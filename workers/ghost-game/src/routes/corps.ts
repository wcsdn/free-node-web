/**
 * Corps Route - 军团路由 (重构版)
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

// 军团阵型
const FORMATIONS = [
  { id: 0, name: '鱼鳞阵', attack: 1.0, defense: 0.9 },
  { id: 1, name: '锋矢阵', attack: 1.2, defense: 0.7 },
  { id: 2, name: '鹤翼阵', attack: 0.9, defense: 1.1 },
  { id: 3, name: '八卦阵', attack: 0.8, defense: 1.3 },
];

// 获取军团列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const corps = await db.prepare(`
      SELECT c.*, ci.name as city_name
      FROM corps_system c
      JOIN cities ci ON c.city_id = ci.id
      WHERE c.leader_id = ?
      ORDER BY c.created_at DESC
    `).bind(walletAddress).all();

    const list = (corps.results || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      cityId: c.city_id,
      state: c.state || 0,
      formation: c.formation || 0,
      targetPosition: c.target_position,
      cityName: c.city_name,
    }));

    return success(c, list);
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 创建军团
app.post('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { name, cityId, formation = 0 } = await c.req.json();
  if (!name || name.length < 2) return error(c, 'Name must be 2+ characters');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      INSERT INTO corps_system (leader_id, city_id, name, formation, state, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).bind(walletAddress, cityId, name, formation, new Date().toISOString()).run();

    return success(c, { name, formation, message: 'Corps created' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 军团出征
app.post('/:id/depart', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const corpsId = parseInt(c.req.param('id'));
  const { targetPosition } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      UPDATE corps_system SET state = 1, target_position = ?, depart_time = ?
      WHERE id = ? AND leader_id = ?
    `).bind(targetPosition, new Date().toISOString(), corpsId, walletAddress).run();

    return success(c, { message: 'Departed' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 军团召回
app.post('/:id/recall', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const corpsId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      UPDATE corps_system SET state = 3 WHERE id = ? AND leader_id = ?
    `).bind(corpsId, walletAddress).run();

    return success(c, { message: 'Recalled' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 获取阵型配置
app.get('/formations', async (c) => {
  return success(c, FORMATIONS);
});

export default app;
