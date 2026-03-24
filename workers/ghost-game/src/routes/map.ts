/**
 * 地图系统路由
 * 支持：地图数据、世界探索、NPC位置、地图移动
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import worldNpcs from '../config/world_npcs.json';
import landforms from '../config/landforms.json';
import buildingConfigs from '../config/buildings.json';

// 类型定义
interface WorldNPC {
  Pos: number;
  Level: number;
  Name: string;
  PicIndex: number;
}

interface Landform {
  Pos: number;
  Type: number;
  PicIndex: number;
}

// 重新定义，避免类型冲突
const worldNpcsData = (worldNpcs as any).CityInfo || [];
const landformsData = (landforms as any).Unit || [];

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 地图大小配置
const MAP_CONFIG = {
  WIDTH: 400,      // 地图宽度
  HEIGHT: 400,     // 地图高度
  WORLD_SIZE: 160000, // 世界大小
};

// 地形类型
const TERRAIN_TYPES = {
  PLAIN: 1,        // 平原
  MOUNTAIN: 2,     // 山地
  WATER: 3,        // 水域
  FOREST: 4,       // 森林
  DESERT: 5,       // 沙漠
};

// 获取地图配置
app.get('/config', async (c) => {
  return success(c, {
    // C# 字段 (驼峰)
    Width: MAP_CONFIG.WIDTH,
    Height: MAP_CONFIG.HEIGHT,
    // 兼容字段
    width: MAP_CONFIG.WIDTH,
    height: MAP_CONFIG.HEIGHT,
    worldSize: MAP_CONFIG.WORLD_SIZE,
    terrainTypes: TERRAIN_TYPES,
  });
});

// 根路径 - 获取地图概览
app.get('/', async (c) => {
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取地图基本信息和世界数据
    const npcs = (worldNpcsData || []).map((npc: any) => ({
      pos: npc.Pos,
      level: npc.Level,
      name: npc.Name,
      picIndex: npc.PicIndex,
    }));

    const terrains = (landformsData || []).map((t: any) => ({
      pos: t.Pos,
      type: t.Type,
      picIndex: t.PicIndex,
    }));

    return success(c, {
      config: {
        Width: MAP_CONFIG.WIDTH,
        Height: MAP_CONFIG.HEIGHT,
        worldSize: MAP_CONFIG.WORLD_SIZE,
        terrainTypes: TERRAIN_TYPES,
        // 兼容小写字段
        width: MAP_CONFIG.WIDTH,
        height: MAP_CONFIG.HEIGHT,
      },
      npcs: npcs,
      terrains: terrains,
      myPos: 0,
      message: '地图数据加载成功',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取玩家位置
app.get('/position', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city: any = await db.prepare(`
      SELECT position, name FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'No city found');

    return success(c, {
      position: city.position,
      name: city.name,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取指定区域地图数据
app.get('/area/:x/:y', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const x = parseInt(c.req.param('x'));
  const y = parseInt(c.req.param('y'));
  const radius = parseInt(c.req.query('radius')) || 5;

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取范围内的城市
    const cities = await db.prepare(`
      SELECT c.*, ch.name as character_name
      FROM cities c
      LEFT JOIN characters ch ON c.wallet_address = ch.wallet_address
      WHERE c.position >= ? AND c.position <= ?
    `).bind(
      y * 400 + Math.max(1, x - radius),
      y * 400 + Math.min(400, x + radius)
    ).all();

    // 获取范围内的NPC
    const npcs = (worldNpcsData).filter((npc: any) => {
      const pos = npc.Pos || npc.pos || 0;
      const npcX = pos % 400;
      const npcY = Math.floor(pos / 400);
      return Math.abs(npcX - x) <= radius && Math.abs(npcY - y) <= radius;
    });

    // 获取地形数据
    const terrains = (landformsData).filter((l: any) => {
      const pos = l.Pos || l.pos || 0;
      const lx = pos % 400;
      const ly = Math.floor(pos / 400);
      return Math.abs(lx - x) <= radius && Math.abs(ly - y) <= radius;
    });

    return success(c, {
      center: { x, y },
      radius,
      cities: (cities.results || []).map(c => ({
        id: c.id,
        position: c.position,
        name: c.name,
        owner: c.character_name,
        type: 'city',
      })),
      npcs: npcs.map(n => ({
        position: n.Pos || n.pos,
        name: n.Name || n.name,
        level: n.Level || n.level,
        type: 'npc',
      })),
      terrains,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取指定位置详情
app.get('/position/:pos', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const pos = parseInt(c.req.param('pos'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 检查是否城市
    const city: any = await db.prepare(`
      SELECT c.*, ch.name as owner_name, ch.level as owner_level
      FROM cities c
      LEFT JOIN characters ch ON c.wallet_address = ch.wallet_address
      WHERE c.position = ?
    `).bind(pos).first();

    if (city) {
      return success(c, {
        position: pos,
        type: 'city',
        name: city.name,
        owner: city.owner_name,
        ownerLevel: city.owner_level,
        prosperity: city.prosperity,
      });
    }

    // 检查是否NPC
    const npc = (worldNpcsData).find(n => (n.Pos || n.pos) === pos);
    if (npc) {
      return success(c, {
        position: pos,
        type: 'npc',
        name: npc.Name || npc.name,
        level: npc.Level || npc.level,
        portraitIndex: npc.PicIndex || npc.picIndex,
      });
    }

    // 地形
    const terrain = (landformsData).find(l => (l.Pos || l.pos) === pos);
    if (terrain) {
      return success(c, {
        position: pos,
        type: 'terrain',
        terrainType: terrain.Type || terrain.type,
        picIndex: terrain.PicIndex || terrain.picIndex,
      });
    }

    return success(c, {
      position: pos,
      type: 'empty',
      message: 'Empty tile',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 探索地图
app.post('/explore', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { targetPosition, useGold } = await c.req.json();
  if (!targetPosition) return error(c, 'Missing targetPosition');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city: any = await db.prepare(`
      SELECT c.*, ch.gold 
      FROM cities c
      LEFT JOIN characters ch ON c.wallet_address = ch.wallet_address
      WHERE c.wallet_address = ? ORDER BY c.id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'No city found');

    const currentPos = city.position;
    const distance = Math.abs(targetPosition - currentPos);

    // 检查距离
    if (distance > 50) {
      return error(c, 'Target too far');
    }

    // 检查资源
    if (distance > 20) {
      const costGold = 10;
      if ((city.gold || 0) < costGold) {
        return error(c, `Need ${costGold} gold to explore this far`);
      }
    }

    // 检查是否已有城市
    const existingCity: any = await db.prepare(`
      SELECT id FROM cities WHERE position = ?
    `).bind(targetPosition).first();

    if (existingCity) {
      return error(c, 'Position already occupied');
    }

    // 探索成功，创建记录
    const explored: any = await db.prepare(`
      SELECT * FROM map_explored WHERE wallet_address = ? AND position = ?
    `).bind(walletAddress, targetPosition).first();

    if (!explored) {
      await db.prepare(`
        INSERT INTO map_explored (wallet_address, position, explored_at)
        VALUES (?, ?, datetime('now'))
      `).bind(walletAddress, targetPosition).run();

      // 消耗金条
      if (distance > 20) {
        await db.prepare(`
          UPDATE characters SET gold = gold - 10 WHERE wallet_address = ?
        `).bind(walletAddress).run();
      }
    }

    // 获取地形
    const terrain = (landformsData).find(l => (l.Pos || l.pos) === targetPosition);

    return success(c, {
      position: targetPosition,
      distance,
      explored: true,
      terrain: terrain || { type: 1 },
      message: `探索成功，距离 ${distance}`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取已探索区域
app.get('/explored', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const explored = await db.prepare(`
      SELECT position, explored_at FROM map_explored 
      WHERE wallet_address = ?
      ORDER BY explored_at DESC
    `).bind(walletAddress).all();

    return success(c, {
      positions: (explored.results || []).map((e: any) => e.position),
      total: explored.results?.length || 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 移动到指定位置
app.post('/move', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { targetPosition } = await c.req.json();
  if (!targetPosition) return error(c, 'Missing targetPosition');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city: any = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'No city found');

    const currentPos = city.position;
    const distance = Math.abs(targetPosition - currentPos);
    const travelTime = distance * 2; // 2秒/格

    // 检查目标位置
    const targetCity: any = await db.prepare(`
      SELECT id FROM cities WHERE position = ?
    `).bind(targetPosition).first();

    if (targetCity) {
      return error(c, 'Position occupied');
    }

    // 开始移动
    const arriveTime = new Date(Date.now() + travelTime * 1000).toISOString();

    await db.prepare(`
      INSERT INTO city_movements (wallet_address, city_id, from_position, to_position, start_time, arrive_time)
      VALUES (?, ?, ?, ?, datetime('now'), ?)
    `).bind(walletAddress, city.id, currentPos, targetPosition, arriveTime).run();

    return success(c, {
      from: currentPos,
      to: targetPosition,
      distance,
      travelTime,
      arriveTime,
      message: `移动中，预计 ${travelTime} 秒到达`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取移动状态
app.get('/movement/status', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const movement: any = await db.prepare(`
      SELECT * FROM city_movements 
      WHERE wallet_address = ? AND arrive_time > datetime('now')
      ORDER BY start_time DESC LIMIT 1
    `).bind(walletAddress).first();

    if (!movement) {
      return success(c, { moving: false });
    }

    const now = new Date();
    const arriveTime = new Date(movement.arrive_time);
    const remainingSeconds = Math.max(0, Math.floor((arriveTime.getTime() - now.getTime()) / 1000));

    return success(c, {
      moving: true,
      from: movement.from_position,
      to: movement.to_position,
      startTime: movement.start_time,
      arriveTime: movement.arrive_time,
      remainingSeconds,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 取消移动
app.post('/movement/cancel', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const movement: any = await db.prepare(`
      SELECT * FROM city_movements 
      WHERE wallet_address = ? AND arrive_time > datetime('now')
      ORDER BY start_time DESC LIMIT 1
    `).bind(walletAddress).first();

    if (!movement) return error(c, 'No active movement');

    // 删除移动记录
    await db.prepare(`
      DELETE FROM city_movements WHERE id = ?
    `).bind(movement.id).run();

    return success(c, { message: 'Movement cancelled' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取NPC列表
app.get('/npcs', async (c) => {
  const { level } = c.req.query();
  
  let npcs = (worldNpcsData);
  
  if (level) {
    const lvl = parseInt(level);
    npcs = npcs.filter((npc: any) => (npc.Level || npc.level) === lvl);
  }

  return success(c, {
    npcs: npcs.map(n => ({
      position: n.Pos || n.pos,
      name: n.Name || n.name,
      level: n.Level || n.level,
      portraitIndex: n.PicIndex || n.picIndex,
    })),
    total: npcs.length,
  });
});


// GetMapUnitInfo - GET /map/unit
// C# 签名: public MapUnitInfo[] GetMapUnitInfo(int cityID, int unitType, int pos)
// 返回: MapUnitInfo[] (数组)
// unitType: 1=内政, 2=城防, 3=大地图
app.get('/unit', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, map_type, pos } = c.req.query();
  const cityId = parseInt(city_id || '1');
  const unitType = parseInt(map_type || '1');
  const position = parseInt(pos || '0');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let mapUnits: any[] = [];

    if (unitType === 1) {
      // 内政地图: 只返回内政建筑 (type = 'interior')
      const buildings = await db.prepare(`
        SELECT * FROM buildings WHERE city_id = ? AND type = 'interior' ORDER BY position
      `).bind(cityId).all();

      mapUnits = (buildings.results || []).map((b: any) => {
        // 根据建筑类型获取配置 (interior 或 defense)
        const buildingType = b.type || 'interior';
        const config = getBuildingConfig(buildingType, b.config_id);
        const levelData = getBuildingLevelData(config, b.level);
        
        // 从配置文件读取路径 (配置文件中的路径已经是大写 .GIF)
        // 直接使用配置文件中的路径，不做任何转换
        const image = levelData?.Image || config?.Image || '';
        const icon = levelData?.Icon || config?.Icon || '';
        
        return {
          ID: b.id,
          Type: 1,  // 建筑类型
          EventID: 0,
          Name: config?.Name || '建筑',
          Level: b.level,
          Pos: b.position,
          Image: image,
          Icon: icon,
          Index: b.config_id,
          State: b.state,
          AttackCount: 0,
          UniteCount: 0,
          SubLevel: 0,
          UserName: walletAddress,
          ImageArray: [],
          StateFlag: [],
          Quality: 1,
          CityName: '',
          ArriveTime: '',
          DefeceFlag: 0,
          JuntaName: '',
          JuntaState: 0,
          LevelDifferenceFlag: 0,
          ImageIndex: 0,
          NpcFloor: 0,
          NpcFloorMax: 0,
          NpcFloorJunta: 0,
          EspecialType: 0,
          StartTime: '',
          EndTime: '',
          IsAppendantNPC: 0,
          AppendantNPCSingle: null,
          IsLord: 0,
          OccupationInfo: null,
          LordEndTime: '',
        };
      });
    } else if (unitType === 2) {
      // 城防地图: 返回城防建筑和驻守武将
      const defenseBuildings = await db.prepare(`
        SELECT * FROM buildings WHERE city_id = ? AND type = 'defense' ORDER BY position
      `).bind(cityId).all();

      const defenseHeroes = await db.prepare(`
        SELECT * FROM heroes WHERE city_id = ? AND state = 2 ORDER BY id
      `).bind(cityId).all();

      // 建筑单元
      mapUnits = (defenseBuildings.results || []).map((b: any) => ({
        ID: b.id,
        Type: 1,
        Name: '城防建筑',
        Level: b.level,
        Pos: b.position || 0,
        Index: b.config_id,
        State: b.state,
        // ... 其他字段
      }));

      // 武将单元
      const heroUnits = (defenseHeroes.results || []).map((h: any) => ({
        ID: h.id,
        Type: 2,  // 武将类型
        Name: h.name,
        Level: h.level,
        Pos: h.position || 0,  // 使用 position 字段而不是 defence_pos
        Index: h.id,
        State: h.state,
        Quality: h.quality || 1,
        // ... 其他字段
      }));

      mapUnits = [...mapUnits, ...heroUnits];
    } else if (unitType === 3) {
      // 大地图: 返回周围城市和NPC
      // 查询附近的城市
      const nearbyCities = await db.prepare(`
        SELECT c.*, ci.pos 
        FROM cities c
        JOIN city_interior ci ON c.id = ci.city_id
        WHERE ci.pos >= ? AND ci.pos < ? AND c.wallet_address != ?
        ORDER BY ci.pos
        LIMIT 20
      `).bind(position, position + 100, walletAddress).all();

      mapUnits = (nearbyCities.results || []).map((city: any) => ({
        ID: city.id,
        Type: 3, // 城市类型
        Name: city.name,
        Level: city.level,
        Pos: city.pos,
        Index: city.id,
        State: 0,
        UserName: city.wallet_address,
        Quality: city.vip_level || 0,
        CityName: city.name,
        Image: '',
        Icon: '',
        AttackCount: 0,
        UniteCount: 0,
        SubLevel: 0,
        ImageArray: [],
        StateFlag: [],
        ArriveTime: '',
        DefeceFlag: 0,
        JuntaName: '',
        JuntaState: 0,
        LevelDifferenceFlag: 0,
        ImageIndex: 0,
        NpcFloor: 0,
        NpcFloorMax: 0,
        NpcFloorJunta: 0,
        EspecialType: 0,
        StartTime: '',
        EndTime: '',
        IsAppendantNPC: 0,
        AppendantNPCSingle: null,
        IsLord: 0,
        OccupationInfo: null,
        LordEndTime: '',
      }));
    }

    // 如果没有数据，返回特殊标记 (C# 约定)
    if (mapUnits.length === 0) {
      return success(c, [{ ID: -1 }]);
    }

    return success(c, mapUnits);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 辅助函数: 获取建筑配置
function getBuildingConfig(type: string, configId: number): any {
  const configs = type === 'interior' 
    ? (buildingConfigs as any).InteriorBuilding 
    : (buildingConfigs as any).DefenseBuilding;
  
  if (!configs) return null;
  return configs.find((b: any) => b.ID === configId) || null;
}

// 辅助函数: 获取建筑等级数据
function getBuildingLevelData(config: any, level: number): any {
  if (!config) return null;
  const dataKey = config.InteriorData ? 'InteriorData' : 'DefenseData';
  const dataArray = config[dataKey] || [];
  return dataArray[level - 1] || null;
}

// GetWorldLandform - GET /map/world/landform 获取世界地图地形
app.get('/world/landform', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const { city_id, pos = '0' } = c.req.query();
  const position = parseInt(pos as string) || 0;

  const db = c.env.DB;
  if (!db) return c.json({ success: false, error: 'Database not configured' }, 503);

  try {
    // 获取玩家城市的位置
    const myCity: any = await db.prepare(`
      SELECT ci.pos, c.name, c.level
      FROM cities c
      JOIN city_interior ci ON c.id = ci.city_id
      WHERE c.wallet_address = ?
      ORDER BY c.id ASC LIMIT 1
    `).bind(walletAddress).first();

    const myPos = myCity?.pos || 0;

    // 获取所有城市的位置信息
    const cities = await db.prepare(`
      SELECT ci.pos, c.name, c.level, c.wallet_address
      FROM cities c
      JOIN city_interior ci ON c.id = ci.city_id
    `).all();

    const cityMap = new Map();
    (cities.results || []).forEach((city: any) => {
      cityMap.set(city.pos, city);
    });

    // 生成地形数据
    const landforms = [];
    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < 9; x++) {
        const posIndex = y * 9 + x;
        const cityInfo = cityMap.get(posIndex);

        if (cityInfo) {
          landforms.push({
            X: x, Y: y, Pos: posIndex,
            Type: 'city',
            Name: cityInfo.name,
            Level: cityInfo.level,
            Owner: cityInfo.wallet_address,
            // 兼容小写字段
            x, y, pos: posIndex, type: 'city', name: cityInfo.name, level: cityInfo.level, owner: cityInfo.wallet_address,
          });
        } else {
          landforms.push({
            X: x, Y: y, Pos: posIndex,
            Type: posIndex < 50 ? 'npc_city' : 'wild',
            Name: posIndex < 50 ? `NPC ${posIndex}` : `荒野${posIndex}`,
            Level: 1,
            Owner: null,
            // 兼容小写字段
            x, y, pos: posIndex, type: posIndex < 50 ? 'npc_city' : 'wild',
            name: posIndex < 50 ? `NPC ${posIndex}` : `荒野${posIndex}`, level: 1, owner: null,
          });
        }
      }
    }

    return success(c, {
      landforms,
      size: { Width: 9, Height: 9, width: 9, height: 9 },
      myPos,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// GetWorldPosState - GET /map/world/pos-state 获取指定位置的状态
app.get('/world/pos-state', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const { city_id, pos = '0' } = c.req.query();
  const position = parseInt(pos as string) || 0;

  const db = c.env.DB;
  if (!db) return c.json({ success: false, error: 'Database not configured' }, 503);

  try {
    // 查询该位置的详细信息
    const city: any = await db.prepare(`
      SELECT c.*, ci.pos as city_pos
      FROM cities c
      JOIN city_interior ci ON c.id = ci.city_id
      WHERE ci.pos = ?
    `).bind(position).first();

    if (!city) {
      // NPC区域
      return c.json({
        success: true,
        data: {
          pos: position,
          type: position < 100 ? 'npc_city' : 'wild',
          owner: null,
          name: `城池${position}`,
          level: 1,
          prosperity: 0,
          isProtected: false,
          canAttack: position >= 50,
        }
      });
    }

    // 判断是否是自己的城市
    const isMyCity = city.wallet_address === walletAddress;

    return c.json({
      success: true,
      data: {
        pos: position,
        type: 'player_city',
        owner: city.wallet_address,
        name: city.name,
        level: city.level,
        prosperity: city.prosperity || 0,
        isProtected: isMyCity && position < 10,
        canAttack: !isMyCity && position >= 50,
        population: city.population,
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// GetCityNameByPos - GET /map/city-name 根据位置获取城市名称
app.get('/city-name', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { pos } = c.req.query();
  if (!pos) return error(c, 'pos is required');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 查询该位置的城市信息
    const city: any = await db.prepare(`
      SELECT c.*, ci.pos as city_pos
      FROM cities c
      JOIN city_interior ci ON c.id = ci.city_id
      WHERE ci.pos = ?
    `).bind(parseInt(pos)).first();

    if (!city) {
      return success(c, { name: null, pos: parseInt(pos), isNPC: true });
    }

    return success(c, {
      name: city.name,
      pos: parseInt(pos),
      isNPC: false,
      owner: city.wallet_address,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetMapInfoByPos - GET /map/info-by-pos 根据位置获取地图信息
app.get('/info-by-pos', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { pos } = c.req.query();
  if (!pos) return error(c, 'pos is required');

  const position = parseInt(pos);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 查询该位置的详细信息
    const city: any = await db.prepare(`
      SELECT c.*, ci.pos as city_pos
      FROM cities c
      JOIN city_interior ci ON c.id = ci.city_id
      WHERE ci.pos = ?
    `).bind(position).first();

    if (!city) {
      // NPC区域
      return success(c, {
        pos: position,
        type: position < 100 ? 'npc_city' : 'wild',
        name: `地区${position}`,
        level: 1,
        owner: null,
      });
    }

    return success(c, {
      pos: position,
      type: 'player_city',
      name: city.name,
      level: city.level,
      owner: city.wallet_address,
      population: city.population,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
