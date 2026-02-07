/**
 * 主线任务路由 - 完整版
 * 支持：任务链、前置条件、进度追踪、奖励发放
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import mainTaskConfigs from '../config/tasks.json';

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
  IN_PROGRESS: 1,    // 进行中
  COMPLETED: 2,      // 已完成（可领取）
  CLAIMED: 3,        // 已领取奖励
};

// 任务类型
const TASK_TYPES = {
  INTERIOR: 1,        // 内政任务
  FIGHT: 3,          // 战斗任务
  COLLECT: 4,        // 收集任务
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
      SELECT * FROM tasks WHERE wallet_address = ? ORDER BY updated_at DESC
    `).bind(walletAddress).first();

    if (!taskProgress) {
      // 初始化新玩家任务
      return success(c, {
        mainId: 1,
        mainIndex: 1,
        tasks: [],
        message: 'No tasks started',
      });
    }

    // 解析任务配置
    const taskIds = taskProgress.task_ids ? JSON.parse(taskProgress.task_ids) : [];
    const taskStates = taskProgress.task_states ? JSON.parse(taskProgress.task_states) : [];
    const taskProgressValues = taskProgress.task_progress ? JSON.parse(taskProgress.task_progress) : [];

    // 获取任务详情
    const tasks = taskIds.map((taskId: number, index: number) => {
      const config = (mainTaskConfigs as Record<string, any>)[String(taskId)];
      if (!config) return null;

      return {
        id: taskId,
        mainId: taskProgress.main_id,
        mainIndex: taskProgress.main_index,
        subIndex: index + 1,
        name: config.Name || config.name,
        description: config.Des || config.description,
        type: config.Type || config.type,
        target: config.Target || config.target,
        targetType: config.TargetType || config.targetType,
        needObjType: config.NeedObjType || config.needObjType,
        needObjId: config.NeedObjID || config.needObjId,
        needObjValue: config.NeedObjValue || config.needObjValue,
        cost: {
          money: config.CostMoney || config.costMoney || 0,
          food: config.CostFood || config.costFood || 0,
          men: config.CostMen || config.costMen || 0,
          gold: config.CostGold || config.costGold || 0,
        },
        reward: {
          money: config.GetMoney || config.rewardMoney || 0,
          food: config.GetFood || config.rewardFood || 0,
          men: config.GetMen || config.rewardMen || 0,
          gold: config.GetGold || config.rewardGold || 0,
          exp: config.GetExp || config.rewardExp || 0,
        },
        progress: taskProgressValues[index] || 0,
        status: taskStates[index] || TASK_STATUS.NOT_STARTED,
        isCompleted: (taskStates[index] || 0) >= TASK_STATUS.COMPLETED,
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

// 获取当前任务详情
app.get('/current', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const taskProgress: any = await db.prepare(`
      SELECT * FROM tasks WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!taskProgress) {
      return error(c, 'No active tasks', 404);
    }

    const taskIds = taskProgress.task_ids ? JSON.parse(taskProgress.task_ids) : [];
    const taskStates = taskProgress.task_states ? JSON.parse(taskProgress.task_states) : [];
    const taskProgressValues = taskProgress.task_progress ? JSON.parse(taskProgress.task_progress) : [];

    // 获取第一个未完成的任务
    let currentTask = null;
    let currentIndex = -1;

    for (let i = 0; i < taskIds.length; i++) {
      if (taskStates[i] < TASK_STATUS.COMPLETED) {
        const config = (mainTaskConfigs as Record<string, any>)[String(taskIds[i])];
        if (config) {
          currentTask = {
            id: taskIds[i],
            mainId: taskProgress.main_id,
            mainIndex: taskProgress.main_index,
            subIndex: i + 1,
            name: config.Name || config.name,
            description: config.Des || config.description,
            type: config.Type || config.type,
            target: config.Target || config.target,
            targetType: config.TargetType || config.targetType,
            needObjType: config.NeedObjType || config.needObjType,
            needObjId: config.NeedObjID || config.needObjId,
            needObjValue: config.NeedObjValue || config.needObjValue,
            cost: {
              money: config.CostMoney || 0,
              food: config.CostFood || 0,
              men: config.CostMen || 0,
              gold: config.CostGold || 0,
            },
            reward: {
              money: config.GetMoney || 0,
              food: config.GetFood || 0,
              men: config.GetMen || 0,
              gold: config.GetGold || 0,
            },
            progress: taskProgressValues[i] || 0,
            status: taskStates[i],
          };
          currentIndex = i;
          break;
        }
      }
    }

    if (!currentTask) {
      return success(c, {
        message: 'All tasks completed',
        canProceed: true,
      });
    }

    return success(c, {
      task: currentTask,
      progress: currentIndex + 1,
      total: taskIds.length,
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
    let taskIds: number[] = [];
    let taskStates: number[] = [];
    let taskProgress: number[] = [];

    if (existing) {
      // 获取下一个任务
      const taskIds = existing.task_ids ? JSON.parse(existing.task_ids) : [];
      const taskStates = existing.task_states ? JSON.parse(existing.task_states) : [];

      // 检查是否所有任务都完成
      const allCompleted = taskStates.every(s => s >= TASK_STATUS.COMPLETED);
      
      if (allCompleted) {
        // 进入下一章
        mainId = existing.main_id;
        mainIndex = existing.main_index + 1;
        taskIds = [];
        taskStates = [];
        taskProgress = [];
      } else {
        mainId = existing.main_id;
        mainIndex = existing.main_index;
        taskIds = taskIds;
        taskStates = taskStates;
        taskProgress = taskProgress;
      }
    }

    // 获取主线任务配置
    const mainTaskKey = `${mainId}_${mainIndex}`;
    const mainTask = (mainTaskConfigs as Record<string, any>)[mainTaskKey];

    if (!mainTask) {
      return error(c, `Main task ${mainId}_${mainIndex} not found`, 404);
    }

    // 解析子任务ID
    const subTaskIds = mainTask.Task || mainTask.task || [];
    
    if (existing) {
      await db.prepare(`
        UPDATE tasks SET 
          main_id = ?, 
          main_index = ?,
          updated_at = datetime('now')
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

    // 找到任务索引
    const taskIndex = taskIds.indexOf(task_id);
    if (taskIndex === -1) return error(c, 'Task not found in current progress');

    // 检查任务是否已完成
    if (taskStates[taskIndex] >= TASK_STATUS.COMPLETED) {
      return success(c, { 
        message: 'Task already completed',
        status: taskStates[taskIndex],
      });
    }

    // 获取任务配置
    const config = (mainTaskConfigs as Record<string, any>)[String(task_id)];
    const targetValue = config?.NeedObjValue || config?.needObjValue || 1;

    // 更新进度
    const newProgress = (taskProgressValues[taskIndex] || 0) + (increment || 1);
    const completed = newProgress >= targetValue;
    
    taskProgressValues[taskIndex] = newProgress;
    if (completed) {
      taskStates[taskIndex] = TASK_STATUS.COMPLETED;
    }

    // 保存
    await db.prepare(`
      UPDATE tasks SET 
        task_progress = ?,
        task_states = ?,
        updated_at = datetime('now')
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
    const taskProgressValues = taskProgress.task_progress ? JSON.parse(taskProgress.task_progress) : [];

    const taskIndex = taskIds.indexOf(taskId);
    if (taskIndex === -1) return error(c, 'Task not found');

    if (taskStates[taskIndex] !== TASK_STATUS.COMPLETED) {
      return error(c, 'Task not completed yet');
    }

    // 获取任务配置并发放奖励
    const config = (mainTaskConfigs as Record<string, any>)[String(taskId)];
    const rewards = {
      money: (config?.GetMoney || config?.rewardMoney || 0),
      food: (config?.GetFood || config?.rewardFood || 0),
      men: (config?.GetMen || config?.rewardMen || 0),
      gold: (config?.GetGold || config?.rewardGold || 0),
      exp: (config?.GetExp || config?.rewardExp || 0),
    };

    // 更新任务状态为已领取
    taskStates[taskIndex] = TASK_STATUS.CLAIMED;

    // 发放奖励
    await db.prepare(`
      UPDATE cities SET 
        money = money + ?,
        food = food + ?,
        population = population + ?
      WHERE wallet_address = ? AND id = (
        SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
      )
    `).bind(rewards.money, rewards.food, rewards.men, walletAddress, walletAddress).run();

    await db.prepare(`
      UPDATE characters SET 
        gold = gold + ?,
        exp = exp + ?
      WHERE wallet_address = ?
    `).bind(rewards.gold, rewards.exp, walletAddress).run();

    // 保存
    await db.prepare(`
      UPDATE tasks SET 
        task_states = ?,
        updated_at = datetime('now')
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
    const taskProgressValues = taskProgress.task_progress ? JSON.parse(taskProgress.task_progress) : [];

    let totalRewards = { money: 0, food: 0, men: 0, gold: 0, exp: 0 };
    let claimedCount = 0;

    for (let i = 0; i < taskIds.length; i++) {
      if (taskStates[i] === TASK_STATUS.COMPLETED) {
        const config = (mainTaskConfigs as Record<string, any>)[String(taskIds[i])];
        if (config) {
          totalRewards.money += (config?.GetMoney || config?.rewardMoney || 0);
          totalRewards.food += (config?.GetFood || config?.rewardFood || 0);
          totalRewards.men += (config?.GetMen || config?.rewardMen || 0);
          totalRewards.gold += (config?.GetGold || config?.rewardGold || 0);
          totalRewards.exp += (config?.GetExp || config?.rewardExp || 0);
          taskStates[i] = TASK_STATUS.CLAIMED;
          claimedCount++;
        }
      }
    }

    if (claimedCount === 0) {
      return success(c, { message: 'No completed tasks to claim' });
    }

    // 发放奖励
    await db.prepare(`
      UPDATE cities SET 
        money = money + ?,
        food = food + ?,
        population = population + ?
      WHERE wallet_address = ? AND id = (
        SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
      )
    `).bind(totalRewards.money, totalRewards.food, totalRewards.men, walletAddress, walletAddress).run();

    await db.prepare(`
      UPDATE characters SET 
        gold = gold + ?,
        exp = exp + ?
      WHERE wallet_address = ?
    `).bind(totalRewards.gold, totalRewards.exp, walletAddress).run();

    // 保存
    await db.prepare(`
      UPDATE tasks SET 
        task_states = ?,
        updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(JSON.stringify(taskStates), walletAddress).run();

    return success(c, {
      claimed: claimedCount,
      rewards: totalRewards,
      message: `Claimed ${claimedCount} task rewards`,
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

    return success(c, { message: 'Task abandoned. Use /api/task/start to begin again.' });
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
        totalRewards: { gold: 0, exp: 0 },
      });
    }

    const taskStates = taskProgress.task_states ? JSON.parse(taskProgress.task_states) : [];
    const completedCount = taskStates.filter(s => s === TASK_STATUS.CLAIMED).length;
    const inProgressCount = taskStates.filter(s => s === TASK_STATUS.IN_PROGRESS).length;

    return success(c, {
      started: true,
      mainId: taskProgress.main_id,
      mainIndex: taskProgress.main_index,
      totalTasks: taskStates.length,
      completedTasks: completedCount,
      inProgressTasks: inProgressCount,
      completionRate: Math.round((completedCount / taskStates.length) * 100),
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
