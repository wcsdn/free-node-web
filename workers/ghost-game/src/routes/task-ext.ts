/**
 * Task Extended Routes - 任务系统扩展接口
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { TaskServiceExtension, TASK_TYPES, TASK_STATES, TASK_PROGRESS_TYPES, TASK_REWARD_CONFIG } from '../services';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}
function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// ==================== 任务查询 ====================

// 获取任务列表
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { type } = c.req.query();
  const service = new TaskServiceExtension(db);
  const result = await service.getTaskList(walletAddress, type ? parseInt(type) : undefined);

  return success(c, result);
});

// 获取任务详情
app.get('/detail/:taskId', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const taskId = parseInt(c.req.param('taskId'));
  const service = new TaskServiceExtension(db);
  const result = await service.getTaskDetail(walletAddress, taskId);

  return success(c, result);
});

// 获取可接任务
app.get('/available', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const service = new TaskServiceExtension(db);
  const result = await service.getAvailableTasks(walletAddress);

  return success(c, result);
});

// ==================== 任务执行 ====================

// 接受任务
app.post('/accept', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { task_id } = await c.req.json();
  if (!task_id) return error(c, 'task_id is required');

  const service = new TaskServiceExtension(db);
  const result = await service.acceptTask(walletAddress, task_id);

  if (!result.success) {
    return error(c, result.error);
  }

  return success(c, result);
});

// 放弃任务
app.post('/abandon', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { task_id } = await c.req.json();
  if (!task_id) return error(c, 'task_id is required');

  const service = new TaskServiceExtension(db);
  const result = await service.abandonTask(walletAddress, task_id);

  if (!result.success) {
    return error(c, result.error);
  }

  return success(c, result);
});

// 更新任务进度
app.post('/progress', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { progress_type, delta, related_id } = await c.req.json();
  if (progress_type === undefined || delta === undefined) {
    return error(c, 'progress_type and delta are required');
  }

  const service = new TaskServiceExtension(db);
  const result = await service.updateTaskProgress(walletAddress, progress_type, delta, related_id);

  return success(c, result);
});

// 完成任务（领取奖励）
app.post('/complete', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { task_id } = await c.req.json();
  if (!task_id) return error(c, 'task_id is required');

  const service = new TaskServiceExtension(db);
  const result = await service.completeTask(walletAddress, task_id);

  if (!result.success) {
    return error(c, result.error);
  }

  return success(c, result);
});

// 一键完成所有可领取任务
app.post('/complete-all', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const service = new TaskServiceExtension(db);
  const result = await service.completeAllTasks(walletAddress);

  if (!result.success) {
    return error(c, result.error);
  }

  return success(c, result);
});

// ==================== 日常任务 ====================

// 获取日常任务
app.get('/daily', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const service = new TaskServiceExtension(db);
  const result = await service.getDailyTasks(walletAddress);

  return success(c, result);
});

// 重置日常任务
app.post('/daily/reset', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const service = new TaskServiceExtension(db);
  const result = await service.resetDailyTasks(walletAddress);

  if (!result.success) {
    return error(c, result.error);
  }

  return success(c, result);
});

// ==================== 成就系统 ====================

// 获取成就列表
app.get('/achievements', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const service = new TaskServiceExtension(db);
  const result = await service.getAchievements(walletAddress);

  return success(c, result);
});

// 获取成就进度
app.get('/achievements/:achievementId/progress', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const achievementId = parseInt(c.req.param('achievementId'));
  const service = new TaskServiceExtension(db);
  const result = await service.getAchievementProgress(walletAddress, achievementId);

  return success(c, result);
});

export default app;
