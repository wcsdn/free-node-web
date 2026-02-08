/**
 * Festival Route - 节日活动路由 (重构版)
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

// 活动配置
const FESTIVAL_EVENTS = [
  { id: 'spring', name: '春节活动', startDate: '2026-01-20', endDate: '2026-02-20', rewards: { gold: 100, items: [1] } },
  { id: 'lantern', name: '元宵节', startDate: '2026-02-01', endDate: '2026-02-15', rewards: { gold: 50, items: [2] } },
];

// 获取活动列表
app.get('/', async (c) => {
  const now = new Date().toISOString();
  const activeEvents = FESTIVAL_EVENTS.filter(e => now >= e.startDate && now <= e.endDate);
  return success(c, { events: activeEvents, total: activeEvents.length });
});

// 领取每日奖励
app.post('/daily-claim', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 检查今日是否已领取
    const today = new Date().toISOString().split('T')[0];
    const existing = await db.prepare(`
      SELECT * FROM daily_rewards WHERE wallet_address = ? AND date = ?
    `).bind(walletAddress, today).first();

    if (existing) return error(c, 'Already claimed today');

    // 发放奖励
    await db.prepare(`
      UPDATE characters SET gold = gold + 50 WHERE wallet_address = ?
    `).bind(walletAddress).run();

    await db.prepare(`
      INSERT INTO daily_rewards (wallet_address, date) VALUES (?, ?)
    `).bind(walletAddress, today).run();

    return success(c, { reward: { gold: 50 }, message: 'Claimed' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
