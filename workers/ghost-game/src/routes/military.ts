/**
 * Military Route - 军事路由 (重构版)
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

// 军事配置
const MILITARY_CONFIGS = [
  { id: 1, name: '步兵', type: 'infantry', attack: 10, defense: 15, cost: { money: 100, food: 50 } },
  { id: 2, name: '骑兵', type: 'cavalry', attack: 18, defense: 8, cost: { money: 150, food: 80 } },
  { id: 3, name: '弓兵', type: 'archer', attack: 20, defense: 5, cost: { money: 120, food: 60 } },
  { id: 4, name: '攻城车', type: 'siege', attack: 30, defense: 10, cost: { money: 300, food: 150 } },
];

// 获取军事列表
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT id FROM cities WHERE wallet_address = ? ORDER BY id LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    const troops = await db.prepare(`
      SELECT * FROM troops WHERE city_id = ?
    `).bind((city as any).id).all();

    return success(c, { troops: troops.results || [] });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 获取军事配置
app.get('/config', async (c) => {
  return success(c, { configs: MILITARY_CONFIGS });
});

export default app;
