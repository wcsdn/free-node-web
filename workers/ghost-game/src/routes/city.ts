/**
 * 城市路由 - D1数据库版本
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

// 辅助函数
function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 根路径 - 获取城市信息
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) {
      // 自动创建城市
      const cityName = '主城';
      const position = Math.floor(Math.random() * 100) + 1;
      
      const result = await db.prepare(`
        INSERT INTO cities (wallet_address, name, position, prosperity, money, food, population)
        VALUES (?, ?, ?, 100, 3000, 3000, 300)
      `).bind(walletAddress, cityName, position).run();

      return success(c, {
        id: result.meta.last_row_id,
        walletAddress,
        name: cityName,
        position,
        prosperity: 100,
        money: 3000,
        food: 3000,
        population: 300,
        autoCreated: true,
        message: 'Auto-created city'
      });
    }

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
      populationRate: city.population_rate,
      mapImage: city.map_image,
      lastCollect: city.last_collect,
      createdAt: city.created_at
    });
  } catch (err: any) {
    console.error('Get city error:', err);
    return error(c, err.message || '获取城市失败');
  }
});

// 获取城市列表
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const cities = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC
    `).bind(walletAddress).all();

    return success(c, cities.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取城市建筑
app.get('/buildings', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 先获取用户的城市
    const city = await db.prepare(`
      SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    const buildings = await db.prepare(`
      SELECT * FROM buildings WHERE city_id = ? ORDER BY position
    `).bind((city as any).id).all();

    return success(c, buildings.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 创建城市
app.post('/create', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { name } = await c.req.json();
  if (!name || name.length < 1 || name.length > 10) {
    return error(c, 'City name must be 1-10 characters');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const cityCount = await db.prepare(`
      SELECT COUNT(*) as count FROM cities WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if ((cityCount as any).count >= 3) {
      return error(c, 'Max 3 cities per account');
    }

    const position = Math.floor(Math.random() * 100) + 1;
    const result = await db.prepare(`
      INSERT INTO cities (wallet_address, name, position, prosperity, money, food, population)
      VALUES (?, ?, ?, 100, 3000, 3000, 300)
    `).bind(walletAddress, name, position).run();

    return success(c, {
      id: result.meta.last_row_id,
      name,
      position,
      message: 'City created'
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 收集资源
app.post('/:id/collect', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const cityId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT * FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(cityId, walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    const cityAny = city as any;
    const lastCollect = new Date(cityAny.last_collect);
    const now = new Date();
    const hoursPassed = (now.getTime() - lastCollect.getTime()) / (1000 * 60 * 60);

    if (hoursPassed < 0.1) {
      return error(c, 'Too soon to collect (wait 6 minutes)');
    }

    const moneyProduced = Math.floor(cityAny.money_rate * hoursPassed);
    const foodProduced = Math.floor(cityAny.food_rate * hoursPassed);

    await db.prepare(`
      UPDATE cities SET money = money + ?, food = food + ?, last_collect = ? WHERE id = ?
    `).bind(moneyProduced, foodProduced, now.toISOString(), cityId).run();

    return success(c, {
      collected: { money: moneyProduced, food: foodProduced },
      total: { money: cityAny.money + moneyProduced, food: cityAny.food + foodProduced }
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
