/**
 * City Route - 城市路由
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import type { City, ServiceResult } from '../models';
import { verifyWalletAuth } from '../utils/auth';
import { cityService } from '../services';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status?: number) {
  return c.json({ success: false, error: message }, status as number);
}

// 类型守卫：检查是否是错误结果
function isErrorResult<T>(result: ServiceResult<T>): result is { ok: false; error: string; status?: number } {
  return !result.ok;
}

// GET /api/game/city - 获取城市信息 (自动创建)
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await cityService.getOrCreate(db, walletAddress);
  if (isErrorResult(result)) return error(c, result.error, result.status);

  const { city, buildings, isNew } = result.data;

  return success(c, {
    id: city.id,
    walletAddress: city.wallet_address,
    name: city.name,
    position: city.position,
    prosperity: city.prosperity,
    money: city.money,
    food: city.food,
    population: city.population,
    moneyRate: city.money_rate,
    foodRate: city.food_rate,
    buildings: buildings.map(b => ({
      id: b.id,
      configId: b.config_id,
      name: '',
      type: b.type,
      level: b.level,
      position: b.position,
      state: b.state,
    })),
    autoCreated: isNew,
  });
});

// GET /api/game/city/list - 获取城市列表
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await cityService.getList(db, walletAddress);
  if (isErrorResult(result)) return error(c, result.error, result.status);

  return success(c, result.data.map(city => ({
    ID: city.id,
    Name: city.name,
    Position: city.position,
    Money: city.money,
    Food: city.food,
    Population: city.population,
  })));
});

// POST /api/game/city - 创建城市
app.post('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { name } = await c.req.json();
  if (!name || name.length < 1 || name.length > 10) {
    return error(c, 'City name must be 1-10 characters');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await cityService.create(db, walletAddress, name);
  if (isErrorResult(result)) return error(c, result.error, result.status);

  const city = result.data;
  return success(c, {
    id: city.id,
    name: city.name,
    position: city.position,
  });
});

// POST /api/game/city/:id/collect - 收集资源
app.post('/:id/collect', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const cityId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await cityService.collect(db, walletAddress, cityId);
  if (isErrorResult(result)) return error(c, result.error, result.status);

  return success(c, {
    collected: result.data.collected,
    total: result.data.total,
  });
});

// POST /api/game/city/interior/:id - 获取城市内政信息
app.post('/interior/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const cityId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await cityService.getDetail(db, walletAddress, cityId);
  if (isErrorResult(result)) return error(c, result.error, result.status);

  const { city, buildings } = result.data;
  return success(c, {
    city: {
      id: city.id,
      name: city.name,
      money: city.money,
      food: city.food,
      population: city.population,
      prosperity: city.prosperity,
    },
    buildings: buildings.map(b => ({
      id: b.id,
      configId: b.config_id,
      name: '建筑',
      type: b.type,
      level: b.level,
      position: b.position,
      state: b.state,
    })),
  });
});

// POST /api/game/city/building-list/:id - 获取建筑列表
app.post('/building-list/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const cityId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const buildings = await db.prepare(`
      SELECT * FROM buildings WHERE city_id = ? ORDER BY position
    `).bind(cityId).all();

    return success(c, { buildings: buildings.results || [] });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
