/**
 * Map Route - 地图路由 (重构版)
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

// 地图配置
const MAP_CONFIG = { width: 400, height: 400, worldSize: 160000 };
const TERRAIN_TYPES = { PLAIN: 1, MOUNTAIN: 2, WATER: 3, FOREST: 4, DESERT: 5 };

// 获取地图配置
app.get('/config', async (c) => {
  return success(c, { ...MAP_CONFIG, terrainTypes: TERRAIN_TYPES });
});

// 获取玩家位置
app.get('/position', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city: any = await db.prepare(`
      SELECT position, name FROM cities WHERE wallet_address = ? ORDER BY id LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'No city found');

    return success(c, { position: city.position, name: city.name });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 移动到位置
app.post('/move', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { position } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      UPDATE cities SET position = ? WHERE wallet_address = ?
    `).bind(position, walletAddress).run();

    return success(c, { position, message: 'Moved' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 获取附近NPC
app.get('/npcs', async (c) => {
  const { x = 0, y = 0, range = 100 } = c.req.query();
  // 简化：返回示例NPC
  return success(c, {
    npcs: [
      { id: 1, name: '新手引导员', position: 100, level: 1 },
      { id: 2, name: '商人', position: 200, level: 5 },
      { id: 3, name: '将军', position: 300, level: 10 },
    ],
  });
});

export default app;
