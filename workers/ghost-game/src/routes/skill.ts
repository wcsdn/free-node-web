/**
 * 技能路由 - D1数据库版本
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

// 根路径 - 获取技能列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const skills = await db.prepare(`
      SELECT * FROM skills WHERE wallet_address = ? ORDER BY static_index
    `).bind(walletAddress).all();

    return success(c, skills.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 升级技能
app.post('/:id/upgrade', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const skillId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      UPDATE skills SET skill_level = skill_level + 1 WHERE id = ? AND wallet_address = ?
    `).bind(skillId, walletAddress).run();

    return success(c, { id: skillId, message: 'Skill upgraded' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
