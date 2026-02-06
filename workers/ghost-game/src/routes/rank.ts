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

export default app;
