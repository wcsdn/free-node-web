/**
 * 游戏状态路由 - 包含城市建筑列表
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 根路径 - 获取游戏状态
app.get('/', async (c) => {
  return success(c, {
    status: 'online',
    version: '1.0.0',
    serverTime: new Date().toISOString(),
    features: {
      pve: true,
      pvp: true,
      corps: true,
      crafting: true,
    }
  });
});

// 获取服务器状态
app.get('/status', async (c) => {
  return success(c, {
    online: true,
    playerCount: 0,
    uptime: 0,
  });
});

// 获取用户信息 (包含城市列表)
app.get('/user-info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取角色信息
    let character: any = await db.prepare(`
      SELECT * FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    // 如果没有角色，自动创建
    if (!character) {
      const charName = `玩家_${walletAddress.substring(2, 8)}`;
      await db.prepare(`
        INSERT INTO characters (wallet_address, name, level, exp, gold, vip_level)
        VALUES (?, ?, 1, 0, 1000, 0)
      `).bind(walletAddress, charName).run();

      character = {
        wallet_address: walletAddress,
        name: charName,
        level: 1,
        exp: 0,
        gold: 1000,
        vip_level: 0,
      };
    }

    // 获取城市列表
    const citiesResult: any = await db.prepare(`
      SELECT * FROM cities WHERE LOWER(wallet_address) = ?
    `).bind(walletAddress.toLowerCase()).all();

    // 如果没有城市，自动创建主城
    if (!citiesResult.results || citiesResult.results.length === 0) {
      const cityName = '主城';
      const position = Math.floor(Math.random() * 100) + 1;
      
      const result = await db.prepare(`
        INSERT INTO cities (wallet_address, name, position, prosperity, money, food, population)
        VALUES (?, ?, ?, 100, 3000, 3000, 300)
      `).bind(walletAddress, cityName, position).run();

      const newCity = [{
        id: result.meta.last_row_id,
        wallet_address: walletAddress,
        name: cityName,
        position,
        prosperity: 100,
        money: 3000,
        food: 3000,
        population: 300,
      }];

      // 同时创建初始建筑
      await db.prepare(`
        INSERT INTO buildings (city_id, type, level, position, state, config_id)
        VALUES (?, 'interior', 1, 10, 0, 1)
      `).bind(result.meta.last_row_id).run();

      const cityList = newCity.map((city: any) => ({
        ID: city.id,
        Name: city.name,
        Position: city.position,
        Money: city.money,
        Food: city.food,
        Population: city.population,
      }));

      return success(c, {
        walletAddress: character.wallet_address,
        name: character.name,
        level: character.level,
        gold: character.gold,
        CityList: cityList,
      });
    }

    const cityList = (citiesResult.results || []).map((city: any) => ({
      ID: city.id,
      Name: city.name,
      Position: city.position,
      Money: city.money,
      Food: city.food,
      Population: city.population,
    }));

    return success(c, {
      walletAddress: character.wallet_address,
      name: character.name,
      level: character.level,
      gold: character.gold,
      CityList: cityList,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ========== 城市内部信息路由 (GET/POST) ==========
// 支持 /api/game/city/interior 或 /api/game/city/interior/:id
app.get('/city/interior', async (c) => handleInterior(c));
app.post('/city/interior', async (c) => handleInterior(c));
app.get('/city/interior/:id', async (c) => handleInterior(c));
app.post('/city/interior/:id', async (c) => handleInterior(c));

// ========== 城市建筑列表路由 (GET/POST) ==========
app.get('/city/building-list', async (c) => handleBuildingList(c));
app.post('/city/building-list', async (c) => handleBuildingList(c));
app.get('/city/building-list/:id', async (c) => handleBuildingList(c));
app.post('/city/building-list/:id', async (c) => handleBuildingList(c));

async function handleInterior(c: any) {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  let cityIdParam = c.req.param('id');
  let cityId: number | null = null;
  
  if (cityIdParam) {
    cityId = parseInt(cityIdParam);
  }
  
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let selectedCityId: number | null = null;

    // 如果传递了 cityId，检查是否属于用户
    if (cityId && !isNaN(cityId)) {
      const city: any = await db.prepare(`
        SELECT * FROM cities WHERE id = ? AND LOWER(wallet_address) = ?
      `).bind(cityId, walletAddress.toLowerCase()).first();

      if (city) {
        // 城市属于用户，使用它
        selectedCityId = cityId;
      }
    }

    // 如果没有找到有效的城市，自动获取用户的第一个城市
    if (!selectedCityId) {
      const firstCity: any = await db.prepare(`
        SELECT id FROM cities WHERE LOWER(wallet_address) = ? ORDER BY id ASC LIMIT 1
      `).bind(walletAddress.toLowerCase()).first();

      if (!firstCity) {
        return success(c, {
          hasCity: false,
          message: 'No city found, please create one'
        });
      }
      selectedCityId = firstCity.id;
    }

    // 获取城市详情
    const city: any = await db.prepare(`
      SELECT * FROM cities WHERE id = ?
    `).bind(selectedCityId).first();

    if (!city) {
      return error(c, 'City not found');
    }

    const buildings = await db.prepare(`
      SELECT * FROM buildings WHERE city_id = ?
    `).bind(selectedCityId).all();

    const heroes = await db.prepare(`
      SELECT * FROM heroes WHERE city_id = ? AND state = 0
    `).bind(selectedCityId).all();

    return success(c, {
      city: {
        id: city.id,
        name: city.name,
        position: city.position,
        prosperity: city.prosperity,
        money: city.money,
        food: city.food,
        population: city.population,
        moneyRate: city.money_rate,
        foodRate: city.food_rate,
        lastCollect: city.last_collect,
      },
      buildings: (buildings as any).results || [],
      heroes: (heroes as any).results || [],
      buildingCount: (buildings as any).results?.length || 0,
      heroCount: (heroes as any).results?.length || 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
}

async function handleBuildingList(c: any) {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  let cityIdParam = c.req.param('id');
  let cityId: number | null = null;
  
  if (cityIdParam) {
    cityId = parseInt(cityIdParam);
  }
  
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let selectedCityId: number | null = null;

    // 如果传递了 cityId，检查是否属于用户
    if (cityId && !isNaN(cityId)) {
      const city: any = await db.prepare(`
        SELECT id FROM cities WHERE id = ? AND LOWER(wallet_address) = ?
      `).bind(cityId, walletAddress.toLowerCase()).first();

      if (city) {
        selectedCityId = cityId;
      }
    }

    // 自动获取用户的第一个城市
    if (!selectedCityId) {
      const firstCity: any = await db.prepare(`
        SELECT id FROM cities WHERE LOWER(wallet_address) = ? ORDER BY id ASC LIMIT 1
      `).bind(walletAddress.toLowerCase()).first();

      if (!firstCity) {
        return success(c, {
          hasCity: false,
          message: 'No city found'
        });
      }
      selectedCityId = firstCity.id;
    }

    const buildings = await db.prepare(`
      SELECT * FROM buildings WHERE city_id = ? ORDER BY position
    `).bind(selectedCityId).all();

    return success(c, {
      cityId: selectedCityId,
      buildings: (buildings as any).results || [],
      count: (buildings as any).results?.length || 0
    });
  } catch (err: any) {
    return error(c, err.message);
  }
}

export default app;
