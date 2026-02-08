/**
 * Event Route - 时间事件路由 (重构版)
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

const EVENT_TYPES = { BUILDING: 1, TECHNIC: 2, HERO: 4 };

// 获取等待中的事件
app.get('/pending', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const events = await db.prepare(`
      SELECT * FROM time_events 
      WHERE wallet_address = ? AND end_time > datetime('now')
      ORDER BY end_time ASC
    `).bind(walletAddress).all();

    return success(c, { events: events.results || [], total: events.results?.length || 0 });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 创建事件
app.post('/create', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, type, action, target_id, duration_ms } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const endTime = new Date(Date.now() + duration_ms).toISOString();

    await db.prepare(`
      INSERT INTO time_events (wallet_address, city_id, type, action, target_id, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
    `).bind(walletAddress, city_id, type, action, target_id, endTime).run();

    return success(c, { message: 'Event created', endTime });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 取消事件
app.post('/:id/cancel', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const eventId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      DELETE FROM time_events WHERE id = ? AND wallet_address = ?
    `).bind(eventId, walletAddress).run();

    return success(c, { message: 'Event cancelled' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
