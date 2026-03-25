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

    // 获取建筑配置数据
    const interiorConfigs = (buildingConfigs.InteriorBuilding || []);
    const defenceConfigs = (buildingConfigs.DefenceBuilding || []);

    // 格式化建筑信息
    const formattedBuildings = (buildings.results || []).map((b: any) => {
      // 从配置中查找
      const allConfigs = [...(interiorConfigs as any[]), ...(defenceConfigs as any[])];
      const config = allConfigs.find((c: any) => c.ID === b.config_id);
      const level = b.level || 1;
      const levelData = config?.InteriorData?.[level - 1] || config?.DefenceData?.[level - 1];
      const nextLevelData = config?.InteriorData?.[level] || config?.DefenceData?.[level];

      // 基础字段
      const base = {
        id: b.id, ID: b.id,
        cityId: b.city_id, CityID: b.city_id,
        type: b.type, BuildingType: b.type,
        level: level, Level: level,
        position: b.position, Position: b.position,
        state: b.state, State: b.state,
        configId: b.config_id, ConfigID: b.config_id,
        configName: config?.Name || '建筑' + b.config_id, Name: config?.Name || '建筑' + b.config_id,
        // Index 是前端期望的关键字段 (对应 TheBuildingInfo.Index)
        Index: b.config_id,
        // 升级消耗
        UpNeedMoney: nextLevelData?.CostMoney || levelData?.CostMoney || 1000,
        UpNeedFood: nextLevelData?.CostFood || levelData?.CostFood || 1000,
        UpNeedMen: nextLevelData?.CostMen || levelData?.CostMen || 100,
        UpNeedTime: nextLevelData?.CostTime || levelData?.CostTime || 60,
        // 效果
        EffectType: levelData?.EffType || 1,
        EffectValue: levelData?.EffValue || 10,
        // SnapSwitch: 立即建造开关 (来自当前等级配置)
        SnapSwitch: levelData?.SnapSwitch || 0,
        // EffectArray: 效果数组 (前端按索引访问)
        EffectArray: (levelData?.EffectArray || []).map((e: any) => ({
          EffID: e.EffID || levelData?.EffType || config?.EffType || 1,
          EffValue: e.EffValue || levelData?.EffValue || config?.EffValue || 0,
        })),
        // TradeRes: 资源交易信息 (市场类建筑 types 5/6/7)
        TradeRes: {
          LevelMoney: config?.ID === 7 ? (levelData?.LevelMoney || level) : 0,
          MoneyPer: config?.ID === 7 ? (levelData?.MoneyPer || 0) : 0,
          LevelFood: config?.ID === 6 ? (levelData?.LevelFood || level) : 0,
          FoodPer: config?.ID === 6 ? (levelData?.FoodPer || 0) : 0,
          LevelMen: config?.ID === 5 ? (levelData?.LevelMen || level) : 0,
          MenPer: config?.ID === 5 ? (levelData?.MenPer || 0) : 0,
        },
        CreateTime: b.created_at, UpdateTime: b.updated_at || b.created_at,
      };
      return base;
    });

    return success(c, {
      city,
      buildings: formattedBuildings,
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

    // 检查是否已经有相同类型的建筑（同一个 config_id 只能有一个）
    const duplicate = await db.prepare(`
      SELECT id FROM buildings WHERE city_id = ? AND config_id = ?
    `).bind(city_id, config_id).first();

    if (duplicate) return error(c, '该建筑已存在，不能重复建造');

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

// GetBuildingByID - GET /building/by-id
// C#: public BuildingInfo GetBuildingByID(int cityID, int buildingType, int buildingID)
// 返回 BuildingInfo (单个对象，不包装)
app.get('/by-id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, map_type, building_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    if (!building_id) {
      // C# 约定: ID=-1 表示空
      return success(c, { ID: -1 });
    }

    // 查找建筑
    const bid = parseInt(building_id as string);
    const building: any = await db.prepare(
      `SELECT * FROM buildings WHERE id = ?`
    ).bind(bid).first();

    if (!building) {
      return success(c, { ID: -1 });
    }

    // 验证所有权
    if (building.wallet_address !== walletAddress) {
      return success(c, { ID: -1 });
    }

    // 如果提供了 city_id,验证建筑是否属于该城市
    if (city_id && building.city_id !== parseInt(city_id)) {
      return success(c, { ID: -1 });
    }

    // 获取城市信息 (用于 AppSettings 常量)
    const city: any = await db.prepare(
      `SELECT * FROM cities WHERE id = ?`
    ).bind(building.city_id).first();

    // 获取城市内政信息 (建筑等级数组、科技等级数组)
    const buildings: any = await db.prepare(
      `SELECT * FROM buildings WHERE city_id = ? AND type = 'interior'`
    ).bind(building.city_id).all();

    // 构建 InteriorBuildingLevel 数组 (长度 22, 索引 = config_id - 1)
    const interiorBuildingLevel = new Array(22).fill(0);
    (buildings.results || []).forEach((b: any) => {
      if (b.config_id && b.config_id >= 1 && b.config_id <= 22) {
        interiorBuildingLevel[b.config_id - 1] = b.level || 0;
      }
    });

    // 获取科技等级
    const technics: any = await db.prepare(
      `SELECT technic_id, technic_level FROM technics WHERE wallet_address = ?`
    ).bind(walletAddress).all();
    const technicLevel = new Array(22).fill(0);
    (technics.results || []).forEach((t: any) => {
      if (t.technic_id && t.technic_id >= 1 && t.technic_id <= 22) {
        technicLevel[t.technic_id - 1] = t.technic_level || 0;
      }
    });

    // ========== AppSettings 常量 (来自 C# ConfigurationManager.AppSettings) ==========
    const APP_SETTINGS = {
      MenRoom: 1000,                          // 人口上限
      FoodRoom: 1000000,                     // 粮食上限
      MoneyRoom: 1000000,                    // 铜钱上限
      MenSpeed: 100,                          // 人口增长速度
      FoodSpeed: (city as any)?.food_rate || 100,  // 粮食生产速度
      MoneySpeed: (city as any)?.money_rate || 100, // 铜钱生产速度
      EventTimePercent: 100,                  // 事件时间百分比
      DegradeNeedResPercent: 50,              // 拆除返还资源百分比
    };

    // 补充配置信息 (BuildingInfo 字段)
    const config = getBuildingConfig(building.type, building.config_id);
    const currentLevelData = getBuildingLevelData(config, building.level);
    const nextLevelData = getBuildingLevelData(config, building.level + 1);
    const prevLevelData = getBuildingLevelData(config, building.level - 1);

    const buildingIndex = building.config_id;

    // ========== 基础效果值 ==========
    let currentEff = currentLevelData?.EffValue || 0;
    let nextEff = nextLevelData?.EffValue || 0;
    let oldEff = building.level > 1 ? (prevLevelData?.EffValue || 0) : 0;

    // ========== 特殊建筑效果加成 (C# GetBuildingByID 逻辑) ==========
    // 市场(Index=7): MoneyRoom 常量加成 + TradeRes
    if (buildingIndex === 7) {
      currentEff += APP_SETTINGS.MoneyRoom;
      if (building.level > 1 && prevLevelData) oldEff += APP_SETTINGS.MoneyRoom;
      if (nextLevelData) nextEff += APP_SETTINGS.MoneyRoom;
    }
    // 校舍(Index=6): FoodRoom 常量加成 + TradeRes
    if (buildingIndex === 6) {
      currentEff += APP_SETTINGS.FoodRoom;
      if (building.level > 1 && prevLevelData) oldEff += APP_SETTINGS.FoodRoom;
      if (nextLevelData) nextEff += APP_SETTINGS.FoodRoom;
    }
    // 兵营(Index=5): MenRoom 常量加成 + TradeRes
    if (buildingIndex === 5) {
      currentEff += APP_SETTINGS.MenRoom;
      if (building.level > 1 && prevLevelData) oldEff += APP_SETTINGS.MenRoom;
      if (nextLevelData) nextEff += APP_SETTINGS.MenRoom;
    }
    // 城墙(Index=2): MenSpeed 常量加成
    if (buildingIndex === 2) {
      currentEff += APP_SETTINGS.MenSpeed;
      if (building.level > 1 && prevLevelData) oldEff += APP_SETTINGS.MenSpeed;
      if (nextLevelData) nextEff += APP_SETTINGS.MenSpeed;
    }
    // 农场(Index=3): FoodSpeed 常量加成
    if (buildingIndex === 3) {
      currentEff += APP_SETTINGS.FoodSpeed;
      if (building.level > 1 && prevLevelData) oldEff += APP_SETTINGS.FoodSpeed;
      if (nextLevelData) nextEff += APP_SETTINGS.FoodSpeed;
    }
    // 钱庄(Index=4): MoneySpeed 常量加成
    if (buildingIndex === 4) {
      currentEff += APP_SETTINGS.MoneySpeed;
      if (building.level > 1 && prevLevelData) oldEff += APP_SETTINGS.MoneySpeed;
      if (nextLevelData) nextEff += APP_SETTINGS.MoneySpeed;
    }

    // ========== EffID (效果ID) ==========
    const EffID = currentLevelData?.EffType || config?.EffType || 0;

    // ========== SnapSwitch / SnapGold (来自下一级配置) ==========
    const SnapSwitch = nextLevelData?.SnapSwitch ?? 0;
    const SnapGold = nextLevelData?.SnapGold ?? 0;

    // ========== 升级依赖条件检查 ==========
    const needBuildingID = nextLevelData?.NeedBuildingID || 0;
    const needBuildingLevel = nextLevelData?.NeedBuildingLevel || 0;
    const needTechnicID = nextLevelData?.NeedTechnicID || 0;
    const needTechnicLevel = nextLevelData?.NeedTechnicLevel || 0;

    // 建筑等级适配检查
    const isBuildFitLevel = (() => {
      if (!needBuildingID || needBuildingID < 1) return true;
      const requiredLevel = interiorBuildingLevel[needBuildingID - 1] || 0;
      return requiredLevel >= needBuildingLevel;
    })();

    // 科技等级适配检查
    const isTechnicFitLevel = (() => {
      if (!needTechnicID || needTechnicID < 1) return true;
      const requiredLevel = technicLevel[needTechnicID - 1] || 0;
      return requiredLevel >= needTechnicLevel;
    })();

    // 综合依赖条件 (建筑等级 + 科技等级同时满足)
    const isDependCondition = isBuildFitLevel && isTechnicFitLevel;

    // 依赖建筑名称
    let UpNeedBuildingName = '';
    if (needBuildingID > 0) {
      const depConfig = getBuildingConfig('interior', needBuildingID);
      UpNeedBuildingName = depConfig?.Name || '';
    }

    // 依赖科技名称
    let UpNeedTechnicName = '';
    if (needTechnicID > 0) {
      const technicConfig = (buildingConfigs as any)?.Technics?.find(
        (t: any) => t.ID === needTechnicID
      );
      UpNeedTechnicName = technicConfig?.Name || '';
    }

    // ========== TradeRes (市场/校舍/兵营: Index 5,6,7) ==========
    let TradeRes: any = null;
    if (buildingIndex === 5 || buildingIndex === 6 || buildingIndex === 7) {
      // 根据建筑类型计算 TradeRes
      const cityLevel = 1; // 默认城市等级，后续从 city 扩展字段获取
      if (buildingIndex === 7) {
        // 市场: 铜钱交易
        TradeRes = {
          LevelMoney: Math.max(0, APP_SETTINGS.MoneyRoom - 0),
          MoneyPer: 400 + Math.floor(cityLevel / 2) * 10,
          LevelFood: 0,
          FoodPer: 0,
          LevelMen: 0,
          MenPer: 0,
        };
      } else if (buildingIndex === 6) {
        // 校舍: 粮食交易
        TradeRes = {
          LevelMoney: 0,
          MoneyPer: 0,
          LevelFood: Math.max(0, APP_SETTINGS.FoodRoom - 0),
          FoodPer: 200 + Math.floor(cityLevel / 2) * 5,
          LevelMen: 0,
          MenPer: 0,
        };
      } else if (buildingIndex === 5) {
        // 兵营: 人口交易
        TradeRes = {
          LevelMoney: 0,
          MoneyPer: 0,
          LevelFood: 0,
          FoodPer: 0,
          LevelMen: Math.max(0, APP_SETTINGS.MenRoom - 0),
          MenPer: 66 + Math.floor(cityLevel / 2) * 2,
        };
      }
    }

    // ========== EffectArray (聚义厅 Index=1, 校场 Index=11-21) ==========
    let EffectArray: any[] = [];
    if (buildingIndex === 1 || (buildingIndex >= 11 && buildingIndex <= 21)) {
      // 从 persist_effects 表获取持续效果
      const persistEffects: any = await db.prepare(
        `SELECT * FROM persist_effects WHERE user_name = ? AND static_index = ? AND end_time > datetime('now')`
      ).bind(walletAddress, buildingIndex).all();

      EffectArray = (persistEffects.results || []).map((e: any) => ({
        StaticIndex: e.static_index,
        MainEffectType: e.main_effect_type,
        EffectType: e.effect_type,
        EffectID: e.effect_id,
        EffectName: '',  // 后续从配置获取
        State: 1,        // 1=激活
        Image: '',
        Gold: 0,
        Seconds: Math.floor((new Date(e.end_time).getTime() - Date.now()) / 1000),
        StartTime: e.start_time,
        EndTime: e.end_time,
        PersistEffectArray: [],  // 子效果数组
      }));
    }

    // ========== 拆除返还资源 ==========
    const DegradeNeedResPercent = APP_SETTINGS.DegradeNeedResPercent;
    const DownNeedFood = currentLevelData?.CostFood
      ? Math.floor(currentLevelData.CostFood * DegradeNeedResPercent / 100) : 0;
    const DownNeedMen = currentLevelData?.CostMen
      ? Math.floor(currentLevelData.CostMen * DegradeNeedResPercent / 100) : 0;
    const DownNeedMoney = currentLevelData?.CostMoney
      ? Math.floor(currentLevelData.CostMoney * DegradeNeedResPercent / 100) : 0;

    // C# BuildingInfo 字段 (驼峰命名)
    return success(c, {
      ID: building.id,
      Name: config?.Name || '',
      Level: building.level,
      Index: buildingIndex,
      State: building.state,
      Pos: building.position,
      Image: currentLevelData?.Image || config?.Image || '',
      Icon: currentLevelData?.Icon || config?.Icon || '',
      EventID: 0,
      Type: building.type === 'defense' ? 2 : 1,
      UserName: walletAddress,
      AttackCount: 0,
      UniteCount: 0,
      SubLevel: 0,
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
      IsLord: 0,
      ImageArray: [],
      StateFlag: [],
      // 附加数据
      MaxLevel: config?.InteriorData?.length || config?.DefenseData?.length || 10,
      LevelData: currentLevelData,
      NextLevelData: nextLevelData,
      CanUpgrade: !!nextLevelData,
      // 效果值 (已应用特殊建筑加成)
      EffID,
      CurrentEff: currentEff,
      NextEff: nextEff,
      OldEff: oldEff,
      // 立即建造
      SnapSwitch,
      SnapGold,
      // 升级依赖
      UpNeedBuildingID: needBuildingID,
      UpNeedBuildingLevel: needBuildingLevel,
      UpNeedTechnicID: needTechnicID,
      UpNeedTechnicLevel: needTechnicLevel,
      UpNeedBuildingName,
      UpNeedTechnicName,
      // 依赖条件检查
      isBuildFitLevel,
      isTechnicFitLevel,
      isDependCondition,
      // 拆除返还
      DownNeedFood,
      DownNeedMen,
      DownNeedMoney,
      DownReturnArea: currentLevelData?.CostArea || 0,
      Area: currentLevelData?.CostArea || 0,
      // 特殊建筑 TradeRes (市场/校舍/兵营)
      TradeRes,
      // 特殊建筑 EffectArray (聚义厅/校场)
      EffectArray,
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

// 获取建筑详情 (包含 /list 别名处理)
app.get('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const idParam = c.req.param('id');
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  // 特殊处理 /list 路径 (别名，防止被 :id 误匹配)
  if (idParam === 'list') {
    const { city_id, map_type } = c.req.query();
    
    if (!city_id) {
      return error(c, 'Missing city_id');
    }

    try {
      // 验证城市所有权
      const city = await db.prepare(`
        SELECT id FROM cities WHERE id = ? AND wallet_address = ?
      `).bind(parseInt(city_id), walletAddress).first();

      if (!city) {
        return error(c, 'City not found or not owned', 404);
      }

      // 返回该城市所有建筑
      const buildings: any = await db.prepare(`
        SELECT * FROM buildings WHERE city_id = ? ORDER BY position
      `).bind(parseInt(city_id)).all();

      const buildingList = (buildings.results || []).map((b: any) => {
        const config = (buildingConfigs.InteriorBuilding || []).find((cfg: any) => cfg.ID === b.config_id) as any ||
                      (buildingConfigs.DefenceBuilding || []).find((cfg: any) => cfg.ID === b.config_id) as any;
        const levelData = config ? getBuildingLevelData(config, b.level || 1) : null;
        return {
          ID: b.id,
          CityID: b.city_id,
          Index: b.config_id,
          State: b.state || 0,
          UserName: walletAddress,
          Name: config?.Name || `建筑${b.config_id}`,
          Des: config?.Des || '',
          Pos: b.position,
          Level: b.level || 1,
          UpNeedBuildingID: 0,
          UpNeedBuildingLevel: 0,
          UpNeedTechnicID: 0,
          UpNeedTechnicLevel: 0,
          UpNeedFood: levelData?.CostFood || 0,
          UpNeedMoney: levelData?.CostMoney || 0,
          UpNeedMen: levelData?.CostMen || 0,
          UpNeedGold: 0,
          UpNeedArea: 0,
          UpNeedTime: levelData?.CostTime || 0,
          DownNeedFood: 0,
          DownNeedMen: 0,
          DownNeedMoney: 0,
          DownReturnArea: 0,
          EffID: config?.EffectID || 0,
          Area: 0,
          CurrentEff: levelData?.EffectValue || 0,
          NextEff: levelData?.EffectValue || 0,
          OldEff: 0,
          EventID: 0,
          Type: config?.Type || 1,
          Image: levelData?.Image || config?.Image || '',
          Icon: levelData?.Icon || config?.Icon || '',
          Attack: levelData?.Attack || 0,
          HitPoint: levelData?.HitPoint || 0,
          AttackRange: levelData?.AttackRange || 0,
          EffRange: levelData?.EffRange || 0,
          MaxLevel: config?.InteriorData?.length || config?.DefenseData?.length || 10,
          UpNeedBuildingName: '',
        };
      });

      return success(c, buildingList);
    } catch (err: any) {
      return error(c, err.message);
    }
  }

  const buildingId = parseInt(idParam);

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


// GetBuildingByPos - GET /building/by-pos
// C# 签名: public BuildingInfo[] GetBuildingByPos(int cityID, int buildingType, int pos)
// 返回: BuildingInfo[] (数组，不是单个对象)
// FIX: pos 参数变为可选，不传时返回该城市所有建筑
// NOTE: 路由注册在 /:id 之前，避免被误匹配
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, map_type, pos } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    if (!city_id) {
      return error(c, 'Missing city_id');
    }

    // 验证城市所有权
    const city = await db.prepare(`
      SELECT id FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(parseInt(city_id), walletAddress).first();

    if (!city) {
      return error(c, 'City not found or not owned', 404);
    }

    // 如果没有 pos 参数，返回该城市所有建筑
    if (!pos) {
      const buildings: any = await db.prepare(`
        SELECT * FROM buildings WHERE city_id = ? ORDER BY position
      `).bind(parseInt(city_id)).all();

      const buildingList = (buildings.results || []).map((b: any) => {
        const config = (buildingConfigs.InteriorBuilding || []).find((cfg: any) => cfg.ID === b.config_id) as any ||
                      (buildingConfigs.DefenceBuilding || []).find((cfg: any) => cfg.ID === b.config_id) as any;
        const levelData = config ? getBuildingLevelData(config, b.level || 1) : null;
        return {
          ID: b.id,
          CityID: b.city_id,
          Index: b.config_id,
          State: b.state || 0,
          UserName: walletAddress,
          Name: config?.Name || `建筑${b.config_id}`,
          Des: config?.Des || '',
          Pos: b.position,
          Level: b.level || 1,
          UpNeedBuildingID: 0,
          UpNeedBuildingLevel: 0,
          UpNeedTechnicID: 0,
          UpNeedTechnicLevel: 0,
          UpNeedFood: levelData?.CostFood || 0,
          UpNeedMoney: levelData?.CostMoney || 0,
          UpNeedMen: levelData?.CostMen || 0,
          UpNeedGold: 0,
          UpNeedArea: 0,
          UpNeedTime: levelData?.CostTime || 0,
          DownNeedFood: 0,
          DownNeedMen: 0,
          DownNeedMoney: 0,
          DownReturnArea: 0,
          EffID: config?.EffectID || 0,
          Area: 0,
          CurrentEff: levelData?.EffectValue || 0,
          NextEff: levelData?.EffectValue || 0,
          OldEff: 0,
          EventID: 0,
          Type: config?.Type || 1,
          Image: levelData?.Image || config?.Image || '',
          Icon: levelData?.Icon || config?.Icon || '',
          Attack: levelData?.Attack || 0,
          HitPoint: levelData?.HitPoint || 0,
          AttackRange: levelData?.AttackRange || 0,
          EffRange: levelData?.EffRange || 0,
          MaxLevel: config?.InteriorData?.length || config?.DefenseData?.length || 10,
          UpNeedBuildingName: '',
        };
      });

      return success(c, buildingList);
    }

    // 查找指定位置的建筑
    const building: any = await db.prepare(`
      SELECT * FROM buildings WHERE city_id = ? AND position = ?
    `).bind(parseInt(city_id), parseInt(pos)).first();

    // 如果位置没有建筑，返回可建造建筑列表
    if (!building) {
      // 获取可建造建筑配置
      const buildingType = parseInt(map_type || '1');
      const availableConfigs = buildingType === 1 
        ? (buildingConfigs.InteriorBuilding || [])
        : (buildingConfigs.DefenceBuilding || []);

      // 返回可建造建筑列表 (BuildingInfo[] 格式)
      const availableBuildings = availableConfigs.slice(0, 10).map((config: any) => {
        const levelData = getBuildingLevelData(config, 1);
        return {
          ID: 0,
          CityID: parseInt(city_id),
          Index: config.ID,
          State: 0,
          UserName: walletAddress,
          Name: config.Name || '',
          Des: config.Des || '',
          Pos: parseInt(pos),
          Level: 0,
          UpNeedBuildingID: 0,
          UpNeedBuildingLevel: 0,
          UpNeedTechnicID: 0,
          UpNeedTechnicLevel: 0,
          UpNeedFood: levelData?.CostFood || 0,
          UpNeedMoney: levelData?.CostMoney || 0,
          UpNeedMen: levelData?.CostMen || 0,
          UpNeedGold: 0,
          UpNeedArea: 0,
          UpNeedTime: levelData?.CostTime || 0,
          DownNeedFood: 0,
          DownNeedMen: 0,
          DownNeedMoney: 0,
          DownReturnArea: 0,
          EffID: config.EffectID || 0,
          Area: 0,
          CurrentEff: 0,
          NextEff: levelData?.EffectValue || 0,
          OldEff: 0,
          EventID: 0,
          Type: buildingType,
          Image: levelData?.Image || config.Image || '',
          Icon: levelData?.Icon || config.Icon || '',
          Attack: 0,
          HitPoint: 0,
          AttackRange: 0,
          EffRange: 0,
          MaxLevel: config.InteriorData?.length || config.DefenseData?.length || 10,
          UpNeedBuildingName: '',
          UpNeedTechnicName: '',
          SnapSwitch: 0,
          SnapGold: 0,
          TradeRes: null,
          EffectArray: [],
        };
      });

      return success(c, availableBuildings);
    }

    // 补充配置信息
    const config = getBuildingConfig(building.type, building.config_id);
    const levelData = getBuildingLevelData(config, building.level);
    const nextLevelData = getBuildingLevelData(config, building.level + 1);

    // 返回 C# BuildingInfo[] 数组格式 (只有一个元素)
    return success(c, [{
      // C# 字段名 (驼峰)
      ID: building.id,
      CityID: building.city_id,
      Index: building.config_id,
      State: building.state,
      UserName: walletAddress,
      Name: config?.Name || config?.name || '',
      Des: config?.Des || config?.Description || '',
      Pos: building.position,
      Level: building.level,
      // 升级所需资源
      UpNeedBuildingID: 0,
      UpNeedBuildingLevel: 0,
      UpNeedTechnicID: 0,
      UpNeedTechnicLevel: 0,
      UpNeedFood: nextLevelData?.CostFood || 0,
      UpNeedMoney: nextLevelData?.CostMoney || 0,
      UpNeedMen: nextLevelData?.CostMen || 0,
      UpNeedGold: 0,
      UpNeedArea: 0,
      UpNeedTime: nextLevelData?.CostTime || 0,
      // 拆除所需资源
      DownNeedFood: 0,
      DownNeedMen: 0,
      DownNeedMoney: 0,
      DownReturnArea: 0,
      // 效果
      EffID: config?.EffectID || 0,
      Area: levelData?.Area || 0,
      CurrentEff: levelData?.EffectValue || 0,
      NextEff: nextLevelData?.EffectValue || 0,
      OldEff: 0,
      EventID: 0,
      Type: building.type === 'interior' ? 1 : 2,
      // 图片
      Image: levelData?.Image || config?.Image || '',
      Icon: levelData?.Icon || config?.Icon || '',
      // 战斗属性
      Attack: levelData?.Attack || 0,
      HitPoint: levelData?.HitPoint || 0,
      AttackRange: levelData?.AttackRange || 0,
      EffRange: levelData?.EffRange || 0,
      MaxLevel: config?.InteriorData?.length || config?.DefenseData?.length || 10,
      // 附加
      UpNeedBuildingName: '',
      UpNeedTechnicName: '',
      SnapSwitch: 0,
      SnapGold: 0,
      TradeRes: null,
      EffectArray: [],
    }]);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// DEBUG: simple count test - GET /building/debug-count
app.get('/debug-count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);
  const db = c.env.DB;
  if (!db) return error(c, 'No DB', 503);
  try {
    const result: any = await db.prepare('SELECT COUNT(*) as count FROM buildings WHERE wallet_address = ?').bind(walletAddress).first();
    return c.json({ debug: true, count: result?.count, walletAddress });
  } catch (err: any) {
    return c.json({ debug: true, error: err.message });
  }
});

// AddBuildingEvent - POST /building/event
app.post('/event', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID, actionType, objType, objID, pos } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    if (!cityID || actionType === undefined) {
      return error(c, 'Missing cityID or actionType');
    }

    // 验证城市所有权
    const city: any = await db.prepare(`
      SELECT * FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(cityID, walletAddress).first();

    if (!city) {
      return error(c, 'City not found or not owned', 404);
    }

    // actionType: 1=建造, 2=升级, 3=拆除, 4=取消, 5=加速
    let result: any = {};

    switch (actionType) {
      case 1: // 建造
        if (!objID || pos === undefined) {
          return error(c, 'Missing objID or pos for build action');
        }
        
        const config = getBuildingConfigById(objID);
        if (!config) {
          return error(c, 'Invalid building config');
        }

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
        const existing = await db.prepare(`
          SELECT id FROM buildings WHERE city_id = ? AND position = ?
        `).bind(cityID, pos).first();

        if (existing) {
          return error(c, 'Position already occupied');
        }

        // 检查是否已经有相同类型的建筑（同一个 config_id 只能有一个）
        const duplicate = await db.prepare(`
          SELECT id FROM buildings WHERE city_id = ? AND config_id = ?
        `).bind(cityID, objID).first();

        if (duplicate) {
          return error(c, '该建筑已存在，不能重复建造');
        }

        // 扣除资源
        await db.prepare(`
          UPDATE cities SET money = money - ?, food = food - ?, population = population - ? WHERE id = ?
        `).bind(baseCost.money, baseCost.food, baseCost.men, cityID).run();

        // 创建建筑
        const buildResult = await db.prepare(`
          INSERT INTO buildings (city_id, type, level, position, state, config_id)
          VALUES (?, 'interior', 1, ?, 0, ?)
        `).bind(cityID, pos, objID).run();

        result = {
          action: 'build',
          buildingId: buildResult.meta.last_row_id,
          name: config.Name,
          position: pos,
          cost: baseCost,
        };
        break;

      case 2: // 升级
        if (!objID) {
          return error(c, 'Missing objID for upgrade action');
        }

        const building: any = await db.prepare(`
          SELECT * FROM buildings WHERE id = ? AND city_id = ?
        `).bind(objID, cityID).first();

        if (!building) {
          return error(c, 'Building not found');
        }

        const buildingConfig = getBuildingConfig(building.type, building.config_id);
        const nextLevelData = getBuildingLevelData(buildingConfig, building.level + 1);

        if (!nextLevelData) {
          return error(c, 'Building already at max level');
        }

        // 验证资源
        if (city.money < nextLevelData.CostMoney || 
            city.food < nextLevelData.CostFood || 
            city.population < nextLevelData.CostMen) {
          return error(c, 'Not enough resources for upgrade');
        }

        // 扣除资源并升级
        await db.prepare(`
          UPDATE cities SET 
            money = money - ?, 
            food = food - ?,
            population = population - ?
          WHERE id = ?
        `).bind(nextLevelData.CostMoney, nextLevelData.CostFood, nextLevelData.CostMen, cityID).run();

        await db.prepare(`
          UPDATE buildings SET level = level + 1 WHERE id = ?
        `).bind(objID).run();

        result = {
          action: 'upgrade',
          buildingId: objID,
          previousLevel: building.level,
          newLevel: building.level + 1,
          cost: {
            money: nextLevelData.CostMoney,
            food: nextLevelData.CostFood,
            men: nextLevelData.CostMen,
          },
        };
        break;

      case 3: // 拆除
        if (!objID) {
          return error(c, 'Missing objID for demolish action');
        }

        const buildingToDemolish: any = await db.prepare(`
          SELECT * FROM buildings WHERE id = ? AND city_id = ?
        `).bind(objID, cityID).first();

        if (!buildingToDemolish) {
          return error(c, 'Building not found');
        }

        const demolishConfig = getBuildingConfig(buildingToDemolish.type, buildingToDemolish.config_id);

        // 返还 50% 资源
        const refundRate = 0.5;
        const refundMoney = Math.floor(buildingToDemolish.level * 50 * refundRate);
        const refundFood = Math.floor(buildingToDemolish.level * 30 * refundRate);

        await db.prepare(`
          UPDATE cities SET money = money + ?, food = food + ? WHERE id = ?
        `).bind(refundMoney, refundFood, cityID).run();

        await db.prepare(`DELETE FROM buildings WHERE id = ?`).bind(objID).run();

        result = {
          action: 'demolish',
          buildingId: objID,
          name: demolishConfig?.Name || '建筑',
          refund: { money: refundMoney, food: refundFood },
        };
        break;

      case 4: // 取消建造/升级
        result = {
          action: 'cancel',
          message: 'Event cancelled',
        };
        break;

      case 5: // 加速
        result = {
          action: 'speedup',
          message: 'Building speedup applied',
        };
        break;

      default:
        return error(c, 'Invalid actionType');
    }

    return success(c, result);
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
