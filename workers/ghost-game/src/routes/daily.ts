/**
 * Daily Route - 每日任务路由 (重构版)
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

// 任务配置
const DAILY_TASKS = [
  { id: 1, key: 'login', title: '每日登录', type: 'login', target: 1, reward: { exp: 10, gold: 50 } },
  { id: 2, key: 'collect', title: '采集资源', type: 'collect', target: 3, reward: { exp: 20, gold: 100 } },
  { id: 3, key: 'build', title: '建造建筑', type: 'build', target: 1, reward: { exp: 30, gold: 150 } },
  { id: 4, key: 'upgrade', title: '升级建筑', type: 'upgrade', target: 2, reward: { exp: 40, gold: 200 } },
  { id: 5, key: 'recruit_hero', title: '招募武将', type: 'recruit', target: 1, reward: { exp: 50, gold: 300 } },
  { id: 6, key: 'battle', title: '完成战斗', type: 'battle', target: 3, reward: { exp: 60, gold: 400 } },
  { id: 7, key: 'explore', title: '探索地图', type: 'explore', target: 5, reward: { exp: 30, gold: 150 } },
  { id: 8, key: 'train_hero', title: '训练武将', type: 'train', target: 5, reward: { exp: 40, gold: 200 } },
];

// 获取每日任务
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const today = new Date().toISOString().split('T')[0];

  try {
    const progress = await db.prepare(`
      SELECT * FROM daily_task_progress WHERE wallet_address = ? AND date = ?
    `).bind(walletAddress, today).all();

    const progressMap: Record<number, number> = {};
    for (const p of (progress.results || [])) {
      progressMap[(p as any).task_id] = (p as any).current_value;
    }

    const tasks = DAILY_TASKS.map(t => ({
      id: t.id,
      title: t.title,
      type: t.type,
      target: t.target,
      current: progressMap[t.id] || 0,
      progress: Math.min(100, Math.floor(((progressMap[t.id] || 0) / t.target) * 100)),
      reward: t.reward,
      completed: (progressMap[t.id] || 0) >= t.target,
    }));

    const completed = tasks.filter(t => t.completed).length;

    return success(c, {
      date: today,
      tasks,
      stats: { total: tasks.length, completed, remaining: tasks.length - completed },
    });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 更新任务进度
app.post('/progress', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { task_key, increment = 1 } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const today = new Date().toISOString().split('T')[0];
  const task = DAILY_TASKS.find(t => t.key === task_key);
  if (!task) return error(c, 'Invalid task key');

  try {
    const existing = await db.prepare(`
      SELECT * FROM daily_task_progress WHERE wallet_address = ? AND task_id = ? AND date = ?
    `).bind(walletAddress, task.id, today).first();

    if (existing) {
      await db.prepare(`
        UPDATE daily_task_progress SET current_value = current_value + ? WHERE wallet_address = ? AND task_id = ? AND date = ?
      `).bind(increment, walletAddress, task.id, today).run();
    } else {
      await db.prepare(`
        INSERT INTO daily_task_progress (wallet_address, task_id, date, current_value, status)
        VALUES (?, ?, ?, ?, 0)
      `).bind(walletAddress, task.id, today, increment).run();
    }

    return success(c, { message: 'Progress updated' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 领取奖励
app.post('/claim', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { task_id } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const today = new Date().toISOString().split('T')[0];
  const task = DAILY_TASKS.find(t => t.id === task_id);
  if (!task) return error(c, 'Invalid task_id');

  try {
    const existing = await db.prepare(`
      SELECT * FROM daily_task_progress WHERE wallet_address = ? AND task_id = ? AND date = ?
    `).bind(walletAddress, task.id, today).first();

    if (!existing) return error(c, 'Task not started');
    if ((existing as any).current_value < task.target) return error(c, 'Task not completed');
    if ((existing as any).status === 1) return error(c, 'Already claimed');

    // 发放奖励
    await db.prepare(`
      UPDATE characters SET exp = exp + ?, gold = gold + ? WHERE wallet_address = ?
    `).bind(task.reward.exp, task.reward.gold, walletAddress).run();

    await db.prepare(`
      UPDATE daily_task_progress SET status = 1 WHERE wallet_address = ? AND task_id = ? AND date = ?
    `).bind(walletAddress, task.id, today).run();

    return success(c, { reward: task.reward, message: 'Claimed' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
