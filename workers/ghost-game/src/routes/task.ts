/**
 * Task Routes - 任务接口
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import taskService, { TaskService, getItemInfo } from '../services/task.service';
import persistEffectGroupsData from '../config/persist_effect_groups.json';
import missionConditionsData from '../config/mission_conditions.json';
import tasksConfig from '../config/tasks.json';

// 持久效果分组配置（从 persist_effect_groups.json 加载）
interface PersistEffectConfig {
  ID: number;
  MainEffectType: number;
  EffectType: number;
  Name: string;
  PersistTime: number;
  Gold: number;
  [key: string]: any;
}

const PERSIST_EFFECT_GROUPS: Record<number, PersistEffectConfig> =
  ((persistEffectGroupsData as any).EffectGroup as PersistEffectConfig[]).reduce((acc, item) => {
    acc[item.ID] = item;
    return acc;
  }, {} as Record<number, PersistEffectConfig>);

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

    // Build user item map for CostItemStateList computation (only items with state=1)
    // C#: ItemAccess.GetItemsByCityID(userName, cityID, 1) - state=1 表示可用物品
    const walletItems: Record<number, number> = {};
    const char: any = { gold: 0, insignia: 0 };
    try {
      const itemsResult: any = await db.prepare(
        'SELECT config_id, COUNT(*) as cnt FROM items WHERE wallet_address = ? AND state = 1 GROUP BY config_id'
      ).bind(walletAddress).all();
      for (const row of (itemsResult.results || [])) {
        walletItems[row.config_id] = (walletItems[row.config_id] || 0) + row.cnt;
      }
      // 获取用户元宝和战勋 (C#: State==2 时需要检查 CostGold 和 CostInsignia)
      const charResult: any = await db.prepare(
        'SELECT gold, insignia FROM characters WHERE wallet_address = ?'
      ).bind(walletAddress).first();
      char.gold = charResult?.gold || 0;
      char.insignia = charResult?.insignia || 0;
    } catch (_) { /* ignore */ }

    const taskList = (tasks || []).map((t: any) => {
      const costItemList: any[] = (t.costItemList || []).map((item: any) => ({
        StaticIndex: item.StaticIndex || 0,
        Name: item.Name || '',
        ItemType: item.ItemType || 1,
        Des: item.Des || '',
        Level: item.Level || 1,
        Quality: item.Quality || 1,
        Image: item.Image || '',
      }));

      // ============================================
      // CostItemStateList 计算逻辑 (修复)
      // C#: GetMissionState 中 Type==2 的处理逻辑：
      //   - 遍历 CostItemList，检查每个物品是否在背包中 (state=1)
      //   - 同时检查 gold >= CostGold && insignia >= CostInsignia
      //   - 如果所有物品都有且资源足够，State=2 (可领取)
      // ============================================
      const costItemStateList: number[] = (t.costItemList || []).map(
        (item: any) => {
          const hasItem = (walletItems[item.StaticIndex] || 0) > 0;
          // 对于 Type=2 任务，还需要检查元宝和战勋是否足够
          if (t.type === 2) {
            const goldEnough = char.gold >= (t.costGold || 0);
            const insigniaEnough = char.insignia >= (t.costInsignia || 0);
            return hasItem && goldEnough && insigniaEnough ? 1 : 0;
          }
          return hasItem ? 1 : 0;
        }
      );


      // Resolve GetItem ItemInfo if reward item index is set
      const getItem = (t.getItemIndex && t.getItemIndex > 0) ? getItemInfo(t.getItemIndex) : null;

      return {
        ID: t.id,
        Name: t.name,
        NameColor: t.nameColor || 1,
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
        NeedObjType: t.needObjType || 0,
        NeedObjID: t.needObjID || 0,
        NeedObjValue: t.needObjValue || 0,
        CostMoney: t.costMoney || 0,
        CostFood: t.costFood || 0,
        CostGold: t.costGold || 0,
        CostInsignia: t.costInsignia || 0,
        CostItemList: costItemList,
        CostItemStateList: costItemStateList,
        Target: t.target || 0,
        TargetType: t.targetType || 0,
        OverFlag: t.overFlag || 0,
        TaskItemName: t.taskItem || '',
        TaskItemNum: t.taskItemNum || 0,
        TaskItemCondition: t.taskItemCondition || 0,
        TaskItemProbability: t.taskItemProbability || 0,
        AppendItemIndex: t.appendItemIndex || 0,
        AppendItemProbability: t.appendItemProbability || 0,
        GetMoney: t.getMoney || 0,
        GetFood: t.getFood || 0,
        GetMen: t.getMen || 0,
        GetGold: t.getGold || 0,
        RewardGold: t.getGold || 0,
        RewardExp: 0,
        GetItem: getItem,
        GainType: t.gainType || 0,
        GainIndex: t.gainIndex || 0,
        Progress: t.hasTaskItemNum || 0,
        HasTaskItemNum: t.hasTaskItemNum || 0,
      };
    });

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

    // Build user item map for CostItemStateList computation (only items with state=1)
    // C#: ItemAccess.GetItemsByCityID(userName, cityID, 1) - state=1 表示可用物品
    const walletItems: Record<number, number> = {};
    const char: any = { gold: 0, insignia: 0 };
    try {
      const itemsResult: any = await db.prepare(
        'SELECT config_id, COUNT(*) as cnt FROM items WHERE wallet_address = ? AND state = 1 GROUP BY config_id'
      ).bind(walletAddress).all();
      for (const row of (itemsResult.results || [])) {
        walletItems[row.config_id] = (walletItems[row.config_id] || 0) + row.cnt;
      }
      // 获取用户元宝和战勋 (C#: State==2 时需要检查 CostGold 和 CostInsignia)
      const charResult: any = await db.prepare(
        'SELECT gold, insignia FROM characters WHERE wallet_address = ?'
      ).bind(walletAddress).first();
      char.gold = charResult?.gold || 0;
      char.insignia = charResult?.insignia || 0;
    } catch (_) { /* ignore */ }

    const taskList = (tasks || []).map((t: any) => {
      const costItemList: any[] = (t.costItemList || []).map((item: any) => ({
        StaticIndex: item.StaticIndex || 0,
        Name: item.Name || '',
        ItemType: item.ItemType || 1,
        Des: item.Des || '',
        Level: item.Level || 1,
        Quality: item.Quality || 1,
        Image: item.Image || '',
      }));

      // ============================================
      // CostItemStateList 计算逻辑 (修复)
      // C#: GetMissionState 中 Type==2 的处理逻辑：
      //   - 遍历 CostItemList，检查每个物品是否在背包中 (state=1)
      //   - 同时检查 gold >= CostGold && insignia >= CostInsignia
      //   - 如果所有物品都有且资源足够，State=2 (可领取)
      // ============================================
      const costItemStateList: number[] = (t.costItemList || []).map(
        (item: any) => {
          const hasItem = (walletItems[item.StaticIndex] || 0) > 0;
          // 对于 Type=2 任务，还需要检查元宝和战勋是否足够
          if (t.type === 2) {
            const goldEnough = char.gold >= (t.costGold || 0);
            const insigniaEnough = char.insignia >= (t.costInsignia || 0);
            return hasItem && goldEnough && insigniaEnough ? 1 : 0;
          }
          return hasItem ? 1 : 0;
        }
      );


      const getItem = (t.getItemIndex && t.getItemIndex > 0) ? getItemInfo(t.getItemIndex) : null;

      return {
        ID: t.id,
        Name: t.name,
        NameColor: t.nameColor || 1,
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
        NeedObjType: t.needObjType || 0,
        NeedObjID: t.needObjID || 0,
        NeedObjValue: t.needObjValue || 0,
        CostMoney: t.costMoney || 0,
        CostFood: t.costFood || 0,
        CostGold: t.costGold || 0,
        CostInsignia: t.costInsignia || 0,
        CostItemList: costItemList,
        CostItemStateList: costItemStateList,
        Target: t.target || 0,
        TargetType: t.targetType || 0,
        OverFlag: t.overFlag || 0,
        TaskItemName: t.taskItem || '',
        TaskItemNum: t.taskItemNum || 0,
        TaskItemCondition: t.taskItemCondition || 0,
        TaskItemProbability: t.taskItemProbability || 0,
        AppendItemIndex: t.appendItemIndex || 0,
        AppendItemProbability: t.appendItemProbability || 0,
        GetMoney: t.getMoney || 0,
        GetFood: t.getFood || 0,
        GetMen: t.getMen || 0,
        GetGold: t.getGold || 0,
        RewardGold: t.getGold || 0,
        RewardExp: 0,
        GetItem: getItem,
        GainType: t.gainType || 0,
        GainIndex: t.gainIndex || 0,
        Progress: t.hasTaskItemNum || 0,
        HasTaskItemNum: t.hasTaskItemNum || 0,
      };
    });

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
    // 每日任务配置 - 从 JSON 配置读取 (C#: 从 MissionAccess 获取)
    // Type=2 为每日任务，参考 jx/BLL/Event.cs AddDailyTaskEvent
    const dailyTaskConfigs = (tasksConfig.Task || []).filter((t: any) => t.Type === 2);

    // 如果 JSON 没有每日任务，使用硬编码默认任务
    const dailyTasks = dailyTaskConfigs.length > 0
      ? dailyTaskConfigs.map((cfg: any) => ({
          ID: cfg.ID,
          Name: cfg.Name,
          Type: 2,
          Des: cfg.BeginDes || cfg.EndDes || '',
          NeedObjValue: cfg.NeedObjValue || 1,
          RewardGold: cfg.GetGold || 0,
          RewardExp: cfg.GetExp || 0,
          Progress: 0,
          HasTaskItemNum: 0,
          State: 0,
        }))
      : [
          // 默认每日任务 - 参考 C# MissionAccess
          { ID: 2001, Name: '日常修炼', Type: 2, Des: '在训练场训练侠客', NeedObjValue: 1, RewardGold: 50, RewardExp: 100, Progress: 0, HasTaskItemNum: 0, State: 0 },
          { ID: 2002, Name: '资源收集', Type: 2, Des: '采集资源', NeedObjValue: 1, RewardGold: 30, RewardExp: 50, Progress: 0, HasTaskItemNum: 0, State: 0 },
          { ID: 2003, Name: '巡逻任务', Type: 2, Des: '巡逻城市周边', NeedObjValue: 1, RewardGold: 40, RewardExp: 80, Progress: 0, HasTaskItemNum: 0, State: 0 },
          { ID: 2004, Name: '护送任务', Type: 2, Des: '护送商队', NeedObjValue: 1, RewardGold: 60, RewardExp: 120, Progress: 0, HasTaskItemNum: 0, State: 0 },
          { ID: 2005, Name: '悬赏任务', Type: 2, Des: '完成悬赏令', NeedObjValue: 1, RewardGold: 80, RewardExp: 150, Progress: 0, HasTaskItemNum: 0, State: 0 },
        ];

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

// GET /task/other - 获取支线/酒馆任务列表
// C#: GetOtherMissionList 对应支线/酒馆任务 (MissionType=其他)
// 返回 other_tasks 表中的支线任务和酒馆任务
app.get('/other', async (c) => {
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
    // 获取支线/酒馆任务（从 other_tasks 表）
    const otherTasks = await db.prepare(
      'SELECT ot.*, tc.name, tc.description, tc.target_value, tc.reward_gold, tc.reward_exp, tc.reward_money, tc.reward_food ' +
      'FROM other_tasks ot ' +
      'LEFT JOIN task_configs tc ON ot.config_id = tc.id ' +
      'WHERE ot.wallet_address = ? AND ot.city_id = ?'
    ).bind(walletAddress, cityId).all();

    // 支线/酒馆任务 (Type=3)
    const branchTasks = (otherTasks.results || []).map((t: any) => ({
      ID: t.id,
      ConfigID: t.config_id,
      Name: t.name || '支线任务',
      NameColor: 2,
      NameType: 2,
      State: t.state || 0,
      SubType: t.task_type || 1,
      Type: 3,
      Des: t.description || '',
      BeginDes: t.description || '',
      EndDes: '任务完成',
      NeedObjType: 0,
      NeedObjValue: t.target_value || 0,
      CostMoney: 0,
      CostFood: 0,
      CostGold: 0,
      RewardMoney: t.reward_money || 0,
      RewardFood: t.reward_food || 0,
      RewardGold: t.reward_gold || 0,
      RewardExp: t.reward_exp || 0,
      Progress: t.progress || 0,
      HasTaskItemNum: t.progress || 0,
    }));

    return success(c, branchTasks);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GET /task/cycle - 获取循环任务列表 (MissionType=4 探索/循环任务)
// C#: GetCurrentMission(userName, cityID, missionType=4)
// 循环任务通过 Type=4 区分（探索类任务）
app.get('/cycle', async (c) => {
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
    // 从 tasks 表中获取 missionType=4 的循环任务
    // 循环任务存储在 missions 表，通过 MissionType=4 筛选
    // condition_index 指向 mission_conditions.json 中的条目
    const cycleMissions: any = await db.prepare(
      'SELECT m.* FROM missions m ' +
      'WHERE m.wallet_address = ? AND m.city_id = ? AND m.mission_type = 4'
    ).bind(walletAddress, cityId).all();

    const tasks = (cycleMissions.results || []).map((m: any) => {
      // 从 mission_conditions.json 按 condition_index 查找条件详情
      const condData = (missionConditionsData as any).Condition?.find(
        (c: any) => c.ID === m.condition_index
      ) || {};
      const getItem = (m.reward_item_index && m.reward_item_index > 0)
        ? getItemInfo(m.reward_item_index) : null;

      return {
        ID: m.id,
        Name: m.name || '循环任务',
        NameColor: 4,
        NameType: 4,
        State: m.mission_state || 0,
        SubType: m.mission_type || 4,
        Type: 4,
        Des: condData.BeginDes || m.description || '',
        BeginDes: condData.BeginDes || m.description || '前往指定地点探索',
        EndDes: condData.EndDes || '探索完成',
        ActionDes: condData.ActionDes || '',
        NeedObjType: condData.NeedObjType || 4,
        NeedObjID: condData.NeedObjID || 0,
        NeedObjValue: condData.NeedObjValue || m.target_value || 1,
        Target: m.target_pos || 0,
        TargetType: 0,
        OverFlag: 0,
        TaskItemName: condData.MissionItem || '',
        TaskItemNum: condData.MissionItemNum || 0,
        TaskItemCondition: condData.MissionItemCondition || 0,
        TaskItemProbability: condData.MissionItemProbability || 0,
        AppendItemIndex: condData.AppendItemIndex || 0,
        AppendItemProbability: condData.AppendItemProbability || 0,
        CostMoney: condData.CostMoney || m.cost_money || 0,
        CostFood: condData.CostFood || m.cost_food || 0,
        CostGold: condData.CostGold || m.cost_gold || 0,
        CostInsignia: condData.CostInsignia || 0,
        GetMoney: condData.GetMoney || m.reward_money || 0,
        GetFood: condData.GetFood || m.reward_food || 0,
        GetGold: condData.GetGold || m.reward_gold || 0,
        RewardGold: condData.GetGold || m.reward_gold || 0,
        RewardExp: m.reward_exp || 0,
        GetItem: getItem,
        GainType: 0,
        GainIndex: 0,
        Progress: m.has_task_item_num || 0,
        HasTaskItemNum: m.has_task_item_num || 0,
      };
    });

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
    // C# State=0表示已领取过,不能再次领取; State=1表示任务未完成; State>=2表示可领取
    // TS: 0=未领取, 1=进行中, 2=已完成(可领取), 3=已领取
    if (currentState === 0 || currentState === 1) return error(c, '任务未完成或不可领取');
    if (currentState === 3) return error(c, '奖励已领取');

    // 获取任务配置
    const service = new TaskService(db);
    const taskConfig = service.getTaskConfig(task_id);
    if (!taskConfig) return error(c, '任务配置不存在', 404);

    // 验证任务条件是否满足
    const isComplete = await taskService.verifyTaskComplete(walletAddress, cityId, task_id, db);
    if (!isComplete) return error(c, '任务条件未满足');

    // C#: 获取任务消耗资源 (CostMen/CostMoney/CostFood/CostGold)
    const costMen = taskConfig.costMen || 0;
    const costMoney = taskConfig.costMoney || 0;
    const costFood = taskConfig.costFood || 0;
    const costGold = taskConfig.costGold || 0;

    // C#: 先获取城市资源，检查是否足够
    const city: any = await db.prepare(
      'SELECT * FROM cities WHERE id = ? AND wallet_address = ?'
    ).bind(cityId, walletAddress).first();

    if (!city) return error(c, '城市不存在', 404);

    // 检查元宝 (characters.gold)
    const character: any = await db.prepare(
      'SELECT gold FROM characters WHERE wallet_address = ?'
    ).bind(walletAddress).first();

    if ((city.population || 0) < costMen) return error(c, '人口不足');
    if ((city.money || 0) < costMoney) return error(c, '银两不足');
    if ((city.food || 0) < costFood) return error(c, '粮食不足');
    if ((character.gold || 0) < costGold) return error(c, '元宝不足');

    // C#: 扣除资源 - 城市资源用 UPDATE cities，消耗人口/金钱/粮食
    // 先扣除城市资源（人口/金钱/粮食）
    if (costMen > 0 || costMoney > 0 || costFood > 0) {
      await db.prepare(`
        UPDATE cities SET
          population = MAX(0, population - ?),
          money = MAX(0, money - ?),
          food = MAX(0, food - ?)
        WHERE id = ?
      `).bind(costMen, costMoney, costFood, cityId).run();
    }

    // 扣除元宝 (characters.gold)
    if (costGold > 0) {
      await db.prepare(
        'UPDATE characters SET gold = gold - ? WHERE wallet_address = ?'
      ).bind(costGold, walletAddress).run();
    }

    // ============================================
    // CostItemList 消耗处理 (修复)
    // C#: MissionPrize 中消耗 CostItemList 物品
    //   - 遍历 CostItemList，从背包删除消耗的物品
    //   - 每个物品需要从 items 表中删除对应数量 (state=1 的可用物品)
    // ============================================
    if (taskConfig.costItemList && taskConfig.costItemList.length > 0) {
      for (const item of taskConfig.costItemList) {
        const staticIndex = (item as any).StaticIndex || (item as any).staticIndex || 0;
        if (staticIndex > 0) {
          // C#: Item.DeleteItem(userName, staticIndex) - 删除一个物品
          // 从背包中删除一个物品 (state=1 的可用物品)
          const deleteResult: any = await db.prepare(`
            DELETE FROM items
            WHERE wallet_address = ? AND config_id = ? AND state = 1
            LIMIT 1
          `).bind(walletAddress, staticIndex).run();
          console.log(`[TaskGain] Consumed item ${staticIndex}, deleted: ${deleteResult.meta?.changes || 0}`);
        }
      }
    }

    // C#: 发放奖励 (GetMoney/GetFood/GetMen/GetGold/GetItemIndex)
    // 奖励字段从 MissionGain 静态数据读取 (getMoney/getFood/getMen/getGold)
    const rewards: any = {
      // 资源奖励
      getMoney: taskConfig.getMoney || 0,
      getFood: taskConfig.getFood || 0,
      getMen: taskConfig.getMen || 0,
      getGold: taskConfig.getGold || 0,
      // 物品奖励
      getItemIndex: taskConfig.getItemIndex || 0,
      // 返还消耗
      returnMoney: costMoney,
      returnFood: costFood,
      returnMen: costMen,
      returnGold: costGold,
    };

    // C#: 更新城市资源 (GetMoney/GetFood/GetMen)
    if (rewards.getMoney > 0 || rewards.getFood > 0 || rewards.getMen > 0) {
      await db.prepare(`
        UPDATE cities SET
          money = money + ?,
          food = food + ?,
          population = population + ?
        WHERE id = ?
      `).bind(rewards.getMoney || 0, rewards.getFood || 0, rewards.getMen || 0, cityId).run();
    }

    // C#: 发放元宝 (characters.gold)
    if (rewards.getGold > 0) {
      await db.prepare(
        'UPDATE characters SET gold = gold + ? WHERE wallet_address = ?'
      ).bind(rewards.getGold, walletAddress).run();
    }

    // 发放物品
    if (rewards.getItemIndex > 0) {
      // C#: 检查背包是否已满 (Item.GetItemMaxCount)
      const maxItemCount: any = await db.prepare(
        'SELECT item_count FROM item_max_count WHERE wallet_address = ?'
      ).bind(walletAddress).first();
      const maxCount = maxItemCount?.item_count || 999;
      const currentCount: any = await db.prepare(
        'SELECT COALESCE(SUM(count), 0) as total FROM items WHERE wallet_address = ?'
      ).bind(walletAddress).first();
      if ((currentCount?.total || 0) >= maxCount) {
        return error(c, '物品背包已满，无法获得物品');
      }

      await db.prepare(`
        INSERT INTO items (wallet_address, config_id, count, source)
        VALUES (?, ?, 1, 'task_reward')
        ON CONFLICT(wallet_address, config_id) DO UPDATE SET count = count + 1
      `).bind(walletAddress, rewards.getItemIndex).run();
    }

    // C#: 处理持续效果 (GainType=1 表示任务给予持续效果/Buff)
    // 参考 C# MissionPrize 中对 GetGainType==1 的处理
    if (taskConfig.gainType === 1 && taskConfig.gainIndex > 0) {
      const effectGroup = PERSIST_EFFECT_GROUPS[taskConfig.gainIndex];
      if (effectGroup) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + effectGroup.PersistTime * 1000).toISOString();

        // 检查是否已有同类持续效果（MainEffectType 相同则覆盖）
        await db.prepare(`
          DELETE FROM user_effects WHERE wallet_address = ? AND category = ?
        `).bind(walletAddress, effectGroup.MainEffectType).run();

        // 插入新的持续效果记录
        await db.prepare(`
          INSERT INTO user_effects (wallet_address, category, type, value, stack, max_stack, source, expires_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          walletAddress,
          effectGroup.MainEffectType,
          effectGroup.EffectType,
          1, // value
          1, // stack
          1, // max_stack
          taskConfig.gainIndex, // source = StaticIndex = GainIndex
          expiresAt,
          now.toISOString(),
          now.toISOString()
        ).run();
      }
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

// POST /task/save - 保存任务状态
// C#: SaveMission(string userName, int missionID)
// 保存玩家任务进度（如接任务时改变状态为1，任务进度等）
app.post('/save', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = (c.env as Env).DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { task_id, state, progress } = await c.req.json();
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

    // 更新任务状态（如果提供了state参数）
    if (state !== undefined && state !== null) {
      taskStates[taskIndex] = state;
    }

    // 更新任务进度（如果提供了progress参数）
    if (progress !== undefined && progress !== null) {
      taskProgress[taskIndex] = progress;
    }

    await db.prepare(`
      UPDATE tasks SET task_states = ?, task_progress = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(JSON.stringify(taskStates), JSON.stringify(taskProgress), walletAddress).run();

    return success(c, {
      taskId: task_id,
      state: taskStates[taskIndex],
      progress: taskProgress[taskIndex],
      message: '任务状态已保存',
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
