/**
 * Corps Routes - 军团接口
 * 使用 Service 层
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { corpsService } from '../services';

const app = new Hono<{ Bindings: Env }>();

// 辅助函数
function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 获取军团列表
app.post('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { limit } = await c.req.json<{ limit?: number }>();
  const result = await corpsService.getList(db, limit);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to get corps list', r.status || 500);
  }

  return success(c, r.data);
});

// 获取军团详情
app.post('/detail', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { corps_id } = await c.req.json<{ corps_id?: number }>();
  if (!corps_id) return error(c, 'corps_id is required');

  const result = await corpsService.getDetail(db, corps_id);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to get corps detail', r.status || 500);
  }

  return success(c, r.data);
});

// 创建军团
app.post('/create', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { name, notice } = await c.req.json<{ name?: string; notice?: string }>();
  if (!name) return error(c, 'name is required');

  const result = await corpsService.create(db, walletAddress, name, notice);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to create corps', r.status || 500);
  }

  return success(c, r.data);
});

// 申请加入军团
app.post('/apply', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { corps_id, message } = await c.req.json<{ corps_id?: number; message?: string }>();
  if (!corps_id) return error(c, 'corps_id is required');

  const result = await corpsService.apply(db, walletAddress, corps_id, message);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to apply', r.status || 500);
  }

  return success(c, { message: 'Application submitted' });
});

// 离开军团
app.post('/leave', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await corpsService.leave(db, walletAddress);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to leave corps', r.status || 500);
  }

  return success(c, { message: 'Left corps successfully' });
});

// 获取我的军团信息
app.post('/my', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await corpsService.getMyCorps(db, walletAddress);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to get my corps', r.status || 500);
  }

  return success(c, r.data);
});

export default app;
