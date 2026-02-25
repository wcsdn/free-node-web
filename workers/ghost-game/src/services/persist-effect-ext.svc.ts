/**
 * PersistEffect System Extensions - 持久效果系统扩展
 * 从 jx/BLL/PersistEffectEx.cs 迁移
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

export class PersistEffectServiceExtension {
  private db: D1Database;
  constructor(db: D1Database) { this.db = db; }

  // ==================== 效果查询 ====================

  /** 获取用户所有效果 */
  async getAllEffects(walletAddress: string) {
    const effects: any = await this.db.prepare(`
      SELECT * FROM user_effects WHERE wallet_address = ? AND expires_at > datetime('now')
      ORDER BY created_at DESC
    `).bind(walletAddress).all();

    const now = Date.now() / 1000;
    const activeEffects = (effects.results || []).filter((e: any) => 
      !e.expires_at || new Date(e.expires_at).getTime() / 1000 > now
    );

    return {
      success: true,
      effects: activeEffects.map((e: any) => ({
        id: e.id,
        category: e.category,
        categoryName: EFFECT_CATEGORIES[e.category as keyof typeof EFFECT_CATEGORIES]?.name || '未知',
        type: e.type,
        typeName: EFFECT_TYPES[e.type as keyof typeof EFFECT_TYPES]?.name || '未知',
        value: e.value,
        stack: e.stack,
        maxStack: e.max_stack,
        source: e.source,
        sourceName: EFFECT_SOURCES[e.source as keyof typeof EFFECT_SOURCES]?.name || '未知',
        expiresAt: e.expires_at,
        remainingTime: e.expires_at ? Math.max(0, new Date(e.expires_at).getTime() / 1000 - now) : null,
      })),
      count: activeEffects.length,
    };
  }

  /** 获取武将效果 */
  async getHeroEffects(walletAddress: string, heroId: number) {
    const effects: any = await this.db.prepare(`
      SELECT * FROM hero_effects WHERE hero_id = ? AND expires_at > datetime('now')
    `).bind(heroId).all();

    return {
      success: true,
      heroId,
      effects: (effects.results || []).map((e: any) => ({
        id: e.id,
        category: e.category,
        value: e.value,
        stack: e.stack,
        expiresAt: e.expires_at,
      })),
    };
  }

  /** 计算综合效果 */
  async calculateTotalEffects(walletAddress: string) {
    const effects = await this.getAllEffects(walletAddress);
    
    const totals: { [key: number]: number } = {};

    for (const effect of effects.effects) {
      if (!totals[effect.category]) {
        totals[effect.category] = 0;
      }
      const category = EFFECT_CATEGORIES[effect.category as keyof typeof EFFECT_CATEGORIES];
      const stackBonus = Math.min(effect.stack, category?.maxStack || 1) - 1;
      totals[effect.category] += effect.value * (1 + stackBonus * 0.1);
    }

    return {
      success: true,
      effects: effects.effects,
      totals: Object.entries(totals).map(([category, value]) => ({
        category: parseInt(category),
        name: EFFECT_CATEGORIES[category as keyof typeof EFFECT_CATEGORIES]?.name,
        value: Math.round(value * 10000) / 100, // 转换为百分比
      })),
    };
  }

  // ==================== 效果应用 ====================

  /** 应用效果 */
  async applyEffect(walletAddress: string, options: {
    category: number;
    type: number;
    value: number;
    duration?: number; // 秒，null表示永久
    source: number;
    heroId?: number;
    stackable?: boolean;
  }) {
    const { category, type, value, duration = 3600, source, heroId, stackable = false } = options;

    const categoryKey = String(category) as keyof typeof EFFECT_CATEGORIES;
    const maxStack = EFFECT_CATEGORIES[categoryKey]?.maxStack || 1;
    const expiresAt = duration ? new Date(Date.now() + duration * 1000).toISOString() : null;

    if (heroId) {
      // 武将效果
      if (stackable) {
        const existing: any = await this.db.prepare(`
          SELECT * FROM hero_effects WHERE hero_id = ? AND category = ?
        `).bind(heroId, category).first();

        if (existing) {
          const newStack = Math.min((existing as any).stack + 1, maxStack);
          await this.db.prepare(`
            UPDATE hero_effects SET stack = ?, expires_at = ?, updated_at = datetime('now')
            WHERE id = ?
          `).bind(newStack, expiresAt, (existing as any).id).run();

          return {
            success: true,
            heroId,
            category,
            stack: newStack,
            maxStack,
            message: `效果叠层 ${newStack}/${maxStack}`,
          };
        }
      }

      await this.db.prepare(`
        INSERT INTO hero_effects (hero_id, category, type, value, stack, max_stack, source, expires_at, created_at)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, datetime('now'))
      `).bind(heroId, category, type, value, maxStack, source, expiresAt).run();
    } else {
      // 用户效果
      if (stackable) {
        const existing: any = await this.db.prepare(`
          SELECT * FROM user_effects WHERE wallet_address = ? AND category = ?
        `).bind(walletAddress, category).first();

        if (existing) {
          const newStack = Math.min((existing as any).stack + 1, maxStack);
          await this.db.prepare(`
            UPDATE user_effects SET stack = ?, expires_at = ?, updated_at = datetime('now')
            WHERE id = ?
          `).bind(newStack, expiresAt, (existing as any).id).run();

          return {
            success: true,
            walletAddress,
            category,
            stack: newStack,
            maxStack,
            message: `效果叠层 ${newStack}/${maxStack}`,
          };
        }
      }

      await this.db.prepare(`
        INSERT INTO user_effects (wallet_address, category, type, value, stack, max_stack, source, expires_at, created_at)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, datetime('now'))
      `).bind(walletAddress, category, type, value, maxStack, source, expiresAt).run();
    }

    const categoryName = EFFECT_CATEGORIES[categoryKey]?.name;
    return {
      success: true,
      category,
      categoryName,
      value,
      duration,
      message: `获得 ${categoryName} 效果 +${(value * 100).toFixed(1)}%`,
    };
  }

  /** 移除效果 */
  async removeEffect(walletAddress: string, effectId: number, heroId?: number) {
    if (heroId) {
      await this.db.prepare(`DELETE FROM hero_effects WHERE id = ? AND hero_id = ?`)
        .bind(effectId, heroId).run();
    } else {
      await this.db.prepare(`DELETE FROM user_effects WHERE id = ? AND wallet_address = ?`)
        .bind(effectId, walletAddress).run();
    }

    return { success: true, effectId, message: '效果已移除' };
  }

  /** 清除所有效果 */
  async clearAllEffects(walletAddress: string, heroId?: number) {
    if (heroId) {
      await this.db.prepare(`DELETE FROM hero_effects WHERE hero_id = ?`).bind(heroId).run();
    } else {
      await this.db.prepare(`DELETE FROM user_effects WHERE wallet_address = ?`).bind(walletAddress).run();
    }

    return { success: true, message: '所有效果已清除' };
  }

  // ==================== 效果计算 ====================

  /** 计算战斗属性加成 */
  async calculateCombatBonus(walletAddress: string, heroId?: number) {
    const effects = heroId 
      ? await this.getHeroEffects(walletAddress, heroId)
      : await this.getAllEffects(walletAddress);

    const bonus = {
      atk: 1,
      def: 1,
      hp: 1,
      critRate: 0,
      critDmg: 1.5,
      speed: 1,
      dodge: 0,
      accuracy: 1,
      lifesteal: 0,
    };

    for (const effect of effects.effects) {
      const category = EFFECT_CATEGORIES[effect.category as keyof typeof EFFECT_CATEGORIES];
      const value = effect.value * effect.stack;

      switch (effect.category) {
        case 101: // ATK_BOOST
          bonus.atk += value;
          break;
        case 102: // DEF_BOOST
          bonus.def += value;
          break;
        case 103: // HP_BOOST
          bonus.hp += value;
          break;
        case 104: // CRIT_RATE
          bonus.critRate += value;
          break;
        case 105: // CRIT_DMG
          bonus.critDmg += value;
          break;
        case 106: // SPEED_BOOST
          bonus.speed += value;
          break;
        case 107: // RESISTANCE
          bonus.def += value * 0.5; // 部分抗性转为防御
          break;
        case 108: // LIFESTEAL
          bonus.lifesteal += value;
          break;
        case 109: // DODGE
          bonus.dodge += value;
          break;
        case 110: // ACCURACY
          bonus.accuracy += value;
          break;
      }
    }

    return {
      success: true,
      base: {
        atk: 1000,
        def: 500,
        hp: 10000,
        critRate: 0.05,
        critDmg: 1.5,
        speed: 100,
        dodge: 0.05,
        accuracy: 1,
        lifesteal: 0,
      },
      bonus: {
        atk: Math.round(bonus.atk * 10000) / 100,
        def: Math.round(bonus.def * 10000) / 100,
        hp: Math.round(bonus.hp * 10000) / 100,
        critRate: Math.round(bonus.critRate * 10000) / 100,
        critDmg: Math.round(bonus.critDmg * 10000) / 100,
        speed: Math.round(bonus.speed * 10000) / 100,
        dodge: Math.round(bonus.dodge * 10000) / 100,
        accuracy: Math.round(bonus.accuracy * 10000) / 100,
        lifesteal: Math.round(bonus.lifesteal * 10000) / 100,
      },
    };
  }

  // ==================== 效果过期清理 ====================

  /** 清理过期效果（定时任务调用） */
  async cleanupExpiredEffects() {
    const result = await this.db.prepare(`
      DELETE FROM user_effects WHERE expires_at < datetime('now')
    `).run();

    const heroResult = await this.db.prepare(`
      DELETE FROM hero_effects WHERE expires_at < datetime('now')
    `).run();

    return {
      success: true,
      userEffectsRemoved: result.meta.changes,
      heroEffectsRemoved: heroResult.meta.changes,
    };
  }
}
