/**
 * 军团成员路由 - D1数据库版本
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

// 根路径 - 获取军团成员信息
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取用户所在的军团
    const membership: any = await db.prepare(`
      SELECT cm.*, cs.name as corps_name
      FROM corps_members cm
      JOIN corps_system cs ON cm.corps_id = cs.id
      WHERE cm.wallet_address = ?
    `).bind(walletAddress).first();

    if (!membership) {
      return success(c, { inCorps: false, message: 'Not in any corps' });
    }

    // 获取军团成员列表
    const members = await db.prepare(`
      SELECT cm.*, c.name as character_name, c.level as character_level
      FROM corps_members cm
      LEFT JOIN characters c ON cm.wallet_address = c.wallet_address
      WHERE cm.corps_id = ?
      ORDER BY 
        CASE cm.role 
          WHEN 'leader' THEN 1 
          WHEN 'commander' THEN 2 
          WHEN 'elder' THEN 3 
          ELSE 4 
        END,
        cm.joined_at ASC
    `).bind(membership.corps_id).all();

    return success(c, {
      inCorps: true,
      corpsId: membership.corps_id,
      corpsName: membership.corps_name,
      role: membership.role,
      members: (members as any).results || []
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 加入军团
app.post('/join', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { corps_id } = await c.req.json();
  if (!corps_id) return error(c, 'Missing corps_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 检查是否已在军团
    const existing = await db.prepare(`
      SELECT id FROM corps_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (existing) return error(c, 'Already in a corps');

    // 检查军团是否存在
    const corps = await db.prepare(`
      SELECT * FROM corps_system WHERE id = ?
    `).bind(corps_id).first();

    if (!corps) return error(c, 'Corps not found');

    // 加入军团
    await db.prepare(`
      INSERT INTO corps_members (corps_id, wallet_address, role, contribution)
      VALUES (?, ?, 'member', 0)
    `).bind(corps_id, walletAddress).run();

    await db.prepare(`
      UPDATE corps_system SET member_count = member_count + 1 WHERE id = ?
    `).bind(corps_id).run();

    return success(c, { corpsId: corps_id, message: 'Joined corps' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 退出军团
app.post('/leave', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const membership: any = await db.prepare(`
      SELECT * FROM corps_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!membership) return error(c, 'Not in any corps');
    if (membership.role === 'leader') return error(c, 'Leader cannot leave');

    await db.prepare(`
      DELETE FROM corps_members WHERE wallet_address = ?
    `).bind(walletAddress).run();

    return success(c, { message: 'Left corps' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 踢出成员
app.post('/kick', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { member_address } = await c.req.json();
  if (!member_address) return error(c, 'Missing member_address');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      DELETE FROM corps_members WHERE wallet_address = ?
    `).bind(member_address).run();

    return success(c, { message: 'Member kicked' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
