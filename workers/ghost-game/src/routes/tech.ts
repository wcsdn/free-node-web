/**
 * Tech Route - 科技路由 (重构版)
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import technicConfigs from '../config/technics.json';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 获取科技配置
app.get('/configs', async (c) => {
  const techs = (technicConfigs || []).map((t: any) => ({
    id: t.ID,
    name: t.Name,
    description: t.Des,
    maxLevel: t.InteriorData?.length || 1,
  }));
  return success(c, { techs, total: techs.length });
});

// 获取玩家科技
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const techs = await db.prepare(`
      SELECT * FROM technics WHERE wallet_address = ? ORDER BY updated_at DESC
    `).bind(walletAddress).all();

    const data = (techs.results || []).map((t: any) => ({
      id: t.id,
      configId: t.config_id,
      level: t.level,
      name: t.name || '未知科技',
    }));

    return success(c, { techs: data, total: data.length });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 研究科技
app.post('/research', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { config_id } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      INSERT OR IGNORE INTO technics (wallet_address, config_id, level)
      VALUES (?, ?, 1)
    `).bind(walletAddress, config_id).run();

    return success(c, { configId: config_id, message: 'Research started' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
