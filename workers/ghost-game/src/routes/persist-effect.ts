/**
 * PersistEffect Route - 持久效果路由 (重构版)
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

// 获取活跃效果
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const effects = await db.prepare(`
      SELECT * FROM persist_effects 
      WHERE user_name = ? AND end_time > datetime('now')
      ORDER BY end_time ASC
    `).bind(walletAddress).all();

    return success(c, { effects: effects.results || [] });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 添加效果
app.post('/add', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { type, duration_hours = 1 } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const endTime = new Date(Date.now() + duration_hours * 3600000).toISOString();

    await db.prepare(`
      INSERT INTO persist_effects (user_name, static_index, main_effect_type, effect_type, start_time, end_time)
      VALUES (?, ?, ?, ?, datetime('now'), ?)
    `).bind(walletAddress, 1, type, 1, endTime).run();

    return success(c, { type, endTime, message: 'Effect added' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 移除效果
app.post('/:id/remove', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const effectId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      DELETE FROM persist_effects WHERE id = ? AND user_name = ?
    `).bind(effectId, walletAddress).run();

    return success(c, { message: 'Effect removed' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
