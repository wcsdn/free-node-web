/**
 * 科技路由 - 完整版 (使用 technics.json)
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import technicConfigs from '../config/technics.json';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// ========== 辅助函数：按 Level 查找 InteriorData ==========
// InteriorData 是数组，元素 { Level: N, ... }，Level 从 1 开始
function getLevelData(interiorData: any[] | undefined, level: number): any {
  if (!interiorData || level <= 0) return null;
  return interiorData.find((d: any) => d.Level === level) || null;
}
function getNextLevelData(interiorData: any[] | undefined, currentLevel: number): any {
  if (!interiorData) return null;
  return interiorData.find((d: any) => d.Level === currentLevel + 1) || null;
}

// ========== bonus 配置（从配置文件读取，参考 Web.config） ==========
// 参考 jx/BLL/Technic.cs:
//   Tech 4: DefenceBuildNumDefault - 城防数量加成（每级额外增加城防单位数量）
//   Tech 3: DefaultMaxHeroCount   - 武将数量上限加成
//   Tech 2: CenterBuild           - 聚义厅等级上限加成
//   Tech 11: TrainingHeroEffect    - 训练效果加成
//   Tech 13: ItemCountOfOneCity    - 物品存储上限（<=0 时默认 50，在 GetStaticEffectValueByLevel 中处理）
const TECH_BONUS_CONFIG: Record<number, number> = {
  1: 0,    // 移山填海 - 面积（通过 NeedArea 校验，不在这里加bonus）
  2: 15,   // 土木技术 - CenterBuild (聚义厅等级上限加成)
  3: 10,   // 招贤纳士 - DefaultMaxHeroCount (武将数量上限加成)
  4: 5,    // 计量技术 - DefenceBuildNumDefault (城防数量加成，每级额外增加5个城防单位)
  11: 14,  // 犒劳三军 - TrainingHeroEffect (训练效果加成)
  // Tech 13 (仓库扩容) 的默认值 50 在 GetStaticEffectValueByLevel 中特殊处理
};
function getTechBonus(techId: number): number {
  return TECH_BONUS_CONFIG[techId] ?? 0;
}

// ========== 科技效果类型 ==========
const TECH_EFFECT_TYPES = {
  AREA: 1,           // 区域/面积
  BUILDING_LEVEL: 2, // 建筑等级上限
  TRAIN_SPEED: 3,   // 训练速度
  BUILD_SPEED: 4,    // 建造速度
  ATTACK: 5,         // 攻击
  DEFENSE: 6,        // 防御
  ECONOMY: 7,        // 经济
};

// GET /tech/list - 获取玩家科技列表（别名，支持未登录）
app.get('/list', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ success: false, error: 'Database not configured' }, 503);

  // 不强制要求登录，未登录返回空数据
  const walletAddress = await verifyWalletAuth(c).catch(() => null);
  if (!walletAddress) {
    return c.json({ success: true, data: [] });
  }

  try {
    const city = await db.prepare(`
      SELECT id, name FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return c.json({ success: true, data: [] });

    const playerTechs = await db.prepare(`
      SELECT * FROM technics WHERE wallet_address = ? ORDER BY static_index
    `).bind(walletAddress).all();

    const techMap: Record<number, any> = {};
    for (const tech of (playerTechs.results || [])) {
      techMap[(tech as any).static_index] = tech;
    }

    // 计算玩家当前已用面积（用于 Tech ID=1 移山填海面积校验）
    // 参考 jx/BLL/Technic.cs: 计算当前建筑群已用面积
    let usedArea = 0;
    try {
      const buildings: any = await db.prepare(`
        SELECT b.level, i.CostArea
        FROM buildings b
        LEFT JOIN interior_building_config i ON b.config_id = i.id
        WHERE b.city_id = ? AND b.type = 'interior'
      `).bind((city as any).id).all();
      for (const b of (buildings.results || [])) {
        usedArea += ((b as any).CostArea || 0) * ((b as any).level || 1);
      }
    } catch (_) { /* ignore */ }

    const techsWithStatus = (technicConfigs || []).map((techConfig: any) => {
      const playerTech = techMap[techConfig.ID];
      const currentLevel = playerTech?.technic_level || 0;
      const levelData = getLevelData(techConfig.InteriorData, currentLevel);
      const nextLevelData = getNextLevelData(techConfig.InteriorData, currentLevel);
      const maxLevel = techConfig.InteriorData?.length || 1;

      // Tech ID=1 移山填海：面积校验 — 当前已用面积 < 依赖面积时返回 null（不显示该科技）
      // 参考 jx/BLL/Technic.cs: if (CurrentArea < DependArea) return null;
      if (techConfig.ID === 1 && currentLevel === 0) {
        const dependArea = techConfig.DependArea || 0;
        if (usedArea < dependArea) {
          return null; // 面积不足，不显示该科技
        }
      }

      // 特殊加成（参考 C# Technic.cs 中的 DefenceBuildNumDefault, DefaultMaxHeroCount 等）
      // Tech ID=4: DefenceBuildNumDefault 加成同时作用于 CurrEff 和 NextEff
      // Tech ID=3/2/11: 其他特殊加成
      const bonus = getTechBonus(techConfig.ID);
      const currEffBase = currentLevel > 0 ? (levelData?.EffValue || 0) : 0;
      const nextEffBase = nextLevelData?.EffValue || 0;

      // 查找升级所需的科技依赖
      const dependTechnic = nextLevelData?.DependTechnicID
        ? (technicConfigs || []).find((t: any) => t.ID === nextLevelData.DependTechnicID)
        : null;

      return {
        // 小写字段 (兼容)
        id: techConfig.ID,
        name: techConfig.Name,
        icon: techConfig.Icon,
        description: techConfig.Des,
        level: currentLevel,
        maxLevel,
        effect: currEffBase + (currentLevel > 0 ? bonus : 0),
        nextEffect: nextEffBase + bonus,
        canUpgrade: !!nextLevelData,
        isUnlocked: currentLevel > 0,
        state: playerTech?.state ?? -1,
        upgradeCost: nextLevelData ? {
          money: nextLevelData.CostMoney || 0,
          food: nextLevelData.CostFood || 0,
          gold: nextLevelData.CostGold || 0,
          time: nextLevelData.CostTime || 0,
        } : null,
        // 大写字段 (前端 TechnicInfo.* 期望)
        ID: techConfig.ID,
        Index: techConfig.ID,
        Name: techConfig.Name || '',
        Des: techConfig.Des || '',
        Level: currentLevel,
        // Tech ID=4 补充 DefenceBuildNumDefault 加成（参考 C#: technicSingle.CurrentEff += DefenceBuildNumDefault）
        CurrEff: currEffBase + (currentLevel > 0 ? bonus : 0),
        CurrentEff: currEffBase + (currentLevel > 0 ? bonus : 0),
        // C# TechnicInfo.NextEff: 下一级科技效果值（含加成）
        NextEff: nextEffBase + bonus,
        EffID: techConfig.EffectID || nextLevelData?.EffType || 0,
        MaxLevel: maxLevel,
        State: playerTech?.state ?? -1,
        // 升级需求
        UpNeedBuildingID: nextLevelData?.NeedBuildingID || 0,
        UpNeedBuildingLevel: nextLevelData?.NeedBuildingLevel || 0,
        UpNeedFood: nextLevelData?.CostFood || 0,
        UpNeedMoney: nextLevelData?.CostMoney || 0,
        UpNeedMen: nextLevelData?.CostMen || 0,
        UpNeedGold: nextLevelData?.CostGold || 0,
        UpNeedArea: nextLevelData?.NeedArea || 0,
        UpNeedTime: nextLevelData?.CostTime || 0,
        // 科技依赖 (前端 Tree.js 使用)
        UpNeedTechnicID: nextLevelData?.DependTechnicID || 0,
        UpNeedTechnicLevel: nextLevelData?.DependTechnicLevel || 0,
        UpNeedTechnicName: dependTechnic?.Name || '',
        // 科技配置属性
        Icon: techConfig.Icon || '',
        Area: techConfig.DependArea || 0,
        EventID: 0,
      };
    }).filter(Boolean); // 过滤 null 值（Tech ID=1 面积不足时）

    return c.json({ success: true, data: techsWithStatus });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST /tech/list - 获取玩家科技列表 (兼容 POST)
app.post('/list', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ success: false, error: 'Database not configured' }, 503);

  const walletAddress = await verifyWalletAuth(c).catch(() => null);
  if (!walletAddress) {
    return c.json({ success: true, data: [] });
  }

  try {
    const city = await db.prepare(`
      SELECT id, name FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return c.json({ success: true, data: [] });

    const playerTechs = await db.prepare(`
      SELECT * FROM technics WHERE wallet_address = ? ORDER BY static_index
    `).bind(walletAddress).all();

    const techMap: Record<number, any> = {};
    for (const tech of (playerTechs.results || [])) {
      techMap[(tech as any).static_index] = tech;
    }

    // 计算玩家当前已用面积（用于 Tech ID=1 移山填海面积校验）
    let usedArea = 0;
    try {
      const buildings: any = await db.prepare(`
        SELECT b.level, i.CostArea
        FROM buildings b
        LEFT JOIN interior_building_config i ON b.config_id = i.id
        WHERE b.city_id = ? AND b.type = 'interior'
      `).bind((city as any).id).all();
      for (const b of (buildings.results || [])) {
        usedArea += ((b as any).CostArea || 0) * ((b as any).level || 1);
      }
    } catch (_) { /* ignore */ }

    const techsWithStatus = (technicConfigs || []).map((techConfig: any) => {
      const playerTech = techMap[techConfig.ID];
      const currentLevel = playerTech?.technic_level || 0;
      const levelData = getLevelData(techConfig.InteriorData, currentLevel);
      const nextLevelData = getNextLevelData(techConfig.InteriorData, currentLevel);
      const maxLevel = techConfig.InteriorData?.length || 1;

      // Tech ID=1 移山填海：面积校验
      if (techConfig.ID === 1 && currentLevel === 0) {
        const dependArea = techConfig.DependArea || 0;
        if (usedArea < dependArea) {
          return null;
        }
      }

      const bonus = getTechBonus(techConfig.ID);
      const currEffBase = currentLevel > 0 ? (levelData?.EffValue || 0) : 0;
      const nextEffBase = nextLevelData?.EffValue || 0;
      const dependTechnic = nextLevelData?.DependTechnicID
        ? (technicConfigs || []).find((t: any) => t.ID === nextLevelData.DependTechnicID)
        : null;

      return {
        // 小写字段 (兼容)
        id: techConfig.ID,
        name: techConfig.Name,
        icon: techConfig.Icon,
        description: techConfig.Des,
        level: currentLevel,
        maxLevel,
        effect: currEffBase + (currentLevel > 0 ? bonus : 0),
        nextEffect: nextEffBase + bonus,
        canUpgrade: !!nextLevelData,
        isUnlocked: currentLevel > 0,
        state: playerTech?.state ?? -1,
        upgradeCost: nextLevelData ? {
          money: nextLevelData.CostMoney || 0,
          food: nextLevelData.CostFood || 0,
          gold: nextLevelData.CostGold || 0,
          time: nextLevelData.CostTime || 0,
        } : null,
        // 大写字段 (前端 TechnicInfo.* 期望)
        ID: techConfig.ID,
        Index: techConfig.ID,
        Name: techConfig.Name || '',
        Des: techConfig.Des || '',
        Level: currentLevel,
        // Tech ID=4 补充 DefenceBuildNumDefault 加成
        CurrEff: currEffBase + (currentLevel > 0 ? bonus : 0),
        CurrentEff: currEffBase + (currentLevel > 0 ? bonus : 0),
        NextEff: nextEffBase + bonus,
        EffID: techConfig.EffectID || nextLevelData?.EffType || 0,
        MaxLevel: maxLevel,
        State: playerTech?.state ?? -1,
        UpNeedBuildingID: nextLevelData?.NeedBuildingID || 0,
        UpNeedBuildingLevel: nextLevelData?.NeedBuildingLevel || 0,
        UpNeedFood: nextLevelData?.CostFood || 0,
        UpNeedMoney: nextLevelData?.CostMoney || 0,
        UpNeedMen: (nextLevelData as any)?.CostMen || 0,
        UpNeedGold: nextLevelData?.CostGold || 0,
        UpNeedArea: (nextLevelData as any)?.NeedArea || 0,
        UpNeedTime: nextLevelData?.CostTime || 0,
        UpNeedTechnicID: (nextLevelData as any)?.DependTechnicID || 0,
        UpNeedTechnicLevel: (nextLevelData as any)?.DependTechnicLevel || 0,
        UpNeedTechnicName: dependTechnic?.Name || '',
        Icon: techConfig.Icon || '',
        Area: techConfig.DependArea || 0,
        EventID: 0,
      };
    }).filter(Boolean);

    return c.json({ success: true, data: techsWithStatus });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 获取所有科技配置
// GetTechnicByID - GET /tech/detail - 根据ID获取科技详情
app.get('/detail', async (c) => {
  const walletAddress = await verifyWalletAuth(c).catch(() => null);
  const db = c.env.DB;
  if (!db) return c.json({ success: false, error: 'Database not configured' }, 503);

  const { id } = c.req.query();
  const techId = parseInt(id || '0');

  if (!techId) {
    return c.json({ success: false, error: 'Missing required field: id' });
  }

  try {
    const techConfig = (technicConfigs || []).find((t: any) => t.ID === techId);
    if (!techConfig) {
      return c.json({ success: false, error: 'Tech not found' }, 404);
    }

    let playerTech: any = null;
    let currentLevel = 0;

    if (walletAddress) {
      const techs = await db.prepare(`
        SELECT * FROM technics WHERE wallet_address = ? AND static_index = ?
      `).bind(walletAddress, techId).all();
      if (techs.results && techs.results.length > 0) {
        playerTech = techs.results[0];
        currentLevel = (playerTech as any).technic_level || 0;
      }
    }

    const levelData = getLevelData(techConfig.InteriorData, currentLevel);
    const nextLevelData = getNextLevelData(techConfig.InteriorData, currentLevel);
    const dependTechnic = nextLevelData?.DependTechnicID
      ? (technicConfigs || []).find((t: any) => t.ID === nextLevelData.DependTechnicID)
      : null;

    return c.json({
      success: true,
      data: {
        id: techConfig.ID,
        name: techConfig.Name,
        icon: techConfig.Icon,
        description: techConfig.Des,
        level: currentLevel,
        maxLevel: techConfig.InteriorData?.length || 1,
        effect: currentLevel > 0 ? (levelData?.EffValue || 0) : 0,
        nextEffect: nextLevelData?.EffValue || 0,
        canUpgrade: !!nextLevelData,
        isUnlocked: currentLevel > 0,
        state: playerTech?.state ?? -1,
        upgradeCost: nextLevelData ? {
          money: nextLevelData.CostMoney || 0,
          food: nextLevelData.CostFood || 0,
          gold: nextLevelData.CostGold || 0,
          time: nextLevelData.CostTime || 0,
        } : null,
        // C# TechnicInfo PascalCase 字段
        ID: techConfig.ID,
        Index: techConfig.ID,
        Name: techConfig.Name || '',
        Des: techConfig.Des || '',
        Level: currentLevel,
        CurrEff: currentLevel > 0 ? (levelData?.EffValue || 0) : 0,
        CurrentEff: currentLevel > 0 ? (levelData?.EffValue || 0) : 0,
        // C# TechnicInfo.NextEff: 下一级科技效果值 (前端 Tips.js 使用)
        NextEff: nextLevelData?.EffValue || 0,
        EffID: (techConfig as any).EffectID || nextLevelData?.EffType || 0,
        MaxLevel: techConfig.InteriorData?.length || 1,
        State: playerTech?.state ?? -1,
        UpNeedBuildingID: nextLevelData?.NeedBuildingID || 0,
        UpNeedBuildingLevel: nextLevelData?.NeedBuildingLevel || 0,
        UpNeedFood: nextLevelData?.CostFood || 0,
        UpNeedMoney: nextLevelData?.CostMoney || 0,
        UpNeedMen: (nextLevelData as any)?.CostMen || 0,
        UpNeedGold: nextLevelData?.CostGold || 0,
        UpNeedArea: (nextLevelData as any)?.NeedArea || 0,
        UpNeedTime: nextLevelData?.CostTime || 0,
        UpNeedTechnicID: (nextLevelData as any)?.DependTechnicID || 0,
        UpNeedTechnicLevel: (nextLevelData as any)?.DependTechnicLevel || 0,
        UpNeedTechnicName: dependTechnic?.Name || '',
        Icon: techConfig.Icon || '',
        Area: (techConfig as any).DependArea || 0,
        EventID: 0,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/configs', async (c) => {
  const techs = (technicConfigs || []).map((tech: any) => ({
    id: tech.ID,
    name: tech.Name,
    icon: tech.Icon,
    description: tech.Des,
    dependPos: tech.DependPos,
    dependBuildingId: tech.DependBuildingID,
    dependTechnicId: tech.DependTechnicID,
    dependArea: tech.DependArea,
    maxLevel: tech.InteriorData?.length || 1,
    levels: (tech.InteriorData || []).map((level: any) => ({
      level: level.Level,
      effectType: level.EffType,
      effectValue: level.EffValue,
      cost: {
        money: level.CostMoney || 0,
        food: level.CostFood || 0,
        gold: level.CostGold || 0,
        time: level.CostTime || 0,
      },
      requirements: {
        buildingId: level.NeedBuildingID,
        buildingLevel: level.NeedBuildingLevel,
        technicId: level.NeedTechnicID,
        technicLevel: level.NeedTechnicLevel,
        area: level.NeedArea,
      },
    })),
  }));

  return success(c, {
    techs,
    total: techs.length,
  });
});

// 获取玩家科技状态
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT id, name FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'No city found', 404);

    // 获取玩家已研究的科技
    const playerTechs = await db.prepare(`
      SELECT * FROM technics WHERE wallet_address = ? ORDER BY static_index
    `).bind(walletAddress).all();

    // 构建玩家科技映射
    const techMap: Record<number, any> = {};
    for (const tech of (playerTechs.results || [])) {
      techMap[(tech as any).static_index] = tech;
    }

    // 合并配置和玩家数据
    const techsWithStatus = (technicConfigs || []).map((techConfig: any) => {
      const playerTech = techMap[techConfig.ID];
      const currentLevel = playerTech?.technic_level || 0;
      const levelData = getLevelData(techConfig.InteriorData, currentLevel);
      const nextLevelData = getNextLevelData(techConfig.InteriorData, currentLevel);

      return {
        id: techConfig.ID,
        staticIndex: techConfig.ID,
        name: techConfig.Name,
        icon: techConfig.Icon,
        description: techConfig.Des,
        effectType: techConfig.InteriorData?.[0]?.EffType || 0,
        currentLevel,
        maxLevel: techConfig.InteriorData?.length || 1,
        currentEffect: currentLevel > 0
          ? (levelData?.EffValue || 0)
          : 0,
        nextEffect: nextLevelData?.EffValue || 0,
        canUpgrade: !!nextLevelData,
        isUnlocked: currentLevel > 0,
        state: playerTech?.state ?? -1,

        // C# TechnicInfo 字段 (驼峰)
        ID: techConfig.ID,
        Index: techConfig.ID,
        Name: techConfig.Name || '',
        Des: techConfig.Des || '',
        Level: currentLevel,
        CurrEff: currentLevel > 0 ? (levelData?.EffValue || 0) : 0,
        CurrentEff: currentLevel > 0 ? (levelData?.EffValue || 0) : 0,
        // C# TechnicInfo.NextEff: 下一级科技效果值 (前端 Tips.js 使用)
        NextEff: nextLevelData?.EffValue || 0,
        UpNeedBuildingID: nextLevelData?.NeedBuildingID || 0,
        UpNeedBuildingLevel: nextLevelData?.NeedBuildingLevel || 0,
        UpNeedFood: nextLevelData?.CostFood || 0,
        UpNeedMoney: nextLevelData?.CostMoney || 0,
        UpNeedMen: nextLevelData?.CostMen || 0,
        UpNeedGold: nextLevelData?.CostGold || 0,
        UpNeedArea: nextLevelData?.NeedArea || 0,
        EffID: techConfig.EffectID || 0,

        // 当前等级升级消耗
        upgradeCost: nextLevelData ? {
          money: nextLevelData.CostMoney || 0,
          food: nextLevelData.CostFood || 0,
          gold: nextLevelData.CostGold || 0,
          time: nextLevelData.CostTime || 0,
        } : null,

        // 升级需求
        upgradeRequirements: nextLevelData ? {
          buildingId: nextLevelData.NeedBuildingID,
          buildingLevel: nextLevelData.NeedBuildingLevel,
          technicId: nextLevelData.NeedTechnicID,
          technicLevel: nextLevelData.NeedTechnicLevel,
          area: nextLevelData.NeedArea,
        } : null,
      };
    });

    return success(c, {
      city: { id: city.id, name: city.name },
      techs: techsWithStatus,
      total: techsWithStatus.length,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GET /tech/research - 获取研究中的科技（GET版，未登录友好）
app.get('/research', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ success: false, error: 'Database not configured' }, 503);

  const walletAddress = await verifyWalletAuth(c).catch(() => null);
  if (!walletAddress) return c.json({ success: true, data: { techs: [], total: 0 } });

  try {
    const city = await db.prepare(`
      SELECT id, name FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return c.json({ success: true, data: { techs: [], total: 0 } });

    // 只返回研究中的科技（state=1）
    const researching = await db.prepare(`
      SELECT t.*, tc.name, tc.icon, tc.des, tc.interior_data
      FROM technics t
      JOIN tech_configs tc ON t.static_index = tc.id
      WHERE t.wallet_address = ? AND t.state = 1
    `).bind(walletAddress).all();

    const events = await db.prepare(`
      SELECT * FROM time_events WHERE wallet_address = ? AND event_type = 2 AND end_time > datetime('now')
      ORDER BY end_time ASC
    `).bind(walletAddress).all();

    const researchingTechs = (researching.results || []).map((tech: any) => {
      const matchingEvent = (events.results || []).find((e: any) => parseInt(e.target_id) === tech.id);
      const remainSeconds = matchingEvent ? Math.max(0, Math.floor((new Date(String(matchingEvent.end_time)).getTime() - Date.now()) / 1000)) : 0;
      return {
        id: tech.id, static_index: tech.static_index, name: tech.name,
        icon: tech.icon, level: tech.technic_level, remain_seconds: remainSeconds,
        end_time: matchingEvent?.end_time || null,
      };
    });

    return c.json({ success: true, data: { techs: researchingTechs, total: researchingTechs.length } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 研究科技（创建时间事件）
app.post('/research', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { static_index, use_immediately } = await c.req.json();
  
  if (!static_index) {
    return error(c, 'Missing required field: static_index');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city: any = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'No city found', 404);

    const config = (technicConfigs || []).find((t: any) => t.ID === static_index);
    if (!config) return error(c, 'Invalid tech static_index');

    // 获取玩家当前科技等级
    const currentTech: any = await db.prepare(`
      SELECT * FROM technics WHERE wallet_address = ? AND static_index = ?
    `).bind(walletAddress, static_index).first();

    const currentLevel = currentTech?.technic_level || 0;
    const nextLevelData = getNextLevelData(config.InteriorData, currentLevel);

    if (!nextLevelData) {
      return error(c, 'Tech already at max level');
    }

    // 验证资源
    if (city.money < (nextLevelData.CostMoney || 0) || city.food < (nextLevelData.CostFood || 0)) {
      return error(c, `Not enough resources. Need ${nextLevelData.CostMoney} money, ${nextLevelData.CostFood} food`);
    }

    // 验证前置条件
    if (nextLevelData.NeedBuildingID && nextLevelData.NeedBuildingLevel) {
      const building: any = await db.prepare(`
        SELECT level FROM buildings WHERE city_id = ? AND config_id = ?
      `).bind(city.id, nextLevelData.NeedBuildingID).first();

      if (!building || building.level < nextLevelData.NeedBuildingLevel) {
        return error(c, `Need building ${nextLevelData.NeedBuildingID} at level ${nextLevelData.NeedBuildingLevel}`);
      }
    }

    // 检查科技前置条件
    const dependTechnicId = (nextLevelData as any).DependTechnicID;
    if (dependTechnicId && dependTechnicId > 0) {
      const preTech: any = await db.prepare(`
        SELECT technic_level FROM technics WHERE wallet_address = ? AND static_index = ?
      `).bind(walletAddress, dependTechnicId).first();

      if (!preTech || preTech.technic_level < 1) {
        return error(c, `Need technic ${dependTechnicId} at level 1`);
      }
    }

    // 扣除资源
    await db.prepare(`
      UPDATE cities SET money = money - ?, food = food - ? WHERE id = ?
    `).bind(nextLevelData.CostMoney || 0, nextLevelData.CostFood || 0, city.id).run();

    // 如果有建造时间，创建时间事件
    if ((nextLevelData.CostTime || 0) > 0 && !use_immediately) {
      const now = new Date();
      const endTime = new Date(now.getTime() + (nextLevelData.CostTime || 0) * 1000);

      // 创建科技记录（研究中）
      const techResult = await db.prepare(`
        INSERT OR REPLACE INTO technics (wallet_address, city_id, static_index, technic_level, state, build_id)
        VALUES (?, ?, ?, ?, 1, 0)
      `).bind(walletAddress, city.id, static_index, currentLevel).run();

      // 创建时间事件（target_id 使用 static_index，而非自增ID）
      await db.prepare(`
        INSERT INTO time_events (wallet_address, city_id, event_type, target_id, start_time, end_time, state)
        VALUES (?, ?, 2, ?, datetime('now'), datetime('?', 'unixepoch'), 0)
      `).bind(walletAddress, city.id, static_index, endTime.getTime() / 1000).run();

      return success(c, {
        techId: techResult.meta.last_row_id,
        staticIndex: static_index,
        name: config.Name,
        currentLevel,
        newLevel: currentLevel,
        state: 'researching',
        remainingTime: nextLevelData.CostTime,
        message: `${config.Name} 开始研究 (${nextLevelData.CostTime}秒)`,
      });
    } else {
      // 立即完成
      await db.prepare(`
        INSERT OR REPLACE INTO technics (wallet_address, city_id, static_index, technic_level, state, build_id)
        VALUES (?, ?, ?, ?, 0, 0)
      `).bind(walletAddress, city.id, static_index, currentLevel + 1).run();

      return success(c, {
        staticIndex: static_index,
        name: config.Name,
        previousLevel: currentLevel,
        newLevel: currentLevel + 1,
        state: 'completed',
        effect: nextLevelData.EffValue,
        message: `${config.Name} 研究成功 (Lv.${currentLevel + 1})`,
      });
    }
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 升级科技
app.post('/:id/upgrade', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const techId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const tech: any = await db.prepare(`
      SELECT t.*, c.money, c.food 
      FROM technics t 
      JOIN cities c ON t.city_id = c.id 
      WHERE t.id = ? AND t.wallet_address = ?
    `).bind(techId, walletAddress).first();

    if (!tech) return error(c, 'Tech not found');

    const config = (technicConfigs || []).find((t: any) => t.ID === tech.static_index);
    if (!config) return error(c, 'Tech config not found');

    const currentLevel = tech.technic_level;
    const nextLevelData = getNextLevelData(config.InteriorData, currentLevel);

    if (!nextLevelData) {
      return error(c, 'Tech already at max level');
    }

    // 验证资源
    if (tech.money < (nextLevelData.CostMoney || 0) || tech.food < (nextLevelData.CostFood || 0)) {
      return error(c, `Not enough resources. Need ${nextLevelData.CostMoney} money, ${nextLevelData.CostFood} food`);
    }

    // 扣除资源并升级
    await db.prepare(`
      UPDATE cities SET money = money - ?, food = food - ? WHERE id = ?
    `).bind(nextLevelData.CostMoney || 0, nextLevelData.CostFood || 0, tech.city_id).run();

    await db.prepare(`
      UPDATE technics SET technic_level = technic_level + 1 WHERE id = ?
    `).bind(techId).run();

    const newLevel = currentLevel + 1;

    return success(c, {
      id: techId,
      previousLevel: currentLevel,
      newLevel,
      name: config.Name,
      cost: {
        money: nextLevelData.CostMoney || 0,
        food: nextLevelData.CostFood || 0,
      },
      effect: nextLevelData.EffValue,
      message: `${config.Name} 升级到 Lv.${newLevel}`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取科技效果汇总
app.get('/effects', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const techs = await db.prepare(`
      SELECT * FROM technics WHERE wallet_address = ? AND technic_level > 0
    `).bind(walletAddress).all();

    const effects: Record<string, number> = {};
    let totalBonus = 0;

    for (const tech of (techs.results || [])) {
      const config = (technicConfigs || []).find((t: any) => t.ID === (tech as any).static_index);
      if (config) {
        const levelData = getLevelData(config.InteriorData, (tech as any).technic_level);
        if (levelData) {
          const effectType = levelData.EffType;
          const effectValue = levelData.EffValue;

          const typeName = Object.entries(TECH_EFFECT_TYPES).find(([_, v]) => v === effectType)?.[0] || 'UNKNOWN';
          effects[typeName] = (effects[typeName] || 0) + effectValue;
          totalBonus += effectValue;
        }
      }
    }

    return success(c, {
      effects,
      totalBonus,
      message: `科技总加成: +${totalBonus}`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

/**
 * GET /tech/eff-value - 获取指定科技的效果值
 * 对应 C# Technic.getTechnicEffValue(userName, cityID, TechnicIndex)
 * C# 逻辑:
 *   1. 检查 TechnicIndex 是否在 XmlData.Technic 中
 *   2. 获取该玩家该城市的科技信息 (CityInteriorInfo)
 *   3. 从 interior.TechnicLevel[TechnicIndex - 1] 获取等级
 *   4. 若 level <= 0 返回 0
 *   5. 返回 XmlData.Technic[TechnicIndex].InteriorData[level].EffValue
 *   6. 特殊加成: Tech 4 +0, Tech 3 +10, Tech 2 +15, Tech 11 +14
 */
app.get('/eff-value', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, technic_index } = c.req.query();
  const techIndex = parseInt(technic_index as string || '0');

  if (!techIndex) {
    return error(c, 'Missing required field: technic_index', 400);
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取城市（支持指定 city_id 或取第一个）
    let cityId: number;
    let city: any;
    if (city_id) {
      city = await db.prepare(`
        SELECT id FROM cities WHERE wallet_address = ? AND id = ?
      `).bind(walletAddress, parseInt(city_id as string)).first();
      if (!city) return error(c, 'City not found or unauthorized', 404);
      cityId = (city as any).id;
    } else {
      city = await db.prepare(`
        SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
      `).bind(walletAddress).first();
      if (!city) return error(c, 'No city found', 404);
      cityId = (city as any).id;
    }

    // 检查科技配置是否存在
    const config = (technicConfigs || []).find((t: any) => t.ID === techIndex);
    if (!config) return error(c, `Technic ${techIndex} not found in config`, 404);

    // 获取该玩家该城市的科技等级
    // technics 表中 static_index 对应科技 ID, technic_level 对应等级
    const playerTech: any = await db.prepare(`
      SELECT technic_level FROM technics WHERE wallet_address = ? AND static_index = ?
    `).bind(walletAddress, techIndex).first();

    const level = playerTech?.technic_level || 0;

    if (level <= 0) {
      return success(c, {
        technicIndex: techIndex,
        level: 0,
        effectValue: 0,
        bonus: 0,
        message: 'Tech not researched',
      });
    }

    // 获取该等级的效果值
    const levelData = config.InteriorData?.find((l: any) => l.Level === level);
    if (!levelData) return error(c, `Level ${level} not found for technic ${techIndex}`, 404);

    let effectValue = levelData.EffValue || 0;

    // 应用特殊加成（从配置读取）
    const bonus = getTechBonus(techIndex);
    const finalEffect = effectValue + bonus;

    return success(c, {
      technicIndex: techIndex,
      level,
      effectValue,
      bonus,
      finalEffect,
      cityId,
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});


// GetTechnicByBuilding - GET /tech/by-building 根据建筑获取相关科技
app.get('/by-building', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const { city_id, building_type } = c.req.query();
  const buildingType = parseInt(building_type as string || '0');

  const db = c.env.DB;
  if (!db) return c.json({ success: false, error: 'Database not configured' }, 503);

  try {
    // 获取玩家的科技数据
    const city = await db.prepare(`
      SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return c.json({ success: false, error: 'No city found' }, 404);

    // 获取玩家已研究的科技
    const playerTechs = await db.prepare(`
      SELECT * FROM technics WHERE wallet_address = ? ORDER BY static_index
    `).bind(walletAddress).all();

    // 构建玩家科技映射
    const techMap: Record<number, any> = {};
    for (const tech of (playerTechs.results || [])) {
      techMap[(tech as any).static_index] = tech;
    }

    // 筛选与该建筑类型相关的科技
    const relatedTechs = (technicConfigs || [])
      .filter((tech: any) => {
        // 检查科技配置中的建筑关联
        const interiorData = tech.InteriorData || [];
        return interiorData.some((level: any) => level.NeedBuildingID === buildingType);
      })
      .map((techConfig: any) => {
        const playerTech = techMap[techConfig.ID];
        const currentLevel = playerTech?.technic_level || 0;
        const nextLevelData = getNextLevelData(techConfig.InteriorData, currentLevel);

        return {
          id: techConfig.ID,
          name: techConfig.Name,
          icon: techConfig.Icon,
          level: currentLevel,
          maxLevel: techConfig.InteriorData?.length || 1,
          effect: nextLevelData?.EffValue || 0,
          description: techConfig.Des,
        };
      });

    return c.json({
      success: true,
      data: {
        buildingType,
        cityId: (city as any).id,
        techs: relatedTechs,
        total: relatedTechs.length,
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ========== 缺失方法补充 ==========

/**
 * GetTechnicByBuilding - 根据城市ID和建筑索引获取该建筑相关的科技列表
 * 参考 jx/BLL/Technic.cs GetTechnicByBuilding(userName, cityID, buildingIndex)
 */
app.get('/by-building/:cityId/:buildingIndex', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const cityId = parseInt(c.req.param('cityId'));
  const buildingIndex = parseInt(c.req.param('buildingIndex'));

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  if (!cityId || !buildingIndex) {
    return error(c, 'Missing cityId or buildingIndex', 400);
  }

  try {
    // 验证城市归属
    const city: any = await db.prepare(`
      SELECT id FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(cityId, walletAddress).first();
    if (!city) return error(c, 'City not found or unauthorized', 404);

    // 获取该城市的所有科技（state=0 已完成 or state=1 研究中）
    const playerTechs = await db.prepare(`
      SELECT * FROM technics WHERE wallet_address = ? AND city_id = ?
    `).bind(walletAddress, cityId).all();

    const techMap: Record<number, any> = {};
    for (const tech of (playerTechs.results || [])) {
      techMap[(tech as any).static_index] = tech;
    }

    // 科技ID=1 移山填海：先计算当前已用面积
    let usedAreaForTech1 = 0;
    const tech1Related = (technicConfigs || []).some((t: any) => t.ID === 1 && t.DependBuildingID === buildingIndex);
    if (tech1Related) {
      const buildings: any = await db.prepare(`
        SELECT b.level FROM buildings b
        WHERE b.city_id = ? AND b.type = 'interior'
      `).bind(cityId).all();
      for (const b of (buildings.results || [])) {
        usedAreaForTech1 += ((b as any).level || 1) * 10;
      }
    }

    // 根据 buildingIndex 筛选相关科技
    // DependBuildingID = buildingIndex 表示该科技依赖此建筑
    const relatedTechs = (technicConfigs || [])
      .filter((techConfig: any) => {
        return techConfig.DependBuildingID === buildingIndex;
      })
      .map((techConfig: any) => {
        const playerTech = techMap[techConfig.ID];
        const currentLevel = playerTech?.technic_level || 0;
        const nextLevelData = getNextLevelData(techConfig.InteriorData, currentLevel) as any;
        const levelData = getLevelData(techConfig.InteriorData, currentLevel);
        const maxLevel = techConfig.InteriorData?.length || 1;

        // 特殊加成处理（从配置读取）
        const bonus = getTechBonus(techConfig.ID);
        let currEff = currentLevel > 0 ? (levelData?.EffValue || 0) + bonus : 0;
        let nextEff = (nextLevelData?.EffValue || 0) + bonus;

        // 科技ID=1 移山填海：面积校验 - 参考 jx/BLL/Technic.cs
        // 如果当前已用面积 < 依赖面积（DependArea），返回 null（不显示该科技）
        let areaCheck = true;
        if (techConfig.ID === 1 && nextLevelData?.NeedArea) {
          areaCheck = usedAreaForTech1 >= nextLevelData.NeedArea;
          if (!areaCheck) {
            return null; // 面积不足，不返回该科技（对应 C# return null）
          }
        }

        const canUpgrade = !!nextLevelData && areaCheck;
        const dependTechnic = nextLevelData?.DependTechnicID
          ? (technicConfigs || []).find((t: any) => t.ID === nextLevelData.DependTechnicID)
          : null;

        return {
          ID: techConfig.ID,
          Index: techConfig.ID,
          Name: techConfig.Name || '',
          Icon: techConfig.Icon || '',
          Des: techConfig.Des || '',
          Level: currentLevel,
          CurrEff: currEff,
          CurrentEff: currEff,
          NextEff: nextEff,
          EffID: nextLevelData?.EffType || 0,
          MaxLevel: maxLevel,
          State: playerTech?.state || -1,
          UpNeedBuildingID: nextLevelData?.NeedBuildingID || 0,
          UpNeedBuildingLevel: nextLevelData?.NeedBuildingLevel || 0,
          UpNeedFood: nextLevelData?.CostFood || 0,
          UpNeedMoney: nextLevelData?.CostMoney || 0,
          UpNeedGold: nextLevelData?.CostGold || 0,
          UpNeedMen: (nextLevelData as any)?.CostMen || 0,
          UpNeedArea: (nextLevelData as any)?.NeedArea || 0,
          UpNeedTime: nextLevelData?.CostTime || 0,
          UpNeedTechnicID: (nextLevelData as any)?.DependTechnicID || 0,
          UpNeedTechnicLevel: (nextLevelData as any)?.DependTechnicLevel || 0,
          UpNeedTechnicName: dependTechnic?.Name || '',
          CanUpgrade: canUpgrade,
          AreaCheck: areaCheck,
          EventID: 0,
        };
      }).filter(Boolean);

    return success(c, {
      cityId,
      buildingIndex,
      techs: relatedTechs,
      total: relatedTechs.length,
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

/**
 * GetUserTechnic - 获取用户所有科技（完整信息）
 * 对应 C# Technic.cs getTechnicEffValue 逻辑
 */
app.get('/user', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city: any = await db.prepare(`
      SELECT id, name FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();
    if (!city) return error(c, 'No city found', 404);

    // 获取该用户所有科技
    const playerTechs = await db.prepare(`
      SELECT * FROM technics WHERE wallet_address = ?
    `).bind(walletAddress).all();

    const techMap: Record<number, any> = {};
    for (const tech of (playerTechs.results || [])) {
      techMap[(tech as any).static_index] = tech;
    }

    // 构建所有科技的完整信息
    const allTechs = (technicConfigs || []).map((techConfig: any) => {
      const playerTech = techMap[techConfig.ID];
      const currentLevel = playerTech?.technic_level || 0;
      const levelData = getLevelData(techConfig.InteriorData, currentLevel);
      const nextLevelData = getNextLevelData(techConfig.InteriorData, currentLevel);
      const maxLevel = techConfig.InteriorData?.length || 1;

      return {
        ID: techConfig.ID,
        Index: techConfig.ID,
        Name: techConfig.Name || '',
        Icon: techConfig.Icon || '',
        Des: techConfig.Des || '',
        Level: currentLevel,
        CurrEff: currentLevel > 0 ? (levelData?.EffValue || 0) : 0,
        CurrentEff: currentLevel > 0 ? (levelData?.EffValue || 0) : 0,
        NextEff: nextLevelData?.EffValue || 0,
        EffID: nextLevelData?.EffType || techConfig.InteriorData?.[0]?.EffType || 0,
        MaxLevel: maxLevel,
        State: playerTech?.state ?? -1,
        IsUnlocked: currentLevel > 0,
        CanUpgrade: !!nextLevelData,
        UpNeedBuildingID: nextLevelData?.NeedBuildingID || 0,
        UpNeedBuildingLevel: nextLevelData?.NeedBuildingLevel || 0,
        UpNeedFood: nextLevelData?.CostFood || 0,
        UpNeedMoney: nextLevelData?.CostMoney || 0,
        UpNeedGold: nextLevelData?.CostGold || 0,
        UpNeedMen: (nextLevelData as any)?.CostMen || 0,
        UpNeedArea: (nextLevelData as any)?.NeedArea || 0,
        UpNeedTime: nextLevelData?.CostTime || 0,
        EventID: 0,
        // 静态配置属性
        DependPos: techConfig.DependPos || 0,
        DependBuildingID: techConfig.DependBuildingID || 0,
        DependArea: techConfig.DependArea || 0,
      };
    });

    // 计算科技效果汇总
    const effectSummary: Record<string, number> = {};
    for (const techConfig of (technicConfigs || [])) {
      const playerTech = techMap[techConfig.ID];
      const level = playerTech?.technic_level || 0;
      if (level > 0) {
        const levelData = getLevelData(techConfig.InteriorData, level);
        if (levelData) {
          const effType = levelData.EffType;
          const effValue = levelData.EffValue;

          // 特殊加成（从配置读取）
          const bonus = getTechBonus(techConfig.ID);
          const finalEff = effValue + bonus;

          const typeName = getEffectTypeName(effType);
          effectSummary[typeName] = (effectSummary[typeName] || 0) + finalEff;
        }
      }
    }

    return success(c, {
      cityId: (city as any).id,
      cityName: (city as any).name,
      techs: allTechs,
      effectSummary,
      total: allTechs.length,
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

/**
 * UpdateTechnicLevel - 更新科技等级（完成后回调）
 * 对应 C# Technic.UpdateTechnicLevel(userName, eventID, cityID, technicIndex, level)
 */
app.post('/level', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { event_id, city_id, technic_index, level } = await c.req.json();

  if (!technic_index || level === undefined) {
    return error(c, 'Missing required fields: technic_index, level', 400);
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 验证城市归属
    const city: any = await db.prepare(`
      SELECT id, money, food FROM cities WHERE wallet_address = ? ${city_id ? 'AND id = ?' : 'ORDER BY id ASC LIMIT 1'}
    `).bind(city_id ? [walletAddress, city_id] : [walletAddress]).first();
    if (!city) return error(c, 'City not found', 404);

    // 获取当前科技记录
    const tech: any = await db.prepare(`
      SELECT * FROM technics WHERE wallet_address = ? AND static_index = ?
    `).bind(walletAddress, technic_index).first();

    const config = (technicConfigs || []).find((t: any) => t.ID === technic_index);
    if (!config) return error(c, 'Tech config not found', 404);

    const currentLevel = tech?.technic_level || 0;
    const targetLevel = typeof level === 'number' ? level : currentLevel + 1;

    if (targetLevel <= currentLevel) {
      return error(c, `Target level ${targetLevel} must be greater than current level ${currentLevel}`, 400);
    }

    // 如果 event_id 提供，更新对应的时间事件状态
    if (event_id) {
      await db.prepare(`
        UPDATE time_events SET state = 1 WHERE id = ? AND wallet_address = ?
      `).bind(event_id, walletAddress).run();
    }

    // 更新科技等级
    const updateResult = await db.prepare(`
      INSERT OR REPLACE INTO technics (wallet_address, city_id, static_index, technic_level, state, build_id)
      VALUES (?, ?, ?, ?, 0, 0)
    `).bind(walletAddress, city.id, technic_index, targetLevel).run();

    const levelData = getLevelData(config.InteriorData, targetLevel) as any;
    const effectType = levelData?.EffType || 0;
    const effectValue = levelData?.EffValue || 0;

    return success(c, {
      technicId: technic_index,
      name: config.Name,
      previousLevel: currentLevel,
      newLevel: targetLevel,
      effectType,
      effectValue,
      message: `${config.Name} 升级至 Lv.${targetLevel}，效果值: ${effectValue}`,
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

/**
 * 计算科技效果对建筑/资源的影响
 * 对应 C# Technic.GetStaticEffectValueByLevel 逻辑
 */
app.get('/effect-calc', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { effect_type, technic_index, level } = c.req.query();
  const effType = parseInt(effect_type || '0');
  const techIndex = parseInt(technic_index || '0');
  const lvl = parseInt(level || '0');

  if (!effType || !techIndex || !lvl) {
    return error(c, 'Missing required fields: effect_type, technic_index, level', 400);
  }

  try {
    const config = (technicConfigs || []).find((t: any) => t.ID === techIndex);
    if (!config) return error(c, 'Tech config not found', 404);

    const levelData = config.InteriorData?.find((l: any) => l.Level === lvl);
    if (!levelData) return error(c, `Level ${lvl} not found in tech ${techIndex}`, 404);

    const baseValue = levelData.EffValue || 0;

    // 应用特殊加成（从配置读取）
    const bonus = getTechBonus(techIndex);
    let finalValue = baseValue + bonus;

    if (techIndex === 1) {
      // 移山填海：返回面积上限
      const maxArea = baseValue;
      return success(c, { maxArea, baseValue, bonus, effectType: effType });
    }
    if (techIndex === 13) {
      // 仓库扩容：返回物品存储上限 (ItemCountOfOneCity 默认 50)
      const defaultItemCount = 50;
      const maxItems = baseValue > 0 ? baseValue : defaultItemCount;
      return success(c, { maxItems, baseValue, bonus, effectType: effType });
    }

    return success(c, {
      effectValue: finalValue,
      baseValue,
      bonus,
      effectType: effType,
      technicIndex: techIndex,
      level: lvl,
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

/**
 * 根据效果类型名称映射
 */
function getEffectTypeName(effType: number): string {
  const map: Record<number, string> = {
    1: 'AREA',          // 移山填海 - 面积上限
    2: 'BUILDING_LEVEL', // 土木技术 - 建筑等级上限
    3: 'HERO_COUNT',    // 招贤纳士 - 侠客数量
    4: 'DEFENCE_COUNT', // 计量技术 - 城防单位数量
    5: 'WALL_LEVEL',    // 城墙升级 - 城墙等级
    6: 'ARCHER_TOWER',  // 箭塔升级 - 箭塔等级
    7: 'TRAP',          // 陷阱升级 - 陷阱等级
    8: 'ROLLING_LOG',   // 滚木升级 - 滚木等级
    9: 'STONE_THROWER', // 礌石升级 - 礌石等级
    10: 'RECRUIT_SPEED', // 厉兵秣马 - 招募时间
    11: 'TRAIN_EFFECT',  // 犒劳三军 - 训练效果
    12: 'TRAIN_SPEED',   // 枕戈待旦 - 训练时间
    13: 'STORAGE',       // 仓库扩容 - 物品上限
    14: 'BUILD_SPEED',   // 器械应用 - 建造时间
    15: 'MARCH_SPEED',   // 令行禁止 - 行军速度
  };
  return map[effType] || `TYPE_${effType}`;
}

// ========== 缺失方法补充（C# Technic.cs 参考实现）==========

/**
 * isBeTechnic - 检查指定科技是否在玩家的科技列表中
 * 对应 C# Technic.isBeTechnic(ArrayList technicList, int technicId)
 */
function isBeTechnic(technicList: any[], technicId: number): boolean {
  return technicList.some((t: any) => t.StaticIndex === technicId);
}

/**
 * checkTechnicFull - 检查指定建筑关联的科技是否都存在（补充缺失的）
 * 对应 C# Technic.checkTechnicFull(userName, cityID, buildingIndex)
 * 逻辑：
 *   1. 获取该 buildingIndex 关联的所有科技（DependBuildingID = buildingIndex）
 *   2. 获取玩家已有的科技列表
 *   3. 若有科技缺失，自动创建记录（state=-1, level=0）并插入数据库
 *   4. 返回更新后的完整科技列表
 */
async function checkTechnicFull(
  db: any,
  walletAddress: string,
  cityId: number,
  buildingIndex: number
): Promise<{ technicList: any[]; newlyAdded: number[] }> {
  // 获取该建筑关联的所有科技
  const relatedTechs = (technicConfigs || []).filter(
    (t: any) => t.DependBuildingID === buildingIndex
  );

  if (relatedTechs.length === 0) {
    return { technicList: [], newlyAdded: [] };
  }

  // 获取玩家已有的科技
  const playerTechs: any = await db.prepare(`
    SELECT * FROM technics WHERE wallet_address = ? AND city_id = ?
  `).bind(walletAddress, cityId).all();

  const existingMap = new Map<number, any>();
  for (const tech of (playerTechs.results || [])) {
    existingMap.set((tech as any).static_index, tech);
  }

  const technicList: any[] = [];
  const newlyAdded: number[] = [];

  for (const techConfig of relatedTechs) {
    const techId = techConfig.ID;
    const existing = existingMap.get(techId);

    if (existing) {
      technicList.push(existing);
    } else {
      // 科技不存在，自动创建（state=-1 表示未激活，level=0）
      const insertResult = await db.prepare(`
        INSERT INTO technics (wallet_address, city_id, static_index, technic_level, state, build_id)
        VALUES (?, ?, ?, 0, -1, 0)
      `).bind(walletAddress, cityId, techId).run();

      const newTech = {
        id: insertResult.meta?.last_row_id,
        wallet_address: walletAddress,
        city_id: cityId,
        static_index: techId,
        technic_level: 0,
        state: -1,
        build_id: 0,
      };
      technicList.push(newTech);
      newlyAdded.push(techId);
    }
  }

  return { technicList, newlyAdded };
}

/**
 * GetStaticEffectValueByLevel - 获取指定科技指定等级的效果值（含加成）
 * 对应 C# Technic.GetStaticEffectValueByLevel(technicIndex, level)
 */
function getStaticEffectValueByLevel(techIndex: number, level: number): number {
  if (level <= 0) return 0;

  const config = (technicConfigs || []).find((t: any) => t.ID === techIndex);
  if (!config) return 0;

  const levelData = getLevelData(config.InteriorData, level);
  if (!levelData) return 0;

  const baseValue = levelData.EffValue || 0;
  const bonus = getTechBonus(techIndex);
  return baseValue + bonus;
}

export default app;
