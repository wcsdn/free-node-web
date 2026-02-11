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

// 获取持久效果分组
app.get('/persist-group', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { objType, objID } = c.req.query();
  if (!objType || !objID) return error(c, 'Missing objType or objID');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现获取持久效果分组逻辑
    return success(c, []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取过期效果数组
app.get('/over-array', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { objType, objID } = c.req.query();
  if (!objType || !objID) return error(c, 'Missing objType or objID');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现获取过期效果数组逻辑
    return success(c, []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 处理过期效果
app.post('/process-overdue', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现处理过期效果逻辑
    return success(c, { message: 'Overdue effects processed' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
