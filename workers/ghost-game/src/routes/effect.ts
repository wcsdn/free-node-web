/**
 * Effect Routes - 效果系统
 * 参考 jx/BLL/PersistEffect.cs
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import persistEffectGroupsData from '../config/persist_effect_groups.json';
import persistEffectsData from '../config/persist_effects.json';

const app = new Hono<{ Bindings: Env }>();

// 持久效果配置（从 persist_effect_groups.json 加载）
interface PersistEffectConfig {
  ID: number;
  MainEffectType: number;
  EffectType: number;
  Name: string;
  PersistTime: number;
  Gold: number;
  [key: string]: any;
}

const PERSIST_EFFECT_GROUPS: Record<number, PersistEffectConfig> =
  (persistEffectGroupsData.EffectGroup as PersistEffectConfig[]).reduce((acc, item) => {
    acc[item.ID] = item;
    return acc;
  }, {} as Record<number, PersistEffectConfig>);

// 子效果配置（从 persist_effects.json 加载）
// 参考 jx/BLL/PersistEffect.translateEffectGroupInfo 中 PersistEffectArray 的构建逻辑
// XmlData.PersistEffect[k] -> { Des, Type, Value }
interface PersistEffectItem {
  ID: number;
  Type: number;
  Value: number;
  Name: string;
  Des: string;
  [key: string]: any;
}

const PERSIST_EFFECTS: Record<number, PersistEffectItem> =
  ((persistEffectsData as any).Effect || []).reduce((acc: Record<number, PersistEffectItem>, item: PersistEffectItem) => {
    acc[item.ID] = item;
    return acc;
  }, {} as Record<number, PersistEffectItem>);

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

/**
 * 刷新城市资源（持续效果变更后调用）
 * 参考 jx/BLL/PersistEffect.UpdatePersistEffectByGroupID 中的 CityInterior.GetCityInteriorInfo 调用
 * 逻辑：
 *   1. 获取当前激活的持续效果
 *   2. 计算各类资源加成倍率
 *   3. 更新城市资源（钱/粮等）
 */
async function refreshCityResources(db: any, walletAddress: string, cityId: number): Promise<void> {
  // 获取用户城市
  let city: any;
  if (cityId) {
    city = await db.prepare(
      `SELECT * FROM cities WHERE wallet_address = ? AND id = ?`
    ).bind(walletAddress, cityId).first();
  } else {
    city = await db.prepare(
      `SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1`
    ).bind(walletAddress).first();
  }
  if (!city) return;

  // 获取当前激活的持续效果
  const activeEffects: any[] = await (db.prepare(`
    SELECT pe.*, pg.PersistTime, pg.Gold
    FROM persist_effects pe
    LEFT JOIN persist_effect_groups pg ON pe.static_index = pg.id
    WHERE pe.wallet_address = ? AND pe.end_time > datetime('now')
    ORDER BY pe.created_at DESC
  `).bind(walletAddress).all() as any).results || [];

  // 计算资源加成倍率（参考 C# PersistEffect.UpdateResSpeed）
  let goldSpeedPer = 1.0;
  let foodSpeedPer = 1.0;
  let vipExtraGold = 0;
  let vipExtraFood = 0;

  for (const effect of activeEffects) {
    const mainType = effect.main_effect_type;
    const staticIdx = effect.static_index;
    const cfg = PERSIST_EFFECT_GROUPS[staticIdx];
    if (!cfg) continue;

    if (mainType === 1) {
      // VIP 效果：从效果配置动态读取加成（参考 C# UpdateResSpeed 遍历 PersistEffectArray）
      // EffectID1~6 对应 persist_effects.json 中的子效果，Type 3=金币增长，Type 2=粮食增长
      const effectIds: number[] = [];
      for (let i = 1; i <= 6; i++) {
        const id = cfg[`EffectID${i}`];
        if (id) effectIds.push(id);
      }
      for (const effectId of effectIds) {
        const effectInfo = PERSIST_EFFECTS[effectId];
        if (effectInfo) {
          if (effectInfo.Type === 3) {
            // VIP铜钱增长 Value 单位是%，实际使用需 * 0.01
            vipExtraGold += effectInfo.Value;
          } else if (effectInfo.Type === 2) {
            // VIP粮食增长
            vipExtraFood += effectInfo.Value;
          }
        }
      }
    } else if (mainType === 3) {
      // 帐房先生：金币产量加成 +10%（从效果配置读取）
      for (let i = 1; i <= 6; i++) {
        const effectId = cfg[`EffectID${i}`];
        if (effectId) {
          const effectInfo = PERSIST_EFFECTS[effectId];
          if (effectInfo) {
            goldSpeedPer += effectInfo.Value * 0.01;
          }
        }
      }
    } else if (mainType === 4) {
      // 农具：粮食产量加成（从效果配置读取）
      for (let i = 1; i <= 6; i++) {
        const effectId = cfg[`EffectID${i}`];
        if (effectId) {
          const effectInfo = PERSIST_EFFECTS[effectId];
          if (effectInfo) {
            foodSpeedPer += effectInfo.Value * 0.01;
          }
        }
      }
    }
  }

  // 应用加成并更新城市资源
  const newMoney = Math.min(Math.floor(city.money * goldSpeedPer) + vipExtraGold, 999999999);
  const newFood = Math.min(Math.floor(city.food * foodSpeedPer) + vipExtraFood, 999999999);

  await db.prepare(`
    UPDATE cities SET money = ?, food = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(newMoney, newFood, city.id).run();
}

// ==================== GET /effect/persist-group - 获取持久效果分组 ====================

app.get('/persist-group', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const city_id = c.req.query('city_id');
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const effects = await db.prepare(`
      SELECT * FROM persist_effects
      WHERE wallet_address = ? AND city_id = ?
      ORDER BY created_at DESC
    `).bind(walletAddress, city_id || 0).all();

    const grouped: Record<string, any[]> = {};
    (effects.results || []).forEach((e: any) => {
      if (!grouped[e.effect_type]) grouped[e.effect_type] = [];
      grouped[e.effect_type].push(e);
    });

    return success(c, grouped);
  } catch (err: any) {
    return success(c, {});
  }
});

// ==================== GET /effect/over-array - 获取过期效果数组 ====================

app.get('/over-array', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const expiredEffects = await db.prepare(`
      SELECT * FROM persist_effects
      WHERE wallet_address = ? AND end_time < datetime('now')
    `).bind(walletAddress).all();

    return success(c, expiredEffects.results || []);
  } catch (err: any) {
    return success(c, []);
  }
});

// ==================== POST /effect/process-overdue - 处理过期效果 ====================

app.post('/process-overdue', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID, eventID } = await c.req.json().catch(() => ({}));

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result = await db.prepare(`
      DELETE FROM persist_effects
      WHERE wallet_address = ? AND end_time < datetime('now')
    `).bind(walletAddress).run();

    return success(c, {
      message: 'Overdue effects processed',
      deletedCount: result.meta.changes,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ==================== POST /effect/update - 更新持久效果（通过StaticIndex） ====================
// 参考 jx/BLL/PersistEffect.UpdatePersistEffectByGroupID(userName, cityID, StaticIndex)
// 逻辑：
//   - 如果用户已有该主类型效果 → 延长持续时间
//   - 如果没有 → 创建新效果
// 返回: 0=成功, 非0=错误码

app.post('/update', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const body = await c.req.json().catch(() => ({}));
    const cityID = parseInt(body.cityID as string) || 0;
    const staticIndex = parseInt(body.staticIndex as string);

    if (isNaN(staticIndex) || staticIndex <= 0) {
      return error(c, 'staticIndex is required and must be positive');
    }

    // 从配置获取效果数据
    // persist_effect_groups.json 中 staticIndex 对应的效果
    let effectConfig: any = PERSIST_EFFECT_GROUPS[staticIndex] || null;

    if (!effectConfig) {
      return error(c, `Effect config not found for staticIndex: ${staticIndex}`, 404);
    }

    const mainEffectType = effectConfig.mainEffectType || effectConfig.main_effect_type;
    const effectType = effectConfig.effectType || effectConfig.effect_type;
    const persistTime = effectConfig.PersistTime || 3600; // 默认1小时
    const goldCost = effectConfig.Gold || 0;

    // 检查用户金币是否足够
    const char: any = await db.prepare(
      `SELECT gold FROM characters WHERE wallet_address = ?`
    ).bind(walletAddress).first();

    if (!char) return error(c, 'Character not found', 404);

    if (char.gold < goldCost) {
      return error(c, `Insufficient gold. Required: ${goldCost}, Available: ${char.gold}`, 400);
    }

    // 查询是否已有该主类型的效果
    const existingEffect: any = await db.prepare(`
      SELECT * FROM persist_effects
      WHERE wallet_address = ? AND main_effect_type = ? AND city_id = ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(walletAddress, mainEffectType, cityID).first();

    let resultCode = 0;
    const now = new Date();

    // effectValue 从效果配置的第一个子效果 ID 读取（参考 C# translateEffectGroupInfo 构建 PersistEffectArray 的逻辑）
    let effectValue = 1;
    const firstEffectId = effectConfig.EffectID1 || effectConfig.effectID1;
    if (firstEffectId) {
      const firstEffect = PERSIST_EFFECTS[firstEffectId];
      if (firstEffect) {
        effectValue = firstEffect.Value;
      }
    }

    if (!existingEffect) {
      // 添加新效果
      const endTime = new Date(now.getTime() + persistTime * 1000);
      await db.prepare(`
        INSERT INTO persist_effects (
          wallet_address, city_id, static_index, main_effect_type,
          effect_type, effect_value, start_time, end_time, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'))
      `).bind(
        walletAddress, cityID, staticIndex, mainEffectType,
        effectType, effectValue,
        endTime.toISOString().replace('T', ' ').slice(0, 19)
      ).run();

      resultCode = 0;
    } else {
      // 延长已有效果的持续时间
      // 参考 C#: EndTime = effectSingle.EndTime.AddSeconds(XmlData.PersistEffectGroup[StaticIndex].PersistTime)
      const currentEndTime = new Date(existingEffect.end_time);
      const newEndTime = new Date(currentEndTime.getTime() + persistTime * 1000);

      await db.prepare(`
        UPDATE persist_effects
        SET end_time = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        newEndTime.toISOString().replace('T', ' ').slice(0, 19),
        existingEffect.id
      ).run();

      resultCode = 0;
    }

    // 扣除元宝
    if (goldCost > 0) {
      await db.prepare(`
        UPDATE characters SET gold = gold - ?, updated_at = datetime('now')
        WHERE wallet_address = ?
      `).bind(goldCost, walletAddress).run();
    }

    // 参考 jx/BLL/PersistEffect.UpdatePersistEffectByGroupID:
    // 正常添加效果后更新DB资源（模拟 CityInterior.GetCityInteriorInfo）
    try {
      await refreshCityResources(db, walletAddress, cityID);
    } catch (_) { /* ignore if resource refresh fails */ }

    return success(c, {
      result: resultCode,
      message: resultCode === 0 ? 'Effect updated successfully' : 'Update failed',
      staticIndex,
      cityID,
      goldCost,
      newGold: char.gold - goldCost,
      effectType: mainEffectType,
      persistTime,
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

// ==================== POST /effect/update-by-type - 通过主类型和效果类型更新 ====================
// 参考 jx/BLL/PersistEffect.UpdatePersistEffectByType(userName, cityID, MainEffectType, EffectType)
// 遍历 PERSIST_EFFECT_GROUPS 找到匹配的 StaticIndex，然后调用 update

app.post('/update-by-type', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const body = await c.req.json().catch(() => ({}));
    const cityID = parseInt(body.cityID as string) || 0;
    const mainEffectType = parseInt(body.mainEffectType as string);
    const effectType = parseInt(body.effectType as string);

    if (isNaN(mainEffectType)) {
      return error(c, 'mainEffectType is required');
    }

    // 从 PERSIST_EFFECT_GROUPS 中找到匹配的 staticIndex
    let matchedStaticIndex: number | null = null;
    for (const [idx, cfg] of Object.entries(PERSIST_EFFECT_GROUPS)) {
      const effectCfg = cfg as any;
      if (
        effectCfg.EffectType === effectType &&
        effectCfg.MainEffectType === mainEffectType
      ) {
        matchedStaticIndex = parseInt(idx);
        break;
      }
      if (
        effectCfg.effectType === effectType &&
        effectCfg.mainEffectType === mainEffectType
      ) {
        matchedStaticIndex = parseInt(idx);
        break;
      }
    }

    if (matchedStaticIndex === null) {
      return error(c, `No matching effect found for mainEffectType=${mainEffectType}, effectType=${effectType}`, 404);
    }

    // 从 JSON 配置获取效果参数
    const effectCfg = PERSIST_EFFECT_GROUPS[matchedStaticIndex];
    if (!effectCfg) {
      return error(c, `Effect config not found for staticIndex: ${matchedStaticIndex}`, 404);
    }

    const mainEffect = effectCfg.MainEffectType || effectCfg.mainEffectType;
    const effectVal = effectCfg.EffectType || effectCfg.effectType;
    const persistTime = effectCfg.PersistTime || 3600;
    const goldCost = effectCfg.Gold || 0;

    const char: any = await db.prepare(
      `SELECT gold FROM characters WHERE wallet_address = ?`
    ).bind(walletAddress).first();

    if (!char) return error(c, 'Character not found', 404);
    if (char.gold < goldCost) {
      return error(c, `Insufficient gold. Required: ${goldCost}, Available: ${char.gold}`, 400);
    }

    const existingEffect: any = await db.prepare(`
      SELECT * FROM persist_effects
      WHERE wallet_address = ? AND main_effect_type = ? AND city_id = ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(walletAddress, mainEffect, cityID).first();

    // effectValue 从效果配置动态读取（参考 C# translateEffectGroupInfo）
    let effectValue = 1;
    const matchedCfg = PERSIST_EFFECT_GROUPS[matchedStaticIndex];
    if (matchedCfg) {
      const firstEffectId = matchedCfg.EffectID1 || matchedCfg.effectID1;
      if (firstEffectId) {
        const firstEffect = PERSIST_EFFECTS[firstEffectId];
        if (firstEffect) {
          effectValue = firstEffect.Value;
        }
      }
    }

    const now = new Date();
    if (!existingEffect) {
      const endTime = new Date(now.getTime() + persistTime * 1000);
      await db.prepare(`
        INSERT INTO persist_effects (
          wallet_address, city_id, static_index, main_effect_type,
          effect_type, effect_value, start_time, end_time, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'))
      `).bind(
        walletAddress, cityID, matchedStaticIndex, mainEffect,
        effectVal, effectValue,
        endTime.toISOString().replace('T', ' ').slice(0, 19)
      ).run();
    } else {
      const currentEndTime = new Date(existingEffect.end_time);
      const newEndTime = new Date(currentEndTime.getTime() + persistTime * 1000);
      await db.prepare(`
        UPDATE persist_effects
        SET end_time = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        newEndTime.toISOString().replace('T', ' ').slice(0, 19),
        existingEffect.id
      ).run();
    }

    if (goldCost > 0) {
      await db.prepare(`
        UPDATE characters SET gold = gold - ?, updated_at = datetime('now')
        WHERE wallet_address = ?
      `).bind(goldCost, walletAddress).run();
    }

    // 参考 jx/BLL/PersistEffect.UpdatePersistEffectByGroupID: 效果更新后刷新城市资源
    try {
      await refreshCityResources(db, walletAddress, cityID);
    } catch (_) { /* ignore */ }

    return success(c, {
      result: 0,
      message: 'Effect updated by type successfully',
      staticIndex: matchedStaticIndex,
      cityID,
      mainEffectType,
      effectType: effectVal,
      goldCost,
      newGold: char.gold - goldCost,
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

// ==================== POST /effect/fast-move - 急行军效果 ====================
// 参考 jx/BLL/PersistEffect.updateFastMove(userName, cityID) -> UpdatePersistEffectByGroupID(..., 10)

app.post('/fast-move', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const body = await c.req.json().catch(() => ({}));
    const cityID = parseInt(body.cityID as string) || 0;

    // StaticIndex 10 = 急行军
    const FAST_MOVE_STATIC_INDEX = 10;

    const effectConfig: any = PERSIST_EFFECT_GROUPS[FAST_MOVE_STATIC_INDEX] || null;

    if (!effectConfig) {
      return error(c, 'Fast move effect config not found', 404);
    }

    const goldCost = effectConfig.Gold || 0;
    const persistTime = effectConfig.PersistTime || 3600;

    const char: any = await db.prepare(
      `SELECT gold FROM characters WHERE wallet_address = ?`
    ).bind(walletAddress).first();

    if (!char) return error(c, 'Character not found', 404);
    if (char.gold < goldCost) {
      return error(c, `Insufficient gold. Required: ${goldCost}`, 400);
    }

    const existingEffect: any = await db.prepare(`
      SELECT * FROM persist_effects
      WHERE wallet_address = ? AND static_index = ? AND city_id = ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(walletAddress, FAST_MOVE_STATIC_INDEX, cityID).first();

    const now = new Date();
    if (!existingEffect) {
      const endTime = new Date(now.getTime() + persistTime * 1000);
      await db.prepare(`
        INSERT INTO persist_effects (
          wallet_address, city_id, static_index, main_effect_type,
          effect_type, effect_value, start_time, end_time, created_at
        )
        VALUES (?, ?, ?, ?, ?, 1, datetime('now'), ?, datetime('now'))
      `).bind(
        walletAddress, cityID, FAST_MOVE_STATIC_INDEX,
        effectConfig.MainEffectType || effectConfig.mainEffectType || 10,
        effectConfig.EffectType || effectConfig.effectType || 0,
        endTime.toISOString().replace('T', ' ').slice(0, 19)
      ).run();
    } else {
      const currentEndTime = new Date(existingEffect.end_time);
      const newEndTime = new Date(currentEndTime.getTime() + persistTime * 1000);
      await db.prepare(`
        UPDATE persist_effects
        SET end_time = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        newEndTime.toISOString().replace('T', ' ').slice(0, 19),
        existingEffect.id
      ).run();
    }

    if (goldCost > 0) {
      await db.prepare(`
        UPDATE characters SET gold = gold - ?, updated_at = datetime('now')
        WHERE wallet_address = ?
      `).bind(goldCost, walletAddress).run();
    }

    return success(c, {
      result: 0,
      message: 'Fast move effect applied',
      staticIndex: FAST_MOVE_STATIC_INDEX,
      cityID,
      goldCost,
      newGold: char.gold - goldCost,
      duration: persistTime,
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

// ==================== GET /effect/by-build-index/:buildIndex - 获取指定建筑索引关联的持续效果 ====================
// 参考 jx/BLL/PersistEffect.GetPersistEffectByBuildIndex(userName, buildIndex)
// 根据建筑索引返回该建筑可能关联的所有持续效果组（已激活的包含 state=1，未激活的 state=0）
// buildIndex 映射：
//   1  -> 聚义厅: StaticIndex 1(VIP7天), 2(VIP30天), 7(与世无争8小时), 8(与世无争2天), 9(与世无争7天)
//   2  -> 义舍: StaticIndex 3(召集令)
//   3  -> 农场: StaticIndex 5(农具)
//   4  -> 钱庄: StaticIndex 4(帐房先生)
//   11 -> 急行军: StaticIndex 10(兵贵神速)
//   12-21 -> 各门派建筑: StaticIndex 6(白驹丸)

app.get('/by-build-index/:buildIndex', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const buildIndex = parseInt(c.req.param('buildIndex'));
  if (isNaN(buildIndex) || buildIndex <= 0) {
    return error(c, 'Invalid buildIndex', 400);
  }

  try {
    // 获取该用户当前所有的持续效果（用于判断 state）
    const allEffects: any[] = await (db.prepare(`
      SELECT main_effect_type, end_time FROM persist_effects
      WHERE wallet_address = ? AND end_time > datetime('now')
    `).bind(walletAddress).all() as any).results || [];

    // 根据 buildIndex 确定需要返回的 StaticIndex 列表
    const targetStaticIndexes: number[] = [];
    if (buildIndex === 1) {
      targetStaticIndexes.push(1, 2, 7, 8, 9); // 聚义厅
    } else if (buildIndex === 2) {
      targetStaticIndexes.push(3); // 义舍 - 召集令
    } else if (buildIndex === 3) {
      targetStaticIndexes.push(5); // 农场 - 农具
    } else if (buildIndex === 4) {
      targetStaticIndexes.push(4); // 钱庄 - 帐房先生
    } else if (buildIndex === 11) {
      targetStaticIndexes.push(10); // 急行军
    } else if (buildIndex >= 12 && buildIndex <= 21) {
      targetStaticIndexes.push(6); // 各门派建筑 - 白驹丸
    }

    // 构建主类型到结束时间的映射（用于判断是否已激活）
    const activeByMainType = new Map<number, string>();
    for (const e of allEffects) {
      activeByMainType.set(e.main_effect_type, e.end_time);
    }

    // 参考 C# translateEffectGroupInfo + GetEffectState
    // State=1 表示用户已拥有该效果（MainEffectType 存在于用户效果列表中）
    const now = new Date();
    const effectList = targetStaticIndexes.map(staticIndex => {
      const cfg = PERSIST_EFFECT_GROUPS[staticIndex];
      if (!cfg) return null;

      const mainEffectType = cfg.MainEffectType;
      const endTimeStr = activeByMainType.get(mainEffectType);
      const isActive = !!endTimeStr && new Date(endTimeStr) > now;

      // 计算剩余秒数
      let seconds = 0;
      if (isActive) {
        seconds = Math.max(0, Math.floor((new Date(endTimeStr).getTime() - now.getTime()) / 1000));
      }

      return {
        StaticIndex: staticIndex,
        MainEffectType: mainEffectType,
        EffectType: cfg.EffectType,
        EffectName: cfg.Name,
        Gold: cfg.Gold,
        Image: cfg.Image,
        StartTime: isActive ? (activeByMainType.get(mainEffectType) ? new Date(new Date(endTimeStr).getTime() - (cfg.PersistTime || 0) * 1000).toISOString() : null) : null,
        EndTime: endTimeStr || null,
        Seconds: seconds,
        // EffectState: 1=已拥有该效果, 0=未拥有（参考 C# GetEffectState）
        State: isActive ? 1 : 0,
        // PersistEffectArray - 子效果列表（从 EffectID 数组构建）
        PersistEffectArray: buildPersistEffectArray(staticIndex),
      };
    }).filter(Boolean);

    return success(c, {
      buildIndex,
      effects: effectList,
      total: effectList.length,
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

/**
 * 根据 StaticIndex 构建子效果数组
 * 参考 jx/BLL/PersistEffect.translateEffectGroupInfo 中构建 PersistEffectArray 的逻辑
 */
function buildPersistEffectArray(staticIndex: number): Array<{
  StaticIndex: number;
  Type: number;
  Des: string;
  Value: number;
}> {
  const cfg = PERSIST_EFFECT_GROUPS[staticIndex];
  if (!cfg) return [];

  // 子效果 ID 列表（EffectID1 ~ EffectID6）
  const effectIds: number[] = [];
  for (let i = 1; i <= 6; i++) {
    const id = cfg[`EffectID${i}`];
    if (id) effectIds.push(id);
  }

  // 从 persist_effects.json 加载子效果描述和值（从 PERSIST_EFFECTS 读取）
  // 参考 C# translateEffectGroupInfo 中遍历 XmlData.PersistEffect[effectID] 的逻辑：
  //   persisteSinlge.Des = XmlData.PersistEffect[k].Des;
  //   persisteSinlge.Type = XmlData.PersistEffect[k].Type;
  //   persisteSinlge.Value = XmlData.PersistEffect[k].Value;
  const result: Array<{ StaticIndex: number; Type: number; Des: string; Value: number }> = [];
  for (const effectId of effectIds) {
    const effectInfo = PERSIST_EFFECTS[effectId];
    if (effectInfo) {
      result.push({
        StaticIndex: effectId,
        Type: effectInfo.Type,
        Des: effectInfo.Des,
        Value: effectInfo.Value,
      });
    }
  }
  return result;
}

// ==================== POST /effect/refresh-resources - 更新用户资源（效果变更后调用） ====================
// 参考 jx/BLL/PersistEffect.UpdatePersistEffectByGroupID 中的资源更新逻辑
// 在添加/更新持续效果后，需要更新用户的城市资源（模拟 CityInterior.GetCityInteriorInfo）

app.post('/refresh-resources', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const { cityID } = await c.req.json().catch(() => ({}));

    // 获取用户城市
    let city: any;
    if (cityID) {
      city = await db.prepare(
        `SELECT * FROM cities WHERE wallet_address = ? AND id = ?`
      ).bind(walletAddress, cityID).first();
    } else {
      city = await db.prepare(
        `SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1`
      ).bind(walletAddress).first();
    }

    if (!city) return error(c, 'City not found', 404);

    // 获取当前激活的持续效果（用于计算资源加成）
    const activeEffects: any[] = await (db.prepare(`
      SELECT pe.*, pg.PersistTime, pg.Gold
      FROM persist_effects pe
      LEFT JOIN persist_effect_groups pg ON pe.static_index = pg.id
      WHERE pe.wallet_address = ? AND pe.end_time > datetime('now')
      ORDER BY pe.created_at DESC
    `).bind(walletAddress).all() as any).results || [];

    // 计算资源加成倍率（参考 C# PersistEffect.UpdateResSpeed）
    // MainEffectType=1 (VIP): 影响钱/粮生产速度
    // MainEffectType=3 (帐房先生): 影响金币
    // MainEffectType=4 (农具): 影响粮食
    let goldSpeedPer = 1.0;
    let foodSpeedPer = 1.0;
    let vipExtraGold = 0;
    let vipExtraFood = 0;

    for (const effect of activeEffects) {
      const mainType = effect.main_effect_type;
      const staticIdx = effect.static_index;
      const cfg = PERSIST_EFFECT_GROUPS[staticIdx];
      if (!cfg) continue;

      if (mainType === 1) {
        // VIP 效果：从效果配置动态读取加成（参考 C# UpdateResSpeed 遍历 PersistEffectArray）
        const effectIds: number[] = [];
        for (let i = 1; i <= 6; i++) {
          const id = cfg[`EffectID${i}`];
          if (id) effectIds.push(id);
        }
        for (const effectId of effectIds) {
          const effectInfo = PERSIST_EFFECTS[effectId];
          if (effectInfo) {
            if (effectInfo.Type === 3) {
              vipExtraGold += effectInfo.Value;
            } else if (effectInfo.Type === 2) {
              vipExtraFood += effectInfo.Value;
            }
          }
        }
      } else if (mainType === 3) {
        // 帐房先生：金币产量加成（从效果配置读取）
        for (let i = 1; i <= 6; i++) {
          const effectId = cfg[`EffectID${i}`];
          if (effectId) {
            const effectInfo = PERSIST_EFFECTS[effectId];
            if (effectInfo) {
              goldSpeedPer += effectInfo.Value * 0.01;
            }
          }
        }
      } else if (mainType === 4) {
        // 农具：粮食产量加成（从效果配置读取）
        for (let i = 1; i <= 6; i++) {
          const effectId = cfg[`EffectID${i}`];
          if (effectId) {
            const effectInfo = PERSIST_EFFECTS[effectId];
            if (effectInfo) {
              foodSpeedPer += effectInfo.Value * 0.01;
            }
          }
        }
      }
    }

    // 应用加成并更新城市资源
    const newMoney = Math.floor(city.money * goldSpeedPer) + vipExtraGold;
    const newFood = Math.floor(city.food * foodSpeedPer) + vipExtraFood;

    await db.prepare(`
      UPDATE cities SET money = ?, food = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(Math.min(newMoney, 999999999), Math.min(newFood, 999999999), city.id).run();

    return success(c, {
      message: 'Resources refreshed after effect update',
      cityID: city.id,
      oldMoney: city.money,
      newMoney: Math.min(newMoney, 999999999),
      oldFood: city.food,
      newFood: Math.min(newFood, 999999999),
      activeEffectCount: activeEffects.length,
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

export default app;
