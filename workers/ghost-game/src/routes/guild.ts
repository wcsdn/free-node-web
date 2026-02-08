/**
 * Guild Route - 帮派路由 (重构版)
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

// 获取我的帮派
app.get('/my', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const member: any = await db.prepare(`
      SELECT gm.*, g.name, g.level FROM guild_members gm
      JOIN guilds g ON gm.guild_id = g.id
      WHERE gm.wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) return success(c, { hasGuild: false });

    return success(c, {
      hasGuild: true,
      guild: { id: member.guild_id, name: member.name, level: member.level },
      role: member.role,
      contribution: member.contribution,
    });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 创建帮派
app.post('/create', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { name, notice } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 创建帮派
    await db.prepare(`
      INSERT INTO guilds (name, notice, level, leader_id, created_at)
      VALUES (?, ?, 1, ?, ?)
    `).bind(name, notice || '', walletAddress, new Date().toISOString()).run();

    // 添加创建者为会长
    const guildId = (await db.prepare('SELECT last_insert_rowid() as id').first() as any).id;
    await db.prepare(`
      INSERT INTO guild_members (guild_id, wallet_address, role, joined_at)
      VALUES (?, ?, 1, ?)
    `).bind(guildId, walletAddress, new Date().toISOString()).run();

    return success(c, { id: guildId, name, message: 'Guild created' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 帮派捐献
app.post('/donate', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { gold = 0, food = 0 } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      UPDATE characters SET gold = gold - ? WHERE wallet_address = ?
    `).bind(gold, walletAddress).run();

    await db.prepare(`
      UPDATE guild_members SET contribution = contribution + ? WHERE wallet_address = ?
    `).bind(gold, walletAddress).run();

    return success(c, { contribution: gold, message: 'Donated' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
