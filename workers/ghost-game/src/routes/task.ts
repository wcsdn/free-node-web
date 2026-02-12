import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { taskService } from '../services/task.service';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}
function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

app.get('/', async (c) => {
  return success(c, { message: 'OK' });
});

app.post('/', async (c) => {
  return success(c, { message: 'OK' });
});

// ============ 主线任务接口 ============

// GetTask - GET /task/list - 获取当前任务列表
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();
  const cityId = parseInt(city_id || '0');

  if (!cityId) {
    return error(c, 'City ID is required');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const tasks = await taskService.getCurrentTasks(db, walletAddress, cityId);
    return success(c, { tasks });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetTaskByType - GET /task/by-type - 根据类型获取任务
app.get('/by-type', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, task_type } = c.req.query();
  const cityId = parseInt(city_id || '0');
  const subType = parseInt(task_type || '0');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const tasks = await taskService.getTasksByType(db, walletAddress, cityId, subType);
    return success(c, { tasks });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetTaskGoods - POST /task/reward - 领取任务奖励
app.post('/reward', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, task_id } = await c.req.json();
  const cityId = parseInt(city_id || '0');
  const taskId = parseInt(task_id || '0');

  if (!cityId || !taskId) {
    return error(c, 'City ID and Task ID are required');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result = await taskService.gainTaskReward(db, walletAddress, cityId, taskId);
    if (result.success) {
      return success(c, { message: 'Reward claimed successfully' });
    }
    return error(c, result.error || 'Failed to claim reward');
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ============ 战斗任务接口 ============

// GetFitFightTask - GET /task/fight/suitable - 获取适合的战斗任务
app.get('/fight/suitable', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, pos } = c.req.query();
  const cityId = parseInt(city_id || '0');
  const posNum = parseInt(pos || '0');

  if (!cityId || !posNum) {
    return error(c, 'City ID and Position are required');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const task = await taskService.getFitFightTask(db, walletAddress, cityId, posNum);
    if (task) {
      return success(c, { task });
    }
    return success(c, { task: null, message: 'No suitable fight task found' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UpdateFightTask - POST /task/fight/update - 更新战斗任务进度
app.post('/fight/update', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, task_id, win, user_type } = await c.req.json();
  const cityId = parseInt(city_id || '0');
  const taskId = parseInt(task_id || '0');
  const userType = parseInt(user_type || '0');

  if (!cityId || !taskId) {
    return error(c, 'City ID and Task ID are required');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const task = await taskService.updateFightTaskProgress(
      db, walletAddress, cityId, taskId, win, userType
    );
    if (task) {
      return success(c, { task, message: 'Task progress updated' });
    }
    return success(c, { task: null, message: 'No progress made' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ============ 探索任务接口 ============

// GetFitSearchTask - GET /task/search/suitable - 获取适合的探索任务
app.get('/search/suitable', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, target_pos, target_type } = c.req.query();
  const cityId = parseInt(city_id || '0');
  const targetPos = parseInt(target_pos || '0');
  const targetType = parseInt(target_type || '0');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const task = await taskService.getFitSearchTask(db, walletAddress, cityId, targetPos, targetType);
    if (task) {
      return success(c, { task });
    }
    return success(c, { task: null, message: 'No suitable search task found' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UpdateSearchTask - POST /task/search/update - 更新探索任务进度
app.post('/search/update', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, task_id, found } = await c.req.json();
  const cityId = parseInt(city_id || '0');
  const taskId = parseInt(task_id || '0');

  if (!cityId || !taskId) {
    return error(c, 'City ID and Task ID are required');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const task = await taskService.updateSearchTaskProgress(
      db, walletAddress, cityId, taskId, found
    );
    if (task) {
      return success(c, { task, message: 'Search task progress updated' });
    }
    return success(c, { task: null, message: 'No progress made' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ============ 日常任务接口 ============

// AddDailyTaskEvent - POST /task/daily/start - 开始日常任务
app.post('/daily/start', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, task_id } = await c.req.json();
  const cityId = parseInt(city_id || '0');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 开始日常任务 (初始化进度)
    const today = new Date().toISOString().split('T')[0];
    
    const config: any = await db.prepare(`
      SELECT * FROM daily_task_configs WHERE id = ?
    `).bind(task_id).first();

    if (!config) {
      return error(c, '任务配置不存在');
    }

    // 检查是否已存在
    const existing: any = await db.prepare(`
      SELECT * FROM daily_task_progress 
      WHERE wallet_address = ? AND task_id = ? AND date = ?
    `).bind(walletAddress, task_id, today).first();

    if (existing) {
      return success(c, { message: '任务已开始', task: existing });
    }

    // 创建新的任务进度
    await db.prepare(`
      INSERT INTO daily_task_progress 
      (wallet_address, task_id, date, current_value, status, created_at, updated_at)
      VALUES (?, ?, ?, 0, 0, datetime('now'), datetime('now'))
    `).bind(walletAddress, task_id, today).run();

    return success(c, { message: '任务开始' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetDailyTaskList - GET /task/daily/list - 获取日常任务列表
app.get('/daily/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const dailyTasks = await db.prepare(`
      SELECT * FROM daily_task_configs ORDER BY sort_order ASC
    `).all();

    const userProgress = await db.prepare(`
      SELECT * FROM daily_task_progress 
      WHERE wallet_address = ? AND date = date('now')
    `).bind(walletAddress).all();

    const tasks = dailyTasks.results?.map((config: any) => {
      const progress = userProgress.results?.find(
        (p: any) => p.task_id === config.id
      );
      return {
        ...config,
        current_value: progress?.current_value || 0,
        status: progress?.status || 0,
      };
    }) || [];

    return success(c, { tasks });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ClaimDailyTaskReward - POST /task/daily/claim - 领取日常任务奖励
app.post('/daily/claim', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, task_id } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const progress = await db.prepare(`
      SELECT * FROM daily_task_progress 
      WHERE wallet_address = ? AND task_id = ? AND date = date('now')
    `).bind(walletAddress, task_id).first();

    if (!progress || progress.status === 0) {
      return error(c, 'Task not completed');
    }

    if (progress.status === 2) {
      return error(c, 'Reward already claimed');
    }

    const config = await db.prepare(`
      SELECT * FROM daily_task_configs WHERE id = ?
    `).bind(task_id).first();

    if (!config) {
      return error(c, 'Task config not found');
    }

    await db.prepare(`
      UPDATE daily_task_progress 
      SET status = 2, claimed_at = datetime('now')
      WHERE wallet_address = ? AND task_id = ? AND date = date('now')
    `).bind(walletAddress, task_id).run();

    return success(c, { 
      message: 'Reward claimed',
      reward: {
        exp: config.reward_exp,
        gold: config.reward_gold,
      }
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UpdateDailyProgress - POST /task/daily/progress - 更新日常任务进度
app.post('/daily/progress', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, task_type, increment } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const today = new Date().toISOString().split('T')[0];
    
    const configs = await db.prepare(`
      SELECT * FROM daily_task_configs WHERE type = ? ORDER BY sort_order ASC
    `).bind(task_type).all();

    for (const config of configs.results || []) {
      const existing = await db.prepare(`
        SELECT * FROM daily_task_progress 
        WHERE wallet_address = ? AND task_id = ? AND date = ?
      `).bind(walletAddress, config.id, today).first();

      if (existing) {
        const newValue = (existing.current_value || 0) + (increment || 1);
        const newStatus = newValue >= config.target_value ? 1 : 0;
        
        await db.prepare(`
          UPDATE daily_task_progress 
          SET current_value = ?, status = ?, updated_at = datetime('now')
          WHERE wallet_address = ? AND task_id = ? AND date = ?
        `).bind(newValue, newStatus, walletAddress, config.id, today).run();
      } else {
        const newValue = increment || 1;
        const newStatus = newValue >= config.target_value ? 1 : 0;
        
        await db.prepare(`
          INSERT INTO daily_task_progress 
          (wallet_address, task_id, date, current_value, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(walletAddress, config.id, today, newValue, newStatus).run();
      }
    }

    return success(c, { message: 'Progress updated' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// DeleteTask - POST /task/delete
app.post('/delete', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { task_id } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 删除任务 (放弃任务)
    await db.prepare(`
      DELETE FROM user_tasks WHERE wallet_address = ? AND task_id = ?
    `).bind(walletAddress, task_id).run();

    return success(c, { message: '任务已删除' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ============ 其他任务接口 ============

// GetOtherTaskSimple - GET /task/other/simple
app.get('/other/simple', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, task_type } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取其他任务简要信息 (如探索任务、收集任务等)
    const tasks = await db.prepare(`
      SELECT id, name, type, sub_type, status, progress, target
      FROM other_tasks 
      WHERE wallet_address = ? AND type = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(walletAddress, task_type || 'explore').all();

    return success(c, { tasks: tasks.results || [] });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetHeChengTaskSimple - GET /task/compose/simple
app.get('/compose/simple', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取合成任务简要信息
    const tasks = await db.prepare(`
      SELECT id, name, type, materials_required, reward, status
      FROM compose_tasks 
      WHERE wallet_address = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(walletAddress).all();

    return success(c, { tasks: tasks.results || [] });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetFeastDayMissionSimple - GET /task/feast/simple
app.get('/feast/simple', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取节日任务简要信息
    const tasks = await db.prepare(`
      SELECT id, name, description, reward, status, end_time
      FROM feast_tasks 
      WHERE wallet_address = ? AND end_time > datetime('now')
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(walletAddress).all();

    return success(c, { tasks: tasks.results || [] });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetResExchangeMissionSimple - GET /task/res-exchange/simple
app.get('/res-exchange/simple', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取资源兑换任务简要信息
    const exchanges = [
      { id: 1, name: '木材兑换', cost_type: 'wood', cost_amount: 1000, reward_type: 'gold', reward_amount: 500 },
      { id: 2, name: '粮食兑换', cost_type: 'food', cost_amount: 1000, reward_type: 'gold', reward_amount: 500 },
      { id: 3, name: '铁矿兑换', cost_type: 'iron', cost_amount: 1000, reward_type: 'gold', reward_amount: 800 },
      { id: 4, name: '石料兑换', cost_type: 'stone', cost_amount: 1000, reward_type: 'gold', reward_amount: 600 },
    ];

    return success(c, { exchanges });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetOtherTaskByType - GET /task/other/by-type
app.get('/other/by-type', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, task_type, sub_type } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 按类型获取其他任务详情
    let query = `
      SELECT * FROM other_tasks 
      WHERE wallet_address = ? AND type = ?
    `;
    const params: any[] = [walletAddress, task_type || 'explore'];

    if (sub_type) {
      query += ' AND sub_type = ?';
      params.push(sub_type);
    }

    query += ' ORDER BY created_at DESC LIMIT 20';

    const tasks = await db.prepare(query).bind(...params).all();

    return success(c, { tasks: tasks.results || [] });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetHeChengTaskByType - GET /task/compose/by-type
app.get('/compose/by-type', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, sub_type } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 按类型获取合成任务
    let query = `SELECT * FROM compose_tasks WHERE wallet_address = ?`;
    const params: any[] = [walletAddress];

    if (sub_type) {
      query += ' AND sub_type = ?';
      params.push(sub_type);
    }

    query += ' ORDER BY created_at DESC LIMIT 20';

    const tasks = await db.prepare(query).bind(...params).all();

    return success(c, { tasks: tasks.results || [] });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetFeastDayMissionByType - GET /task/feast/by-type
app.get('/feast/by-type', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, sub_type } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 按类型获取节日任务
    let query = `
      SELECT * FROM feast_tasks 
      WHERE wallet_address = ? AND end_time > datetime('now')
    `;
    const params: any[] = [walletAddress];

    if (sub_type) {
      query += ' AND sub_type = ?';
      params.push(sub_type);
    }

    query += ' ORDER BY created_at DESC LIMIT 20';

    const tasks = await db.prepare(query).bind(...params).all();

    return success(c, { tasks: tasks.results || [] });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetResExchangeMissionByType - GET /task/res-exchange/by-type
app.get('/res-exchange/by-type', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, sub_type } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 按类型获取资源兑换选项
    const exchanges = [
      { id: 1, type: 'wood', name: '木材兑换金币', cost: 1000, reward: 500, sub_type: 1 },
      { id: 2, type: 'food', name: '粮食兑换金币', cost: 1000, reward: 500, sub_type: 1 },
      { id: 3, type: 'iron', name: '铁矿兑换金币', cost: 1000, reward: 800, sub_type: 2 },
      { id: 4, type: 'stone', name: '石料兑换金币', cost: 1000, reward: 600, sub_type: 2 },
    ];

    const filtered = sub_type 
      ? exchanges.filter(e => e.sub_type === parseInt(sub_type))
      : exchanges;

    return success(c, { exchanges: filtered });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetComposeTaskNums - GET /task/compose/count
app.get('/compose/count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, task_type } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取合成任务数量
    const result: any = await db.prepare(`
      SELECT COUNT(*) as count FROM compose_tasks 
      WHERE wallet_address = ? AND status = 0
    `).bind(walletAddress).first();

    return success(c, { count: result?.count || 0 });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// AddComposeTaskEvent - POST /task/compose/start
app.post('/compose/start', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, task_id, materials } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 开始合成任务
    await db.prepare(`
      INSERT INTO compose_tasks 
      (wallet_address, task_id, materials_required, status, created_at)
      VALUES (?, ?, ?, 0, datetime('now'))
    `).bind(walletAddress, task_id, JSON.stringify(materials || [])).run();

    return success(c, { message: '合成任务已开始' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// QuickGetComposeTask - POST /task/compose/quick-get
app.post('/compose/quick-get', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 返回失败 - 合成任务系统暂未实现
    return error(c, 'Compose tasks not implemented yet');
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetHeChengGoods - POST /task/compose/reward
app.post('/compose/reward', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, task_id } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 返回失败 - 合成任务系统暂未实现
    return error(c, 'Compose tasks not implemented yet');
  } catch (err: any) {
    return error(c, err.message);
  }
});

// FeastDayMissionPrize - POST /task/feast/reward
app.post('/feast/reward', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, task_id } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 返回失败 - 节日任务系统暂未实现
    return error(c, 'Feast tasks not implemented yet');
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ResExchangeMissionPrize - POST /task/res-exchange/reward
app.post('/res-exchange/reward', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, task_id } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 返回失败 - 资源兑换任务系统暂未实现
    return error(c, 'Resource exchange tasks not implemented yet');
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetOtherTaskGoods - POST /task/other/reward
app.post('/other/reward', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, task_id } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 返回失败 - 其他任务系统暂未实现
    return error(c, 'Other tasks not implemented yet');
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ResExchangeMissionPrizeByNum - POST /task/res-exchange/reward-by-num
app.post('/res-exchange/reward-by-num', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, task_id, num } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 返回失败 - 资源兑换任务系统暂未实现
    return error(c, 'Resource exchange tasks not implemented yet');
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
