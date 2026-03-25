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

// 科技效果类型
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
      SELECT * FROM technics WHERE user_name = ? ORDER BY static_index
    `).bind(walletAddress).all();

    const techMap: Record<number, any> = {};
    for (const tech of (playerTechs.results || [])) {
      techMap[(tech as any).static_index] = tech;
    }

    const techsWithStatus = (technicConfigs || []).map((techConfig: any) => {
      const playerTech = techMap[techConfig.ID];
      const currentLevel = playerTech?.technic_level || 0;
      const nextLevelData = techConfig.InteriorData?.[currentLevel] as any;

      // 查找升级所需的科技依赖
      const dependTechnic = nextLevelData?.DependTechnicID
        ? (technicConfigs || []).find((t: any) => t.ID === nextLevelData.DdependTechnicID)
        : null;

      return {
        // 小写字段 (兼容)
        id: techConfig.ID,
        name: techConfig.Name,
        icon: techConfig.Icon,
        description: techConfig.Des,
        level: currentLevel,
        maxLevel: techConfig.InteriorData?.length || 1,
        effect: currentLevel > 0 ? techConfig.InteriorData?.[currentLevel - 1]?.EffValue || 0 : 0,
        nextEffect: nextLevelData?.EffValue || 0,
        canUpgrade: currentLevel < (techConfig.InteriorData?.length || 1),
        isUnlocked: currentLevel > 0,
        state: playerTech?.state || 0,
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
        CurrEff: currentLevel > 0 ? techConfig.InteriorData?.[currentLevel - 1]?.EffValue || 0 : 0,
        CurrentEff: currentLevel > 0 ? techConfig.InteriorData?.[currentLevel - 1]?.EffValue || 0 : 0,
        // C# TechnicInfo.NextEff: 下一级科技效果值 (前端 Tips.js 使用)
        NextEff: nextLevelData?.EffValue || 0,
        EffID: techConfig.EffectID || nextLevelData?.EffType || 0,
        MaxLevel: techConfig.InteriorData?.length || 1,
        State: playerTech?.state || 0,
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
    });

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
      SELECT * FROM technics WHERE user_name = ? ORDER BY static_index
    `).bind(walletAddress).all();

    const techMap: Record<number, any> = {};
    for (const tech of (playerTechs.results || [])) {
      techMap[(tech as any).static_index] = tech;
    }

    const techsWithStatus = (technicConfigs || []).map((techConfig: any) => {
      const playerTech = techMap[techConfig.ID];
      const currentLevel = playerTech?.technic_level || 0;
      const nextLevelData = techConfig.InteriorData?.[currentLevel];
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
        maxLevel: techConfig.InteriorData?.length || 1,
        effect: currentLevel > 0 ? techConfig.InteriorData?.[currentLevel - 1]?.EffValue || 0 : 0,
        nextEffect: nextLevelData?.EffValue || 0,
        canUpgrade: currentLevel < (techConfig.InteriorData?.length || 1),
        isUnlocked: currentLevel > 0,
        state: playerTech?.state || 0,
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
        CurrEff: currentLevel > 0 ? techConfig.InteriorData?.[currentLevel - 1]?.EffValue || 0 : 0,
        CurrentEff: currentLevel > 0 ? techConfig.InteriorData?.[currentLevel - 1]?.EffValue || 0 : 0,
        // C# TechnicInfo.NextEff: 下一级科技效果值 (前端 Tips.js 使用)
        NextEff: nextLevelData?.EffValue || 0,
        EffID: techConfig.EffectID || nextLevelData?.EffType || 0,
        MaxLevel: techConfig.InteriorData?.length || 1,
        State: playerTech?.state || 0,
        UpNeedBuildingID: nextLevelData?.NeedBuildingID || 0,
        UpNeedBuildingLevel: nextLevelData?.NeedBuildingLevel || 0,
        UpNeedFood: nextLevelData?.CostFood || 0,
        UpNeedMoney: nextLevelData?.CostMoney || 0,
        UpNeedMen: nextLevelData?.CostMen || 0,
        UpNeedGold: nextLevelData?.CostGold || 0,
        UpNeedArea: nextLevelData?.NeedArea || 0,
        UpNeedTime: nextLevelData?.CostTime || 0,
        UpNeedTechnicID: nextLevelData?.DependTechnicID || 0,
        UpNeedTechnicLevel: nextLevelData?.DependTechnicLevel || 0,
        UpNeedTechnicName: dependTechnic?.Name || '',
        Icon: techConfig.Icon || '',
        Area: techConfig.DependArea || 0,
        EventID: 0,
      };
    });

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
        SELECT * FROM technics WHERE user_name = ? AND static_index = ?
      `).bind(walletAddress, techId).all();
      if (techs.results && techs.results.length > 0) {
        playerTech = techs.results[0];
        currentLevel = (playerTech as any).technic_level || 0;
      }
    }

    const nextLevelData = techConfig.InteriorData?.[currentLevel] as any;
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
        effect: currentLevel > 0 ? techConfig.InteriorData?.[currentLevel - 1]?.EffValue || 0 : 0,
        nextEffect: nextLevelData?.EffValue || 0,
        canUpgrade: currentLevel < (techConfig.InteriorData?.length || 1),
        isUnlocked: currentLevel > 0,
        state: playerTech?.state || 0,
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
        CurrEff: currentLevel > 0 ? techConfig.InteriorData?.[currentLevel - 1]?.EffValue || 0 : 0,
        CurrentEff: currentLevel > 0 ? techConfig.InteriorData?.[currentLevel - 1]?.EffValue || 0 : 0,
        // C# TechnicInfo.NextEff: 下一级科技效果值 (前端 Tips.js 使用)
        NextEff: nextLevelData?.EffValue || 0,
        EffID: (techConfig as any).EffectID || nextLevelData?.EffType || 0,
        MaxLevel: techConfig.InteriorData?.length || 1,
        State: playerTech?.state || 0,
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
      SELECT * FROM technics WHERE user_name = ? ORDER BY static_index
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
      const nextLevelData = techConfig.InteriorData?.[currentLevel]; // 下一级数据

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
          ? techConfig.InteriorData?.[currentLevel - 1]?.EffValue || 0 
          : 0,
        nextEffect: nextLevelData?.EffValue || 0,
        canUpgrade: currentLevel < (techConfig.InteriorData?.length || 1),
        isUnlocked: currentLevel > 0,
        state: playerTech?.state || 0,
        
        // C# TechnicInfo 字段 (驼峰)
        ID: techConfig.ID,
        Index: techConfig.ID,
        Name: techConfig.Name || '',
        Des: techConfig.Des || '',
        Level: playerTech?.level || 0,
        CurrEff: currentLevel > 0 ? techConfig.InteriorData?.[currentLevel - 1]?.EffValue || 0 : 0,
        CurrentEff: currentLevel > 0 ? techConfig.InteriorData?.[currentLevel - 1]?.EffValue || 0 : 0,
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
      WHERE t.user_name = ? AND t.state = 1
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
      SELECT * FROM technics WHERE user_name = ? AND static_index = ?
    `).bind(walletAddress, static_index).first();

    const currentLevel = currentTech?.technic_level || 0;
    const nextLevelData = config.InteriorData?.[currentLevel];

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
        SELECT technic_level FROM technics WHERE user_name = ? AND static_index = ?
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
        INSERT OR REPLACE INTO technics (user_name, city_id, static_index, technic_level, state, build_id)
        VALUES (?, ?, ?, ?, 1, 0)
      `).bind(walletAddress, city.id, static_index, currentLevel).run();

      // 创建时间事件
      await db.prepare(`
        INSERT INTO time_events (wallet_address, city_id, event_type, target_id, start_time, end_time, state)
        VALUES (?, ?, 2, ?, datetime('now'), datetime('?', 'unixepoch'), 0)
      `).bind(walletAddress, city.id, techResult.meta.last_row_id, endTime.getTime() / 1000).run();

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
        INSERT OR REPLACE INTO technics (user_name, city_id, static_index, technic_level, state, build_id)
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
      WHERE t.id = ? AND t.user_name = ?
    `).bind(techId, walletAddress).first();

    if (!tech) return error(c, 'Tech not found');

    const config = (technicConfigs || []).find((t: any) => t.ID === tech.static_index);
    if (!config) return error(c, 'Tech config not found');

    const currentLevel = tech.technic_level;
    const nextLevelData = config.InteriorData?.[currentLevel];

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
      SELECT * FROM technics WHERE user_name = ? AND technic_level > 0
    `).bind(walletAddress).all();

    const effects: Record<string, number> = {};
    let totalBonus = 0;

    for (const tech of (techs.results || [])) {
      const config = (technicConfigs || []).find((t: any) => t.ID === (tech as any).static_index);
      if (config && config.InteriorData?.[(tech as any).technic_level - 1]) {
        const levelData = config.InteriorData[(tech as any).technic_level - 1];
        const effectType = levelData.EffType;
        const effectValue = levelData.EffValue;
        
        const typeName = Object.entries(TECH_EFFECT_TYPES).find(([_, v]) => v === effectType)?.[0] || 'UNKNOWN';
        effects[typeName] = (effects[typeName] || 0) + effectValue;
        totalBonus += effectValue;
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
      SELECT * FROM technics WHERE user_name = ? ORDER BY static_index
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
        const nextLevelData = techConfig.InteriorData?.[currentLevel];

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

export default app;
