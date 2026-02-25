/**
 * Hero System Extensions - 武将系统扩展
 * 从 jx/BLL/HeroEx.cs 迁移
 */

import type { D1Database } from '@cloudflare/workers-types';

// ==================== 常量配置 ====================

// 武将缘分配置
export const HERO_FATE_CONFIG = {
  // 缘分组合
  FATES: {
    'wuxia_yueyang': {
      id: 'wuxia_yueyang',
      name: '武侠岳家',
      heroes: [1001, 1002, 1003], // 岳飞、岳云、王佐
      bonus: { atk: 15, def: 10 },
      description: '同时上阵激活，攻击力+15%，防御力+10%',
    },
    'wuxia_tianlong': {
      id: 'wuxia_tianlong',
      name: '武侠天龙',
      heroes: [1010, 1011, 1012], // 段誉、虚竹、萧峰
      bonus: { hp: 20, crit: 10 },
      description: '同时上阵激活，生命+20%，暴击率+10%',
    },
    'wuxia_shennong': {
      id: 'wuxia_shennong',
      name: '武侠神农',
      heroes: [1020, 1021, 1022],
      bonus: { heal: 15, def: 10 },
      description: '同时上阵激活，治疗效果+15%，防御力+10%',
    },
    'chuchu_liubei': {
      id: 'chuchu_liubei',
      name: '乱世刘备',
      heroes: [2001, 2002, 2003], // 刘备、关羽、张飞
      bonus: { atk: 12, hp: 15 },
      description: '同时上阵激活，攻击力+12%，生命+15%',
    },
    'chuchu_caocao': {
      id: 'chuchu_caocao',
      name: '乱世曹操',
      heroes: [2010, 2011, 2012],
      bonus: { atk: 18, crit: 8 },
      description: '同时上阵激活，攻击力+18%，暴击率+8%',
    },
    'jianghu_huangxia': {
      id: 'jianghu_huangxia',
      name: '江湖黄系',
      heroes: [3001, 3002, 3003],
      bonus: { dodge: 12, atk: 10 },
      description: '同时上阵激活，闪避+12%，攻击力+10%',
    },
  },
};

// 觉醒配置
export const HERO_AWAKE_CONFIG = {
  MAX_AWAKE_LEVEL: 5,              // 最大觉醒等级
  AWAKE_MATERIALS: [                // 觉醒材料
    { itemId: 5001, count: 10 },   // 觉醒丹
    { itemId: 5002, count: 5 },     // 觉醒石
  ],
  AWAKE_COSTS: [                    // 觉醒消耗
    { gold: 1000, exp: 1000 },
    { gold: 2000, exp: 2000 },
    { gold: 3000, exp: 3000 },
    { gold: 5000, exp: 5000 },
    { gold: 10000, exp: 10000 },
  ],
  STAT_BONUSES: [                   // 属性加成
    { atk: 50, def: 30, hp: 500 },
    { atk: 100, def: 60, hp: 1000 },
    { atk: 200, def: 120, hp: 2000 },
    { atk: 400, def: 240, hp: 4000 },
    { atk: 800, def: 500, hp: 8000 },
  ],
};

// 资质突破配置
export const HERO_QUALITY突破_CONFIG = {
  BREAKTHROUGH_MATERIALS: [
    { itemId: 6001, count: 20 },   // 突破符
    { itemId: 6002, count: 10 },   // 资质丹
  ],
  BREAKTHROUGH_COSTS: [             // 突破消耗
    { gold: 5000 },
    { gold: 10000 },
    { gold: 20000 },
    { gold: 50000 },
  ],
  BREAKTHROUGH_RATES: [0.8, 0.7, 0.6, 0.5, 0.4], // 突破成功率
};

// 兵种适性配置
export const HERO_UNIT_ADAPT = {
  UNIT_TYPES: {
    INFANTRY: '步兵',
    ARCHER: '弓兵',
    CAVALRY: '骑兵',
    SIEGE: '攻城',
    NAVY: '水军',
  },
  ADAPT_LEVELS: {                   // 适性等级
    S: { bonus: 1.2, name: 'S级' },
    A: { bonus: 1.1, name: 'A级' },
    B: { bonus: 1.0, name: 'B级' },
    C: { bonus: 0.9, name: 'C级' },
    D: { bonus: 0.8, name: 'D级' },
  },
  ADAPT_MATERIALS: {                // 适性提升材料
    INFANTRY: { itemId: 7001, cost: 100 },
    ARCHER: { itemId: 7002, cost: 100 },
    CAVALRY: { itemId: 7003, cost: 100 },
    SIEGE: { itemId: 7004, cost: 100 },
    NAVY: { itemId: 7005, cost: 100 },
  },
};

// 伤病恢复配置
export const HERO_RECOVER_CONFIG = {
  RECOVER_ITEMS: [                  // 恢复道具
    { itemId: 8001, name: '金疮药', hp: 500, cost: 50 },
    { itemId: 8002, name: '大还丹', hp: 2000, cost: 200 },
    { itemId: 8003, name: '九转还魂丹', hp: 10000, cost: 1000 },
  ],
  AUTO_RECOVER_RATE: 0.1,           // 每小时自动恢复比例
  MAX_INJURY_TIME: 72,             // 最大负伤时间（小时）
  INJURY_PENALTY: 0.5,             // 负伤属性惩罚
};

// 技能配置
export const HERO_SKILL_CONFIG = {
  MAX_SKILL_LEVEL: 10,              // 技能最大等级
  SKILL_TYPES: {
    ACTIVE: 'active',              // 主动技能
    PASSIVE: 'passive',            // 被动技能
    ULTIMATE: 'ultimate',          // 必杀技
  },
  SKILL_UPGRADE_COSTS: [            // 消耗
    { upgrade: { gold: 100, skillBook: 1 } },
    { gold: 200, skillBook: 2 },
    { gold: 400, skillBook: 4 },
    { gold: 800, skillBook: 8 },
    { gold: 1600, skillBook: 16 },
    { gold: 3200, skillBook: 32 },
    { gold: 6400, skillBook: 64 },
    { gold: 12800, skillBook: 128 },
    { gold: 25600, skillBook: 256 },
    { gold: 51200, skillBook: 512 },
  ],
  SKILL_EXP_ITEMS: [                // 技能经验道具
    { itemId: 9001, exp: 100 },
    { itemId: 9002, exp: 500 },
    { itemId: 9003, exp: 2000 },
  ],
};

// ==================== 服务类扩展 ====================

export class HeroServiceExtension {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ==================== 武将缘分系统 ====================

  /**
   * 获取武将缘分配置
   */
  async getFateConfig() {
    return {
      fates: Object.values(HERO_FATE_CONFIG.FATES),
      totalFates: Object.keys(HERO_FATE_CONFIG.FATES).length,
    };
  }

  /**
   * 检查武将缘分激活状态
   */
  async checkFateActivation(walletAddress: string, heroIds: number[]) {
    const activatedFates: { id: string; name: string; bonus: any; description: string }[] = [];
    const availableFates: { id: string; name: string; heroes: number[]; missing: number[] }[] = [];

    // 获取用户拥有的武将
    const ownedHeroesResult: any = await this.db.prepare(`
      SELECT hero_id FROM heroes WHERE wallet_address = ?
    `).bind(walletAddress).all();
    const ownedHeroes: any[] = (ownedHeroesResult as any)?.results || [];
    const ownedSet = new Set(ownedHeroes.map((h: any) => h.hero_id));

    // 检查每个缘分
    for (const [key, fate] of Object.entries(HERO_FATE_CONFIG.FATES)) {
      const owned = fate.heroes.filter((id: number) => ownedSet.has(id));
      
      if (owned.length >= 3) {
        activatedFates.push({
          id: fate.id,
          name: fate.name,
          bonus: fate.bonus,
          description: fate.description,
        });
      } else if (owned.length > 0) {
        availableFates.push({
          id: fate.id,
          name: fate.name,
          heroes: owned,
          missing: fate.heroes.filter((id: number) => !ownedSet.has(id)),
        });
      }
    }

    return {
      activated: activatedFates,
      available: availableFates,
      totalActivated: activatedFates.length,
    };
  }

  /**
   * 计算缘分加成属性
   */
  async calculateFateBonus(walletAddress: string) {
    const checkResult = await this.checkFateActivation(walletAddress, []);
    
    const totalBonus = {
      atk: 0,
      def: 0,
      hp: 0,
      crit: 0,
      dodge: 0,
      heal: 0,
    };

    for (const fate of checkResult.activated) {
      if (fate.bonus.atk) totalBonus.atk += fate.bonus.atk;
      if (fate.bonus.def) totalBonus.def += fate.bonus.def;
      if (fate.bonus.hp) totalBonus.hp += fate.bonus.hp;
      if (fate.bonus.crit) totalBonus.crit += fate.bonus.crit;
      if (fate.bonus.dodge) totalBonus.dodge += fate.bonus.dodge;
      if (fate.bonus.heal) totalBonus.heal += fate.bonus.heal;
    }

    return {
      bonuses: totalBonus,
      activatedCount: checkResult.totalActivated,
      appliesTo: 'all_heroes', // 缘分加成应用到所有武将
    };
  }

  // ==================== 武将觉醒系统 ====================

  /**
   * 获取觉醒配置
   */
  async getAwakeConfig() {
    return {
      maxLevel: HERO_AWAKE_CONFIG.MAX_AWAKE_LEVEL,
      materials: HERO_AWAKE_CONFIG.AWAKE_MATERIALS,
      costs: HERO_AWAKE_CONFIG.AWAKE_COSTS,
      statBonuses: HERO_AWAKE_CONFIG.STAT_BONUSES,
    };
  }

  /**
   * 检查觉醒条件
   */
  async checkAwake(walletAddress: string, heroId: number) {
    const hero: any = await this.db.prepare(`
      SELECT h.*, hc.name as config_name, hc.quality, hc.base_atk, hc.base_def, hc.base_hp
      FROM heroes h
      JOIN heroes_config hc ON h.hero_id = hc.id
      WHERE h.id = ? AND h.wallet_address = ?
    `).bind(heroId, walletAddress).first();

    if (!hero) {
      return { success: false, error: '武将不存在' };
    }

    const currentLevel = hero.awake_level || 0;
    if (currentLevel >= HERO_AWAKE_CONFIG.MAX_AWAKE_LEVEL) {
      return { success: false, error: '已达到最大觉醒等级' };
    }

    // 检查材料
    const insufficient: { itemId: number; required: number; have: number }[] = [];
    for (const material of HERO_AWAKE_CONFIG.AWAKE_MATERIALS) {
      const userItem: any = await this.db.prepare(`
        SELECT count FROM user_items WHERE wallet_address = ? AND item_id = ?
      `).bind(walletAddress, material.itemId).first();

      const have = userItem?.count || 0;
      if (have < material.count) {
        insufficient.push({ itemId: material.itemId, required: material.count, have });
      }
    }

    if (insufficient.length > 0) {
      return {
        success: false,
        error: '觉醒材料不足',
        insufficient,
      };
    }

    // 检查金币
    const cost = HERO_AWAKE_CONFIG.AWAKE_COSTS[currentLevel].gold;
    const user: any = await this.db.prepare(`
      SELECT gold FROM users WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if ((user as any).gold < cost) {
      return {
        success: false,
        error: '金币不足',
        required: cost,
        have: (user as any).gold,
      };
    }

    const config = HERO_AWAKE_CONFIG.AWAKE_COSTS[currentLevel];

    return {
      success: true,
      hero,
      currentLevel,
      nextLevel: currentLevel + 1,
      materials: HERO_AWAKE_CONFIG.AWAKE_MATERIALS,
      goldCost: config.gold,
      expCost: config.exp,
      statBonus: HERO_AWAKE_CONFIG.STAT_BONUSES[currentLevel],
    };
  }

  /**
   * 执行觉醒
   */
  async awakeHero(walletAddress: string, heroId: number) {
    const checkResult = await this.checkAwake(walletAddress, heroId);
    if (!checkResult.success) {
      return checkResult;
    }

    const { currentLevel, goldCost, statBonus } = checkResult;

    try {
      // 扣除材料
      for (const material of HERO_AWAKE_CONFIG.AWAKE_MATERIALS) {
        await this.db.prepare(`
          UPDATE user_items SET count = count - ? WHERE wallet_address = ? AND item_id = ?
        `).bind(material.count, walletAddress, material.itemId).run();
      }

      // 扣除金币
      await this.db.prepare(`
        UPDATE users SET gold = gold - ? WHERE wallet_address = ?
      `).bind(goldCost, walletAddress).run();

      // 觉醒成功
      await this.db.prepare(`
        UPDATE heroes SET awake_level = ?, 
        atk = atk + ?, 
        def = def + ?, 
        hp = hp + ? 
        WHERE id = ?
      `).bind(currentLevel + 1, statBonus.atk, statBonus.def, statBonus.hp, heroId).run();

      // 记录日志
      await this.db.prepare(`
        INSERT INTO hero_awake_logs (wallet_address, hero_id, old_level, new_level, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).bind(walletAddress, heroId, currentLevel, currentLevel + 1).run();

      return {
        success: true,
        heroId,
        oldLevel: currentLevel,
        newLevel: currentLevel + 1,
        statBonus,
        message: `觉醒成功！攻击力+${statBonus.atk}，防御力+${statBonus.def}，生命+${statBonus.hp}`,
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  // ==================== 资质突破系统 ====================

  /**
   * 获取突破配置
   */
  async getBreakthroughConfig() {
    return {
      materials: HERO_QUALITY突破_CONFIG.BREAKTHROUGH_MATERIALS,
      costs: HERO_QUALITY突破_CONFIG.BREAKTHROUGH_COSTS,
      rates: HERO_QUALITY突破_CONFIG.BREAKTHROUGH_RATES,
      maxBreakthrough: HERO_QUALITY突破_CONFIG.BREAKTHROUGH_RATES.length,
    };
  }

  /**
   * 检查突破条件
   */
  async checkBreakthrough(walletAddress: string, heroId: number) {
    const hero: any = await this.db.prepare(`
      SELECT h.*, hc.quality FROM heroes h
      JOIN heroes_config hc ON h.hero_id = hc.id
      WHERE h.id = ? AND h.wallet_address = ?
    `).bind(heroId, walletAddress).first();

    if (!hero) {
      return { success: false, error: '武将不存在' };
    }

    const currentQuality = hero.quality || 1;
    if (currentQuality >= 6) {
      return { success: false, error: '已达到最高资质' };
    }

    const costIndex = currentQuality - 1;
    const cost = HERO_QUALITY突破_CONFIG.BREAKTHROUGH_COSTS[costIndex];

    // 检查材料
    const insufficient: { itemId: number; required: number; have: number }[] = [];
    for (const material of HERO_QUALITY突破_CONFIG.BREAKTHROUGH_MATERIALS) {
      const userItem: any = await this.db.prepare(`
        SELECT count FROM user_items WHERE wallet_address = ? AND item_id = ?
      `).bind(walletAddress, material.itemId).first();

      const have = userItem?.count || 0;
      if (have < material.count) {
        insufficient.push({ itemId: material.itemId, required: material.count, have });
      }
    }

    if (insufficient.length > 0) {
      return {
        success: false,
        error: '突破材料不足',
        insufficient,
      };
    }

    return {
      success: true,
      hero,
      currentQuality,
      nextQuality: currentQuality + 1,
      materials: HERO_QUALITY突破_CONFIG.BREAKTHROUGH_MATERIALS,
      goldCost: cost.gold,
      successRate: HERO_QUALITY突破_CONFIG.BREAKTHROUGH_RATES[costIndex],
    };
  }

  /**
   * 执行突破
   */
  async breakthroughHero(walletAddress: string, heroId: number) {
    const checkResult = await this.checkBreakthrough(walletAddress, heroId);
    if (!checkResult.success) {
      return checkResult;
    }

    const { currentQuality, goldCost, successRate } = checkResult;

    try {
      // 扣除材料
      for (const material of HERO_QUALITY突破_CONFIG.BREAKTHROUGH_MATERIALS) {
        await this.db.prepare(`
          UPDATE user_items SET count = count - ? WHERE wallet_address = ? AND item_id = ?
        `).bind(material.count, walletAddress, material.itemId).run();
      }

      // 扣除金币
      await this.db.prepare(`
        UPDATE users SET gold = gold - ? WHERE wallet_address = ?
      `).bind(goldCost, walletAddress).run();

      // 计算成功率
      const roll = Math.random();
      const success = roll < successRate;

      if (success) {
        // 突破成功
        const qualityBonus = currentQuality * 10; // 资质加成
        await this.db.prepare(`
          UPDATE heroes SET quality = ?, 
          atk = atk + ?, 
          def = def + ?, 
          hp = hp + ? 
          WHERE id = ?
        `).bind(currentQuality + 1, qualityBonus, qualityBonus, qualityBonus * 5, heroId).run();

        await this.db.prepare(`
          INSERT INTO hero_breakthrough_logs (wallet_address, hero_id, old_quality, new_quality, success, created_at)
          VALUES (?, ?, ?, ?, 1, datetime('now'))
        `).bind(walletAddress, heroId, currentQuality, currentQuality + 1).run();

        return {
          success: true,
          heroId,
          oldQuality: currentQuality,
          newQuality: currentQuality + 1,
          message: '突破成功！资质提升',
        };
      } else {
        // 突破失败
        await this.db.prepare(`
          INSERT INTO hero_breakthrough_logs (wallet_address, hero_id, old_quality, new_quality, success, created_at)
          VALUES (?, ?, ?, ?, 0, datetime('now'))
        `).bind(walletAddress, heroId, currentQuality, currentQuality).run();

        return {
          success: false,
          heroId,
          message: `突破失败（${(successRate * 100).toFixed(0)}%成功率），请再接再厉`,
        };
      }
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  // ==================== 兵种适性系统 ====================

  /**
   * 获取兵种适性配置
   */
  async getUnitAdaptConfig() {
    return {
      unitTypes: HERO_UNIT_ADAPT.UNIT_TYPES,
      adaptLevels: HERO_UNIT_ADAPT.ADAPT_LEVELS,
      upgradeMaterials: HERO_UNIT_ADAPT.ADAPT_MATERIALS,
    };
  }

  /**
   * 获取武将兵种适性
   */
  async getHeroUnitAdapt(walletAddress: string, heroId: number, unitType: string) {
    const hero: any = await this.db.prepare(`
      SELECT h.*, hc.name as hero_name 
      FROM heroes h
      JOIN heroes_config hc ON h.hero_id = hc.id
      WHERE h.id = ? AND h.wallet_address = ?
    `).bind(walletAddress, heroId).first();
    
    if (!hero) {
      return { success: false, error: '武将不存在' };
    }
    
    // 检查适性材料
    const material = HERO_UNIT_ADAPT.ADAPT_MATERIALS[unitType as keyof typeof HERO_UNIT_ADAPT.ADAPT_MATERIALS];
    if (!material) {
      return { success: false, error: '无效的兵种类型' };
    }

    const userItem: any = await this.db.prepare(`
      SELECT count FROM user_items WHERE wallet_address = ? AND item_id = ?
    `).bind(walletAddress, material.itemId).first();

    if ((userItem?.count || 0) < material.cost) {
      return {
        success: false,
        error: '适性提升材料不足',
        required: material.cost,
        have: userItem?.count || 0,
      };
    }

    // 检查金币
    const user: any = await this.db.prepare(`
      SELECT gold FROM users WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if ((user as any).gold < 1000) {
      return {
        success: false,
        error: '金币不足',
        required: 1000,
        have: (user as any).gold,
      };
    }

    // 从武将属性获取适性等级
    const adaptLevels = {
      infantry: (hero as any).adapt_infantry || 'D',
      cavalry: (hero as any).adapt_cavalry || 'D',
      archer: (hero as any).adapt_archer || 'D',
    };

    return {
      success: true,
      hero,
      currentAdapt: adaptLevels,
      material: material,
      goldCost: 1000,
    };
  }

  /**
   * 提升兵种适性
   */
  async upgradeUnitAdapt(walletAddress: string, heroId: number, unitType: string) {
    const checkResult = await this.getHeroUnitAdapt(walletAddress, heroId, unitType);
    if (!checkResult.success) {
      return checkResult;
    }

    const { hero, currentAdapt, material, goldCost } = checkResult;

    try {
      // 扣除材料
      await this.db.prepare(`
        UPDATE user_items SET count = count - ? WHERE wallet_address = ? AND item_id = ?
      `).bind(material.cost, walletAddress, material.itemId).run();

      // 扣除金币
      await this.db.prepare(`
        UPDATE users SET gold = gold - ? WHERE wallet_address = ?
      `).bind(goldCost, walletAddress).run();

      // 计算新适性等级
      const levels = ['D', 'C', 'B', 'A', 'S'];
      const currentIndex = levels.indexOf(currentAdapt[unitType as keyof typeof currentAdapt] || 'D');
      if (currentIndex >= levels.length - 1) {
        return { success: false, error: '已满级' };
      }

      const newLevel = levels[currentIndex + 1];
      const bonus = HERO_UNIT_ADAPT.ADAPT_LEVELS[newLevel as keyof typeof HERO_UNIT_ADAPT.ADAPT_LEVELS].bonus;

      // 更新适性
      await this.db.prepare(`
        UPDATE heroes SET adapt_${unitType.toLowerCase()} = ? WHERE id = ?
      `).bind(newLevel, heroId).run();

      return {
        success: true,
        heroId,
        unitType,
        oldLevel: currentAdapt[unitType as keyof typeof currentAdapt],
        newLevel,
        bonus,
        message: `${unitType}适性提升至${HERO_UNIT_ADAPT.ADAPT_LEVELS[newLevel as keyof typeof HERO_UNIT_ADAPT.ADAPT_LEVELS].name}，兵种加成+${((bonus - 1) * 100).toFixed(0)}%`,
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  // ==================== 伤病恢复系统 ====================

  /**
   * 获取武将伤病状态
   */
  async getHeroInjuryStatus(walletAddress: string, heroId: number) {
    const hero: any = await this.db.prepare(`
      SELECT h.*, hc.name as hero_name, hc.base_hp
      FROM heroes h
      JOIN heroes_config hc ON h.hero_id = hc.id
      WHERE h.id = ? AND h.wallet_address = ?
    `).bind(heroId, walletAddress).first();

    if (!hero) {
      return { success: false, error: '武将不存在' };
    }

    const currentHp = hero.hp || hero.base_hp;
    const maxHp = hero.max_hp || hero.base_hp * 10;
    const injuryPercent = 1 - (currentHp / maxHp);

    return {
      success: true,
      heroId,
      heroName: hero.hero_name,
      currentHp,
      maxHp,
      hpPercent: Math.floor((currentHp / maxHp) * 100),
      isInjured: injuryPercent > 0,
      injuryPercent: Math.floor(injuryPercent * 100),
      injuryTime: hero.injury_time || 0,
      recoverItems: HERO_RECOVER_CONFIG.RECOVER_ITEMS,
      autoRecoverRate: HERO_RECOVER_CONFIG.AUTO_RECOVER_RATE,
    };
  }

  /**
   * 使用恢复道具
   */
  async useRecoverItem(walletAddress: string, heroId: number, itemId: number) {
    const item = HERO_RECOVER_CONFIG.RECOVER_ITEMS.find(i => i.itemId === itemId);
    if (!item) {
      return { success: false, error: '无效的恢复道具' };
    }

    // 检查道具
    const userItem: any = await this.db.prepare(`
      SELECT count FROM user_items WHERE wallet_address = ? AND item_id = ?
    `).bind(walletAddress, itemId).first();

    if ((userItem?.count || 0) < 1) {
      return { success: false, error: '恢复道具不足' };
    }

    // 检查武将
    const hero: any = await this.db.prepare(`
      SELECT hp, max_hp FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(heroId, walletAddress).first();

    if (!hero) {
      return { success: false, error: '武将不存在' };
    }

    const maxHp = hero.max_hp || hero.base_hp * 10;
    const recoverHp = Math.min(item.hp, maxHp - hero.hp);

    if (recoverHp <= 0) {
      return { success: false, error: '武将生命已满' };
    }

    try {
      // 扣除道具
      await this.db.prepare(`
        UPDATE user_items SET count = count - 1 WHERE wallet_address = ? AND item_id = ?
      `).bind(walletAddress, itemId).run();

      // 恢复生命
      await this.db.prepare(`
        UPDATE heroes SET hp = hp + ? WHERE id = ?
      `).bind(recoverHp, heroId).run();

      return {
        success: true,
        heroId,
        itemName: item.name,
        recoverHp,
        newHp: hero.hp + recoverHp,
        maxHp,
        message: `${item.name}使用成功，恢复${recoverHp}点生命`,
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  // ==================== 技能升级系统 ====================

  /**
   * 获取武将技能信息
   */
  async getHeroSkills(walletAddress: string, heroId: number) {
    const hero: any = await this.db.prepare(`
      SELECT h.*, hc.name as hero_name 
      FROM heroes h
      JOIN heroes_config hc ON h.hero_id = hc.id
      WHERE h.id = ? AND h.wallet_address = ?
    `).bind(heroId, walletAddress).first();

    if (!hero) {
      return { success: false, error: '武将不存在' };
    }

    // 获取技能配置（简化为默认技能）
    const skills = [
      {
        id: hero.skill_id_1 || 1,
        name: '普通攻击',
        type: HERO_SKILL_CONFIG.SKILL_TYPES.ACTIVE,
        level: hero.skill_level_1 || 1,
        maxLevel: HERO_SKILL_CONFIG.MAX_SKILL_LEVEL,
      },
      {
        id: hero.skill_id_2 || 2,
        name: '被动技能',
        type: HERO_SKILL_CONFIG.SKILL_TYPES.PASSIVE,
        level: hero.skill_level_2 || 1,
        maxLevel: HERO_SKILL_CONFIG.MAX_SKILL_LEVEL,
      },
    ];

    return {
      success: true,
      heroId,
      heroName: hero.hero_name,
      skills,
      upgradeCosts: HERO_SKILL_CONFIG.SKILL_UPGRADE_COSTS,
      skillExpItems: HERO_SKILL_CONFIG.SKILL_EXP_ITEMS,
    };
  }

  /**
   * 检查技能升级
   */
  async checkSkillUpgrade(walletAddress: string, heroId: number, skillSlot: number) {
    const hero: any = await this.db.prepare(`
      SELECT skill_level_${skillSlot} FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(heroId, walletAddress).first();

    if (!hero) {
      return { success: false, error: '武将不存在' };
    }

    const currentLevel = (hero as any)[`skill_level_${skillSlot}`] || 1;
    if (currentLevel >= HERO_SKILL_CONFIG.MAX_SKILL_LEVEL) {
      return { success: false, error: '技能已满级' };
    }

    const costIndex = currentLevel - 1;
    const cost = HERO_SKILL_CONFIG.SKILL_UPGRADE_COSTS[costIndex];

    // 检查金币
    const user: any = await this.db.prepare(`
      SELECT gold FROM users WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if ((user as any).gold < cost.gold) {
      return {
        success: false,
        error: '金币不足',
        required: cost.gold,
        have: (user as any).gold,
      };
    }

    // 检查技能书
    const skillBook: any = await this.db.prepare(`
      SELECT count FROM user_items WHERE wallet_address = ? AND item_id = ?
    `).bind(walletAddress, cost.skillBook).first();

    if ((skillBook?.count || 0) < 1) {
      return {
        success: false,
        error: '技能书不足',
        required: cost.skillBook,
        have: skillBook?.count || 0,
      };
    }

    return {
      success: true,
      heroId,
      skillSlot,
      currentLevel,
      nextLevel: currentLevel + 1,
      goldCost: cost.gold,
      skillBookCost: cost.skillBook,
    };
  }

  /**
   * 升级技能
   */
  async upgradeSkill(walletAddress: string, heroId: number, skillSlot: number) {
    const checkResult = await this.checkSkillUpgrade(walletAddress, heroId, skillSlot);
    if (!checkResult.success) {
      return checkResult;
    }

    const { currentLevel, goldCost, skillBookCost } = checkResult;

    try {
      // 扣除金币
      await this.db.prepare(`
        UPDATE users SET gold = gold - ? WHERE wallet_address = ?
      `).bind(goldCost, walletAddress).run();

      // 扣除技能书
      await this.db.prepare(`
        UPDATE user_items SET count = count - 1 WHERE wallet_address = ? AND item_id = ?
      `).bind(walletAddress, skillBookCost).run();

      // 更新技能等级
      await this.db.prepare(`
        UPDATE heroes SET skill_level_${skillSlot} = ? WHERE id = ?
      `).bind(currentLevel + 1, heroId).run();

      return {
        success: true,
        heroId,
        skillSlot,
        oldLevel: currentLevel,
        newLevel: currentLevel + 1,
        message: '技能升级成功',
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
}
}
