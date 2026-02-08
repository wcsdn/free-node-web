/**
 * Mail Route - 邮件路由 (重构版)
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

// 获取邮件列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const mails = await db.prepare(`
      SELECT * FROM mails WHERE receiver_address = ?
      ORDER BY created_at DESC LIMIT 50
    `).bind(walletAddress).all();

    const data = (mails.results || []).map((m: any) => ({
      id: m.id,
      sender: m.sender_address,
      title: m.title,
      content: m.content,
      time: m.created_at,
      read: m.is_read === 1,
      hasAttachment: !!m.attachments,
    }));

    return success(c, { items: data, total: data.length });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 获取未读邮件数量
app.get('/unread-count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM mails WHERE receiver_address = ? AND is_read = 0
    `).bind(walletAddress).first() as { count: number };

    return success(c, { count: result.count });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 标记已读
app.post('/:id/read', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const mailId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      UPDATE mails SET is_read = 1 WHERE id = ? AND receiver_address = ?
    `).bind(mailId, walletAddress).run();

    return success(c, { message: 'Marked as read' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 删除邮件
app.delete('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const mailId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      DELETE FROM mails WHERE id = ? AND receiver_address = ?
    `).bind(mailId, walletAddress).run();

    return success(c, { message: 'Deleted' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
