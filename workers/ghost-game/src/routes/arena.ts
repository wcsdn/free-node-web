/**
 * 竞技场路由 - 真实数据版
 * 从 jx/BLLEX/EventEx.cs 和 jx/DAL/ArenaAccess.cs 迁移
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

// ==================== 工具函数 ====================

/** 计算武将战力 */
function calcHeroPower(hero: {
  attack?: number;
  atk?: number;
  defense?: number;
  def?: number;
  hp?: number;
}): number {
  const atk = hero.attack ?? hero.atk ?? 0;
  const def = hero.defense ?? hero.def ?? 0;
  const hp = hero.hp ?? 0;
  return atk + def * 2 + hp * 0.1;
}

/** 计算用户总战力（最强3个武将之和） */
async function calcUserTotalPower(db: D1Database, walletAddress: string): Promise<number> {
  const heroes: any[] = await (db.prepare(`
    SELECT attack, defense, hp FROM heroes WHERE wallet_address = ?
  `).bind(walletAddress).all() as any).results || [];

  if (heroes.length === 0) {
    const char: any = await db.prepare(`
      SELECT level FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();
    return char ? (char.level || 1) * 100 : 100;
  }

  const powers = heroes.map(h => calcHeroPower(h as any)).sort((a, b) => b - a);
  const top3 = powers.slice(0, 3);
  return top3.reduce((sum, p) => sum + p, 0);
}

// ==================== 竞技场配置（从 KV 读取，支持动态配置）====================

/** 默认竞技场配置 */
const ARENA_DEFAULT_CONFIG = {
  startTime: '20:00:00',
  endTime: '22:00:00',
  // 竞技场 NPC 位置列表（参考 jx/BLL/FestivalActive.cs XmlData.ArenaNpcPosList）
  // 10个守擂位置（0-9为第一组，10-19为第二组）
  npcPosList: [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010,
               1011, 1012, 1013, 1014, 1015, 1016, 1017, 1018, 1019, 1020],
  // 战胜勋章基础值（按擂台等级）
  winnerInsignia: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  // 基础积分
  scoreBase: 32,
};

/**
 * 从 KV 读取竞技场时间配置
 * 参考 jx/BLL/FestivalActive.GetArenaStartTime() / GetArenaEndTime()
 */
async function getArenaTimeConfig(kv: KVNamespace | undefined): Promise<{ startTime: string; endTime: string }> {
  let startTime = ARENA_DEFAULT_CONFIG.startTime;
  let endTime = ARENA_DEFAULT_CONFIG.endTime;
  if (kv) {
    try {
      const savedStart = await kv.get('arena:start_time');
      const savedEnd = await kv.get('arena:end_time');
      if (savedStart) startTime = savedStart;
      if (savedEnd) endTime = savedEnd;
    } catch (_) { /* use defaults */ }
  }
  return { startTime, endTime };
}

/**
 * GetArenaLevel - 获取指定擂台位置的等级
 * 参考 jx/BLL/FestivalActive.GetArenaLevel(npcPos)
 * 计算逻辑：
 *   i > 9 时 npcLevel = i - 10，否则 npcLevel = i
 *   npcLevel == 9 时返回 (npcLevel + 1) * 10，否则 (npcLevel + 1) * 10 - 1
 */
function getArenaLevel(npcPos: number): number {
  const posList = ARENA_DEFAULT_CONFIG.npcPosList;
  for (let i = 0; i < posList.length; i++) {
    if (posList[i] === npcPos) {
      let npcLevel = i;
      if (i > 9) npcLevel = i - 10;
      // 参考 C#: if(npcLevel == 9) npcLevel = (npcLevel + 1) * 10; else npcLevel = (npcLevel + 1) * 10 - 1;
      if (npcLevel === 9) {
        return (npcLevel + 1) * 10;
      } else {
        return (npcLevel + 1) * 10 - 1;
      }
    }
  }
  return 0;
}

/**
 * GetArenaInsignia - 获取指定擂台位置的勋章值
 * 参考 jx/BLL/FestivalActive.GetArenaInsignia(npcPos)
 * 勋章值 = winnerInsignia[npcLevel]
 */
function getArenaInsignia(npcPos: number): number {
  const posList = ARENA_DEFAULT_CONFIG.npcPosList;
  const insigniaList = ARENA_DEFAULT_CONFIG.winnerInsignia;
  for (let i = 0; i < posList.length; i++) {
    if (posList[i] === npcPos) {
      let npcLevel = i;
      if (i > 9) npcLevel = i - 10;
      return insigniaList[npcLevel] || 0;
    }
  }
  return 0;
}

/**
 * GetWinnerName - 获取指定擂台位置的冠军名字
 * 参考 jx/BLL/FestivalActive.GetWinnerName(pos)
 * 从 arena_winners 表获取当前冠军（type=2 为日冠军）
 */
async function getWinnerName(db: D1Database, npcPos: number, serverUnit = 's1'): Promise<string | null> {
  try {
    const winner: any = await db.prepare(`
      SELECT winner_name FROM arena_winners
      WHERE npc_pos = ? AND server_unit = ? AND type = 2
      ORDER BY win_time DESC LIMIT 1
    `).bind(npcPos, serverUnit).first();
    return winner?.winner_name || null;
  } catch (_) {
    return null;
  }
}

/**
 * StatInsignia - 查看挑战勋章值
 * 参考 jx/BLL/FestivalActive.StatInsignia(userName, pos)
 * 勋章值 = 挑战时间(秒) * 勋章基数
 */
async function statInsignia(db: D1Database, walletAddress: string, npcPos: number): Promise<number> {
  // 检查是否为竞技场位置
  const isArena = ARENA_DEFAULT_CONFIG.npcPosList.includes(npcPos);
  if (!isArena) return 0;

  const npcInsignia = getArenaInsignia(npcPos);
  if (npcInsignia === 0) return 0;

  // 计算挑战时间（到达时间到结束时间的秒数）
  const winTime = await getWinnerTime(db, walletAddress, npcPos);
  return winTime * npcInsignia;
}

/**
 * GetArenaEndTime - 获取指定日期的竞技场结束时间（重载版本）
 * 参考 jx/BLL/FestivalActive.GetArenaEndTime(DateTime time)
 * 将 config 中的时间应用到指定日期
 */
async function getArenaEndTimeWithDate(kv: KVNamespace | undefined, date: Date): Promise<Date> {
  const { endTime: endTimeStr } = await getArenaTimeConfig(kv);
  const endTime = new Date(date);
  const parts = endTimeStr.split(':');
  endTime.setHours(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), 0);
  return endTime;
}

/**
 * GetWinnerTime - 获取占领时间（秒）
 * 参考 jx/BLL/FestivalActive.GetWinnerTime(userName, pos)
 */
async function getWinnerTime(db: D1Database, walletAddress: string, npcPos: number): Promise<number> {
  try {
    // 获取到达时间（军团到达时间）
    const corps: any = await db.prepare(`
      SELECT arrive_time FROM corps WHERE wallet_address = ? LIMIT 1
    `).bind(walletAddress).first();

    const MIN_DATE = new Date(0); // 相当于 C# DateTime.MinValue
    const arriveTime = corps?.arrive_time ? new Date(corps.arrive_time) : MIN_DATE;
    if (!arriveTime || arriveTime.getTime() === MIN_DATE.getTime()) return 0;

    // 使用重载版本获取当日结束时间
    const endTime = await getArenaEndTimeWithDate(undefined, arriveTime);

    const now = new Date();
    const lastTime = endTime < now ? endTime : now;

    // 如果到达日期和结束日期不是同一天，返回0
    if (arriveTime.toDateString() !== lastTime.toDateString()) return 0;

    const spaceTime = lastTime.getTime() - arriveTime.getTime();
    return Math.max(0, Math.floor(spaceTime / 1000));
  } catch (_) {
    return 0;
  }
}

/**
 * GetWinnerTime (重载版本) - 获取占领时间（秒）
 * 参考 jx/BLL/FestivalActive.GetWinnerTime(userName, pos) + GetArenaEndTime(DateTime)
 * 带 DateTime 参数的重载版本
 */
async function getWinnerTimeWithDate(
  db: D1Database,
  walletAddress: string,
  npcPos: number,
  kv: KVNamespace | undefined
): Promise<number> {
  try {
    // 获取到达时间（军团到达时间）
    const corps: any = await db.prepare(`
      SELECT arrive_time FROM corps WHERE wallet_address = ? LIMIT 1
    `).bind(walletAddress).first();

    const MIN_DATE = new Date(0); // 相当于 C# DateTime.MinValue
    const arriveTime = corps?.arrive_time ? new Date(corps.arrive_time) : MIN_DATE;
    if (!arriveTime || arriveTime.getTime() === MIN_DATE.getTime()) return 0;

    // 获取指定日期的结束时间（参考 C# GetArenaEndTime(DateTime time)）
    const endTime = await getArenaEndTimeWithDate(kv, arriveTime);

    const now = new Date();
    const lastTime = endTime < now ? endTime : now;

    // 如果到达日期和结束日期不是同一天，返回0
    if (arriveTime.toDateString() !== lastTime.toDateString()) return 0;

    const spaceTime = lastTime.getTime() - arriveTime.getTime();
    return Math.max(0, Math.floor(spaceTime / 1000));
  } catch (_) {
    return 0;
  }
}

/**
 * StatArenaWinnerTime - 查看占领时间（返回 TimeSpan 格式字符串）
 * 参考 jx/BLL/FestivalActive.StatArenaWinnerTime(userName, pos)
 * C#: TimeSpan spaceTime = new TimeSpan(0, 0, wintime); return spaceTime.ToString();
 */
async function statArenaWinnerTime(
  db: D1Database,
  walletAddress: string,
  npcPos: number
): Promise<string | null> {
  // 检查是否为竞技场位置
  if (!isArenaPos(npcPos)) return null;

  const winTime = await getWinnerTime(db, walletAddress, npcPos);
  if (winTime <= 0) return null;

  // C#: new TimeSpan(0, 0, wintime).ToString() -> "HH:mm:ss"
  const hours = Math.floor(winTime / 3600);
  const minutes = Math.floor((winTime % 3600) / 60);
  const seconds = winTime % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/** 判断是否为竞技场位置（擂台） */
function isArenaPos(pos: number): boolean {
  return ARENA_DEFAULT_CONFIG.npcPosList.includes(pos);
}

// ==================== GET /arena - 根路径兼容 ====================

app.get('/', async (c) => {
  return c.json({ success: true, data: { message: 'Arena API' } });
});

// ==================== GET /arena/info - 获取竞技场信息 ====================

app.get('/info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  try {
    const char: any = await db.prepare(`
      SELECT wallet_address, name, level, gold FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!char) {
      return c.json({ success: false, error: 'Character not found' }, 404);
    }

    let arenaRecord: any = await db.prepare(`
      SELECT * FROM arena_records WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!arenaRecord) {
      await db.prepare(`
        INSERT INTO arena_records (wallet_address, score, rank, win_count, lose_count)
        VALUES (?, 1000, 0, 0, 0)
      `).bind(walletAddress).run();
      arenaRecord = { wallet_address: walletAddress, score: 1000, rank: 0, win_count: 0, lose_count: 0 };
    }

    const rankResult: any = await db.prepare(`
      SELECT COUNT(*) + 1 as rank FROM arena_records WHERE score > ?
    `).bind(arenaRecord.score || 1000).first();
    const myRank = rankResult?.rank || 999;

    const opponentsResult: any[] = await (db.prepare(`
      SELECT ar.wallet_address, ar.score,
             c.name, c.level as char_level,
             COALESCE(h.attack, 0) as atk,
             COALESCE(h.defense, 0) as def,
             COALESCE(h.hp, 0) as hp,
             COALESCE(h.level, 1) as hero_level
      FROM arena_records ar
      LEFT JOIN characters c ON c.wallet_address = ar.wallet_address
      LEFT JOIN heroes h ON h.wallet_address = ar.wallet_address
      WHERE ar.wallet_address != ?
      ORDER BY ar.score DESC
      LIMIT 10
    `).bind(walletAddress).all() as any).results || [];

    if (opponentsResult.length < 10) {
      const excludeSet = new Set([walletAddress, ...opponentsResult.map((o: any) => o.wallet_address)]);
      const moreResult: any[] = await (db.prepare(`
        SELECT c.wallet_address, c.name, c.level as char_level,
               COALESCE(h.attack, 0) as atk,
               COALESCE(h.defense, 0) as def,
               COALESCE(h.hp, 0) as hp,
               COALESCE(h.level, 1) as hero_level,
               0 as score
        FROM characters c
        LEFT JOIN heroes h ON h.wallet_address = c.wallet_address
        WHERE c.wallet_address NOT IN (${Array.from(excludeSet).map(() => '?').join(',') || "''"})
        LIMIT ?
      `).bind(...Array.from(excludeSet), 10 - opponentsResult.length).all() as any).results || [];
      opponentsResult.push(...moreResult);
    }

    const opponents = opponentsResult.slice(0, 5).map((opp: any) => ({
      name: opp.name || `玩家${opp.wallet_address?.slice(0, 8)}`,
      level: opp.hero_level || opp.char_level || 1,
      power: Math.round(calcHeroPower(opp)),
      walletAddress: opp.wallet_address,
    }));

    const MAX_CHALLENGE_TIMES = 10;
    const usedTimes = (arenaRecord.win_count || 0) + (arenaRecord.lose_count || 0);
    const remainingTimes = Math.max(0, MAX_CHALLENGE_TIMES - usedTimes);

    return c.json({
      success: true,
      data: {
        Position: 1,
        State: 1,
        MyRank: myRank,
        ChallengeTimes: remainingTimes,
        MaxTimes: MAX_CHALLENGE_TIMES,
        Score: arenaRecord.score || 1000,
        WinCount: arenaRecord.win_count || 0,
        LoseCount: arenaRecord.lose_count || 0,
        position: 1,
        state: 1,
        myRank,
        challengeTimes: remainingTimes,
        maxTimes: MAX_CHALLENGE_TIMES,
        score: arenaRecord.score || 1000,
        winCount: arenaRecord.win_count || 0,
        loseCount: arenaRecord.lose_count || 0,
        userName: char.name,
        userLevel: char.level || 1,
        opponents,
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ==================== GET /arena/arena-time - 竞技场开放时间 ====================
// 参考 jx/BLL/FestivalActive.GetArenaTime()
// 返回格式: string[] - [startTime, endTime]，每个都是 TimeSpan.ToString() 即 "HH:mm:ss"

app.get('/arena-time', async (c) => {
  try {
    // 从 KV 读取竞技场时间配置（参考 jx/BLL/FestivalActive.GetArenaStartTime/GetArenaEndTime）
    const { startTime, endTime } = await getArenaTimeConfig(c.env.KV);

    const now = new Date();
    const todayStart = new Date(now);
    const parts = startTime.split(':');
    todayStart.setHours(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), 0);

    const todayEnd = new Date(now);
    const endParts = endTime.split(':');
    todayEnd.setHours(parseInt(endParts[0]), parseInt(endParts[1]), parseInt(endParts[2]), 0);

    const isOpen = now >= todayStart && now <= todayEnd;

    // 距离开始/结束的时间（秒）
    let nextChangeSeconds = 0;
    let nextChangeType: 'open' | 'close' | null = null;
    if (now < todayStart) {
      nextChangeSeconds = Math.floor((todayStart.getTime() - now.getTime()) / 1000);
      nextChangeType = 'open';
    } else if (now < todayEnd) {
      nextChangeSeconds = Math.floor((todayEnd.getTime() - now.getTime()) / 1000);
      nextChangeType = 'close';
    }

    // C# GetArenaTime() 返回 string[] 格式: TimeSpan.ToString() = "HH:mm:ss"
    // 数组顺序: [开始时间, 结束时间]
    const arenaTimes: [string, string] = [startTime, endTime];

    return c.json({
      success: true,
      data: {
        // C# 兼容格式 - GetArenaTime 返回 string[] (HH:mm:ss)
        ArenaTimes: arenaTimes,
        // 新格式（扩展字段）
        startTime,
        endTime,
        todayStart: todayStart.toISOString(),
        todayEnd: todayEnd.toISOString(),
        isOpen,
        nextChangeSeconds,
        nextChangeType,
        serverTime: now.toISOString(),
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ==================== GET /arena/user-heroes - 获取竞技场冠军武将列表 ====================
// 参考 jx/BLL/FestivalActive.GetUserHeros(npcPos, serverUnit)
// 返回指定擂台位置的历史冠军武将（日冠军、周冠军、月冠军、历史冠军）

app.get('/user-heroes', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const npcPos = parseInt(c.req.query('npcPos') || '1001');
  const serverUnit = c.req.query('serverUnit') || 's1';

  try {
    // 参考 C#: ArenaWinnerInfo dayHero = FestivalActiveAccess.GetArenaWinner(npcPos, 2, serverUnit)
    // type: 1=历史冠军, 2=日冠军, 4=昨日冠军, 5=周冠军
    // 从 arena_winners 表获取（如果存在）
    let winners: any[] = [];
    try {
      const result: any = await db.prepare(`
        SELECT * FROM arena_winners WHERE npc_pos = ? AND server_unit = ?
        ORDER BY type ASC
      `).bind(npcPos, serverUnit).all();
      winners = result?.results || [];
    } catch (_) {
      // 表不存在则返回空
    }

    // 参考 C# GetUserHeros 添加顺序:
    //   heros.Add(dayHero);         // type=2, 日冠军 (第一个)
    //   heros.Add(yesterdayHero);   // type=4, 昨日冠军 (第二个)
    //   heros.Add(weekHero);       // type=5, 周冠军 (第三个)
    //   heros.Add(oldHero);        // type=1, 历史冠军 (第四个)
    // 返回数组顺序: [日=2, 昨=4, 周=5, 历史=1]
    const typeMap: Record<number, string> = {
      2: 'day',
      4: 'yesterday',
      5: 'week',
      1: 'old',
    };

    const arenaWinnerInfoList = [2, 4, 5, 1].map(type => {
      const w = winners.find((x: any) => x.type === type);
      if (w) {
        return {
          type,
          typeName: typeMap[type],
          walletAddress: w.wallet_address,
          name: w.winner_name,
          heroId: w.hero_id,
          heroName: w.hero_name,
          score: w.score || 0,
          winTime: w.win_time,
        };
      }
      return {
        type,
        typeName: typeMap[type],
        walletAddress: null,
        name: null,
        heroId: 0,
        heroName: null,
        score: 0,
        winTime: null,
      };
    });

    return c.json({
      success: true,
      data: {
        npcPos,
        serverUnit,
        winners: arenaWinnerInfoList,
        // C# 兼容格式
        ArenaWinnerInfoList: arenaWinnerInfoList,
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ==================== GET /arena/times - 获取挑战次数 ====================

app.get('/times', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  const MAX_CHALLENGE_TIMES = 10;

  try {
    const arenaRecord: any = await db.prepare(`
      SELECT win_count, lose_count, updated_at FROM arena_records WHERE wallet_address = ?
    `).bind(walletAddress).first();

    const usedTimes = arenaRecord
      ? (arenaRecord.win_count || 0) + (arenaRecord.lose_count || 0)
      : 0;
    const remaining = Math.max(0, MAX_CHALLENGE_TIMES - usedTimes);

    const now = new Date();
    const resetTime = new Date(now);
    resetTime.setUTCHours(0, 0, 0, 0);
    resetTime.setUTCDate(resetTime.getUTCDate() + 1);
    const msUntilReset = resetTime.getTime() - now.getTime();
    const hours = Math.floor(msUntilReset / (1000 * 60 * 60));
    const mins = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((msUntilReset % (1000 * 60)) / 1000);

    return c.json({
      success: true,
      data: {
        remaining,
        max: MAX_CHALLENGE_TIMES,
        lastChallengeTime: arenaRecord?.updated_at || null,
        resetTime: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ==================== POST /arena/challenge - 发起挑战 ====================

app.post('/challenge', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  try {
    const body = await c.req.json().catch(() => ({}));
    const opponentAddress = body.opponentAddress as string;

    if (!opponentAddress) {
      return c.json({ success: false, error: 'opponentAddress is required' }, 400);
    }

    const char: any = await db.prepare(`
      SELECT c.wallet_address, c.name, c.level,
             COALESCE(h.attack, 0) as atk,
             COALESCE(h.defense, 0) as def,
             COALESCE(h.hp, 0) as hp,
             COALESCE(h.level, 1) as hero_level
      FROM characters c
      LEFT JOIN heroes h ON h.wallet_address = c.wallet_address
      WHERE c.wallet_address = ?
    `).bind(walletAddress).first();

    if (!char) {
      return c.json({ success: false, error: 'Character not found' }, 404);
    }

    const oppChar: any = await db.prepare(`
      SELECT c.wallet_address, c.name, c.level,
             COALESCE(h.attack, 0) as atk,
             COALESCE(h.defense, 0) as def,
             COALESCE(h.hp, 0) as hp,
             COALESCE(h.level, 1) as hero_level
      FROM characters c
      LEFT JOIN heroes h ON h.wallet_address = c.wallet_address
      WHERE c.wallet_address = ?
    `).bind(opponentAddress).first();

    if (!oppChar) {
      return c.json({ success: false, error: 'Opponent not found' }, 404);
    }

    const MAX_CHALLENGE_TIMES = 10;
    const arenaRecord: any = await db.prepare(`
      SELECT win_count, lose_count, score FROM arena_records WHERE wallet_address = ?
    `).bind(walletAddress).first();

    const usedTimes = arenaRecord
      ? (arenaRecord.win_count || 0) + (arenaRecord.lose_count || 0)
      : 0;

    if (usedTimes >= MAX_CHALLENGE_TIMES) {
      return c.json({ success: false, error: 'No challenge times remaining' }, 400);
    }

    const myPower = calcHeroPower({ atk: char.atk as number, def: char.def as number, hp: char.hp as number });
    const oppPower = calcHeroPower({ atk: oppChar.atk as number, def: oppChar.def as number, hp: oppChar.hp as number });
    const finalMyPower = myPower > 0 ? myPower : (char.level || 1) * 100;
    const finalOppPower = oppPower > 0 ? oppPower : (oppChar.level || 1) * 100;

    const powerRatio = finalMyPower / Math.max(1, finalOppPower);
    const randomFactor = 0.9 + Math.random() * 0.2;
    const winThreshold = 0.8;
    const winChance = Math.min(0.95, Math.max(0.05, winThreshold * powerRatio * randomFactor));
    const isWin = Math.random() < winChance;

    // 评分变化改为动态获取（参考 jx/BLL/FestivalActive 评分计算逻辑）
    // SCORE_BASE 从配置读取，支持动态调整
    const SCORE_BASE = ARENA_DEFAULT_CONFIG.scoreBase;
    const scoreChange = isWin
      ? Math.round(SCORE_BASE * (1 + finalOppPower / 1000))
      : -Math.round(SCORE_BASE * (1 + finalMyPower / 2000));

    const currentScore = arenaRecord?.score || 1000;
    const newScore = Math.max(0, currentScore + scoreChange);

    await db.prepare(`
      UPDATE arena_records
      SET score = ?,
          win_count = win_count + ?,
          lose_count = lose_count + ?,
          updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(newScore, isWin ? 1 : 0, isWin ? 0 : 1, walletAddress).run();

    if (!arenaRecord) {
      await db.prepare(`
        INSERT INTO arena_records (wallet_address, score, rank, win_count, lose_count)
        VALUES (?, ?, 0, ?, ?)
      `).bind(walletAddress, newScore, isWin ? 1 : 0, isWin ? 0 : 1).run();
    }

    let rewardGold = 0;
    let rewardExp = 0;
    if (isWin) {
      rewardGold = Math.round(50 + finalOppPower * 0.1);
      rewardExp = Math.round(20 + finalOppPower * 0.05);
      await db.prepare(`
        UPDATE characters SET gold = gold + ?, updated_at = datetime('now')
        WHERE wallet_address = ?
      `).bind(rewardGold, walletAddress).run();
    }

    const rankResult: any = await db.prepare(`
      SELECT COUNT(*) + 1 as rank FROM arena_records WHERE score > ?
    `).bind(newScore).first();
    const newRank = rankResult?.rank || 999;

    return c.json({
      success: true,
      data: {
        result: isWin ? 'win' : 'lose',
        myPower: Math.round(finalMyPower),
        oppPower: Math.round(finalOppPower),
        scoreChange,
        newScore,
        newRank,
        reward: { gold: rewardGold, exp: rewardExp },
        myName: char.name || '未知',
        oppName: oppChar.name || '未知',
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ==================== GET /arena/rankings - 获取竞技场排行榜（分页） ====================
// 参考 jx/BLL/FestivalActive.cs 竞技场排名分页

app.get('/rankings', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  // 分页参数
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query('pageSize') || '20')));
  const offset = (page - 1) * pageSize;
  const limit = Math.min(500, pageSize);

  try {
    // 总数
    const countResult: any = await db.prepare(
      `SELECT COUNT(*) as count FROM arena_records`
    ).first();
    const total = countResult?.count || 0;

    // 带排名的分页查询
    const result: any = await db.prepare(`
      SELECT ar.wallet_address, ar.score, ar.win_count, ar.lose_count,
             c.name, c.level as char_level,
             COALESCE(h.level, 1) as hero_level,
             COALESCE(h.attack, 0) as atk,
             COALESCE(h.defense, 0) as def,
             COALESCE(h.hp, 0) as hp
      FROM arena_records ar
      LEFT JOIN characters c ON c.wallet_address = ar.wallet_address
      LEFT JOIN heroes h ON h.wallet_address = ar.wallet_address
      ORDER BY ar.score DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const rows = (result?.results || []) as any[];

    // 计算每个用户的排名（基于 offset 的真实排名）
    const rankings = rows.map((row: any, idx: number) => ({
      rank: offset + idx + 1,
      walletAddress: row.wallet_address,
      name: row.name || `玩家${row.wallet_address?.slice(0, 8)}`,
      level: row.hero_level || row.char_level || 1,
      power: Math.round(calcHeroPower(row)),
      score: row.score || 0,
      winCount: row.win_count || 0,
      loseCount: row.lose_count || 0,
    }));

    // 当前用户的排名（如果已登录）
    const walletAddress = await verifyWalletAuth(c).catch(() => null);
    let myRank = null;
    if (walletAddress) {
      const myRecord: any = await db.prepare(
        `SELECT score FROM arena_records WHERE wallet_address = ?`
      ).bind(walletAddress).first();
      if (myRecord) {
        const rankRes: any = await db.prepare(
          `SELECT COUNT(*) + 1 as rank FROM arena_records WHERE score > ?`
        ).bind(myRecord.score).first();
        myRank = rankRes?.rank || null;
      }
    }

    return c.json({
      success: true,
      data: {
        rankings,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          hasMore: page * pageSize < total,
        },
        myRank,
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ==================== GET /arena/my-rank - 获取我的排名详情 ====================

app.get('/my-rank', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  try {
    const myRecord: any = await db.prepare(`
      SELECT * FROM arena_records WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!myRecord) {
      return c.json({
        success: true,
        data: {
          hasRecord: false,
          score: 1000,
          rank: null,
          winCount: 0,
          loseCount: 0,
        }
      });
    }

    const rankResult: any = await db.prepare(`
      SELECT COUNT(*) + 1 as rank FROM arena_records WHERE score > ?
    `).bind(myRecord.score).first();
    const myRank = rankResult?.rank || 999;

    return c.json({
      success: true,
      data: {
        hasRecord: true,
        score: myRecord.score,
        rank: myRank,
        winCount: myRecord.win_count || 0,
        loseCount: myRecord.lose_count || 0,
        winRate: myRecord.win_count + myRecord.lose_count > 0
          ? Math.round((myRecord.win_count / (myRecord.win_count + myRecord.lose_count)) * 100)
          : 0,
        power: await calcUserTotalPower(db, walletAddress),
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ==================== GET /arena/arena-level - 获取指定擂台等级 ====================
// 参考 jx/BLL/FestivalActive.GetArenaLevel(npcPos)
// 根据擂台位置返回对应的等级

app.get('/arena-level', async (c) => {
  const npcPos = parseInt(c.req.query('npcPos') || '0');
  if (!npcPos) {
    return c.json({ success: false, error: 'npcPos is required' }, 400);
  }

  const level = getArenaLevel(npcPos);
  return c.json({
    success: true,
    data: {
      npcPos,
      level,
    }
  });
});

// ==================== GET /arena/arena-insignia - 获取指定擂台勋章值 ====================
// 参考 jx/BLL/FestivalActive.GetArenaInsignia(npcPos)
// 根据擂台位置返回勋章基数

app.get('/arena-insignia', async (c) => {
  const npcPos = parseInt(c.req.query('npcPos') || '0');
  if (!npcPos) {
    return c.json({ success: false, error: 'npcPos is required' }, 400);
  }

  const insignia = getArenaInsignia(npcPos);
  return c.json({
    success: true,
    data: {
      npcPos,
      insignia,
    }
  });
});

// ==================== GET /arena/winner-name - 获取指定擂台冠军名字 ====================
// 参考 jx/BLL/FestivalActive.GetWinnerName(pos)
// 从 arena_winners 表获取日冠军名字

app.get('/winner-name', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  const npcPos = parseInt(c.req.query('npcPos') || '0');
  const serverUnit = c.req.query('serverUnit') || 's1';

  if (!npcPos) {
    return c.json({ success: false, error: 'npcPos is required' }, 400);
  }

  const winnerName = await getWinnerName(db, npcPos, serverUnit);
  return c.json({
    success: true,
    data: {
      npcPos,
      serverUnit,
      winnerName,
    }
  });
});

// ==================== GET /arena/stat-insignia - 查看挑战勋章值 ====================
// 参考 jx/BLL/FestivalActive.StatInsignia(userName, pos)
// 返回: 挑战时间(秒) * 勋章基数

app.get('/stat-insignia', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  const npcPos = parseInt(c.req.query('npcPos') || '0');
  if (!npcPos) {
    return c.json({ success: false, error: 'npcPos is required' }, 400);
  }

  const insignia = await statInsignia(db, walletAddress, npcPos);
  const npcLevel = getArenaLevel(npcPos);
  const npcInsignia = getArenaInsignia(npcPos);

  return c.json({
    success: true,
    data: {
      npcPos,
      npcLevel,
      npcInsignia,
      insignia,
      isArenaPos: isArenaPos(npcPos),
    }
  });
});

// ==================== GET /arena/is-at-time - 判断是否在竞技时间段内 ====================
// 参考 jx/BLL/FestivalActive.IsAtArenaTime()
// 返回当前是否在竞技场开放时间段内

app.get('/is-at-time', async (c) => {
  try {
    const { startTime, endTime } = await getArenaTimeConfig(c.env.KV);

    const now = new Date();
    const todayStart = new Date(now);
    const parts = startTime.split(':');
    todayStart.setHours(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), 0);

    const todayEnd = new Date(now);
    const endParts = endTime.split(':');
    todayEnd.setHours(parseInt(endParts[0]), parseInt(endParts[1]), parseInt(endParts[2]), 0);

    const isOpen = now >= todayStart && now <= todayEnd;
    const isAtArenaTime = startTime !== '00:00:00' && endTime !== '00:00:00' && isOpen;

    return c.json({
      success: true,
      data: {
        isAtArenaTime,
        isOpen,
        startTime,
        endTime,
        serverTime: now.toISOString(),
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ==================== GET /arena/stat-winner-time - 查看占领时间（TimeSpan字符串）====================
// 参考 jx/BLL/FestivalActive.StatArenaWinnerTime(userName, pos)
// C# 返回: TimeSpan.ToString() 即 "HH:mm:ss" 格式
// 如果未占领或不在竞技场位置返回 null

app.get('/stat-winner-time', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  const npcPos = parseInt(c.req.query('npcPos') || '0');
  if (!npcPos) {
    return c.json({ success: false, error: 'npcPos is required' }, 400);
  }

  try {
    const winnerTimeStr = await statArenaWinnerTime(db, walletAddress, npcPos);
    const winSeconds = winnerTimeStr ? await getWinnerTime(db, walletAddress, npcPos) : 0;

    return c.json({
      success: true,
      data: {
        npcPos,
        walletAddress,
        // C# StatArenaWinnerTime 返回值: TimeSpan.ToString() 或 null
        winnerTime: winnerTimeStr,
        // 扩展：秒数
        winSeconds,
        isArenaPos: isArenaPos(npcPos),
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default app;
