/**
 * Effect Routes - 效果系统
 * 参考 jx/BLL/PersistEffect.cs
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import persistEffectGroupsData from '../config/persist_effect_groups.json';

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

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
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
      // 尝试从数据库 persist_effect_configs 表读取
      try {
        const cfg: any = await db.prepare(
          `SELECT * FROM persist_effect_configs WHERE static_index = ?`
        ).bind(staticIndex).first();
        if (cfg) {
          effectConfig = {
            mainEffectType: cfg.main_effect_type,
            effectType: cfg.effect_type,
            persistTime: cfg.persist_time,
            gold: cfg.gold || 0,
            name: cfg.name,
          };
        }
      } catch (__) { /* ignore */ }
    }

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
        effectType, effectConfig.effectValue || 1,
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
      // 尝试从数据库查找
      try {
        const cfg: any = await db.prepare(`
          SELECT static_index FROM persist_effect_configs
          WHERE main_effect_type = ? AND effect_type = ? LIMIT 1
        `).bind(mainEffectType, effectType || 0).first();
        if (cfg) matchedStaticIndex = cfg.static_index;
      } catch (__) { /* ignore */ }
    }

    if (matchedStaticIndex === null) {
      return error(c, `No matching effect found for mainEffectType=${mainEffectType}, effectType=${effectType}`, 404);
    }

    // 复用 /update 逻辑
    // 重新构造请求体并调用
    const updateResult = await db.prepare(`
      SELECT * FROM persist_effect_configs WHERE static_index = ?
    `).bind(matchedStaticIndex).first();

    if (!updateResult) {
      return error(c, `Effect config not found for staticIndex: ${matchedStaticIndex}`, 404);
    }

    const cfg = updateResult as any;
    const mainEffect = cfg.main_effect_type;
    const effectVal = cfg.effect_type;
    const persistTime = cfg.persist_time || 3600;
    const goldCost = cfg.gold || 0;

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
        walletAddress, cityID, matchedStaticIndex, mainEffect,
        effectVal,
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

export default app;
