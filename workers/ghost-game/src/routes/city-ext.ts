/**
 * CityInterior Extended Routes - 城市内政系统扩展接口
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { CityInteriorServiceExtension, PROSPERITY_CONFIG, RESOURCE_OUTPUT_CONFIG, POPULATION_CONFIG, TAX_CONFIG, BUILDING_QUEUE_CONFIG } from '../services';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}
function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// ==================== 繁荣度系统 ====================

// 获取繁荣度等级
app.get('/prosperity/level', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const service = new CityInteriorServiceExtension(db);
  const result = await service.getProsperityLevel(walletAddress);

  return success(c, result);
});

// 获取繁荣度加成
app.get('/prosperity/bonus', async (c) => {
  const { prosperity } = c.req.query();
  const bonus = CityInteriorServiceExtension.prototype.calculateProsperityBonus(
    parseInt(prosperity || '0')
  );

  return success(c, { prosperity: parseInt(prosperity || '0'), bonus });
});

// 更新繁荣度
app.post('/prosperity/update', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { delta } = await c.req.json();
  if (delta === undefined) return error(c, 'delta is required');

  const service = new CityInteriorServiceExtension(db);
  const result = await service.updateProsperity(walletAddress, delta);

  return success(c, result);
});

// ==================== 资源产量系统 ====================

// 获取资源产量
app.get('/resource/output', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const service = new CityInteriorServiceExtension(db);
  const result = await service.getResourceOutput(walletAddress);

  return success(c, result);
});

// ==================== 人口系统 ====================

// 获取人口信息
app.get('/population', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const service = new CityInteriorServiceExtension(db);
  const result = await service.getPopulationInfo(walletAddress);

  return success(c, result);
});

// 更新人口
app.post('/population/update', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { delta } = await c.req.json();
  if (delta === undefined) return error(c, 'delta is required');

  const service = new CityInteriorServiceExtension(db);
  const result = await service.updatePopulation(walletAddress, delta);

  return success(c, result);
});

// 更新幸福度
app.post('/happiness/update', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { delta } = await c.req.json();
  if (delta === undefined) return error(c, 'delta is required');

  const service = new CityInteriorServiceExtension(db);
  const result = await service.updateHappiness(walletAddress, delta);

  return success(c, result);
});

// ==================== 税收系统 ====================

// 获取税收信息
app.get('/tax', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const service = new CityInteriorServiceExtension(db);
  const result = await service.getTaxInfo(walletAddress);

  return success(c, result);
});

// 收取税收
app.post('/tax/collect', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const service = new CityInteriorServiceExtension(db);
  const result = await service.collectTax(walletAddress);

  if (!result.success) {
    return error(c, result.error);
  }

  return success(c, result);
});

// 设置税率
app.post('/tax/rate', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { rate } = await c.req.json();
  if (rate === undefined) return error(c, 'rate is required');

  const service = new CityInteriorServiceExtension(db);
  const result = await service.setTaxRate(walletAddress, rate);

  return success(c, result);
});

// ==================== 建筑队列系统 ====================

// 获取建筑队列
app.get('/building/queue', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const service = new CityInteriorServiceExtension(db);
  const result = await service.getBuildingQueue(walletAddress);

  return success(c, result);
});

// 加速建筑
app.post('/building/speed-up', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { queue_id } = await c.req.json();
  if (!queue_id) return error(c, 'queue_id is required');

  const service = new CityInteriorServiceExtension(db);
  const result = await service.speedUpBuilding(walletAddress, queue_id);

  if (!result.success) {
    return error(c, result.error);
  }

  return success(c, result);
});

// 取消建筑
app.post('/building/cancel', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { queue_id } = await c.req.json();
  if (!queue_id) return error(c, 'queue_id is required');

  const service = new CityInteriorServiceExtension(db);
  const result = await service.cancelBuilding(walletAddress, queue_id);

  if (!result.success) {
    return error(c, result.error);
  }

  return success(c, result);
});

export default app;
