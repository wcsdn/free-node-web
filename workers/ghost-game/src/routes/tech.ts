/**
 * 科技路由 - D1数据库版本
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

// 根路径 - 获取科技树
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const techs = await db.prepare(`
      SELECT * FROM technics WHERE user_name = ? ORDER BY static_index
    `).bind(walletAddress).all();

    return success(c, techs.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 研究科技
app.post('/research', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { static_index } = await c.req.json();
  if (!static_index) return error(c, 'Missing static_index');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'No city found');

    await db.prepare(`
      INSERT OR IGNORE INTO technics (user_name, city_id, static_index, technic_level, state, build_id)
      VALUES (?, ?, ?, 1, 0, 0)
    `).bind(walletAddress, (city as any).id, static_index).run();

    return success(c, { staticIndex: static_index, message: 'Research started' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 升级科技
app.post('/:id/upgrade', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const techId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      UPDATE technics SET technic_level = technic_level + 1 WHERE id = ? AND user_name = ?
    `).bind(techId, walletAddress).run();

    return success(c, { id: techId, message: 'Tech upgraded' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
