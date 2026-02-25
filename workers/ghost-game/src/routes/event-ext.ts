import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { EventServiceExtension, EVENT_TYPES, EVENT_STATES } from '../services';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) { return c.json({ success: true, data }); }
function error(c: any, msg: string) { return c.json({ success: false, error: msg }); }

// 获取进行中事件
app.get('/active', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new EventServiceExtension(db).getActiveEvents(wallet);
  return success(c, result);
});

// 获取可接事件
app.get('/available', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new EventServiceExtension(db).getAvailableEvents(wallet);
  return success(c, result);
});

// 获取过期事件
app.get('/expired', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new EventServiceExtension(db).getExpiredEvents(wallet);
  return success(c, result);
});

// 接受事件
app.post('/accept', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { event_id, event_type } = await c.req.json();
  const result = await new EventServiceExtension(db).acceptEvent(wallet, event_id, event_type);
  if (!result.success) return error(c, result.error);
  return success(c, result);
});

// 放弃事件
app.post('/abandon', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { event_id } = await c.req.json();
  const result = await new EventServiceExtension(db).abandonEvent(wallet, event_id);
  return success(c, result);
});

// 更新进度
app.post('/progress', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { event_id, delta } = await c.req.json();
  const result = await new EventServiceExtension(db).updateProgress(wallet, event_id, delta);
  return success(c, result);
});

// 刷新随机事件
app.post('/refresh', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new EventServiceExtension(db).refreshRandomEvents(wallet);
  if (!result.success) return error(c, result.error);
  return success(c, result);
});

// 获取剧情章节
app.get('/story/chapters', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new EventServiceExtension(db).getStoryChapters(wallet);
  return success(c, result);
});

// 开始剧情事件
app.post('/story/start', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { event_id } = await c.req.json();
  const result = await new EventServiceExtension(db).startStoryEvent(wallet, event_id);
  if (!result.success) return error(c, result.error);
  return success(c, result);
});

export default app;
