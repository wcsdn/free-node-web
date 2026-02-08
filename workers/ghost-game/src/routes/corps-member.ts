/**
 * CorpsMember Route - 军团成员路由 (重构版)
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

// 获取成员信息
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const member: any = await db.prepare(`
      SELECT cm.*, cs.name FROM corps_members cm
      JOIN corps_system cs ON cm.corps_id = cs.id
      WHERE cm.wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) return success(c, { inCorps: false });

    return success(c, {
      inCorps: true,
      corpsId: member.corps_id,
      corpsName: member.name,
      role: member.role,
    });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 加入军团
app.post('/join', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { corps_id } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      INSERT INTO corps_members (corps_id, wallet_address, role)
      VALUES (?, ?, 'member')
    `).bind(corps_id, walletAddress).run();

    return success(c, { corpsId: corps_id, message: 'Joined' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 退出军团
app.post('/leave', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`DELETE FROM corps_members WHERE wallet_address = ?`).bind(walletAddress).run();
    return success(c, { message: 'Left' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
