/**
 * 聊天路由 - D1数据库版本
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

// 根路径 - 获取消息
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const messages = await db.prepare(`
      SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 50
    `).all();

    return success(c, (messages.results || []).reverse());
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 发送消息
app.post('/send', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { content, type } = await c.req.json();
  if (!content) return error(c, 'Missing content');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const char = await db.prepare(`
      SELECT name FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    await db.prepare(`
      INSERT INTO chat_messages (sender, sender_name, content, type)
      VALUES (?, ?, ?, ?)
    `).bind(walletAddress, (char as any)?.name || '玩家', content, type || 0).run();

    return success(c, { message: 'Message sent' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
