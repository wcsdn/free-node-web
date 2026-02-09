/**
 * City Routes - 城市接口
 * 使用 Service 层
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { cityService } from '../services';

const app = new Hono<{ Bindings: Env }>();

// 辅助函数
function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 获取城市列表
app.post('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await cityService.getList(db, walletAddress);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to get cities', r.status || 500);
  }

  return success(c, r.data);
});

// 获取城市详情
app.post('/detail', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id } = await c.req.json<{ city_id?: number }>();
  const result = await cityService.getDetail(db, walletAddress, city_id);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to get city detail', r.status || 500);
  }

  return success(c, {
    city: r.data.city,
    buildings: r.data.buildings,
    cityId: r.data.cityId,
  });
});

// 收集资源
app.post('/collect', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id } = await c.req.json<{ city_id?: number }>();
  if (!city_id) return error(c, 'city_id is required');

  const result = await cityService.collect(db, walletAddress, city_id);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to collect', r.status || 500);
  }

  return success(c, r.data);
});

// 收集资源 (带cityId路径)
app.post('/:cityId/collect', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const cityId = parseInt(c.req.param('cityId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await cityService.collect(db, walletAddress, cityId);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to collect', r.status || 500);
  }

  return success(c, r.data);
});

// 创建新城市
app.post('/create', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { name } = await c.req.json<{ name?: string }>();
  if (!name) return error(c, 'name is required');

  const result = await cityService.create(db, walletAddress, name);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to create city', r.status || 500);
  }

  return success(c, r.data);
});

export default app;
