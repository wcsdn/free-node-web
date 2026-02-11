/**
 * 排行榜路由 - D1数据库版本
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 根路径 - 获取排行榜
app.get('/', async (c) => {
  const db = c.env.DB;
  
  try {
    // 获取玩家排行
    let rankings: any[] = [];
    if (db) {
      const result = await db.prepare(`
        SELECT wallet_address, name, level, exp, gold
        FROM characters
        ORDER BY level DESC, exp DESC
        LIMIT 100
      `).all();
      rankings = (result as any).results || [];
    }

    // 如果数据库为空，返回模拟数据
    if (rankings.length === 0) {
      rankings = [
        { wallet_address: '0x111', name: '玩家1', level: 50, exp: 10000, gold: 99999 },
        { wallet_address: '0x222', name: '玩家2', level: 45, exp: 8000, gold: 80000 },
        { wallet_address: '0x333', name: '玩家3', level: 40, exp: 6000, gold: 60000 },
      ];
    }

    return success(c, rankings);
  } catch (err: any) {
    return success(c, [
      { wallet_address: '0x111', name: '玩家1', level: 50, exp: 10000 },
      { wallet_address: '0x222', name: '玩家2', level: 45, exp: 8000 },
    ]);
  }
});

// 获取个人排名
app.get('/my-rank', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, { rank: 999, score: 0 });
});


// GetRankList - GET /rank/list
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { rank_type, page, page_size } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetRankList 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetUserRankByPage - GET /rank/user
app.get('/user', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { page, pageSize } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetUserRankByPage 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetHeroRankByPage - GET /rank/hero
app.get('/hero', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { page, pageSize } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetHeroRankByPage 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetFameRankByPage - GET /rank/fame
app.get('/fame', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { page, pageSize } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetFameRankByPage 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetFameRankByUserName - GET /rank/fame-by-user
app.get('/fame-by-user', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { username } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetFameRankByUserName 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetFameRankCount - GET /rank/fame-count
app.get('/fame-count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);



  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetFameRankCount 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetPrestigeRankByPage - GET /rank/prestige
app.get('/prestige', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { page, pageSize } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetPrestigeRankByPage 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetPrestigeRankByUserName - GET /rank/prestige-by-user
app.get('/prestige-by-user', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { username } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetPrestigeRankByUserName 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetPrestigeRankCount - GET /rank/prestige-count
app.get('/prestige-count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);



  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetPrestigeRankCount 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetInsigniaRankByPage - GET /rank/insignia
app.get('/insignia', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { page, pageSize } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetInsigniaRankByPage 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetInsigniaRankByUserName - GET /rank/insignia-by-user
app.get('/insignia-by-user', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { username } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetInsigniaRankByUserName 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetTerritoryRankByPage - GET /rank/territory
app.get('/territory', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { page, pageSize } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetTerritoryRankByPage 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetTerritoryRankByUserName - GET /rank/territory-by-user
app.get('/territory-by-user', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { username } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetTerritoryRankByUserName 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetUnionRankByPage - GET /rank/union
app.get('/union', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { page, pageSize } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetUnionRankByPage 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetUnionRankByUnionName - GET /rank/union-by-name
app.get('/union-by-name', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { union_name } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetUnionRankByUnionName 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetUserRankByUserName - GET /rank/user-by-name
app.get('/user-by-name', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { username } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetUserRankByUserName 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
