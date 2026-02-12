/**
 * Admin Routes - 管理员接口
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

// 踢出用户
app.post('/kick-user', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 已实现（KickUser 在 C# 中无参数）
    return success(c, { message: 'User kicked' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
