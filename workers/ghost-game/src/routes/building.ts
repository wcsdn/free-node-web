/**
 * Building Route - 建筑路由 (重构版)
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import buildingConfigs from '../config/buildings.json';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 获取建筑列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'No city found', 404);

    const buildings = await db.prepare(`
      SELECT * FROM buildings WHERE city_id = ? ORDER BY position
    `).bind(city.id).all();

    const data = (buildings.results || []).map((b: any) => {
      const config = (buildingConfigs as Record<string, any>)[b.config_id] || {};
      return {
        id: b.id,
        configId: b.config_id,
        name: config.Name || '未知建筑',
        type: b.type,
        level: b.level,
        position: b.position,
        state: b.state,
      };
    });

    return success(c, { city: { id: city.id, name: city.name }, buildings: data });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 升级建筑
app.post('/:id/upgrade', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const buildingId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result = await db.prepare(`
      UPDATE buildings SET level = level + 1, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), buildingId).run();

    if (!result.success) return error(c, 'Upgrade failed');

    return success(c, { id: buildingId, message: 'Upgraded' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
