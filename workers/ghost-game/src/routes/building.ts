/**
 * 建筑路由 - 完整版 (使用 src/config/buildings.json)
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import buildingConfigs from '../config/buildings.json';
import { formatDuration } from '../config/game-config';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 建筑类型映射
const BUILDING_TYPES = {
  INTERIOR: 'interior',
  DEFENSE: 'defense',
};

// 获取城市建筑列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'No city found', 404);

    const buildings = await db.prepare(`
      SELECT * FROM buildings WHERE city_id = ? ORDER BY position
    `).bind(city.id).all();

    // 补充建筑配置信息
    const buildingsWithConfig = (buildings.results || []).map((building: any) => {
      const config = getBuildingConfig(building.type, building.config_id);
      
      if (config) {
        const levelData = getBuildingLevelData(config, building.level);
        return {
          ...building,
          name: config.Name || config.name,
          icon: levelData?.Icon || config.Icon || '',
          image: levelData?.Image || config.Image || '',
          maxLevel: config.InteriorData?.length || 10,
          type: building.type,
          levelData,
          effect: {
            type: levelData?.EffType || config.EffType,
            value: levelData?.EffValue || config.EffValue,
          },
          upgradeCost: {
            money: levelData?.CostMoney || 0,
            food: levelData?.CostFood || 0,
            men: levelData?.CostMen || 0,
            area: levelData?.CostArea || 0,
            time: levelData?.CostTime || 0,
          },
        };
      }
      return building;
    });

    return success(c, {
      city,
      buildings: buildingsWithConfig,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取特定城市建筑列表
app.get('/city/:cityId', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const cityId = parseInt(c.req.param('cityId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT * FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(cityId, walletAddress).first();

    if (!city) return error(c, 'City not found or not owned', 404);

    const buildings = await db.prepare(`
      SELECT * FROM buildings WHERE city_id = ? ORDER BY position
    `).bind(cityId).all();

    return success(c, {
      city,
      buildings: buildings.results || [],
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取可建造建筑列表
app.get('/available/:cityId', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const cityId = parseInt(c.req.param('cityId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT * FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(cityId, walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    const existingBuildings = await db.prepare(`
      SELECT config_id FROM buildings WHERE city_id = ?
    `).bind(cityId).all();

    const builtIds = new Set((existingBuildings.results || []).map((b: any) => b.config_id));

    // 从原始配置获取可建造建筑
    const interiorBuildings = (buildingConfigs.InteriorBuilding || []).filter(
      (b: any) => !builtIds.has(b.ID)
    );
    const defenseBuildings = (buildingConfigs.DefenceBuilding || []).filter(
      (b: any) => !builtIds.has(b.ID)
    );

    return success(c, {
      cityId,
      interiorBuildings: interiorBuildings.map((b: any) => ({
        id: b.ID,
        name: b.Name,
        type: 'interior',
        icon: b.InteriorData?.[0]?.Icon || '',
        maxLevel: b.InteriorData?.length || 10,
        description: b.Des || '',
        baseCost: {
          money: b.InteriorData?.[0]?.CostMoney || 0,
          food: b.InteriorData?.[0]?.CostFood || 0,
          men: b.InteriorData?.[0]?.CostMen || 0,
        },
      })),
      defenseBuildings: defenseBuildings.map((b: any) => ({
        id: b.ID,
        name: b.Name,
        type: 'defense',
        icon: b.DefenseData?.[0]?.Icon || '',
        maxLevel: b.DefenseData?.length || 10,
        description: b.Des || '',
        baseCost: {
          money: b.DefenseData?.[0]?.CostMoney || 0,
          food: b.DefenseData?.[0]?.CostFood || 0,
          men: b.DefenseData?.[0]?.CostMen || 0,
        },
      })),
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 建造建筑
app.post('/build', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, config_id, position } = await c.req.json();
  
  if (!city_id || !config_id) {
    return error(c, 'Missing required fields: city_id, config_id');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city: any = await db.prepare(`
      SELECT * FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(city_id, walletAddress).first();

    if (!city) return error(c, 'City not found or not owned', 404);

    const config = getBuildingConfigById(config_id);
    if (!config) return error(c, 'Invalid building config_id');

    const level1Data = getBuildingLevelData(config, 1);
    const baseCost = {
      money: level1Data?.CostMoney || 100,
      food: level1Data?.CostFood || 100,
      men: level1Data?.CostMen || 10,
    };

    // 检查资源
    if (city.money < baseCost.money || city.food < baseCost.food || city.population < baseCost.men) {
      return error(c, 'Not enough resources');
    }

    // 检查位置
    if (position !== undefined) {
      const existing = await db.prepare(`
        SELECT id FROM buildings WHERE city_id = ? AND position = ?
      `).bind(city_id, position).first();

      if (existing) return error(c, 'Position already occupied');
    }

    // 扣除资源
    await db.prepare(`
      UPDATE cities SET money = money - ?, food = food - ?, population = population - ? WHERE id = ?
    `).bind(baseCost.money, baseCost.food, baseCost.men, city_id).run();

    // 创建建筑
    const result = await db.prepare(`
      INSERT INTO buildings (city_id, type, level, position, state, config_id)
      VALUES (?, 'interior', 1, ?, 0, ?)
    `).bind(city_id, position || 0, config_id).run();

    return success(c, {
      id: result.meta.last_row_id,
      cityId: city_id,
      configId: config_id,
      position: position || 0,
      level: 1,
      name: config.Name,
      icon: level1Data?.Icon || '',
      message: `${config.Name} 建造成功`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取建筑详情
app.get('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const buildingId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const building: any = await db.prepare(`
      SELECT b.*, c.wallet_address as owner
      FROM buildings b
      JOIN cities c ON b.city_id = c.id
      WHERE b.id = ?
    `).bind(buildingId).first();

    if (!building) return error(c, 'Building not found', 404);

    if (building.owner !== walletAddress) {
      return error(c, 'Not authorized', 403);
    }

    const config = getBuildingConfig(building.type, building.config_id);
    const currentLevelData = getBuildingLevelData(config, building.level);
    const nextLevelData = getBuildingLevelData(config, building.level + 1);

    return success(c, {
      ...building,
      name: config?.Name || config?.name,
      icon: currentLevelData?.Icon || config?.Icon || '',
      image: currentLevelData?.Image || config?.Image || '',
      maxLevel: config?.InteriorData?.length || config?.DefenseData?.length || 10,
      levelData: currentLevelData,
      nextLevelData,
      upgradeCost: nextLevelData ? {
        money: nextLevelData.CostMoney,
        food: nextLevelData.CostFood,
        men: nextLevelData.CostMen,
        area: nextLevelData.CostArea,
        time: nextLevelData.CostTime,
        timeFormatted: formatDuration(nextLevelData.CostTime),
      } : null,
      canUpgrade: !!nextLevelData,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 升级建筑
app.post('/:id/upgrade', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const buildingId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const building: any = await db.prepare(`
      SELECT b.*, c.money, c.food, c.population
      FROM buildings b
      JOIN cities c ON b.city_id = c.id
      WHERE b.id = ?
    `).bind(buildingId).first();

    if (!building) return error(c, 'Building not found', 404);

    if (building.owner !== walletAddress) {
      return error(c, 'Not authorized', 403);
    }

    const config = getBuildingConfig(building.type, building.config_id);
    const nextLevelData = getBuildingLevelData(config, building.level + 1);

    if (!nextLevelData) {
      return error(c, 'Building already at max level');
    }

    // 验证资源
    if (building.money < nextLevelData.CostMoney || 
        building.food < nextLevelData.CostFood || 
        building.population < nextLevelData.CostMen) {
      return error(c, 'Not enough resources for upgrade');
    }

    // 扣除资源并升级
    await db.prepare(`
      UPDATE cities SET 
        money = money - ?, 
        food = food - ?,
        population = population - ?
      WHERE id = ?
    `).bind(nextLevelData.CostMoney, nextLevelData.CostFood, nextLevelData.CostMen, building.city_id).run();

    await db.prepare(`
      UPDATE buildings SET level = level + 1 WHERE id = ?
    `).bind(buildingId).run();

    return success(c, {
      id: buildingId,
      previousLevel: building.level,
      newLevel: building.level + 1,
      cost: {
        money: nextLevelData.CostMoney,
        food: nextLevelData.CostFood,
        men: nextLevelData.CostMen,
      },
      time: formatDuration(nextLevelData.CostTime),
      message: `${config?.Name || '建筑'} 升级到 ${building.level + 1} 级`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 拆除建筑
app.delete('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const buildingId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const building: any = await db.prepare(`
      SELECT b.*, c.money, c.food
      FROM buildings b
      JOIN cities c ON b.city_id = c.id
      WHERE b.id = ?
    `).bind(buildingId).first();

    if (!building) return error(c, 'Building not found', 404);

    if (building.owner !== walletAddress) {
      return error(c, 'Not authorized', 403);
    }

    const config = getBuildingConfig(building.type, building.config_id);

    // 返还 50% 资源
    const refundRate = 0.5;
    const refundMoney = Math.floor(building.level * 50 * refundRate);
    const refundFood = Math.floor(building.level * 30 * refundRate);

    await db.prepare(`
      UPDATE cities SET money = money + ?, food = food + ? WHERE id = ?
    `).bind(refundMoney, refundFood, building.city_id).run();

    await db.prepare(`DELETE FROM buildings WHERE id = ?`).bind(buildingId).run();

    return success(c, {
      id: buildingId,
      name: config?.Name || '建筑',
      refund: { money: refundMoney, food: refundFood },
      message: `${config?.Name || '建筑'} 已拆除`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取所有建筑配置
app.get('/config/list', async (c) => {
  return success(c, {
    interiorBuildings: (buildingConfigs.InteriorBuilding || []).map((b: any) => ({
      id: b.ID,
      name: b.Name,
      type: 'interior',
      description: b.Des || '',
      maxLevel: b.InteriorData?.length || 10,
    })),
    defenseBuildings: (buildingConfigs.DefenceBuilding || []).map((b: any) => ({
      id: b.ID,
      name: b.Name,
      type: 'defense',
      description: b.Des || '',
      maxLevel: b.DefenseData?.length || 10,
    })),
  });
});

// 辅助函数：根据类型和ID获取建筑配置
function getBuildingConfig(type: string, configId: number): any {
  if (type === 'defense' || configId > 100) {
    return (buildingConfigs.DefenceBuilding || []).find((b: any) => b.ID === configId);
  }
  return (buildingConfigs.InteriorBuilding || []).find((b: any) => b.ID === configId);
}

function getBuildingConfigById(configId: number): any {
  return (
    (buildingConfigs.InteriorBuilding || []).find((b: any) => b.ID === configId) ||
    (buildingConfigs.DefenceBuilding || []).find((b: any) => b.ID === configId)
  );
}

function getBuildingLevelData(config: any, level: number): any {
  if (!config) return null;
  const dataKey = config.InteriorData ? 'InteriorData' : 'DefenseData';
  const dataArray = config[dataKey] || [];
  return dataArray[level - 1] || null;
}

export default app;
