/**
 * 任务路由 - D1数据库版本
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import taskConfigs from '../config/tasks.json';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 根路径 - 获取任务列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const tasks = await db.prepare(`
      SELECT * FROM user_tasks WHERE wallet_address = ? ORDER BY started_at DESC
    `).bind(walletAddress).all();

    return success(c, tasks.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取任务配置
app.get('/configs', async (c) => {
  const configs = Object.entries(taskConfigs as Record<string, any>).map(([id, task]) => ({
    id: parseInt(id),
    title: task.Title || task.title,
    description: task.Description || task.description,
    type: task.Type || task.type,
    target: task.Target || task.target,
    rewardExp: task.RewardExp || task.rewardExp,
    rewardGold: task.RewardGold || task.rewardGold,
  }));
  return success(c, configs);
});

// 接受任务
app.post('/accept', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { task_id } = await c.req.json();
  if (!task_id) return error(c, 'Missing task_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      INSERT OR IGNORE INTO user_tasks (wallet_address, task_config_id, status, progress)
      VALUES (?, ?, 1, 0)
    `).bind(walletAddress, task_id).run();

    return success(c, { taskId: task_id, message: 'Task accepted' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 提交任务
app.post('/complete', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { task_id } = await c.req.json();
  if (!task_id) return error(c, 'Missing task_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      DELETE FROM user_tasks WHERE wallet_address = ? AND task_config_id = ?
    `).bind(walletAddress, task_id).run();

    await db.prepare(`
      INSERT OR REPLACE INTO completed_tasks (wallet_address, task_config_id, completed_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).bind(walletAddress, task_id).run();

    return success(c, { taskId: task_id, message: 'Task completed' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取已完成任务
app.get('/completed', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const completed = await db.prepare(`
      SELECT * FROM completed_tasks WHERE wallet_address = ? ORDER BY completed_at DESC
    `).bind(walletAddress).all();

    return success(c, completed.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
