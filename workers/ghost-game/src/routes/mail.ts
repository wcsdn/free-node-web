/**
 * 邮件路由 - D1数据库版本
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

// 根路径 - 获取邮件列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const mails = await db.prepare(`
      SELECT * FROM mails WHERE wallet_address = ? ORDER BY created_at DESC LIMIT 50
    `).bind(walletAddress).all();

    return success(c, mails.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 发送邮件
app.post('/send', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { to_address, title, content, mail_type } = await c.req.json();
  if (!to_address || !title) return error(c, 'Missing required fields');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result = await db.prepare(`
      INSERT INTO mails (wallet_address, mail_type, from_name, title, content)
      VALUES (?, ?, ?, ?, ?)
    `).bind(to_address, mail_type || 0, 'System', title, content || '').run();

    return success(c, { id: result.meta.last_row_id, message: 'Mail sent' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 领取附件
app.post('/:id/claim', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const mailId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      UPDATE mails SET has_attachment = 0, attachment_data = NULL WHERE id = ? AND wallet_address = ?
    `).bind(mailId, walletAddress).run();

    return success(c, { message: 'Attachment claimed' });
  } catch (err: any) {
    return error(c, err.message);
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
      DELETE FROM mails WHERE id = ? AND wallet_address = ?
    `).bind(mailId, walletAddress).run();

    return success(c, { message: 'Mail deleted' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 批量清理
app.post('/cleanup', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      DELETE FROM mails WHERE wallet_address = ? AND created_at < datetime('now', '-7 days')
    `).bind(walletAddress).run();

    return success(c, { message: 'Old mails cleaned up' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
