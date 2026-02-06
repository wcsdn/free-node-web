/**
 * 城防路由 - D1数据库版本
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

// 根路径 - 获取城防信息
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    const defenses = await db.prepare(`
      SELECT * FROM defence_buildings WHERE city_id = ?
    `).bind((city as any).id).all();

    return success(c, {
      wallLevel: 1,
      trapCount: defenses.results?.length || 0,
      defenses: defenses.results || [],
      totalDefense: defenses.results?.reduce((sum: number, d: any) => sum + (d.defence_level || 0), 0) || 0
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 建造城防
app.post('/build', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { type, position } = await c.req.json();
  if (!type) return error(c, 'Missing type');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    await db.prepare(`
      INSERT INTO defence_buildings (city_id, user_name, static_index, position, defence_level)
      VALUES (?, ?, ?, ?, 1)
    `).bind((city as any).id, walletAddress, type, position || 0).run();

    return success(c, { type, message: 'Defense built' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 升级城防
app.post('/:id/upgrade', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const defId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      UPDATE defence_buildings SET defence_level = defence_level + 1 WHERE id = ?
    `).bind(defId).run();

    return success(c, { id: defId, message: 'Defense upgraded' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
