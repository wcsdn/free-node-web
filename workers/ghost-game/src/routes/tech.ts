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

// 获取所有科技配置
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

    if (nextLevelData.DependTechnicID && nextLevelData.DependTechnicLevel) {
      const preTech: any = await db.prepare(`
        SELECT technic_level FROM technics WHERE user_name = ? AND static_index = ?
      `).bind(walletAddress, (nextLevelData as any).DependTechnicID).first();

      if (!preTech || preTech.technic_level < (nextLevelData as any).DependTechnicLevel) {
        return error(c, `Need technic ${(nextLevelData as any).DependTechnicID} at level ${(nextLevelData as any).DependTechnicLevel}`);
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

export default app;
