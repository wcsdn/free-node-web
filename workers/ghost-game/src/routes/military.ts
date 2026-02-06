/**
 * 军事路由 - D1数据库版本
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

// 根路径 - 获取军事信息
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    const troops = await db.prepare(`
      SELECT * FROM troops WHERE city_id = ?
    `).bind((city as any).id).all();

    return success(c, troops.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 训练军队
app.post('/train', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { type, amount } = await c.req.json();
  if (!type || !amount) return error(c, 'Missing parameters');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    await db.prepare(`
      INSERT OR REPLACE INTO troops (city_id, type, amount, attack, defense)
      VALUES (?, ?, ?, ?, ?)
    `).bind((city as any).id, type, amount, amount * 10, amount * 5).run();

    return success(c, { type, amount, message: 'Troops trained' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 解散军队
app.post('/:id/dismiss', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const troopId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`DELETE FROM troops WHERE id = ?`).bind(troopId).run();
    return success(c, { id: troopId, message: 'Troops dismissed' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
