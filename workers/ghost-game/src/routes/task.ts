/**
 * Task Routes - 任务接口
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import taskService, { TaskService } from '../services/task.service';

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

const app = new Hono();

// GET /task/ - 获取任务列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = (c.env as Env).DB;
  if (!db) return error(c, 'Database not configured', 503);

  const url = new URL(c.req.url);
  const city_id = url.searchParams.get('city_id');
  const task_type = url.searchParams.get('task_type') || '1';
  let cityId = parseInt(city_id || '0');

  if (!cityId) {
    const defaultCity: any = await db.prepare(
      'SELECT id FROM cities WHERE wallet_address = ? LIMIT 1'
    ).bind(walletAddress).first();
    cityId = defaultCity?.id || 1;
  }

  try {
    const tasks = await taskService.getCurrentTasks(db, walletAddress, cityId);
    const taskList = (tasks || []).map((t: any) => ({
      ID: t.id,
      Name: t.name,
      NameColor: 1,
      NameType: t.nameType,
      State: t.state,
      SubType: t.type,
      Type: t.type,
      Des: t.beginDes || '',
      BeginDes: t.beginDes || '',
      EndDes: t.endDes || '',
      ActionDes: t.actionDes || '',
      mainId: t.mainId,
      mainIndex: t.mainIndex,
      index: t.index,
      NeedObjType: t.needObjType,
      NeedObjID: t.needObjID,
      NeedObjValue: t.needObjValue,
      CostMoney: t.costMoney || 0,
      CostFood: t.costFood || 0,
      CostGold: t.costGold || 0,
      RewardGold: t.rewardGold || 0,
      RewardExp: t.rewardExp || 0,
      Progress: t.hasTaskItemNum || 0,
      HasTaskItemNum: t.hasTaskItemNum || 0,
    }));
    return success(c, taskList);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// POST /task/list - 获取当前任务列表
app.post('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = (c.env as Env).DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id } = await c.req.json<{ city_id?: number }>();
  let cityId = parseInt(String(city_id || '0'));

  if (!cityId) {
    const defaultCity: any = await db.prepare(
      'SELECT id FROM cities WHERE wallet_address = ? LIMIT 1'
    ).bind(walletAddress).first();
    cityId = defaultCity?.id || 1;
  }

  try {
    const tasks = await taskService.getCurrentTasks(db, walletAddress, cityId);
    const taskList = (tasks || []).map((t: any) => ({
      ID: t.id,
      Name: t.name,
      NameColor: 1,
      NameType: t.nameType,
      State: t.state,
      SubType: t.type,
      Type: t.type,
      Des: t.beginDes || '',
      BeginDes: t.beginDes || '',
      EndDes: t.endDes || '',
      ActionDes: t.actionDes || '',
      mainId: t.mainId,
      mainIndex: t.mainIndex,
      index: t.index,
      NeedObjType: t.needObjType,
      NeedObjID: t.needObjID,
      NeedObjValue: t.needObjValue,
      CostMoney: t.costMoney || 0,
      CostFood: t.costFood || 0,
      CostGold: t.costGold || 0,
      RewardGold: t.rewardGold || 0,
      RewardExp: t.rewardExp || 0,
      Progress: t.hasTaskItemNum || 0,
      HasTaskItemNum: t.hasTaskItemNum || 0,
    }));
    return success(c, taskList);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GET /task/daily - 每日任务
app.get('/daily', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = (c.env as Env).DB;
  if (!db) return error(c, 'Database not configured', 503);

  const url = new URL(c.req.url);
  const city_id = url.searchParams.get('city_id');
  let cityId = parseInt(city_id || '0');

  if (!cityId) {
    const defaultCity: any = await db.prepare(
      'SELECT id FROM cities WHERE wallet_address = ? LIMIT 1'
    ).bind(walletAddress).first();
    cityId = defaultCity?.id || 1;
  }

  try {
    const configs = await db.prepare(
      'SELECT * FROM daily_task_configs WHERE is_open = 1 ORDER BY id'
    ).all();

    const dailyTasks = (configs.results || []).map((cfg: any) => ({
      ID: cfg.id,
      Name: cfg.name,
      Type: 2,
      Des: cfg.description || '',
      NeedObjValue: cfg.target_value || 0,
      RewardGold: cfg.reward_gold || 0,
      RewardExp: cfg.reward_exp || 0,
      Progress: 0,
      HasTaskItemNum: 0,
      State: 0,
    }));

    return success(c, dailyTasks);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GET /task/other/simple - 其他任务（支线等）
app.get('/other/simple', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = (c.env as Env).DB;
  if (!db) return error(c, 'Database not configured', 503);

  const url = new URL(c.req.url);
  const city_id = url.searchParams.get('city_id');
  const task_type = url.searchParams.get('task_type') || '1';
  let cityId = parseInt(city_id || '0');

  if (!cityId) {
    const defaultCity: any = await db.prepare(
      'SELECT id FROM cities WHERE wallet_address = ? LIMIT 1'
    ).bind(walletAddress).first();
    cityId = defaultCity?.id || 1;
  }

  try {
    const otherTasks = await db.prepare(
      'SELECT ot.*, tc.name, tc.description, tc.target_value, tc.reward_gold, tc.reward_exp ' +
      'FROM other_tasks ot ' +
      'LEFT JOIN task_configs tc ON ot.config_id = tc.id ' +
      'WHERE ot.wallet_address = ? AND ot.city_id = ?'
    ).bind(walletAddress, cityId).all();

    const tasks = (otherTasks.results || []).map((t: any) => ({
      ID: t.id,
      ConfigID: t.config_id,
      Name: t.name || '支线任务',
      Type: 3,
      Des: t.description || '',
      NeedObjValue: t.target_value || 0,
      RewardGold: t.reward_gold || 0,
      RewardExp: t.reward_exp || 0,
      Progress: t.progress || 0,
      State: t.state || 0,
    }));

    return success(c, tasks);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// POST /task/gain - 完成任务并领取奖励
// C#: MissionPrize(string userName, int cityID, int missionID)
// 验证任务条件满足后，扣除消耗资源，发放任务奖励
app.post('/gain', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = (c.env as Env).DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id, task_id } = await c.req.json();
  if (!task_id) return error(c, 'Missing task_id');

  let cityId = parseInt(String(city_id || '0'));
  if (!cityId) {
    const defaultCity: any = await db.prepare(
      'SELECT id FROM cities WHERE wallet_address = ? LIMIT 1'
    ).bind(walletAddress).first();
    cityId = defaultCity?.id || 1;
  }

  try {
    // 获取用户任务状态
    const userTask: any = await db.prepare(
      'SELECT * FROM tasks WHERE wallet_address = ?'
    ).bind(walletAddress).first();

    if (!userTask) return error(c, '任务状态不存在', 404);

    const taskIds = JSON.parse((userTask.task_ids as string) || '[]');
    const taskStates = JSON.parse((userTask.task_states as string) || '[]');
    const taskProgress = JSON.parse((userTask.task_progress as string) || '[]');

    const taskIndex = taskIds.indexOf(task_id);
    if (taskIndex === -1) return error(c, '任务不存在', 404);

    const currentState = taskStates[taskIndex];
    if (currentState === 0) return error(c, '任务未接取');
    if (currentState === 3) return error(c, '奖励已领取');

    // 获取任务配置
    const service = new TaskService(db);
    const taskConfig = service.getTaskConfig(task_id);
    if (!taskConfig) return error(c, '任务配置不存在', 404);

    // 验证任务条件是否满足
    const isComplete = await taskService.verifyTaskComplete(walletAddress, cityId, task_id, db);
    if (!isComplete) return error(c, '任务条件未满足');

    // 扣除消耗资源
    const costMoney = taskConfig.costMoney || 0;
    const costFood = taskConfig.costFood || 0;
    const costGold = taskConfig.costGold || 0;

    if (costMoney > 0 || costFood > 0) {
      const city: any = await db.prepare(
        'SELECT * FROM cities WHERE id = ? AND wallet_address = ?'
      ).bind(cityId, walletAddress).first();

      if (!city) return error(c, '城市不存在', 404);

      if ((city.gold || 0) < costGold) return error(c, '元宝不足');
      if ((city.money || 0) < costMoney) return error(c, '银两不足');
      if ((city.food || 0) < costFood) return error(c, '粮食不足');
    }

    // 扣除资源
    if (costGold > 0) {
      await db.prepare(
        'UPDATE characters SET gold = gold - ? WHERE wallet_address = ?'
      ).bind(costGold, walletAddress).run();
    }

    // 发放奖励
    const rewards: any = {
      getMoney: taskConfig.getMoney || 0,
      getFood: taskConfig.getFood || 0,
      getMen: taskConfig.getMen || 0,
      getGold: taskConfig.getGold || 0,
      getItemIndex: taskConfig.getItemIndex || 0,
    };

    // 更新城市资源
    if (rewards.getMoney > 0 || rewards.getFood > 0 || rewards.getMen > 0) {
      await db.prepare(`
        UPDATE cities SET
          money = money + ?,
          food = food + ?,
          population = population + ?
        WHERE id = ?
      `).bind(rewards.getMoney || 0, rewards.getFood || 0, rewards.getMen || 0, cityId).run();
    }

    // 发放元宝
    if (rewards.getGold > 0) {
      await db.prepare(
        'UPDATE characters SET gold = gold + ? WHERE wallet_address = ?'
      ).bind(rewards.getGold, walletAddress).run();
    }

    // 发放物品
    if (rewards.getItemIndex > 0) {
      await db.prepare(`
        INSERT INTO items (wallet_address, config_id, count, source)
        VALUES (?, ?, 1, 'task_reward')
        ON CONFLICT(wallet_address, config_id) DO UPDATE SET count = count + 1
      `).bind(walletAddress, rewards.getItemIndex).run();
    }

    // 更新任务状态为已领取
    taskStates[taskIndex] = 3;
    await db.prepare(`
      UPDATE tasks SET task_states = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(JSON.stringify(taskStates), walletAddress).run();

    // 如果有后续任务，解锁下一个任务
    // 查找下一个任务（在 current mainId/mainIndex 中）
    const nextIndex = taskIndex + 1;
    if (nextIndex < taskIds.length && taskIds[nextIndex] === 0) {
      // 需要从配置中获取下一个任务的 ID
      const currentMainId = userTask.main_id;
      const currentMainIndex = userTask.main_index;
      const nextTaskId = await taskService.getNextTaskId(currentMainId, currentMainIndex, taskIndex, db);
      if (nextTaskId) {
        taskIds[nextIndex] = nextTaskId;
        taskStates[nextIndex] = 0;  // 未接取
        taskProgress[nextIndex] = 0;
        await db.prepare(`
          UPDATE tasks SET task_ids = ?, task_states = ?, task_progress = ?, updated_at = datetime('now')
          WHERE wallet_address = ?
        `).bind(JSON.stringify(taskIds), JSON.stringify(taskStates), JSON.stringify(taskProgress), walletAddress).run();
      }
    }

    return success(c, {
      taskId: task_id,
      rewards,
      message: '领取任务奖励成功',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// POST /task/quit - 放弃任务
// C#: QuiteMission(string userName, int missionID)
app.post('/quit', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = (c.env as Env).DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { task_id } = await c.req.json();
  if (!task_id) return error(c, 'Missing task_id');

  try {
    const userTask: any = await db.prepare(
      'SELECT * FROM tasks WHERE wallet_address = ?'
    ).bind(walletAddress).first();

    if (!userTask) return error(c, '任务状态不存在', 404);

    const taskIds = JSON.parse((userTask.task_ids as string) || '[]');
    const taskStates = JSON.parse((userTask.task_states as string) || '[]');
    const taskProgress = JSON.parse((userTask.task_progress as string) || '[]');

    const taskIndex = taskIds.indexOf(task_id);
    if (taskIndex === -1) return error(c, '任务不存在', 404);

    const currentState = taskStates[taskIndex];
    if (currentState === 3) return error(c, '任务已完成，无法放弃');

    // 重置任务状态为未接取
    taskStates[taskIndex] = 0;
    taskProgress[taskIndex] = 0;

    await db.prepare(`
      UPDATE tasks SET task_states = ?, task_progress = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(JSON.stringify(taskStates), JSON.stringify(taskProgress), walletAddress).run();

    return success(c, {
      taskId: task_id,
      message: '放弃任务成功',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GET /task/compound - 获取合成任务列表
// C#: GetCompoundMission(string userName, int cityID)
// 合成任务通过 MissionType=3 区分（来自 missions_by_level.json）
app.get('/compound', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = (c.env as Env).DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const missionsByLevel: any = await import('../config/missions_by_level.json');
    const missions = (missionsByLevel.default?.Mission || []) as any[];
    // MissionType=3 为合成任务
    const composeMissions = missions.filter((m: any) => m.MissionType === 3);

    const tasks = composeMissions.map((cfg: any) => ({
      ID: cfg.GroupIndex,
      Name: cfg.Name || '合成任务',
      Type: 3,
      NameType: cfg.NameType || 7,
      SubType: cfg.SubType || 1,
      BeginDes: cfg.Description || '使用材料合成高级装备',
      EndDes: '合成成功',
      NeedObjType: 0,
      NeedObjValue: 0,
      CostMoney: 0,
      CostFood: 0,
      RewardGold: 0,
      RewardExp: 0,
      Progress: 0,
      HasTaskItemNum: 0,
      State: 0,
      materials: cfg.Conditions || [],
      productIndex: cfg.GainIndex || 0,
    }));

    return success(c, tasks);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GET /task/res-exchange - 获取资源兑换任务
// C#: GetResExchangeMission(string userName, int cityID)
// 资源兑换任务通过 MissionType=5 区分
app.get('/res-exchange', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = (c.env as Env).DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const missionsByLevel: any = await import('../config/missions_by_level.json');
    const missions = (missionsByLevel.default?.Mission || []) as any[];
    // MissionType=5 为资源兑换任务
    const resExchangeMissions = missions.filter((m: any) => m.MissionType === 5);

    const tasks = resExchangeMissions.map((cfg: any) => ({
      ID: cfg.GroupIndex,
      Name: cfg.Name || '资源兑换',
      Type: 5,
      NameType: cfg.NameType || 7,
      SubType: cfg.SubType || 2,
      BeginDes: cfg.Description || '使用低级资源兑换高级资源',
      EndDes: '兑换成功',
      NeedObjType: 0,
      NeedObjValue: 0,
      CostMoney: 0,
      CostFood: 0,
      RewardGold: 0,
      RewardExp: 0,
      Progress: 0,
      HasTaskItemNum: 0,
      State: 0,
      exchangeRatio: cfg.Ratio || 1,
      resourceType: cfg.ResourceType || 1,
    }));

    return success(c, tasks);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GET /task/feast - 获取节日活动任务
// C#: GetFeastDayMission(string userName, int cityID)
// 节日活动任务通过 MissionType=6 区分
app.get('/feast', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = (c.env as Env).DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const missionsByLevel: any = await import('../config/missions_by_level.json');
    const missions = (missionsByLevel.default?.Mission || []) as any[];
    // MissionType=6 为节日活动任务
    const feastMissions = missions.filter((m: any) => m.MissionType === 6);

    const tasks = feastMissions.map((cfg: any) => ({
      ID: cfg.GroupIndex,
      Name: cfg.Name || '节日活动',
      Type: 6,
      NameType: 3,
      SubType: cfg.SubType || 3,
      BeginDes: cfg.Description || '节日活动期间完成任务获得稀有奖励',
      EndDes: '活动结束',
      NeedObjType: 0,
      NeedObjValue: cfg.TargetValue || 0,
      RewardGold: cfg.RewardGold || 0,
      RewardExp: cfg.RewardExp || 0,
      getItemIndex: cfg.GainItemIndex || 0,
      Progress: 0,
      HasTaskItemNum: 0,
      State: 0,
    }));

    return success(c, tasks);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GET /task/verify - 验证任务是否完成
// 检查任务条件是否满足，返回当前进度
app.get('/verify', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = (c.env as Env).DB;
  if (!db) return error(c, 'Database not configured', 503);

  const url = new URL(c.req.url);
  const task_id = parseInt(url.searchParams.get('task_id') || '0');

  let cityId = parseInt(url.searchParams.get('city_id') || '0');
  if (!cityId) {
    const defaultCity: any = await db.prepare(
      'SELECT id FROM cities WHERE wallet_address = ? LIMIT 1'
    ).bind(walletAddress).first();
    cityId = defaultCity?.id || 1;
  }

  if (!task_id) return error(c, 'Missing task_id');

  try {
    const isComplete = await taskService.verifyTaskComplete(walletAddress, cityId, task_id, db);
    const progress = await taskService.getTaskProgress(walletAddress, cityId, task_id, db);

    return success(c, {
      taskId: task_id,
      isComplete,
      progress: progress.current,
      target: progress.target,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
