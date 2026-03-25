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
// 参考 jx/BLL/FestivalActive.GetArenaTime() 和 GetArenaStartTime/GetArenaEndTime()
// 返回格式: [startTime, endTime] - 每天的开放时间段（HH:mm:ss）

app.get('/arena-time', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  try {
    // 从 KV 或配置读取竞技场开放时间
    // 默认: 20:00 - 22:00 (每晚8点到10点)
    let startTime = '20:00:00';
    let endTime = '22:00:00';

    try {
      const kv = c.env.KV;
      if (kv) {
        const savedStart = await kv.get('arena:start_time');
        const savedEnd = await kv.get('arena:end_time');
        if (savedStart) startTime = savedStart;
        if (savedEnd) endTime = savedEnd;
      }
    } catch (_) {
      // KV 不可用，使用默认值
    }

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

    // C# 兼容格式
    return c.json({
      success: true,
      data: {
        // C# GetArenaTime 返回的 string[] 格式
        ArenaTimes: [startTime, endTime],
        // 新格式
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

    // 映射到 ArenaWinnerInfo 格式
    // type: 1=历史冠军(Old), 2=日冠军(Day), 4=昨日冠军(Yesterday), 5=周冠军(Week)
    const typeMap: Record<number, string> = {
      1: 'old',
      2: 'day',
      4: 'yesterday',
      5: 'week',
    };

    const arenaWinnerInfoList = [1, 2, 4, 5].map(type => {
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

    const SCORE_BASE = 32;
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

export default app;
