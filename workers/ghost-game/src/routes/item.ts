/**
 * 物品路由 - D1数据库版本
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

// 根路径 - 获取背包
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const items = await db.prepare(`
      SELECT * FROM inventory WHERE wallet_address = ? ORDER BY obtained_at DESC
    `).bind(walletAddress).all();

    return success(c, items.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 使用物品
app.post('/use', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_id, count } = await c.req.json();
  if (!item_id) return error(c, 'Missing item_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const inv = await db.prepare(`
      SELECT * FROM inventory WHERE wallet_address = ? AND item_id = ?
    `).bind(walletAddress, item_id).first();

    if (!inv || (inv as any).count < (count || 1)) {
      return error(c, 'Not enough items');
    }

    await db.prepare(`
      UPDATE inventory SET count = count - ? WHERE wallet_address = ? AND item_id = ?
    `).bind(count || 1, walletAddress, item_id).run();

    return success(c, { itemId: item_id, count: count || 1, message: 'Item used' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
