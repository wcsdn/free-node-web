/**
 * Item Route - 物品路由 (重构版)
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

// 获取物品列表
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const items = await db.prepare(`
      SELECT * FROM items WHERE wallet_address = ? ORDER BY created_at DESC
    `).bind(walletAddress).all();

    const data = (items.results || []).map((i: any) => ({
      id: i.id,
      configId: i.config_id,
      type: i.type,
      count: i.count,
      equipped: i.equipped === 1,
    }));

    return success(c, { items: data, total: data.length });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 使用物品
app.post('/use', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_id, count = 1 } = await c.req.json();
  if (!item_id) return error(c, 'Missing item_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const item = await db.prepare(`
      SELECT * FROM items WHERE wallet_address = ? AND config_id = ?
    `).bind(walletAddress, item_id).first();

    if (!item || (item as any).count < count) {
      return error(c, 'Not enough items');
    }

    const newCount = (item as any).count - count;
    if (newCount <= 0) {
      await db.prepare(`DELETE FROM items WHERE wallet_address = ? AND config_id = ?`)
        .bind(walletAddress, item_id).run();
    } else {
      await db.prepare(`UPDATE items SET count = ? WHERE wallet_address = ? AND config_id = ?`)
        .bind(newCount, walletAddress, item_id).run();
    }

    return success(c, { itemId: item_id, count, message: 'Used' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
