/**
 * 主线任务路由 - 完整版
 * 支持：任务链、前置条件、进度追踪、奖励发放
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { taskConfigs, getTaskConfig } from '../config/tasks';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 任务状态
const TASK_STATUS = {
  NOT_STARTED: 0,    // 未开始
  IN_PROGRESS: 1,     // 进行中
  COMPLETED: 2,      // 已完成（可领取）
  CLAIMED: 3,        // 已领取奖励
};

// 获取主线任务列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取玩家任务进度
    const taskProgress: any = await db.prepare(`
      SELECT * FROM tasks WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!taskProgress) {
      return success(c, {
        mainId: 1,
        mainIndex: 1,
        tasks: [],
        message: 'No tasks started',
      });
    }

    // 解析任务进度
    const taskIds = taskProgress.task_ids ? JSON.parse(taskProgress.task_ids) : [];
    const taskStates = taskProgress.task_states ? JSON.parse(taskProgress.task_states) : [];
    const taskProgressValues = taskProgress.task_progress ? JSON.parse(taskProgress.task_progress) : [];

    // 获取任务详情
    const tasks = taskIds.map((taskId: number, index: number) => {
      const config = getTaskConfig(taskId);
      if (!config) return null;

      return {
        id: taskId,
        mainId: config.MainID,
        mainIndex: config.MainIndex,
        subIndex: config.Index,
        name: config.Name,
        description: config.BeginDes,
        type: config.Type,
        targetType: config.NeedObjType,
        targetId: config.NeedObjID,
        targetValue: config.NeedObjValue,
        reward: {
          gainType: config.GetGainType,
          gainIndex: config.GetGainIndex,
        },
        progress: taskProgressValues[index] || 0,
        status: taskStates[index] || TASK_STATUS.NOT_STARTED,
        isCompleted: taskStates[index] === TASK_STATUS.COMPLETED,
        canClaim: taskStates[index] === TASK_STATUS.COMPLETED,
      };
    }).filter(Boolean);

    return success(c, {
      mainId: taskProgress.main_id,
      mainIndex: taskProgress.main_index,
      tasks,
      total: tasks.length,
      completedCount: tasks.filter((t: any) => t.status === TASK_STATUS.CLAIMED).length,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 开始/继续任务
app.post('/start', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 检查是否已有任务
    const existing: any = await db.prepare(`
      SELECT * FROM tasks WHERE wallet_address = ?
    `).bind(walletAddress).first();

    let mainId = 1;
    let mainIndex = 1;

    if (existing) {
      const currentTaskIds = existing.task_ids ? JSON.parse(existing.task_ids) : [];
      const currentTaskStates = existing.task_states ? JSON.parse(existing.task_states) : [];

      const allCompleted = (currentTaskStates as number[]).every((s: number) => s >= TASK_STATUS.COMPLETED);
      
      if (allCompleted) {
        // 进入下一章
        mainId = existing.main_id;
        mainIndex = existing.main_index + 1;
      } else {
        // 继续当前章节
        mainId = existing.main_id;
        mainIndex = existing.main_index;
      }
    }

    // 获取主线任务配置
    const mainTask = taskConfigs[`${mainId}_${mainIndex}`];
    if (!mainTask) {
      return success(c, {
        mainId,
        mainIndex,
        message: 'All tasks completed!',
        completed: true,
      });
    }

    // 获取子任务列表
    const subTaskIds = mainTask.Task;

    if (existing) {
      await db.prepare(`
        UPDATE tasks SET main_id = ?, main_index = ?, updated_at = datetime('now')
        WHERE wallet_address = ?
      `).bind(mainId, mainIndex, walletAddress).run();
    } else {
      await db.prepare(`
        INSERT INTO tasks (wallet_address, main_id, main_index, task_ids, task_states, task_progress)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        walletAddress,
        mainId,
        mainIndex,
        JSON.stringify(subTaskIds),
        JSON.stringify(subTaskIds.map(() => TASK_STATUS.NOT_STARTED)),
        JSON.stringify(subTaskIds.map(() => 0))
      ).run();
    }

    return success(c, {
      mainId,
      mainIndex,
      taskCount: subTaskIds.length,
      message: `Started main task ${mainId}-${mainIndex}`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 更新任务进度
app.post('/progress', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { task_id, increment, auto_complete } = await c.req.json();
  if (!task_id) return error(c, 'Missing task_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const taskProgress: any = await db.prepare(`
      SELECT * FROM tasks WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!taskProgress) return error(c, 'No active tasks');

    const taskIds = taskProgress.task_ids ? JSON.parse(taskProgress.task_ids) : [];
    const taskStates = taskProgress.task_states ? JSON.parse(taskProgress.task_states) : [];
    const taskProgressValues = taskProgress.task_progress ? JSON.parse(taskProgress.task_progress) : [];

    const taskIndex = taskIds.indexOf(task_id);
    if (taskIndex === -1) return error(c, 'Task not found in current progress');

    if (taskStates[taskIndex] >= TASK_STATUS.COMPLETED) {
      return success(c, { 
        message: 'Task already completed',
        status: taskStates[taskIndex],
      });
    }

    const config = getTaskConfig(task_id);
    const targetValue = config?.NeedObjValue || 1;

    const newProgress = (taskProgressValues[taskIndex] || 0) + (increment || 1);
    const completed = newProgress >= targetValue || auto_complete;
    
    taskProgressValues[taskIndex] = newProgress;
    if (completed) {
      taskStates[taskIndex] = TASK_STATUS.COMPLETED;
    }

    await db.prepare(`
      UPDATE tasks SET task_progress = ?, task_states = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(
      JSON.stringify(taskProgressValues),
      JSON.stringify(taskStates),
      walletAddress
    ).run();

    return success(c, {
      task_id,
      progress: newProgress,
      target: targetValue,
      is_completed: completed,
      status: taskStates[taskIndex],
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 领取任务奖励
app.post('/:taskId/claim', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const taskId = parseInt(c.req.param('taskId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const taskProgress: any = await db.prepare(`
      SELECT * FROM tasks WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!taskProgress) return error(c, 'No active tasks');

    const taskIds = taskProgress.task_ids ? JSON.parse(taskProgress.task_ids) : [];
    const taskStates = taskProgress.task_states ? JSON.parse(taskProgress.task_states) : [];

    const taskIndex = taskIds.indexOf(taskId);
    if (taskIndex === -1) return error(c, 'Task not found');

    if (taskStates[taskIndex] !== TASK_STATUS.COMPLETED) {
      return error(c, 'Task not completed yet');
    }

    const config = getTaskConfig(taskId);
    const rewards = {
      gainType: config?.GetGainType || 0,
      gainIndex: config?.GetGainIndex || 0,
    };

    // 更新为已领取
    taskStates[taskIndex] = TASK_STATUS.CLAIMED;

    await db.prepare(`
      UPDATE tasks SET task_states = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(JSON.stringify(taskStates), walletAddress).run();

    return success(c, {
      task_id: taskId,
      rewards,
      message: 'Reward claimed',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 一键领取所有完成的任务
app.post('/claim-all', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const taskProgress: any = await db.prepare(`
      SELECT * FROM tasks WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!taskProgress) return error(c, 'No active tasks');

    const taskIds = taskProgress.task_ids ? JSON.parse(taskProgress.task_ids) : [];
    const taskStates = taskProgress.task_states ? JSON.parse(taskProgress.task_states) : [];

    let claimedCount = 0;
    for (let i = 0; i < taskIds.length; i++) {
      if (taskStates[i] === TASK_STATUS.COMPLETED) {
        taskStates[i] = TASK_STATUS.CLAIMED;
        claimedCount++;
      }
    }

    if (claimedCount === 0) {
      return success(c, { message: 'No completed tasks to claim' });
    }

    await db.prepare(`
      UPDATE tasks SET task_states = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(JSON.stringify(taskStates), walletAddress).run();

    return success(c, {
      claimed: claimedCount,
      message: `Claimed ${claimedCount} task rewards`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取任务统计
app.get('/stats', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const taskProgress: any = await db.prepare(`
      SELECT * FROM tasks WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!taskProgress) {
      return success(c, {
        started: false,
        completedChapters: 0,
        completedTasks: 0,
      });
    }

    const taskStates = taskProgress.task_states ? JSON.parse(taskProgress.task_states) : [];
    const completedCount = (taskStates as number[]).filter((s: number) => s === TASK_STATUS.CLAIMED).length;

    return success(c, {
      started: true,
      mainId: taskProgress.main_id,
      mainIndex: taskProgress.main_index,
      totalTasks: taskStates.length,
      completedTasks: completedCount,
      completionRate: Math.round((completedCount / taskStates.length) * 100),
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 接受任务
app.post('/accept', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { task_id } = await c.req.json();
  if (!task_id) return error(c, 'task_id is required');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const taskProgress: any = await db.prepare(`
      SELECT * FROM tasks WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!taskProgress) {
      // 初始化新任务
      await db.prepare(`
        INSERT INTO tasks (wallet_address, main_id, main_index, task_ids, task_states, task_progress)
        VALUES (?, 1, 1, ?, ?, ?)
      `).bind(
        walletAddress,
        JSON.stringify([task_id]),
        JSON.stringify([TASK_STATUS.IN_PROGRESS]),
        JSON.stringify([1])
      ).run();
    } else {
      const taskIds = taskProgress.task_ids ? JSON.parse(taskProgress.task_ids) : [];
      const taskStates = taskProgress.task_states ? JSON.parse(taskProgress.task_states) : [];
      
      // 检查任务是否已存在
      if (taskIds.includes(task_id)) {
        return error(c, 'Task already exists');
      }

      // 添加新任务
      taskIds.push(task_id);
      taskStates.push(TASK_STATUS.IN_PROGRESS);

      await db.prepare(`
        UPDATE tasks SET task_ids = ?, task_states = ?, updated_at = datetime('now')
        WHERE wallet_address = ?
      `).bind(JSON.stringify(taskIds), JSON.stringify(taskStates), walletAddress).run();
    }

    const config = getTaskConfig(task_id);
    return success(c, {
      task_id,
      name: config?.Name,
      status: TASK_STATUS.IN_PROGRESS,
      message: 'Task accepted',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 提交任务
app.post('/submit', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { task_id } = await c.req.json();
  if (!task_id) return error(c, 'task_id is required');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const taskProgress: any = await db.prepare(`
      SELECT * FROM tasks WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!taskProgress) return error(c, 'No active tasks');

    const taskIds = taskProgress.task_ids ? JSON.parse(taskProgress.task_ids) : [];
    const taskStates = taskProgress.task_states ? JSON.parse(taskProgress.task_states) : [];

    const taskIndex = taskIds.indexOf(task_id);
    if (taskIndex === -1) return error(c, 'Task not found');

    if (taskStates[taskIndex] !== TASK_STATUS.IN_PROGRESS) {
      return error(c, 'Task not in progress');
    }

    // 更新为已完成
    taskStates[taskIndex] = TASK_STATUS.COMPLETED;

    await db.prepare(`
      UPDATE tasks SET task_states = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(JSON.stringify(taskStates), walletAddress).run();

    const config = getTaskConfig(task_id);
    return success(c, {
      task_id,
      status: TASK_STATUS.COMPLETED,
      reward: {
        gainType: config?.GetGainType,
        gainIndex: config?.GetGainIndex,
      },
      message: 'Task submitted',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 放弃任务
app.post('/abandon', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      DELETE FROM tasks WHERE wallet_address = ?
    `).bind(walletAddress).run();

    return success(c, { message: 'Task abandoned' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
