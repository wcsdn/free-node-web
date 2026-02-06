/**
 * 建筑路由 - D1数据库版本
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

// 根路径 - 获取建筑列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 先获取城市
    const city = await db.prepare(`
      SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    const buildings = await db.prepare(`
      SELECT * FROM buildings WHERE city_id = ? ORDER BY position
    `).bind((city as any).id).all();

    return success(c, buildings.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取建筑列表 (兼容旧路径)
app.get('/list/:cityId', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const cityId = parseInt(c.req.param('cityId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const buildings = await db.prepare(`
      SELECT * FROM buildings WHERE city_id = ? ORDER BY position
    `).bind(cityId).all();

    return success(c, buildings.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 建造建筑
app.post('/build', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, config_id, position } = await c.req.json();
  
  if (!city_id || !config_id || position === undefined) {
    return error(c, 'Missing required fields');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 检查城市归属
    const city = await db.prepare(`
      SELECT * FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(city_id, walletAddress).first();

    if (!city) return error(c, 'City not found or not owned');

    // 检查位置是否被占用
    const existing = await db.prepare(`
      SELECT id FROM buildings WHERE city_id = ? AND position = ?
    `).bind(city_id, position).first();

    if (existing) return error(c, 'Position already occupied');

    // 创建建筑
    const result = await db.prepare(`
      INSERT INTO buildings (city_id, type, level, position, state, config_id)
      VALUES (?, 'interior', 1, ?, 0, ?)
    `).bind(city_id, position, config_id).run();

    return success(c, {
      id: result.meta.last_row_id,
      cityId: city_id,
      configId: config_id,
      position,
      level: 1,
      message: 'Building created'
    });
  } catch (err: any) {
    return error(c, err.message);
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
    const building: any = await db.prepare(`
      SELECT b.*, c.wallet_address
      FROM buildings b
      JOIN cities c ON b.city_id = c.id
      WHERE b.id = ?
    `).bind(buildingId).first();

    if (!building) return error(c, 'Building not found');
    if (building.wallet_address !== walletAddress) return error(c, 'Not authorized');

    await db.prepare(`
      UPDATE buildings SET level = level + 1 WHERE id = ?
    `).bind(buildingId).run();

    return success(c, { id: buildingId, level: building.level + 1 });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取建筑配置
app.get('/configs', async (c) => {
  return success(c, [
    { id: 1, name: '聚义厅', type: 'interior', maxLevel: 10 },
    { id: 2, name: '民心设施', type: 'interior', maxLevel: 10 },
    { id: 3, name: '钱庄', type: 'interior', maxLevel: 10 },
    { id: 4, name: '农场', type: 'interior', maxLevel: 10 },
    { id: 5, name: '民居', type: 'interior', maxLevel: 10 },
    { id: 6, name: '箭塔', type: 'defense', maxLevel: 10 },
    { id: 7, name: '城墙', type: 'defense', maxLevel: 10 },
  ]);
});

export default app;
