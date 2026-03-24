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
  // 尝试从 heroes 表计算
  const heroes: any[] = await (db.prepare(`
    SELECT attack, defense, hp FROM heroes WHERE wallet_address = ?
  `).bind(walletAddress).all() as any).results || [];

  if (heroes.length === 0) {
    // fallback: 从 characters 表读取 level 作为战力
    const char: any = await db.prepare(`
      SELECT level FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();
    return char ? (char.level || 1) * 100 : 100;
  }

  // 取最强3个武将的战力之和
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
    // 1. 获取用户角色信息
    const char: any = await db.prepare(`
      SELECT wallet_address, name, level, gold FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!char) {
      return c.json({ success: false, error: 'Character not found' }, 404);
    }

    // 2. 获取/创建竞技场记录
    let arenaRecord: any = await db.prepare(`
      SELECT * FROM arena_records WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!arenaRecord) {
      // 创建新记录
      await db.prepare(`
        INSERT INTO arena_records (wallet_address, score, rank, win_count, lose_count)
        VALUES (?, 1000, 0, 0, 0)
      `).bind(walletAddress).run();

      arenaRecord = { wallet_address: walletAddress, score: 1000, rank: 0, win_count: 0, lose_count: 0 };
    }

    // 3. 计算用户排名
    const rankResult: any = await db.prepare(`
      SELECT COUNT(*) + 1 as rank FROM arena_records WHERE score > ?
    `).bind(arenaRecord.score || 1000).first();
    const myRank = rankResult?.rank || 999;

    // 4. 获取挑战对手列表（从竞技场排行榜选取附近的玩家）
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

    // 如果对手不足10个，补充其他玩家
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

    const opponents = opponentsResult.slice(0, 5).map((opp: any, idx: number) => ({
      name: opp.name || `玩家${opp.wallet_address?.slice(0, 8)}`,
      level: opp.hero_level || opp.char_level || 1,
      power: Math.round(calcHeroPower(opp)),
      walletAddress: opp.wallet_address,
    }));

    // 5. 计算剩余挑战次数（每日重置）
    const today = new Date().toISOString().split('T')[0];
    const todayChallenges: any = await db.prepare(`
      SELECT COUNT(*) as count FROM arena_records
      WHERE wallet_address = ? AND DATE(updated_at) = ?
    `).bind(walletAddress, today).first();

    const MAX_CHALLENGE_TIMES = 10;
    const challengeTimes = Math.max(0, MAX_CHALLENGE_TIMES - ((todayChallenges as any)?.count || 0));
    // 注: updated_at 更新在每次挑战后，这里用 arena_records 的 update 次数来估算
    // 实际应记录 challenge_count 字段，临时用 win+lose 次数
    const usedTimes = (arenaRecord.win_count || 0) + (arenaRecord.lose_count || 0);
    const remainingTimes = Math.max(0, MAX_CHALLENGE_TIMES - usedTimes);

    return c.json({
      success: true,
      data: {
        // C# 字段格式 (驼峰)
        Position: 1,
        State: 1,
        MyRank: myRank,
        ChallengeTimes: remainingTimes,
        MaxTimes: MAX_CHALLENGE_TIMES,
        Score: arenaRecord.score || 1000,
        WinCount: arenaRecord.win_count || 0,
        LoseCount: arenaRecord.lose_count || 0,
        // 兼容字段
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

    // 计算重置时间（每天00:00 UTC = 08:00北京时间）
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

    // 1. 获取用户角色
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

    // 2. 获取对手角色
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

    // 3. 校验挑战次数
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

    // 4. 计算战力
    const myPower = calcHeroPower({
      atk: char.atk as number,
      def: char.def as number,
      hp: char.hp as number,
    });
    const oppPower = calcHeroPower({
      atk: oppChar.atk as number,
      def: oppChar.def as number,
      hp: oppChar.hp as number,
    });

    // 如果没有武将数据，用角色等级估算
    const finalMyPower = myPower > 0 ? myPower : (char.level || 1) * 100;
    const finalOppPower = oppPower > 0 ? oppPower : (oppChar.level || 1) * 100;

    // 5. 基于属性计算战斗结果
    // 战力比值 + 少量随机因素（10%）决定胜负
    const powerRatio = finalMyPower / Math.max(1, finalOppPower);
    const randomFactor = 0.9 + Math.random() * 0.2; // 0.9 ~ 1.1
    const winThreshold = 0.8; // 战力相同时 80% 基础胜率
    const winChance = Math.min(0.95, Math.max(0.05, winThreshold * powerRatio * randomFactor));
    const isWin = Math.random() < winChance;

    // 6. 计算分数变化
    const SCORE_BASE = 32;
    const scoreChange = isWin
      ? Math.round(SCORE_BASE * (1 + finalOppPower / 1000))
      : -Math.round(SCORE_BASE * (1 + finalMyPower / 2000));

    // 7. 更新竞技场记录
    const currentScore = arenaRecord?.score || 1000;
    const newScore = Math.max(0, currentScore + scoreChange);

    await db.prepare(`
      UPDATE arena_records
      SET score = ?,
          win_count = win_count + ?,
          lose_count = lose_count + ?,
          updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(
      newScore,
      isWin ? 1 : 0,
      isWin ? 0 : 1,
      walletAddress
    ).run();

    // 8. 如果是新记录，插入
    if (!arenaRecord) {
      await db.prepare(`
        INSERT INTO arena_records (wallet_address, score, rank, win_count, lose_count)
        VALUES (?, ?, 0, ?, ?)
      `).bind(walletAddress, newScore, isWin ? 1 : 0, isWin ? 0 : 1).run();
    }

    // 9. 计算奖励
    let rewardGold = 0;
    let rewardExp = 0;
    if (isWin) {
      rewardGold = Math.round(50 + finalOppPower * 0.1);
      rewardExp = Math.round(20 + finalOppPower * 0.05);

      // 更新金币
      await db.prepare(`
        UPDATE characters SET gold = gold + ?, updated_at = datetime('now')
        WHERE wallet_address = ?
      `).bind(rewardGold, walletAddress).run();
    }

    // 10. 计算新排名
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
        reward: {
          gold: rewardGold,
          exp: rewardExp,
        },
        myName: char.name || '未知',
        oppName: oppChar.name || '未知',
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ==================== GET /arena/rankings - 获取竞技场排行榜 ====================

app.get('/rankings', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  const { limit = '20' } = c.req.query();
  const limitNum = Math.min(100, parseInt(limit as string) || 20);

  try {
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
      LIMIT ?
    `).bind(limitNum).all();

    const rankings = ((result?.results || []) as any[]).map((row: any, idx: number) => ({
      rank: idx + 1,
      walletAddress: row.wallet_address,
      name: row.name || `玩家${row.wallet_address?.slice(0, 8)}`,
      level: row.hero_level || row.char_level || 1,
      power: Math.round(calcHeroPower(row)),
      score: row.score || 0,
      winCount: row.win_count || 0,
      loseCount: row.lose_count || 0,
    }));

    return c.json({ success: true, data: { rankings } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default app;
