/**
 * Hero Routes - 武将接口
 * 使用 Service 层
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { heroService } from '../services';

const app = new Hono<{ Bindings: Env }>();

// 辅助函数
function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 获取武将列表
app.post('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await heroService.getList(db, walletAddress);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to get heroes', r.status || 500);
  }

  return success(c, r.data);
});

// 获取武将详情
app.post('/detail', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { hero_id } = await c.req.json<{ hero_id?: number }>();
  if (!hero_id) return error(c, 'hero_id is required');

  const result = await heroService.getDetail(db, hero_id);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to get hero', r.status || 500);
  }

  return success(c, r.data);
});

// 招募武将
app.post('/recruit', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id, name, quality } = await c.req.json<{ city_id?: number; name?: string; quality?: number }>();
  if (!city_id || !name) return error(c, 'city_id and name are required');

  const result = await heroService.recruit(db, walletAddress, city_id, name, quality);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to recruit hero', r.status || 500);
  }

  return success(c, r.data);
});

// 升级武将
app.post('/levelup', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { hero_id } = await c.req.json<{ hero_id?: number }>();
  if (!hero_id) return error(c, 'hero_id is required');

  const result = await heroService.levelUp(db, hero_id);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to level up hero', r.status || 500);
  }

  return success(c, r.data);
});

// 训练武将
app.post('/:heroId/train', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const heroId = parseInt(c.req.param('heroId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await heroService.train(db, heroId);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to train hero', r.status || 500);
  }

  return success(c, r.data);
});

// 升级武将 (带heroId路径)
app.post('/:heroId/upgrade', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const heroId = parseInt(c.req.param('heroId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await heroService.levelUp(db, heroId);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to upgrade hero', r.status || 500);
  }

  return success(c, r.data);
});

export default app;
