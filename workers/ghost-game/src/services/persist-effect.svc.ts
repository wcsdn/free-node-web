/**
 * PersistEffect Service - 持久效果基础服务
 * 从 jx/BLL/PersistEffect.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';

// 效果类型
export const EFFECT_TYPES = {
  BUFF: { id: 1, name: '增益BUFF', duration: true },
  DEBUFF: { id: 2, name: '减益DEBUFF', duration: true },
  PERMANENT: { id: 3, name: '永久效果', duration: false },
  STACK: { id: 4, name: '可叠加效果', duration: true },
};

// 效果类别
export const EFFECT_CATEGORIES = {
  ATK_BOOST: { id: 101, name: '攻击提升', icon: 'sword', baseValue: 0.1, maxStack: 5 },
  DEF_BOOST: { id: 102, name: '防御提升', icon: 'shield', baseValue: 0.1, maxStack: 5 },
  HP_BOOST: { id: 103, name: '生命提升', icon: 'heart', baseValue: 0.15, maxStack: 5 },
  CRIT_RATE: { id: 104, name: '暴击率', icon: 'star', baseValue: 0.05, maxStack: 3 },
  CRIT_DMG: { id: 105, name: '暴击伤害', icon: 'lightning', baseValue: 0.1, maxStack: 3 },
  SPEED_BOOST: { id: 106, name: '速度提升', icon: 'wind', baseValue: 0.05, maxStack: 5 },
  RESISTANCE: { id: 107, name: '抗性', icon: 'shield', baseValue: 0.1, maxStack: 3 },
  LIFESTEAL: { id: 108, name: '生命偷取', icon: 'drop', baseValue: 0.05, maxStack: 3 },
  DODGE: { id: 109, name: '闪避率', icon: 'eye', baseValue: 0.05, maxStack: 3 },
  ACCURACY: { id: 110, name: '命中率', icon: 'target', baseValue: 0.05, maxStack: 3 },
};

// 效果来源
export const EFFECT_SOURCES = {
  ITEM: { id: 1, name: '装备' },
  SKILL: { id: 2, name: '技能' },
  FOOD: { id: 3, name: '食物' },
  EVENT: { id: 4, name: '事件' },
  BUFF: { id: 5, name: '系统BUFF' },
  GUILD: { id: 6, name: '军团' },
};

export class PersistEffectService {
  private db: D1Database;
  constructor(db: D1Database) { this.db = db; }

  /**
   * 添加效果
   */
  async addEffect(walletAddress: string, effect: {
    effectId: number;
    category: number;
    type: number;
    source: number;
    value: number;
    duration?: number; // 秒，0表示永久
    stack?: number;
  }) {
    const now = new Date();
    const expireTime = effect.duration ?
      new Date(now.getTime() + effect.duration * 1000) : null;

    // 检查是否可以叠加
    const existing: any = await this.db.prepare(`
      SELECT * FROM persist_effects
      WHERE wallet_address = ? AND category = ? AND type = ?
    `).bind(walletAddress, effect.category, effect.type).first();

    if (existing && existing.stack < (effect.stack || 1)) {
      // 叠加效果
      await this.db.prepare(`
        UPDATE persist_effects
        SET stack = stack + 1, value = ?, expire_time = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(effect.value, expireTime?.toISOString() || null, existing.id).run();

      return { success: true, effectId: existing.id, stacked: true };
    }

    // 添加新效果
    const result = await this.db.prepare(`
      INSERT INTO persist_effects (
        wallet_address, effect_id, category, type, source, value, stack, expire_time, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      walletAddress,
      effect.effectId,
      effect.category,
      effect.type,
      effect.source,
      effect.value,
      effect.stack || 1,
      expireTime?.toISOString() || null
    ).run();

    return { success: true, effectId: result.meta.last_row_id, stacked: false };
  }

  /**
   * 移除效果
   */
  async removeEffect(walletAddress: string, effectId: number) {
    await this.db.prepare(`
      DELETE FROM persist_effects WHERE wallet_address = ? AND id = ?
    `).bind(walletAddress, effectId).run();

    return { success: true, message: '效果已移除' };
  }

  /**
   * 移除所有效果
   */
  async removeAllEffects(walletAddress: string, category?: number) {
    if (category) {
      await this.db.prepare(`
        DELETE FROM persist_effects WHERE wallet_address = ? AND category = ?
      `).bind(walletAddress, category).run();
    } else {
      await this.db.prepare(`
        DELETE FROM persist_effects WHERE wallet_address = ?
      `).bind(walletAddress).run();
    }

    return { success: true, message: '效果已清除' };
  }

  /**
   * 获取所有效果
   */
  async getEffects(walletAddress: string, type?: number) {
    let query = 'SELECT * FROM persist_effects WHERE wallet_address = ?';
    const params: any[] = [walletAddress];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results || [];
  }

  /**
   * 获取生效中的效果
   */
  async getActiveEffects(walletAddress: string) {
    const now = new Date().toISOString();

    const result = await this.db.prepare(`
      SELECT * FROM persist_effects
      WHERE wallet_address = ?
        AND (expire_time IS NULL OR expire_time > ?)
      ORDER BY created_at DESC
    `).bind(walletAddress, now).all();

    return result.results || [];
  }

  /**
   * 清理过期效果
   */
  async cleanupExpiredEffects(): Promise<number> {
    const now = new Date().toISOString();

    const result = await this.db.prepare(`
      DELETE FROM persist_effects
      WHERE expire_time IS NOT NULL AND expire_time < ?
    `).bind(now).run();

    return result.meta.changes;
  }

  /**
   * 计算效果加成
   */
  calculateBonus(effects: any[], stat: string): number {
    let bonus = 0;

    for (const effect of effects) {
      const stack = effect.stack || 1;
      const baseValue = effect.value;

      switch (stat) {
        case 'atk':
          if (effect.category === EFFECT_CATEGORIES.ATK_BOOST.id) {
            bonus += baseValue * stack;
          }
          break;
        case 'def':
          if (effect.category === EFFECT_CATEGORIES.DEF_BOOST.id) {
            bonus += baseValue * stack;
          }
          break;
        case 'hp':
          if (effect.category === EFFECT_CATEGORIES.HP_BOOST.id) {
            bonus += baseValue * stack;
          }
          break;
        case 'critRate':
          if (effect.category === EFFECT_CATEGORIES.CRIT_RATE.id) {
            bonus += baseValue * stack;
          }
          break;
        case 'critDmg':
          if (effect.category === EFFECT_CATEGORIES.CRIT_DMG.id) {
            bonus += baseValue * stack;
          }
          break;
        case 'speed':
          if (effect.category === EFFECT_CATEGORIES.SPEED_BOOST.id) {
            bonus += baseValue * stack;
          }
          break;
      }
    }

    return bonus;
  }

  /**
   * 应用效果到属性
   */
  async applyToHero(heroId: number, walletAddress: string) {
    const effects = await this.getActiveEffects(walletAddress);

    return {
      atkBonus: this.calculateBonus(effects, 'atk'),
      defBonus: this.calculateBonus(effects, 'def'),
      hpBonus: this.calculateBonus(effects, 'hp'),
      critRateBonus: this.calculateBonus(effects, 'critRate'),
      critDmgBonus: this.calculateBonus(effects, 'critDmg'),
      speedBonus: this.calculateBonus(effects, 'speed'),
    };
  }

  /**
   * 检查是否有某类效果
   */
  async hasEffect(walletAddress: string, category: number): Promise<boolean> {
    const effects = await this.getActiveEffects(walletAddress);
    return effects.some((e: any) => e.category === category);
  }

  /**
   * 效果持续时间更新
   */
  async extendDuration(walletAddress: string, effectId: number, additionalSeconds: number) {
    const effect: any = await this.db.prepare(`
      SELECT * FROM persist_effects WHERE id = ? AND wallet_address = ?
    `).bind(effectId, walletAddress).first();

    if (!effect) {
      return { success: false, error: '效果不存在' };
    }

    if (!effect.expire_time) {
      return { success: false, error: '永久效果无法延长时间' };
    }

    const newExpire = new Date(effect.expire_time);
    newExpire.setSeconds(newExpire.getSeconds() + additionalSeconds);

    await this.db.prepare(`
      UPDATE persist_effects SET expire_time = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newExpire.toISOString(), effectId).run();

    return { success: true, message: '持续时间已延长' };
  }
}

export const persistEffectService = {
  addEffect(db: D1Database, walletAddress: string, effect: any) {
    const service = new PersistEffectService(db);
    return service.addEffect(walletAddress, effect);
  },
  removeEffect(db: D1Database, walletAddress: string, effectId: number) {
    const service = new PersistEffectService(db);
    return service.removeEffect(walletAddress, effectId);
  },
  removeAllEffects(db: D1Database, walletAddress: string, category?: number) {
    const service = new PersistEffectService(db);
    return service.removeAllEffects(walletAddress, category);
  },
  getEffects(db: D1Database, walletAddress: string, type?: number) {
    const service = new PersistEffectService(db);
    return service.getEffects(walletAddress, type);
  },
  getActiveEffects(db: D1Database, walletAddress: string) {
    const service = new PersistEffectService(db);
    return service.getActiveEffects(walletAddress);
  },
  cleanupExpiredEffects(db: D1Database) {
    const service = new PersistEffectService(db);
    return service.cleanupExpiredEffects();
  },
  applyToHero(db: D1Database, heroId: number, walletAddress: string) {
    const service = new PersistEffectService(db);
    return service.applyToHero(heroId, walletAddress);
  },
};
