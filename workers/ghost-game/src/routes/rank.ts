/**
 * 排行榜路由 - 真实数据版
 * 从 jx/DAL/UserAccess.cs 迁移
 * rank_type: 1=城等级 2=战斗力 3=财富 4=武将强弱
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

// ==================== 根路径兼容 ====================

app.get('/', async (c) => {
  return c.json({ success: true, data: [] });
});

// GET /rank/chess - 棋艺排行榜 (基于武将总战斗力)
app.get('/chess', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ success: true, data: [], message: 'Database not configured' });

  const wallet = await verifyWalletAuth(c).catch(() => null);
  const { page = '1', page_size, pageSize = '20' } = c.req.query();
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const ps = page_size || pageSize;
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(ps as string) || 20));
  const offset = (pageNum - 1) * pageSizeNum;

  try {
    // 排行榜：基于武将总战斗力
    const ranks = await db.prepare(`
      SELECT 
        c.wallet_address,
        c.name,
        c.level,
        COALESCE(SUM(h.attack + h.defense + h.hp) * c.level, 0) as power,
        COUNT(h.id) as hero_count
      FROM characters c
      LEFT JOIN heroes h ON c.wallet_address = h.wallet_address
      GROUP BY c.wallet_address
      ORDER BY power DESC
      LIMIT ? OFFSET ?
    `).bind(pageSizeNum, offset).all();

    // 获取当前用户排名
    let myRank = null;
    if (wallet) {
      const myPower = await db.prepare(`
        SELECT COALESCE(SUM(h.attack + h.defense + h.hp) * c.level, 0) as power
        FROM characters c
        LEFT JOIN heroes h ON c.wallet_address = h.wallet_address
        WHERE c.wallet_address = ?
        GROUP BY c.wallet_address
      `).bind(wallet).first();

      if (myPower) {
        const rankData: any = await db.prepare(`
          SELECT COUNT(*) + 1 as rank
          FROM (
            SELECT COALESCE(SUM(h.attack + h.defense + h.hp) * c.level, 0) as p
            FROM characters c
            LEFT JOIN heroes h ON c.wallet_address = h.wallet_address
            GROUP BY c.wallet_address
            HAVING p > ?
          ) above
        `).bind((myPower as any).power).first();
        myRank = (rankData as any)?.rank || null;
      }
    }

    const totalResult: any = await db.prepare(`SELECT COUNT(*) as count FROM characters`).first();
    const total = totalResult.count;

    const rankList = ((ranks as any).results || []).map((r: any, idx: number) => ({
      rank: offset + idx + 1,
      walletAddress: r.wallet_address,
      name: r.name || `玩家${r.wallet_address.slice(0, 6)}`,
      level: r.level,
      power: r.power,
      heroCount: r.hero_count,
      title: offset + idx + 1 <= 3 ? ['🏆', '🥈', '🥉'][offset + idx] : '',
      // C# UserRank.MySelf 标记：1=当前用户，用于前端高亮
      mySelf: wallet && r.wallet_address.toLowerCase() === wallet.toLowerCase() ? 1 : 0,
    }));

    return c.json({
      success: true,
      data: rankList,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      hasMore: pageNum * pageSizeNum < total,
      myRank,
    });
  } catch (err: any) {
    return c.json({ success: true, data: [], message: err.message });
  }
});

// POST /rank/chess - 棋艺排行榜 (占位符)
app.post('/chess', async (c) => {
  return c.json({ success: true, data: [], message: 'Chess ranking not yet implemented' });
});

// ==================== 快捷排行榜路由 (别名) ====================

// GET /rank/power - 战斗力排行 (type=2)
app.get('/power', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ success: true, data: [] });

  const { page = '1', page_size, pageSize = '20' } = c.req.query();
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const ps = page_size || pageSize;
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(ps as string) || 20));
  const offset = (pageNum - 1) * pageSizeNum;

  try {
    const wallet = await verifyWalletAuth(c).catch(() => null);
    const rankings = await getRankingsByType(db, 2, pageSizeNum, offset, wallet || undefined);
    return c.json({ success: true, data: rankings, rank_type: 2 });
  } catch (err: any) {
    return c.json({ success: true, data: [] });
  }
});

// GET /rank/level - 等级排行 (type=1)
app.get('/level', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ success: true, data: [] });

  const { page = '1', page_size, pageSize = '20' } = c.req.query();
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const ps = page_size || pageSize;
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(ps as string) || 20));
  const offset = (pageNum - 1) * pageSizeNum;

  try {
    const wallet = await verifyWalletAuth(c).catch(() => null);
    const rankings = await getRankingsByType(db, 1, pageSizeNum, offset, wallet || undefined);
    return c.json({ success: true, data: rankings, rank_type: 1 });
  } catch (err: any) {
    return c.json({ success: true, data: [] });
  }
});

// GET /rank/wealth - 财富排行 (type=3)
app.get('/wealth', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ success: true, data: [] });

  const { page = '1', page_size, pageSize = '20' } = c.req.query();
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const ps = page_size || pageSize;
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(ps as string) || 20));
  const offset = (pageNum - 1) * pageSizeNum;

  try {
    const wallet = await verifyWalletAuth(c).catch(() => null);
    const rankings = await getRankingsByType(db, 3, pageSizeNum, offset, wallet || undefined);
    return c.json({ success: true, data: rankings, rank_type: 3 });
  } catch (err: any) {
    return c.json({ success: true, data: [] });
  }
});

// GET /rank/city - 城等级排行 (type=1)
app.get('/city', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ success: true, data: [] });

  const { page = '1', page_size, pageSize = '20' } = c.req.query();
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const ps = page_size || pageSize;
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(ps as string) || 20));
  const offset = (pageNum - 1) * pageSizeNum;

  try {
    const wallet = await verifyWalletAuth(c).catch(() => null);
    const rankings = await getRankingsByType(db, 1, pageSizeNum, offset, wallet || undefined);
    return c.json({ success: true, data: rankings, rank_type: 1 });
  } catch (err: any) {
    return c.json({ success: true, data: [] });
  }
});

// ==================== GET /rank/my-rank - 获取个人排名 ====================

app.get('/my-rank', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  const { rank_type = '1' } = c.req.query();
  const type = parseInt(rank_type as string) || 1;

  try {
    const rank = await getUserRankPosition(db, walletAddress, type);
    const value = await getUserRankValue(db, walletAddress, type);

    return c.json({
      success: true,
      data: {
        rank,
        rank_type: type,
        value: Math.round(value),
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ==================== GET /rank/list - 获取排行榜列表 ====================

app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  const { rank_type = '1', page = '1', page_size, pageSize = '20' } = c.req.query();
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const ps = page_size || pageSize;
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(ps as string) || 20));
  const offset = (pageNum - 1) * pageSizeNum;
  const type = parseInt(rank_type as string) || 1;

  try {
    const rankings = await getRankingsByType(db, type, pageSizeNum, offset, walletAddress);
    const myRank = await getUserRankPosition(db, walletAddress, type);
    const myValue = await getUserRankValue(db, walletAddress, type);

    return c.json({
      success: true,
      data: {
        rankings,
        page: pageNum,
        pageSize: pageSizeNum,
        rank_type: type,
        myRank,
        myValue: Math.round(myValue),
        total: rankings.length,
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ==================== GET /rank/user - 获取用户排名详情 ====================

app.get('/user', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  const { rank_type = '1', page = '1', page_size, pageSize = '20' } = c.req.query();
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const ps = page_size || pageSize;
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(ps as string) || 20));
  const offset = (pageNum - 1) * pageSizeNum;
  const type = parseInt(rank_type as string) || 1;

  try {
    const rankings = await getRankingsByType(db, type, pageSizeNum, offset, walletAddress);
    const myRank = await getUserRankPosition(db, walletAddress, type);
    const myValue = await getUserRankValue(db, walletAddress, type);

    return c.json({
      success: true,
      data: {
        rankings,
        page: pageNum,
        pageSize: pageSizeNum,
        userRank: myRank,
        myValue: Math.round(myValue),
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ==================== GET /rank/hero - 武将强弱排行 ====================

app.get('/hero', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ success: true, data: { ranks: [], total: 0 } });

  const walletAddress = await verifyWalletAuth(c);
  const { page = '1', page_size = '20' } = c.req.query();
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(page_size as string) || 20));
  const offset = (pageNum - 1) * pageSize;

  try {
    // 武将强弱: attack * level 排序
    const result: any = await db.prepare(`
      SELECT h.wallet_address, h.hero_id, h.level, h.attack,
             c.name,
             (h.attack * h.level) as power
      FROM heroes h
      LEFT JOIN characters c ON c.wallet_address = h.wallet_address
      ORDER BY power DESC, h.level DESC
      LIMIT ? OFFSET ?
    `).bind(pageSize, offset).all();

    const ranks = ((result?.results || []) as any[]).map((row: any, idx: number) => ({
      rank: offset + idx + 1,
      wallet_address: row.wallet_address,
      name: row.name || `玩家${row.wallet_address?.slice(0, 8)}`,
      level: row.level || 1,
      value: Math.round(row.power || 0),
      hero_id: row.hero_id,
      attack: row.attack,
      isMe: walletAddress ? row.wallet_address === walletAddress : false,
    }));

    return c.json({ success: true, data: { ranks, total: ranks.length, page: pageNum } });
  } catch (err: any) {
    return c.json({ success: true, data: { ranks: [], total: 0 } });
  }
});

// ==================== GET /rank/fame - 荣誉排行榜 ====================

app.get('/fame', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ success: true, data: { ranks: [], total: 0 } });

  const walletAddress = await verifyWalletAuth(c);
  const { page = '1', page_size = '20' } = c.req.query();
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(page_size as string) || 20));
  const offset = (pageNum - 1) * pageSize;

  try {
    const result: any = await db.prepare(`
      SELECT ar.wallet_address, ar.win_count, c.name,
             (ar.win_count * 10 + ar.score) as fame_score
      FROM arena_records ar
      LEFT JOIN characters c ON c.wallet_address = ar.wallet_address
      WHERE ar.win_count > 0
      ORDER BY fame_score DESC
      LIMIT ? OFFSET ?
    `).bind(pageSize, offset).all();

    const ranks = ((result?.results || []) as any[]).map((row: any, idx: number) => ({
      rank: offset + idx + 1,
      wallet_address: row.wallet_address,
      name: row.name || `玩家${row.wallet_address?.slice(0, 8)}`,
      value: row.fame_score || 0,
      winCount: row.win_count || 0,
      isMe: walletAddress ? row.wallet_address === walletAddress : false,
    }));

    return c.json({ success: true, data: { ranks, total: ranks.length, page: pageNum } });
  } catch (err: any) {
    return c.json({ success: true, data: { ranks: [], total: 0 } });
  }
});

// ==================== 其他排行榜（简化） ====================

app.get('/prestige', async (c) => {
  return c.json({ success: true, data: { ranks: [], total: 0 } });
});

app.get('/insignia', async (c) => {
  return c.json({ success: true, data: { ranks: [], total: 0 } });
});

app.get('/territory', async (c) => {
  return c.json({ success: true, data: { ranks: [], total: 0 } });
});

app.get('/union', async (c) => {
  return c.json({ success: true, data: { ranks: [], total: 0 } });
});

// ==================== 核心逻辑函数 ====================

type RankingRow = {
  rank: number;
  wallet_address: string;
  name: string;
  level: number;
  value: number;
};

async function getRankingsByType(
  db: D1Database,
  type: number,
  limit: number,
  offset: number,
  currentWallet?: string
): Promise<RankingRow[]> {

  let sql = '';
  const params: any[] = [];

  if (type === 1) {
    // 城等级排行: 按 cities.level 排序
    // 如果玩家有多个城，取最高等级
    sql = `
      SELECT c.wallet_address, c.name, c.level as char_level,
             COALESCE((
               SELECT MAX(ci.level) FROM cities ci
               WHERE ci.wallet_address = c.wallet_address
             ), c.level) as level,
             COALESCE((
               SELECT MAX(ci.level) FROM cities ci
               WHERE ci.wallet_address = c.wallet_address
             ), c.level) as value
      FROM characters c
      WHERE c.wallet_address IS NOT NULL AND c.wallet_address != ''
      ORDER BY level DESC, c.wallet_address ASC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
  } else if (type === 2) {
    // 战斗力排行: (attack + defense + hp) * level
    sql = `
      SELECT c.wallet_address, c.name, c.level,
             COALESCE(SUM((h.attack + h.defense + h.hp) * h.level), 0) as power,
             COALESCE(SUM((h.attack + h.defense + h.hp) * h.level), 0) as value
      FROM characters c
      LEFT JOIN heroes h ON h.wallet_address = c.wallet_address
      GROUP BY c.wallet_address
      HAVING value > 0
      ORDER BY value DESC, c.wallet_address ASC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
  } else if (type === 3) {
    // 财富排行: 按 money 排序
    sql = `
      SELECT wallet_address, name, level, money as value
      FROM characters
      WHERE wallet_address IS NOT NULL AND wallet_address != ''
      ORDER BY money DESC, wallet_address ASC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
  } else if (type === 4) {
    // 武将强弱: attack * level，取玩家最强武将
    sql = `
      SELECT h.wallet_address, c.name, h.level,
             (h.attack * h.level) as power,
             (h.attack * h.level) as value
      FROM heroes h
      LEFT JOIN characters c ON c.wallet_address = h.wallet_address
      ORDER BY power DESC, h.level DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
  } else {
    // 默认: 城等级
    sql = `
      SELECT c.wallet_address, c.name, c.level,
             COALESCE((
               SELECT MAX(ci.level) FROM cities ci
               WHERE ci.wallet_address = c.wallet_address
             ), c.level) as value
      FROM characters c
      WHERE c.wallet_address IS NOT NULL AND c.wallet_address != ''
      ORDER BY value DESC, c.wallet_address ASC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
  }

  const result: any = await db.prepare(sql).bind(...params).all();
  const rows = (result?.results || []) as any[];

  return rows.map((row, idx) => ({
    rank: offset + idx + 1,
    wallet_address: row.wallet_address,
    name: row.name || `玩家${row.wallet_address?.slice(0, 8)}`,
    level: row.level || row.char_level || 1,
    value: Math.round(row.value || row.power || 0),
    isMe: currentWallet ? row.wallet_address === currentWallet : false,
  }));
}

async function getUserRankPosition(
  db: D1Database,
  walletAddress: string,
  type: number
): Promise<number> {
  if (type === 1) {
    // 城等级排名
    const myCity: any = await db.prepare(`
      SELECT COALESCE(MAX(level), 0) as city_level,
             COALESCE((SELECT level FROM characters WHERE wallet_address = ?), 1) as char_level
      FROM cities WHERE wallet_address = ?
    `).bind(walletAddress, walletAddress).first();

    const myLevel = myCity?.city_level > 0 ? myCity.city_level : myCity?.char_level || 1;

    const result: any = await db.prepare(`
      SELECT COUNT(*) + 1 as rank FROM (
        SELECT c.wallet_address,
               COALESCE((SELECT MAX(ci.level) FROM cities ci WHERE ci.wallet_address = c.wallet_address), c.level) as city_level
        FROM characters c
      ) t
      WHERE city_level > ?
    `).bind(myLevel).first();
    return result?.rank || 999;

  } else if (type === 2) {
    // 战斗力排名
    const myPower: any = await db.prepare(`
      SELECT COALESCE(SUM((attack + defense + hp) * level), 0) as power
      FROM heroes WHERE wallet_address = ?
    `).bind(walletAddress).first();
    const power = myPower?.power || 0;

    const result: any = await db.prepare(`
      SELECT COUNT(*) + 1 as rank FROM (
        SELECT c.wallet_address,
               COALESCE(SUM((h.attack + h.defense + h.hp) * h.level), 0) as power
        FROM characters c
        LEFT JOIN heroes h ON h.wallet_address = c.wallet_address
        GROUP BY c.wallet_address
      ) t
      WHERE power > ?
    `).bind(power).first();
    return result?.rank || 999;

  } else if (type === 3) {
    // 财富排名
    const myChar: any = await db.prepare(`
      SELECT money FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();
    const money = myChar?.money || 0;

    const result: any = await db.prepare(`
      SELECT COUNT(*) + 1 as rank FROM characters
      WHERE money > ? OR (money = ? AND wallet_address < ?)
    `).bind(money, money, walletAddress).first();
    return result?.rank || 999;

  } else if (type === 4) {
    // 武将强弱排名
    const myHero: any = await db.prepare(`
      SELECT COALESCE(MAX(attack * level), 0) as power
      FROM heroes WHERE wallet_address = ?
    `).bind(walletAddress).first();
    const power = myHero?.power || 0;

    const result: any = await db.prepare(`
      SELECT COUNT(*) + 1 as rank FROM (
        SELECT wallet_address, MAX(attack * level) as power
        FROM heroes
        GROUP BY wallet_address
      ) t
      WHERE power > ?
    `).bind(power).first();
    return result?.rank || 999;
  }

  return 999;
}

async function getUserRankValue(
  db: D1Database,
  walletAddress: string,
  type: number
): Promise<number> {
  if (type === 1) {
    const myCity: any = await db.prepare(`
      SELECT COALESCE(MAX(level), 0) as city_level,
             COALESCE((SELECT level FROM characters WHERE wallet_address = ?), 1) as char_level
      FROM cities WHERE wallet_address = ?
    `).bind(walletAddress, walletAddress).first();
    return myCity?.city_level > 0 ? myCity.city_level : (myCity?.char_level || 1);

  } else if (type === 2) {
    const myPower: any = await db.prepare(`
      SELECT COALESCE(SUM((attack + defense + hp) * level), 0) as power
      FROM heroes WHERE wallet_address = ?
    `).bind(walletAddress).first();
    return myPower?.power || 0;

  } else if (type === 3) {
    const myChar: any = await db.prepare(`
      SELECT money FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();
    return myChar?.money || 0;

  } else if (type === 4) {
    const myHero: any = await db.prepare(`
      SELECT COALESCE(MAX(attack * level), 0) as power
      FROM heroes WHERE wallet_address = ?
    `).bind(walletAddress).first();
    return myHero?.power || 0;
  }

  return 0;
}

export default app;
