/**
 * 持久效果路由 - BUFF/DEBUFF 系统
 * 支持：VIP效果、增益道具、免战状态等
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import effectConfigs from '../config/persist_effects.json';
import effectGroupConfigs from '../config/persist_effect_groups.json';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 效果类型
const EFFECT_TYPES = {
  POPULATION: 1,     // 人口产量
  FOOD: 2,           // 粮食产量
  MONEY: 3,          // 铜钱产量
  EXP: 4,            // 经验加成
  ATTACK: 5,         // 出征实力
  DEFENSE: 6,        // 防御实力
  PEACE: 7,          // 免战状态
  SPEED: 8,          // 行军速度
};

// 获取玩家所有活跃效果
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const effects = await db.prepare(`
      SELECT * FROM persist_effects 
      WHERE user_name = ? AND end_time > datetime('now')
      ORDER BY end_time ASC
    `).bind(walletAddress).all();

    const now = new Date();
    const activeEffects = (effects.results || []).map((effect: any) => {
      const endTime = new Date(effect.end_time);
      const remainingSeconds = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));

      // 获取效果配置
      const effectConfig = (effectConfigs as any).Effect?.find((e: any) => e.ID === effect.static_index);
      const groupConfig = (effectGroupConfigs as any).EffectGroup?.find((g: any) => g.ID === effect.main_effect_type);

      return {
        id: effect.id,
        staticIndex: effect.static_index,
        mainEffectType: effect.main_effect_type,
        effectType: effect.effect_type,
        startTime: effect.start_time,
        endTime: effect.end_time,
        remainingSeconds,
        remainingTime: formatDuration(remainingSeconds),
        effect: effectConfig,
        group: groupConfig,
      };
    });

    // 计算总加成
    const totalBonuses: Record<string, number> = {};
    for (const effect of activeEffects) {
      if (effect.effect && effect.effect.Type) {
        const type = Object.entries(EFFECT_TYPES).find(([_, v]) => v === effect.effect.Type)?.[0] || 'UNKNOWN';
        totalBonuses[type] = (totalBonuses[type] || 0) + effect.effect.Value;
      }
    }

    return success(c, {
      effects: activeEffects,
      total: activeEffects.length,
      bonuses: totalBonuses,
      isPeaceful: activeEffects.some((e: any) => e.mainEffectType === 6), // 免战状态
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取单个效果详情
app.get('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const effectId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const effect: any = await db.prepare(`
      SELECT * FROM persist_effects WHERE id = ? AND user_name = ?
    `).bind(effectId, walletAddress).first();

    if (!effect) return error(c, 'Effect not found', 404);

    const effectConfig = (effectConfigs as any).Effect?.find((e: any) => e.ID === effect.static_index);
    const groupConfig = (effectGroupConfigs as any).EffectGroup?.find((g: any) => g.ID === effect.main_effect_type);

    const now = new Date();
    const endTime = new Date(effect.end_time);
    const remainingSeconds = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));

    return success(c, {
      ...effect,
      effect: effectConfig,
      group: groupConfig,
      remainingSeconds,
      remainingTime: formatDuration(remainingSeconds),
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 使用增益道具（创建效果）
app.post('/use', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { group_id } = await c.req.json();
  if (!group_id) return error(c, 'Missing group_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取效果组配置
    const groupConfig = (effectGroupConfigs as any).EffectGroup?.find((g: any) => g.ID === group_id);
    if (!groupConfig) return error(c, 'Invalid group_id');

    // 检查是否已有相同主效果类型的效果
    const existing: any = await db.prepare(`
      SELECT * FROM persist_effects 
      WHERE user_name = ? AND main_effect_type = ? AND end_time > datetime('now')
    `).bind(walletAddress, groupConfig.MainEffectType).first();

    if (existing) {
      return error(c, 'Already has active effect of this type');
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + (groupConfig.PersistTime || 0) * 1000);

    // 扣除道具（如果有的话，这里简化处理）
    // TODO: 检查并扣除对应道具

    // 创建效果
    const result = await db.prepare(`
      INSERT INTO persist_effects 
      (user_name, static_index, effect_type, main_effect_type, start_time, end_time)
      VALUES (?, ?, ?, ?, datetime('now'), datetime(?))
    `).bind(
      walletAddress,
      groupConfig.EffectID1 || 0,
      groupConfig.EffectType || 1,
      groupConfig.MainEffectType,
      endTime.getTime() / 1000
    ).run();

    return success(c, {
      effectId: result.meta.last_row_id,
      name: groupConfig.Name,
      duration: groupConfig.PersistTime,
      endTime: endTime.toISOString(),
      message: `${groupConfig.Name} 激活成功`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 取消效果
app.delete('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const effectId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result = await db.prepare(`
      DELETE FROM persist_effects WHERE id = ? AND user_name = ?
    `).bind(effectId, walletAddress).run();

    if (result.meta.changes === 0) {
      return error(c, 'Effect not found', 404);
    }

    return success(c, { message: 'Effect removed' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取所有可用效果组
app.get('/configs/groups', async (c) => {
  const groups = (effectGroupConfigs as any).EffectGroup?.map((g: any) => ({
    id: g.ID,
    name: g.Name,
    description: g.Des,
    image: g.Image,
    duration: g.PersistTime,
    costGold: g.Gold,
    effects: [
      g.EffectID1,
      g.EffectID2,
      g.EffectID3,
      g.EffectID4,
      g.EffectID5,
      g.EffectID6,
    ].filter(Boolean),
  })) || [];

  return success(c, groups);
});

// 获取效果配置
app.get('/configs/effects', async (c) => {
  const effects = (effectConfigs as any).Effect?.map((e: any) => ({
    id: e.ID,
    type: e.Type,
    typeName: Object.entries(EFFECT_TYPES).find(([_, v]) => v === e.Type)?.[0],
    value: e.Value,
    name: e.Name,
    description: e.Des,
  })) || [];

  return success(c, effects);
});

// 计算加成
app.get('/bonuses', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const effects = await db.prepare(`
      SELECT * FROM persist_effects 
      WHERE user_name = ? AND end_time > datetime('now')
    `).bind(walletAddress).all();

    const bonuses: Record<string, number> = {};
    let isPeaceful = false;

    for (const effect of (effects.results || [])) {
      const effectConfig = (effectConfigs as any).Effect?.find((e: any) => e.ID === effect.static_index);
      if (effectConfig) {
        const typeName = Object.entries(EFFECT_TYPES).find(([_, v]) => v === effectConfig.Type)?.[0] || 'UNKNOWN';
        bonuses[typeName] = (bonuses[typeName] || 0) + effectConfig.Value;
      }

      if (effect.main_effect_type === 6) {
        isPeaceful = true;
      }
    }

    return success(c, {
      bonuses,
      isPeaceful,
      message: Object.entries(bonuses)
        .map(([type, value]) => `${type}: +${value}%`)
        .join(', ') || 'No active effects',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 清理过期效果（定时任务）
app.post('/cleanup', async (c) => {
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result = await db.prepare(`
      DELETE FROM persist_effects WHERE end_time <= datetime('now')
    `).run();

    return success(c, {
      removed: result.meta.changes,
      message: `Cleaned up ${result.meta.changes} expired effects`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 辅助函数：格式化时间
function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export default app;
