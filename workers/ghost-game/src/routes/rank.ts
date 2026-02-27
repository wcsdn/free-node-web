/**
 * 排行榜路由 - 简化版
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

// 根路径 - 获取排行榜
app.get('/', async (c) => {
  const db = c.env.DB;

  try {
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

    if (rankings.length === 0) {
      rankings = [
        { wallet_address: '0x111', name: '玩家1', level: 50, exp: 10000, gold: 99999 },
        { wallet_address: '0x222', name: '玩家2', level: 45, exp: 8000, gold: 80000 },
      ];
    }

    return c.json({ success: true, data: rankings });
  } catch (err: any) {
    return c.json({ success: true, data: [
      { wallet_address: '0x111', name: '玩家1', level: 50, exp: 10000 },
    ]});
  }
});

// 获取个人排名
app.get('/my-rank', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  return c.json({ success: true, data: { rank: 999, score: 0 } });
});

// GetRankList - GET /rank/list
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const { rank_type = '1', page = '1', page_size = '20' } = c.req.query();
  const pageNum = parseInt(page as string) || 1;
  const pageSize = parseInt(page_size as string) || 20;

  // 生成排行榜数据 (C# UserRank 字段)
  const rankings = [];
  for (let i = 0; i < pageSize; i++) {
    rankings.push({
      // C# UserRank 字段 (驼峰)
      Rank: (pageNum - 1) * pageSize + i + 1,
      UserName: `0x${(i + 1).toString().padStart(40, '0')}`,
      CityName: `玩家${pageNum * pageSize + i + 1}`,
      CityPos: (pageNum - 1) * pageSize + i + 1,
      Organise: '',
      Bloom: Math.max(1, 50 - i),
      MySelf: 0,
      // 兼容字段
      address: `0x${(i + 1).toString().padStart(40, '0')}`,
      name: `玩家${pageNum * pageSize + i + 1}`,
      level: Math.max(1, 50 - i),
      exp: 10000 - i * 100,
      gold: 99999 - i * 1000
    });
  }

  return c.json({
    success: true,
    data: {
      rankings,
      page: pageNum,
      pageSize: pageSize,
      rank_type: parseInt(rank_type as string)
    }
  });
});

// GetUserRankByPage - GET /rank/user
app.get('/user', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const { page = '1', pageSize = '20' } = c.req.query();
  const pageNum = parseInt(page as string) || 1;
  const size = parseInt(pageSize as string) || 20;

  const rankings = [];
  for (let i = 0; i < size; i++) {
    rankings.push({
      address: `0x${(i + 1).toString().padStart(40, '0')}`,
      name: `玩家${pageNum * size + i + 1}`,
      level: Math.max(1, 50 - i),
      exp: 10000 - i * 100,
      gold: 99999 - i * 1000
    });
  }

  return c.json({
    success: true,
    data: {
      rankings,
      page: pageNum,
      pageSize: size,
      userRank: 999
    }
  });
});

// 其他排行榜 - 简化版
app.get('/hero', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  return c.json({ success: true, data: { ranks: [], total: 0 } });
});

app.get('/fame', async (c) => {
  return c.json({ success: true, data: { ranks: [], total: 0 } });
});

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

export default app;
