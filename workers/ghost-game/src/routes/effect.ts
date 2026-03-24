/**
 * Effect Routes - 效果系统
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

// 获取持久效果分组 - GET /effect/persist-group
app.get('/persist-group', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 查询城市的持久效果
    const effects = await db.prepare(`
      SELECT * FROM persist_effects
      WHERE wallet_address = ? AND city_id = ?
      ORDER BY created_at DESC
    `).bind(walletAddress, city_id || 0).all();

    // 按效果类型分组
    const grouped: Record<string, any[]> = {};
    (effects.results || []).forEach((e: any) => {
      if (!grouped[e.effect_type]) {
        grouped[e.effect_type] = [];
      }
      grouped[e.effect_type].push(e);
    });

    return success(c, grouped);
  } catch (err: any) {
    // 表可能不存在
    return success(c, {});
  }
});

// 获取过期效果数组 - GET /effect/over-array
app.get('/over-array', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 查询已过期的效果
    const expiredEffects = await db.prepare(`
      SELECT * FROM persist_effects
      WHERE wallet_address = ? AND end_time < datetime('now')
    `).bind(walletAddress).all();

    return success(c, expiredEffects.results || []);
  } catch (err: any) {
    // 表可能不存在
    return success(c, []);
  }
});

// 处理过期效果 - POST /effect/process-overdue
app.post('/process-overdue', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID, eventID } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 删除过期效果
    const result = await db.prepare(`
      DELETE FROM persist_effects
      WHERE wallet_address = ? AND end_time < datetime('now')
    `).bind(walletAddress).run();

    return success(c, {
      message: 'Overdue effects processed',
      deletedCount: result.meta.changes,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
