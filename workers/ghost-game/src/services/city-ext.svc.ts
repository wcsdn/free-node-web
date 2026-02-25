/**
 * CityInterior System Extensions - 城市内政系统扩展
 * 参考原版 jx/BLL/CityInterior.cs (1,308 行)
 */

import type { D1Database } from '@cloudflare/workers-types';

// ==================== 常量配置 ====================

// 繁荣度配置
export const PROSPERITY_CONFIG = {
  MAX_PROSPERITY: 10000,           // 最大繁荣度
  LEVEL_THRESHOLDS: [             // 繁荣度等级阈值
    0, 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000
  ],
  LEVEL_NAMES: [                  // 等级名称
    '村庄', '小镇', '县城', '郡城', '州城', '府城', '京城', '皇城', '帝都', '神州', '天下'
  ],
  TAX_RATE_BASE: 0.1,             // 基础税率
  TAX_RATE_MAX: 0.3,              // 最高税率
  TAX_RATE_LEVEL_BONUS: 0.01,     // 每级繁荣度增加的税率
};

// 资源产量配置
export const RESOURCE_OUTPUT_CONFIG = {
  MONEY: { base: 100, perProsperity: 0.5, perBuilding: 10 },
  FOOD: { base: 100, perProsperity: 0.5, perBuilding: 8 },
  WOOD: { base: 50, perProsperity: 0.3, perBuilding: 6 },
  IRON: { base: 30, perProsperity: 0.2, perBuilding: 4 },
  TAX_RATE: 0.15,                 // 税收比例
};

// 人口增长配置
export const POPULATION_CONFIG = {
  BASE_GROWTH: 10,                // 基础增长率
  PER_PROSPERITY: 0.05,           // 每繁荣度增长
  MAX_POPULATION_MULTIPLIER: 10, // 最大人口倍数
  HAPPINESS_BONUS: 0.1,           // 幸福度加成
  FOOD_CONSUMPTION: 1,           // 每人每秒消耗食物
  CROWDING_THRESHOLD: 0.9,       // 拥挤阈值
  CROWDING_PENALTY: 0.5,         // 拥挤惩罚
};

// 建筑队列配置
export const BUILDING_QUEUE_CONFIG = {
  MAX_QUEUE: 5,                   // 最大队列数
  SPEED_UP_COST: [50, 100, 200, 400, 800], // 加速消耗
  SPEED_UP_RATES: [0.5, 0.25, 0.15, 0.1, 0.05], // 加速比例
  CANCEL_REFUND_RATE: 0.8,        // 取消返还比例
};

// 税收配置
export const TAX_CONFIG = {
  TAX_INTERVAL: 3600,             // 税收间隔（秒）
  TAX_COLLECTION_RATE: 0.8,        // 实际征收率
  TAX_BONUS_LEVEL: 0.05,          // 繁荣度加成
  MAX_TAX_RATE: 0.25,             // 最高税率
  MIN_TAX_RATE: 0.05,            // 最低税率
  GOLD_TO_RES_RATE: 100,          // 金币换资源比例
};

// 建筑功能配置
export const BUILDING_FUNCTION_CONFIG = {
  // 资源产量加成
  RESOURCE_BONUS: {
    'market': { money: 1.5, food: 1.0 },
    'farm': { food: 2.0 },
    'logging_camp': { wood: 2.0 },
    'iron_mine': { iron: 2.0 },
    'bank': { money: 3.0 },
  },
  // 人口容量加成
  POPULATION_BONUS: {
    'house': 100,
    'apartment': 300,
    'mansion': 500,
  },
  // 幸福度加成
  HAPPINESS_BONUS: {
    'temple': 10,
    'theater': 15,
    'garden': 20,
    'bathhouse': 10,
  },
};

// ==================== 服务类扩展 ====================

export class CityInteriorServiceExtension {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ==================== 繁荣度系统 ====================

  /**
   * 获取繁荣度等级信息
   */
  async getProsperityLevel(walletAddress: string) {
    const city: any = await this.db.prepare(`
      SELECT prosperity FROM cities WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!city) {
      return { success: false, error: '城市不存在' };
    }

    const prosperity = city.prosperity || 0;
    let level = 0;
    for (let i = 0; i < PROSPERITY_CONFIG.LEVEL_THRESHOLDS.length; i++) {
      if (prosperity >= PROSPERITY_CONFIG.LEVEL_THRESHOLDS[i]) {
        level = i;
      }
    }

    const nextLevel = level + 1;
    const nextThreshold = PROSPERITY_CONFIG.LEVEL_THRESHOLDS[nextLevel] || prosperity;
    const currentThreshold = PROSPERITY_CONFIG.LEVEL_THRESHOLDS[level];

    return {
      success: true,
      prosperity,
      level,
      levelName: PROSPERITY_CONFIG.LEVEL_NAMES[level],
      nextLevel: nextLevel < PROSPERITY_CONFIG.LEVEL_NAMES.length ? nextLevel : null,
      nextThreshold,
      progress: currentThreshold < prosperity ? 
        Math.floor((prosperity - currentThreshold) / (nextThreshold - currentThreshold) * 100) : 0,
    };
  }

  /**
   * 计算繁荣度加成
   */
  calculateProsperityBonus(prosperity: number) {
    const level = Math.floor(prosperity / 1000);
    
    return {
      taxRate: Math.min(PROSPERITY_CONFIG.TAX_RATE_MAX, 
        PROSPERITY_CONFIG.TAX_RATE_BASE + level * PROSPERITY_CONFIG.TAX_RATE_LEVEL_BONUS),
      resourceBonus: 1 + (level * 0.05),
      populationBonus: 1 + (level * 0.02),
      defenseBonus: 1 + (level * 0.03),
      recruitBonus: 1 + (level * 0.02),
    };
  }

  /**
   * 更新繁荣度
   */
  async updateProsperity(walletAddress: string, delta: number) {
    const city: any = await this.db.prepare(`
      SELECT prosperity, max_prosperity FROM cities WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!city) {
      return { success: false, error: '城市不存在' };
    }

    const maxProsperity = city.max_prosperity || PROSPERITY_CONFIG.MAX_PROSPERITY;
    const newProsperity = Math.max(0, Math.min(maxProsperity, (city.prosperity || 0) + delta));

    await this.db.prepare(`
      UPDATE cities SET prosperity = ? WHERE wallet_address = ?
    `).bind(newProsperity, walletAddress).run();

    const levelBefore = Math.floor((city.prosperity || 0) / 1000);
    const levelAfter = Math.floor(newProsperity / 1000);
    const leveledUp = levelAfter > levelBefore;

    return {
      success: true,
      oldProsperity: city.prosperity || 0,
      newProsperity,
      delta,
      leveledUp,
      newLevel: levelAfter,
      levelName: PROSPERITY_CONFIG.LEVEL_NAMES[levelAfter],
      message: leveledUp ? `恭喜！城市升级为 ${PROSPERITY_CONFIG.LEVEL_NAMES[levelAfter]}` : null,
    };
  }

  // ==================== 资源产量系统 ====================

  /**
   * 获取资源产量信息
   */
  async getResourceOutput(walletAddress: string) {
    const city: any = await this.db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM buildings WHERE wallet_address = ? AND type = 'market') as market_count,
        (SELECT COUNT(*) FROM buildings WHERE wallet_address = ? AND type = 'farm') as farm_count,
        (SELECT COUNT(*) FROM buildings WHERE wallet_address = ? AND type = 'logging_camp') as logging_count,
        (SELECT COUNT(*) FROM buildings WHERE wallet_address = ? AND type = 'iron_mine') as iron_count,
        (SELECT COUNT(*) FROM buildings WHERE wallet_address = ? AND type = 'bank') as bank_count
      FROM cities c
      WHERE c.wallet_address = ?
    `).bind(walletAddress, walletAddress, walletAddress, walletAddress, walletAddress, walletAddress).first();

    if (!city) {
      return { success: false, error: '城市不存在' };
    }

    const prosperity = city.prosperity || 0;
    const bonus = this.calculateProsperityBonus(prosperity);

    // 计算各种资源产量
    const buildings = {
      market: city.market_count || 0,
      farm: city.farm_count || 0,
      logging: city.logging_count || 0,
      iron: city.iron_count || 0,
      bank: city.bank_count || 0,
    };

    const output = {
      money: Math.floor((RESOURCE_OUTPUT_CONFIG.MONEY.base + 
        prosperity * RESOURCE_OUTPUT_CONFIG.MONEY.perProsperity +
        buildings.market * RESOURCE_OUTPUT_CONFIG.MONEY.perBuilding +
        buildings.bank * 50) * bonus.resourceBonus),
      food: Math.floor((RESOURCE_OUTPUT_CONFIG.FOOD.base + 
        prosperity * RESOURCE_OUTPUT_CONFIG.FOOD.perProsperity +
        buildings.farm * RESOURCE_OUTPUT_CONFIG.FOOD.perBuilding) * bonus.resourceBonus),
      wood: Math.floor((RESOURCE_OUTPUT_CONFIG.WOOD.base + 
        prosperity * RESOURCE_OUTPUT_CONFIG.WOOD.perProsperity +
        buildings.logging * RESOURCE_OUTPUT_CONFIG.WOOD.perBuilding) * bonus.resourceBonus),
      iron: Math.floor((RESOURCE_OUTPUT_CONFIG.IRON.base + 
        prosperity * RESOURCE_OUTPUT_CONFIG.IRON.perProsperity +
        buildings.iron * RESOURCE_OUTPUT_CONFIG.IRON.perBuilding) * bonus.resourceBonus),
    };

    return {
      success: true,
      cityId: city.id,
      prosperity,
      level: Math.floor(prosperity / 1000),
      bonus,
      buildings,
      output,
      outputPerSecond: output,
      outputPerHour: {
        money: output.money * 3600,
        food: output.food * 3600,
        wood: output.wood * 3600,
        iron: output.iron * 3600,
      },
    };
  }

  // ==================== 人口系统 ====================

  /**
   * 获取人口信息
   */
  async getPopulationInfo(walletAddress: string) {
    const city: any = await this.db.prepare(`
      SELECT population, max_population, happiness, prosperity FROM cities WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!city) {
      return { success: false, error: '城市不存在' };
    }

    const population = city.population || 0;
    const maxPopulation = city.max_population || 1000;
    const happiness = city.happiness || 50;
    const prosperity = city.prosperity || 0;

    // 计算增长率
    const baseGrowth = POPULATION_CONFIG.BASE_GROWTH;
    const prosperityBonus = 1 + (prosperity / 10000) * POPULATION_CONFIG.PER_PROSPERITY;
    const happinessBonus = happiness > 50 ? 1 + ((happiness - 50) / 100) * POPULATION_CONFIG.HAPPINESS_BONUS : 0.8;
    
    // 拥挤惩罚
    const crowdingRate = population / maxPopulation;
    let crowdingPenalty = 1;
    if (crowdingRate > POPULATION_CONFIG.CROWDING_THRESHOLD) {
      crowdingPenalty = POPULATION_CONFIG.CROWDING_PENALTY;
    }

    const growthRate = Math.floor(baseGrowth * prosperityBonus * happinessBonus * crowdingPenalty);

    return {
      success: true,
      current: population,
      max: maxPopulation,
      percent: Math.floor((population / maxPopulation) * 100),
      happiness,
      growthRate,
      growthPerHour: growthRate * 3600,
      growthPerDay: growthRate * 86400,
      status: crowdingRate > 0.9 ? 'crowded' : happiness < 30 ? 'unhappy' : 'normal',
    };
  }

  /**
   * 更新人口
   */
  async updatePopulation(walletAddress: string, delta: number) {
    const city: any = await this.db.prepare(`
      SELECT population, max_population FROM cities WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!city) {
      return { success: false, error: '城市不存在' };
    }

    const newPopulation = Math.max(0, Math.min(city.max_population || 1000, (city.population || 0) + delta));

    await this.db.prepare(`
      UPDATE cities SET population = ? WHERE wallet_address = ?
    `).bind(newPopulation, walletAddress).run();

    return {
      success: true,
      oldPopulation: city.population || 0,
      newPopulation,
      delta,
      maxPopulation: city.max_population || 1000,
    };
  }

  /**
   * 更新幸福度
   */
  async updateHappiness(walletAddress: string, delta: number) {
    const city: any = await this.db.prepare(`
      SELECT happiness FROM cities WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!city) {
      return { success: false, error: '城市不存在' };
    }

    const newHappiness = Math.max(0, Math.min(100, (city.happiness || 50) + delta));

    await this.db.prepare(`
      UPDATE cities SET happiness = ? WHERE wallet_address = ?
    `).bind(newHappiness, walletAddress).run();

    return {
      success: true,
      oldHappiness: city.happiness || 50,
      newHappiness,
      delta,
      status: newHappiness > 70 ? 'happy' : newHappiness < 30 ? 'unhappy' : 'neutral',
    };
  }

  // ==================== 税收系统 ====================

  /**
   * 获取税收信息
   */
  async getTaxInfo(walletAddress: string) {
    const city: any = await this.db.prepare(`
      SELECT prosperity, population, last_tax_time, tax_rate FROM cities WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!city) {
      return { success: false, error: '城市不存在' };
    }

    const prosperity = city.prosperity || 0;
    const population = city.population || 0;
    const taxRate = city.tax_rate || TAX_CONFIG.MIN_TAX_RATE;
    const lastTaxTime = city.last_tax_time || 0;

    const bonus = this.calculateProsperityBonus(prosperity);
    const effectiveRate = Math.min(taxRate + (prosperity / 10000) * TAX_CONFIG.TAX_BONUS_LEVEL, TAX_CONFIG.MAX_TAX_RATE);

    // 计算预计税收
    const baseTax = population * effectiveRate;
    const taxAmount = Math.floor(baseTax);

    // 计算下次税收时间
    const nextTaxTime = lastTaxTime + TAX_CONFIG.TAX_INTERVAL;
    const timeRemaining = Math.max(0, nextTaxTime - Math.floor(Date.now() / 1000));

    return {
      success: true,
      currentRate: taxRate,
      effectiveRate,
      maxRate: TAX_CONFIG.MAX_TAX_RATE,
      minRate: TAX_CONFIG.MIN_TAX_RATE,
      population,
      baseTax,
      taxAmount,
      interval: TAX_CONFIG.TAX_INTERVAL,
      lastTaxTime,
      nextTaxTime,
      timeRemaining,
      canCollect: timeRemaining <= 0,
    };
  }

  /**
   * 收取税收
   */
  async collectTax(walletAddress: string) {
    const checkResult = await this.getTaxInfo(walletAddress);
    if (!checkResult.success) {
      return checkResult;
    }

    if (!checkResult.canCollect) {
      return {
        success: false,
        error: '税收时间未到',
        timeRemaining: checkResult.timeRemaining,
      };
    }

    const taxAmount = checkResult.taxAmount;

    try {
      // 更新税收时间和金币
      await this.db.prepare(`
        UPDATE cities SET last_tax_time = ?, gold = gold + ? WHERE wallet_address = ?
      `).bind(Math.floor(Date.now() / 1000), taxAmount, walletAddress).run();

      // 更新用户金币
      await this.db.prepare(`
        UPDATE users SET gold = gold + ? WHERE wallet_address = ?
      `).bind(taxAmount, walletAddress).run();

      return {
        success: true,
        taxAmount,
        nextTaxTime: checkResult.nextTaxTime + TAX_CONFIG.TAX_INTERVAL,
        message: `收取税收 ${taxAmount} 金币`,
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * 设置税率
   */
  async setTaxRate(walletAddress: string, newRate: number) {
    const city: any = await this.db.prepare(`
      SELECT tax_rate FROM cities WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!city) {
      return { success: false, error: '城市不存在' };
    }

    const rate = Math.max(TAX_CONFIG.MIN_TAX_RATE, Math.min(TAX_CONFIG.MAX_TAX_RATE, newRate));

    await this.db.prepare(`
      UPDATE cities SET tax_rate = ? WHERE wallet_address = ?
    `).bind(rate, walletAddress).run();

    return {
      success: true,
      oldRate: city.tax_rate || TAX_CONFIG.MIN_TAX_RATE,
      newRate: rate,
      message: `税率已调整为 ${(rate * 100).toFixed(1)}%`,
    };
  }

  // ==================== 建筑队列系统 ====================

  /**
   * 获取建筑队列
   */
  async getBuildingQueue(walletAddress: string) {
    const queue: any = await this.db.prepare(`
      SELECT * FROM building_queue 
      WHERE wallet_address = ? AND status = 'pending'
      ORDER BY queue_order ASC, created_at ASC
    `).bind(walletAddress).all();

    return {
      success: true,
      queue: (queue.results || []).map((q: any) => ({
        id: q.id,
        buildingType: q.building_type,
        level: q.level,
        position: q.position,
        startTime: q.start_time,
        endTime: q.end_time,
        progress: Math.min(100, Math.floor((Date.now() / 1000 - q.start_time) / (q.end_time - q.start_time) * 100)),
      })),
      maxQueue: BUILDING_QUEUE_CONFIG.MAX_QUEUE,
      currentQueue: (queue.results || []).length,
      availableSlots: BUILDING_QUEUE_CONFIG.MAX_QUEUE - (queue.results || []).length,
    };
  }

  /**
   * 加速建筑
   */
  async speedUpBuilding(walletAddress: string, queueId: number) {
    const queueItem: any = await this.db.prepare(`
      SELECT * FROM building_queue WHERE id = ? AND wallet_address = ?
    `).bind(queueId, walletAddress).first();

    if (!queueItem) {
      return { success: false, error: '队列不存在' };
    }

    if (queueItem.status !== 'pending') {
      return { success: false, error: '建筑已完成或已取消' };
    }

    const remainingTime = queueItem.end_time - Math.floor(Date.now() / 1000);
    if (remainingTime <= 0) {
      return { success: false, error: '建筑已完成' };
    }

    // 计算加速费用
    const speedIndex = Math.min(BUILDING_QUEUE_CONFIG.SPEED_UP_COST.length - 1, 
      Math.floor(remainingTime / 3600)); // 每小时一个档位
    const cost = BUILDING_QUEUE_CONFIG.SPEED_UP_COST[speedIndex];

    // 检查金币
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

    try {
      // 扣除金币
      await this.db.prepare(`
        UPDATE users SET gold = gold - ? WHERE wallet_address = ?
      `).bind(cost, walletAddress).run();

      // 完成建筑
      await this.db.prepare(`
        UPDATE building_queue SET status = 'completed', end_time = ? WHERE id = ?
      `).bind(Math.floor(Date.now() / 1000), queueId).run();

      // 添加到建筑表
      await this.db.prepare(`
        INSERT INTO buildings (wallet_address, type, level, position, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).bind(walletAddress, queueItem.building_type, queueItem.level, queueItem.position).run();

      return {
        success: true,
        queueId,
        cost,
        remainingTime,
        savedTime: remainingTime,
        message: `消耗 ${cost} 金币，建筑立即完成`,
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * 取消建筑
   */
  async cancelBuilding(walletAddress: string, queueId: number) {
    const queueItem: any = await this.db.prepare(`
      SELECT * FROM building_queue WHERE id = ? AND wallet_address = ?
    `).bind(queueId, walletAddress).first();

    if (!queueItem) {
      return { success: false, error: '队列不存在' };
    }

    if (queueItem.status !== 'pending') {
      return { success: false, error: '建筑已完成或已取消' };
    }

    // 计算返还资源
    const refundRate = BUILDING_QUEUE_CONFIG.CANCEL_REFUND_RATE;

    try {
      // 删除队列
      await this.db.prepare(`
        DELETE FROM building_queue WHERE id = ?
      `).bind(queueId).run();

      // 返还资源（简化：返还部分金币）
      await this.db.prepare(`
        UPDATE users SET gold = gold + ? WHERE wallet_address = ?
      `).bind(Math.floor(1000 * refundRate), walletAddress).run(); // 简化：返还1000金币

      return {
        success: true,
        queueId,
        refundRate,
        message: `取消成功，返还部分资源`,
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
