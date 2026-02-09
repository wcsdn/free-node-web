/**
 * Hero Route - 武将路由 (重构版)
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import type { ServiceResult } from '../models';
import { verifyWalletAuth } from '../utils/auth';
import { heroService } from '../services';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status?: number) {
  return c.json({ success: false, error: message }, status as number);
}

// 类型守卫：检查是否是错误结果
function isErrorResult<T>(result: ServiceResult<T>): result is { ok: false; error: string; status?: number } {
  return !result.ok;
}

// GET /api/hero - 获取武将列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await heroService.getList(db, walletAddress);
  if (isErrorResult(result)) return error(c, result.error, result.status);

  return success(c, result.data);
});

// GET /api/hero/list - 获取武将列表 (兼容旧版)
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await heroService.getList(db, walletAddress);
  if (isErrorResult(result)) return error(c, result.error, result.status);

  return c.json({
    success: true,
    data: result.data,
    count: result.data.length,
  });
});

// POST /api/hero/:id/levelup - 升级武将
app.post('/:id/levelup', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const heroId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await heroService.levelUp(db, heroId);
  if (isErrorResult(result)) return error(c, result.error, result.status);

  return success(c, result.data);
});

export default app;
