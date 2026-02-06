/**
 * 通知路由 - D1数据库版本
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

// 根路径 - 获取通知
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const notifications = await db.prepare(`
      SELECT n.*, un.is_read, un.read_at
      FROM notifications n
      LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.wallet_address = ?
      WHERE n.start_time IS NULL OR n.start_time <= datetime('now')
      ORDER BY n.priority DESC, n.created_at DESC LIMIT 50
    `).bind(walletAddress).all();

    return success(c, notifications.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取未读数量
app.get('/unread', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, { count: 0 });
});

// 标记已读
app.post('/:id/read', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const notifId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      INSERT OR IGNORE INTO user_notifications (wallet_address, notification_id, is_read, read_at)
      VALUES (?, ?, 1, datetime('now'))
    `).bind(walletAddress, notifId).run();

    return success(c, { message: 'Marked as read' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
