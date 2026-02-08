/**
 * Task Route - 主线任务路由 (重构版)
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

// 主线任务配置 (示例)
const MAIN_TASKS = [
  { id: 1, name: '建设主城', desc: '建造一座主城', target: 1, reward: { exp: 100, gold: 500 } },
  { id: 2, name: '招募武将', desc: '招募一名武将', target: 1, reward: { exp: 150, gold: 600 } },
  { id: 3, name: '强化军队', desc: '训练5队士兵', target: 5, reward: { exp: 200, gold: 800 } },
  { id: 4, name: '探索地图', desc: '探索3个区域', target: 3, reward: { exp: 250, gold: 1000 } },
  { id: 5, name: '击败敌人', desc: '完成3场战斗', target: 3, reward: { exp: 300, gold: 1200 } },
];

// 获取主线任务
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const task = await db.prepare(`
      SELECT * FROM tasks WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!task) {
      // 初始化任务
      await db.prepare(`
        INSERT INTO tasks (wallet_address, main_id, main_index, task_ids, task_states, task_progress)
        VALUES (?, 1, 1, ?, ?, ?)
      `).bind(walletAddress, JSON.stringify([1]), JSON.stringify([0]), JSON.stringify([0])).run();

      return success(c, {
        mainId: 1,
        mainIndex: 1,
        currentTask: { ...MAIN_TASKS[0], progress: 0, status: 'in_progress' },
        allTasks: MAIN_TASKS,
      });
    }

    const taskIds = (task as any).task_ids ? JSON.parse((task as any).task_ids) : [];
    const taskStates = (task as any).task_states ? JSON.parse((task as any).task_states) : [];
    const taskProgress = (task as any).task_progress ? JSON.parse((task as any).task_progress) : [];

    const tasks = taskIds.map((id: number, idx: number) => {
      const config = MAIN_TASKS.find(t => t.id === id);
      return {
        ...config,
        progress: taskProgress[idx] || 0,
        status: taskStates[idx] === 2 ? 'completed' : taskStates[idx] === 1 ? 'claimable' : 'in_progress',
      };
    });

    const currentTaskId = taskIds[0] || 1;
    const currentTask = MAIN_TASKS.find(t => t.id === currentTaskId);

    return success(c, {
      mainId: (task as any).main_id,
      mainIndex: (task as any).main_index,
      tasks,
      currentTask: { ...currentTask, progress: taskProgress[0] || 0 },
    });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 更新任务进度
app.post('/progress', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { increment = 1 } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const task = await db.prepare(`
      SELECT * FROM tasks WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!task) return error(c, 'No tasks initialized');

    const taskIds = JSON.parse((task as any).task_ids);
    const taskStates = JSON.parse((task as any).task_states);
    const taskProgress = JSON.parse((task as any).task_progress);

    // 更新第一个任务的进度
    taskProgress[0] = (taskProgress[0] || 0) + increment;

    const currentTask = MAIN_TASKS.find(t => t.id === taskIds[0]);
    if (currentTask && taskProgress[0] >= currentTask.target) {
      taskStates[0] = 1; // 可领取
    }

    await db.prepare(`
      UPDATE tasks SET task_states = ?, task_progress = ?, updated_at = ?
      WHERE wallet_address = ?
    `).bind(JSON.stringify(taskStates), JSON.stringify(taskProgress), new Date().toISOString(), walletAddress).run();

    return success(c, { progress: taskProgress[0] });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 领取任务奖励
app.post('/claim', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const task = await db.prepare(`
      SELECT * FROM tasks WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!task) return error(c, 'No tasks');

    const taskIds = JSON.parse((task as any).task_ids);
    const taskStates = JSON.parse((task as any).task_states);
    const taskProgress = JSON.parse((task as any).task_progress);

    if (taskStates[0] !== 1) return error(c, 'Nothing to claim');

    // 发放奖励
    const currentTask = MAIN_TASKS.find(t => t.id === taskIds[0]);
    if (currentTask) {
      await db.prepare(`
        UPDATE characters SET exp = exp + ?, gold = gold + ? WHERE wallet_address = ?
      `).bind(currentTask.reward.exp, currentTask.reward.gold, walletAddress).run();
    }

    // 推进到下一个任务
    const nextTaskId = taskIds[0] + 1;
    if (nextTaskId > MAIN_TASKS.length) {
      return success(c, { message: 'All tasks completed!' });
    }

    taskIds.shift();
    taskStates.shift();
    taskProgress.shift();
    taskIds.push(nextTaskId);
    taskStates.push(0);
    taskProgress.push(0);

    await db.prepare(`
      UPDATE tasks SET task_ids = ?, task_states = ?, task_progress = ?, main_index = main_index + 1
      WHERE wallet_address = ?
    `).bind(JSON.stringify(taskIds), JSON.stringify(taskStates), JSON.stringify(taskProgress), walletAddress).run();

    return success(c, { reward: currentTask?.reward, message: 'Claimed, next task unlocked' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
