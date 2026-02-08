/**
 * Skill Route - 技能路由 (重构版)
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import skillConfigs from '../config/skills.json';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 获取技能配置
app.get('/configs', async (c) => {
  const skills = Object.values(skillConfigs as Record<string, any>).map((s: any) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    description: s.description,
    effectValue: s.effectValue,
    icon: s.icon,
  }));
  return success(c, { skills, total: skills.length });
});

// 获取玩家技能
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const skills = await db.prepare(`
      SELECT * FROM skills WHERE wallet_address = ? ORDER BY static_index
    `).bind(walletAddress).all();

    const data = (skills.results || []).map((s: any) => ({
      id: s.id,
      staticIndex: s.static_index,
      level: s.skill_level,
      name: s.name || '未知技能',
      type: s.type || 1,
    }));

    return success(c, { skills: data, total: data.length });
  } catch (err) {
    return error(c, (err as Error).message);
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

    return success(c, { id: skillId, message: 'Upgraded' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
