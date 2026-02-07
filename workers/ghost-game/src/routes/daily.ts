/**
 * 每日任务路由 - 完整版
 * 支持：任务配置、任务刷新、进度追踪、奖励领取
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import missionConfigs from '../config/missions_by_level.json';
import missionConditions from '../config/mission_conditions.json';
import missionGains from '../config/mission_gains.json';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 任务状态
const TASK_STATUS = {
  IN_PROGRESS: 0,    // 进行中
  COMPLETED: 1,      // 已完成（可领取）
  CLAIMED: 2,        // 已领取
  EXPIRED: 3,       // 已过期
};

// 任务类型
const TASK_TYPES = {
  LOGIN: 'login',           // 登录
  BUILD: 'build',           // 建造建筑
  UPGRADE: 'upgrade',       // 升级建筑
  RECRUIT_HERO: 'recruit', // 招募英雄
  TRAIN_HERO: 'train',      // 训练英雄
  BATTLE: 'battle',         // 战斗
  COLLECT: 'collect',       // 采集资源
  EXPLORE: 'explore',      // 探索
  UPGRADE_HERO: 'upgrade_hero', // 武将升级
};

// 获取今日任务列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const today = new Date().toISOString().split('T')[0];

  try {
    // 获取任务配置
    const configs = await db.prepare(`
      SELECT * FROM daily_task_configs WHERE 1=1 ORDER BY sort_order
    `).all();

    // 获取今日任务进度
    const progress = await db.prepare(`
      SELECT * FROM daily_task_progress 
      WHERE wallet_address = ? AND date = ?
    `).bind(walletAddress, today).all();

    // 构建进度映射
    const progressMap: Record<number, any> = {};
    for (const p of (progress.results || [])) {
      progressMap[(p as any).task_id] = p;
    }

    // 合并配置和进度
    const tasks = (configs.results || []).map((config: any) => {
      const taskProgress = progressMap[config.id] || {
        current_value: 0,
        status: TASK_STATUS.IN_PROGRESS,
      };

      return {
        id: config.id,
        key: config.task_key,
        title: config.title,
        description: config.description,
        type: config.type,
        target_value: config.target_value,
        current_value: taskProgress.current_value || 0,
        progress: Math.min(100, Math.floor((taskProgress.current_value / config.target_value) * 100)),
        reward: {
          exp: config.reward_exp,
          gold: config.reward_gold,
        },
        status: taskProgress.status,
        is_completed: taskProgress.current_value >= config.target_value,
        can_claim: taskProgress.status === TASK_STATUS.COMPLETED,
      };
    });

    // 统计
    const stats = {
      total: tasks.length,
      completed: tasks.filter((t: any) => t.is_completed).length,
      claimed: tasks.filter((t: any) => t.status === TASK_STATUS.CLAIMED).length,
      totalExp: tasks
        .filter((t: any) => t.status !== TASK_STATUS.CLAIMED)
        .reduce((sum: number, t: any) => sum + t.reward.exp, 0),
    };

    return success(c, {
      date: today,
      tasks,
      stats,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 更新任务进度
app.post('/progress', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { task_key, increment } = await c.req.json();
  if (!task_key) return error(c, 'Missing task_key');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const today = new Date().toISOString().split('T')[0];

  try {
    // 获取任务配置
    const config: any = await db.prepare(`
      SELECT * FROM daily_task_configs WHERE task_key = ?
    `).bind(task_key).first();

    if (!config) return error(c, 'Task not found');

    // 获取当前进度
    const currentProgress: any = await db.prepare(`
      SELECT * FROM daily_task_progress 
      WHERE wallet_address = ? AND task_id = ? AND date = ?
    `).bind(walletAddress, config.id, today).first();

    let newValue = (currentProgress?.current_value || 0) + (increment || 1);
    const targetValue = config.target_value;
    let status = TASK_STATUS.IN_PROGRESS;

    if (newValue >= targetValue) {
      newValue = targetValue;
      status = TASK_STATUS.COMPLETED;
    }

    // 更新进度
    await db.prepare(`
      INSERT OR REPLACE INTO daily_task_progress 
      (wallet_address, task_id, date, current_value, status, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(walletAddress, config.id, today, newValue, status).run();

    return success(c, {
      task_key,
      current_value: newValue,
      target_value: targetValue,
      progress: Math.floor((newValue / targetValue) * 100),
      is_completed: newValue >= targetValue,
      status,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 批量更新进度
app.post('/batch-progress', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { updates } = await c.req.json(); // [{ task_key, increment }]
  if (!updates || !Array.isArray(updates)) return error(c, 'Invalid updates');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const today = new Date().toISOString().split('T')[0];

  try {
    const results: any[] = [];

    for (const update of updates) {
      const config: any = await db.prepare(`
        SELECT * FROM daily_task_configs WHERE task_key = ?
      `).bind(update.task_key).first();

      if (!config) continue;

      const currentProgress: any = await db.prepare(`
        SELECT * FROM daily_task_progress 
        WHERE wallet_address = ? AND task_id = ? AND date = ?
      `).bind(walletAddress, config.id, today).first();

      let newValue = (currentProgress?.current_value || 0) + (update.increment || 1);
      const targetValue = config.target_value;

      if (newValue >= targetValue) {
        newValue = targetValue;
        // 如果之前已完成，不重复通知
        if (currentProgress?.status === TASK_STATUS.COMPLETED) {
          continue;
        }
      }

      await db.prepare(`
        INSERT OR REPLACE INTO daily_task_progress 
        (wallet_address, task_id, date, current_value, status, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(walletAddress, config.id, today, newValue, 
        newValue >= targetValue ? TASK_STATUS.COMPLETED : TASK_STATUS.IN_PROGRESS).run();

      results.push({
        task_key: update.task_key,
        current_value: newValue,
        target_value: targetValue,
        is_completed: newValue >= targetValue,
      });
    }

    return success(c, {
      updated: results.length,
      results,
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

  const today = new Date().toISOString().split('T')[0];

  try {
    // 获取任务配置
    const config: any = await db.prepare(`
      SELECT * FROM daily_task_configs WHERE id = ?
    `).bind(taskId).first();

    if (!config) return error(c, 'Task not found');

    // 获取任务进度
    const progress: any = await db.prepare(`
      SELECT * FROM daily_task_progress 
      WHERE wallet_address = ? AND task_id = ? AND date = ?
    `).bind(walletAddress, taskId, today).first();

    if (!progress) return error(c, 'Task not started');
    if (progress.status !== TASK_STATUS.COMPLETED) return error(c, 'Task not completed');
    if (progress.claimed_at) return error(c, 'Reward already claimed');

    // 发放奖励
    await db.prepare(`
      UPDATE characters SET exp = exp + ? WHERE wallet_address = ?
    `).bind(config.reward_exp, walletAddress).run();

    // 标记已领取
    await db.prepare(`
      UPDATE daily_task_progress SET status = ?, claimed_at = datetime('now') 
      WHERE wallet_address = ? AND task_id = ? AND date = ?
    `).bind(TASK_STATUS.CLAIMED, walletAddress, taskId, today).run();

    return success(c, {
      task_id: taskId,
      reward: {
        exp: config.reward_exp,
        gold: config.reward_gold,
      },
      message: 'Reward claimed successfully',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 一键领取所有已完成任务
app.post('/claim-all', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const today = new Date().toISOString().split('T')[0];

  try {
    // 获取所有已完成但未领取的任务
    const completedTasks: any[] = await db.prepare(`
      SELECT p.*, c.reward_exp, c.reward_gold
      FROM daily_task_progress p
      JOIN daily_task_configs c ON p.task_id = c.id
      WHERE p.wallet_address = ? AND p.date = ? AND p.status = ?
    `).bind(walletAddress, today, TASK_STATUS.COMPLETED).all();

    if (completedTasks.length === 0) {
      return success(c, { 
        claimed: 0, 
        message: 'No completed tasks to claim',
        rewards: { exp: 0, gold: 0 },
      });
    }

    // 计算总奖励
    let totalExp = 0;
    let totalGold = 0;

    for (const task of completedTasks) {
      totalExp += task.reward_exp || 0;
      totalGold += task.reward_gold || 0;
    }

    // 发放奖励
    await db.prepare(`
      UPDATE characters SET exp = exp + ? WHERE wallet_address = ?
    `).bind(totalExp, walletAddress).run();

    // 标记所有为已领取
    await db.prepare(`
      UPDATE daily_task_progress 
      SET status = ?, claimed_at = datetime('now') 
      WHERE wallet_address = ? AND date = ? AND status = ?
    `).bind(TASK_STATUS.CLAIMED, walletAddress, today, TASK_STATUS.COMPLETED).run();

    return success(c, {
      claimed: completedTasks.length,
      rewards: {
        exp: totalExp,
        gold: totalGold,
      },
      message: `Claimed ${completedTasks.length} task rewards`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 刷新任务
app.post('/refresh', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { task_key } = await c.req.json();
  if (!task_key) return error(c, 'Missing task_key');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const today = new Date().toISOString().split('T')[0];

  try {
    // 获取当前进度
    const config: any = await db.prepare(`
      SELECT * FROM daily_task_configs WHERE task_key = ?
    `).bind(task_key).first();

    if (!config) return error(c, 'Task not found');

    // 检查是否已完成
    const progress: any = await db.prepare(`
      SELECT * FROM daily_task_progress 
      WHERE wallet_address = ? AND task_id = ? AND date = ?
    `).bind(walletAddress, config.id, today).first();

    if (progress && progress.status === TASK_STATUS.CLAIMED) {
      return error(c, 'Cannot refresh claimed task');
    }

    // 重置进度
    await db.prepare(`
      INSERT OR REPLACE INTO daily_task_progress 
      (wallet_address, task_id, date, current_value, status, updated_at)
      VALUES (?, ?, ?, 0, ?, datetime('now'))
    `).bind(walletAddress, config.id, today, TASK_STATUS.IN_PROGRESS).run();

    return success(c, {
      task_key,
      message: 'Task refreshed',
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
    // 获取今日统计
    const today = new Date().toISOString().split('T')[0];
    const todayStats: any = await db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as claimed,
        SUM(CASE WHEN current_value >= target_value AND status < 2 THEN 1 ELSE 0 END) as completed
      FROM daily_task_progress p
      JOIN daily_task_configs c ON p.task_id = c.id
      WHERE p.wallet_address = ? AND p.date = ?
    `).bind(walletAddress, today).first();

    // 获取本周统计
    const weekStats: any = await db.prepare(`
      SELECT 
        COUNT(DISTINCT date) as active_days,
        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as total_claimed
      FROM daily_task_progress
      WHERE wallet_address = ? AND date >= date('now', '-7 days')
    `).bind(walletAddress).first();

    // 获取历史最佳
    const bestDay: any = await db.prepare(`
      SELECT date, COUNT(*) as claimed
      FROM daily_task_progress
      WHERE wallet_address = ? AND status = 2
      GROUP BY date
      ORDER BY claimed DESC
      LIMIT 1
    `).bind(walletAddress).first();

    return success(c, {
      today: {
        total: todayStats?.total || 0,
        completed: todayStats?.completed || 0,
        claimed: todayStats?.claimed || 0,
        remaining: (todayStats?.total || 0) - (todayStats?.claimed || 0),
      },
      week: {
        active_days: weekStats?.active_days || 0,
        total_claimed: weekStats?.total_claimed || 0,
      },
      best_day: bestDay ? {
        date: bestDay.date,
        claimed: bestDay.claimed,
      } : null,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 初始化每日任务配置
app.post('/init-config', async (c) => {
  // 需要管理员权限
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 默认任务配置
    const defaultTasks = [
      { key: 'login', title: '每日登录', type: 'login', target: 1, reward_exp: 10, reward_gold: 50 },
      { key: 'build_1', title: '建造1级建筑', type: 'build', target: 1, reward_exp: 20, reward_gold: 100 },
      { key: 'upgrade_1', title: '升级1次建筑', type: 'upgrade', target: 1, reward_exp: 30, reward_gold: 150 },
      { key: 'recruit_hero', title: '招募1名英雄', type: 'recruit', target: 1, reward_exp: 50, reward_gold: 200 },
      { key: 'train_hero', title: '训练1名英雄', type: 'train', target: 1, reward_exp: 25, reward_gold: 100 },
      { key: 'battle_1', title: '完成1场战斗', type: 'battle', target: 1, reward_exp: 40, reward_gold: 150 },
      { key: 'collect_10', title: '收集资源10次', type: 'collect', target: 10, reward_exp: 15, reward_gold: 50 },
      { key: 'explore_1', title: '探索1次地图', type: 'explore', target: 1, reward_exp: 30, reward_gold: 100 },
    ];

    let inserted = 0;
    for (const task of defaultTasks) {
      try {
        await db.prepare(`
          INSERT OR IGNORE INTO daily_task_configs 
          (task_key, title, description, type, target_value, reward_exp, reward_gold)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          task.key,
          task.title,
          `完成任务获得奖励`,
          task.type,
          task.target,
          task.reward_exp,
          task.reward_gold
        ).run();
        inserted++;
      } catch (e) {
        // 忽略重复插入
      }
    }

    return success(c, {
      message: `Initialized ${inserted} task configs`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
