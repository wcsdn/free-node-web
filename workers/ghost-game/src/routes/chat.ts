/**
 * Chat Route - 聊天路由 (重构版)
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

// 获取聊天列表
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { channel = 'global', limit = '50' } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const messages = await db.prepare(`
      SELECT * FROM chat_messages 
      WHERE channel = ? OR ? = 'global'
      ORDER BY created_at DESC LIMIT ?
    `).bind(channel, channel, parseInt(limit) || 50).all();

    return success(c, { channel, messages: (messages.results || []).reverse() });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 发送消息
app.post('/send', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { content, channel = 'global' } = await c.req.json();
  if (!content) return error(c, 'Missing content');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const char = await db.prepare(`
      SELECT name FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    await db.prepare(`
      INSERT INTO chat_messages (sender, sender_name, content, channel)
      VALUES (?, ?, ?, ?)
    `).bind(walletAddress, (char as any)?.name || '玩家', content, channel).run();

    return success(c, { message: 'Sent' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
