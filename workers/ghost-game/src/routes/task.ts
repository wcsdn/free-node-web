/**
 * Task Routes - 任务接口
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import taskService from '../services/task.service';

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

export default app;
