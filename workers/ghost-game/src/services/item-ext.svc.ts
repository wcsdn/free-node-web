/**
 * Item System Extensions - 物品系统扩展
 * 从 jx/BLL/ItemEx.cs 迁移
 */

import type { D1Database } from '@cloudflare/workers-types';

// ==================== 常量配置 ====================

// 物品类型
export const ITEM_TYPES_EXT = {
  WEAPON: 1,       // 武器
  ARMOR: 2,        // 防具
  HELMET: 3,       // 头盔
  BOOTS: 4,        // 靴子
  BELT: 5,         // 腰带
  ACCESSORY: 6,     // 饰品
  CONSUMABLE: 7,   // 消耗品
  MATERIAL: 8,      // 材料
  GEM: 9,          // 宝石
  SPECIAL: 10,      // 特殊物品
};

// 合成配方配置
export const COMPOSE_RECIPES: { [key: number]: {
  id: number;
  name: string;
  resultItemId: number;
  materials: { itemId: number; count: number }[];
  goldCost: number;
  successRate: number;
  category: string;
} } = {
  1001: { id: 1001, name: '精炼铁矿', resultItemId: 2001, materials: [{ itemId: 1001, count: 10 }], goldCost: 100, successRate: 0.9, category: '矿石' },
  1002: { id: 1002, name: '锻造精钢', resultItemId: 2002, materials: [{ itemId: 1001, count: 20 }, { itemId: 1002, count: 10 }], goldCost: 200, successRate: 0.85, category: '金属' },
  1003: { id: 1003, name: '制作皮甲', resultItemId: 2003, materials: [{ itemId: 1003, count: 15 }], goldCost: 150, successRate: 0.88, category: '皮革' },
  1004: { id: 1004, name: '纺织丝绸', resultItemId: 2004, materials: [{ itemId: 1004, count: 10 }], goldCost: 180, successRate: 0.87, category: '布料' },
  1005: { id: 1005, name: '镶嵌宝石', resultItemId: 9001, materials: [{ itemId: 1005, count: 5 }], goldCost: 300, successRate: 0.95, category: '宝石' },
  1006: { id: 1006, name: '打造武器', resultItemId: 10101, materials: [{ itemId: 2001, count: 10 }, { itemId: 2002, count: 5 }], goldCost: 500, successRate: 0.8, category: '武器' },
  1007: { id: 1007, name: '锻造防具', resultItemId: 10201, materials: [{ itemId: 2002, count: 10 }, { itemId: 2003, count: 8 }], goldCost: 450, successRate: 0.82, category: '防具' },
};

// 强化配置
export const ENHANCE_CONFIG = {
  MAX_LEVEL: 15,                    // 最大强化等级
  BASE_COST: [100, 150, 200, 300, 400, 500, 600, 800, 1000, 1200, 1500, 1800, 2000, 2500, 3000], // 每级基础消耗金币
  SUCCESS_RATES: [1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3], // 强化成功率
  BREAKTHROUGH_RATE: 0.5,           // 突破成功率
  DOWNGRADE_ON_FAIL: true,         // 失败是否降级
};

// 镶嵌配置
export const GEM_SLOTS = {
  MAX_SLOTS: 4,                    // 最大镶嵌孔数
  UNLOCK_COSTS: [500, 1000, 2000, 3000], // 开孔费用
  GEM_TYPES: {
    ATTACK: 1,   // 攻击宝石
    DEFENSE: 2,   // 防御宝石
    HP: 3,        // 生命宝石
    CRITICAL: 4,   // 暴击宝石
  },
};

// 耐久度配置
export const DURABILITY_CONFIG = {
  MAX_DURABILITY: 100,            // 最大耐久度
  REPAIR_COST_FACTOR: 0.1,        // 修理费用系数
  DECAY_RATE: 1,                  // 每次使用耐久度减少
  CRITICAL_DECAY: 5,              // 战斗等关键使用消耗
};

// 分解配置
export const DISMANTLE_CONFIG = {
  RETURN_RATE: 0.3,               // 材料返还比例
  QUALITY_BONUS: {
    1: 0.1,   // 白色
    2: 0.2,   // 绿色
    3: 0.3,   // 蓝色
    4: 0.5,   // 紫色
    5: 0.8,   // 橙色
    6: 1.0,   // 红色
  },
};

// ==================== 服务类扩展 ====================

export class ItemServiceExtension {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ==================== 物品合成系统 ====================

  /**
   * 获取合成配方列表
   */
  async getComposeRecipes(category?: string) {
    let recipes = Object.values(COMPOSE_RECIPES);
    
    if (category) {
      recipes = recipes.filter(r => r.category === category);
    }

    return {
      recipes: recipes.map(r => ({
        id: r.id,
        name: r.name,
        resultItemId: r.resultItemId,
        materials: r.materials,
        goldCost: r.goldCost,
        successRate: r.successRate,
        category: r.category,
      })),
      total: recipes.length,
    };
  }

  /**
   * 检查合成所需材料
   */
  async checkComposeMaterials(walletAddress: string, recipeId: number) {
    const recipe = COMPOSE_RECIPES[recipeId];
    if (!recipe) {
      return { success: false, error: '配方不存在' };
    }

    // 检查用户材料是否足够
    const insufficient: { itemId: number; name: string; required: number; have: number }[] = [];

    for (const material of recipe.materials) {
      const userItem: any = await this.db.prepare(`
        SELECT ui.*, ic.name as item_name 
        FROM user_items ui
        JOIN items_config ic ON ui.item_id = ic.id
        WHERE ui.wallet_address = ? AND ui.item_id = ?
      `).bind(walletAddress, material.itemId).first();

      const haveCount = userItem?.count || 0;
      if (haveCount < material.count) {
        insufficient.push({
          itemId: material.itemId,
          name: userItem?.item_name || `材料${material.itemId}`,
          required: material.count,
          have: haveCount,
        });
      }
    }

    if (insufficient.length > 0) {
      return {
        success: false,
        error: '材料不足',
        insufficient,
      };
    }

    // 检查金币
    const user: any = await this.db.prepare(`
      SELECT gold FROM users WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if ((user as any).gold < recipe.goldCost) {
      return {
        success: false,
        error: '金币不足',
        required: recipe.goldCost,
        have: (user as any).gold,
      };
    }

    return {
      success: true,
      recipe,
      totalCost: recipe.goldCost,
    };
  }

  /**
   * 执行物品合成
   */
  async composeItem(walletAddress: string, recipeId: number) {
    const checkResult = await this.checkComposeMaterials(walletAddress, recipeId);
    if (!checkResult.success) {
      return checkResult;
    }

    const recipe = COMPOSE_RECIPES[recipeId]!;

    try {
      // 扣除材料
      for (const material of recipe.materials) {
        await this.db.prepare(`
          UPDATE user_items 
          SET count = count - ? 
          WHERE wallet_address = ? AND item_id = ?
        `).bind(material.count, walletAddress, material.itemId).run();
      }

      // 扣除金币
      await this.db.prepare(`
        UPDATE users SET gold = gold - ? WHERE wallet_address = ?
      `).bind(recipe.goldCost, walletAddress).run();

      // 计算成功率并决定结果
      const roll = Math.random();
      const success = roll < recipe.successRate;

      if (!success) {
        // 合成失败，返还部分材料
        return {
          success: false,
          error: '合成失败',
          materialsReturned: recipe.materials.map(m => ({
            itemId: m.itemId,
            count: Math.floor(m.count * 0.3),
          })),
        };
      }

      // 合成成功，添加产物
      await this.addItem(walletAddress, {
        configId: recipe.resultItemId,
        count: 1,
        source: 'compose',
      });

      // 记录合成日志
      await this.logCompose(walletAddress, recipeId, recipe.resultItemId, true);

      return {
        success: true,
        resultItemId: recipe.resultItemId,
        cost: recipe.goldCost,
        message: '合成成功',
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * 记录合成日志
   */
  private async logCompose(walletAddress: string, recipeId: number, resultItemId: number, success: boolean) {
    await this.db.prepare(`
      INSERT INTO compose_logs (wallet_address, recipe_id, result_item_id, success, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(walletAddress, recipeId, resultItemId, success ? 1 : 0).run();
  }

  // ==================== 物品强化系统 ====================

  /**
   * 获取强化配置
   */
  getEnhanceConfig(currentLevel: number) {
    if (currentLevel < 0 || currentLevel >= ENHANCE_CONFIG.MAX_LEVEL) {
      return null;
    }

    return {
      level: currentLevel,
      nextLevel: currentLevel + 1,
      baseCost: ENHANCE_CONFIG.BASE_COST[currentLevel],
      successRate: ENHANCE_CONFIG.SUCCESS_RATES[currentLevel],
      costGold: Math.floor(ENHANCE_CONFIG.BASE_COST[currentLevel] * (currentLevel + 1) / 10),
    };
  }

  /**
   * 检查物品是否可以强化
   */
  async checkEnhance(walletAddress: string, itemId: number, targetLevel: number) {
    const item: any = await this.db.prepare(`
      SELECT ui.*, ic.type, ic.quality, ic.enhance_level
      FROM user_items ui
      JOIN items_config ic ON ui.item_id = ic.id
      WHERE ui.id = ? AND ui.wallet_address = ?
    `).bind(itemId, walletAddress).first();

    if (!item) {
      return { success: false, error: '物品不存在' };
    }

    if (item.type !== ITEM_TYPES_EXT.WEAPON && 
        item.type !== ITEM_TYPES_EXT.ARMOR &&
        item.type !== ITEM_TYPES_EXT.HELMET &&
        item.type !== ITEM_TYPES_EXT.BOOTS) {
      return { success: false, error: '此类型物品不能强化' };
    }

    const currentLevel = item.enhance_level || 0;
    if (currentLevel >= ENHANCE_CONFIG.MAX_LEVEL) {
      return { success: false, error: '已达到最大强化等级' };
    }

    if (targetLevel !== currentLevel + 1) {
      return { success: false, error: '只能逐级强化' };
    }

    const config = this.getEnhanceConfig(currentLevel);
    if (!config) {
      return { success: false, error: '强化配置不存在' };
    }

    // 检查金币
    const user: any = await this.db.prepare(`
      SELECT gold FROM users WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if ((user as any).gold < config.costGold) {
      return {
        success: false,
        error: '金币不足',
        required: config.costGold,
        have: (user as any).gold,
      };
    }

    return {
      success: true,
      item,
      config,
    };
  }

  /**
   * 执行物品强化
   */
  async enhanceItem(walletAddress: string, itemId: number) {
    const checkResult = await this.checkEnhance(walletAddress, itemId, 0);
    if (!checkResult.success) {
      return checkResult;
    }

    const { config, item } = checkResult;
    const currentLevel = item.enhance_level || 0;

    try {
      // 扣除金币
      await this.db.prepare(`
        UPDATE users SET gold = gold - ? WHERE wallet_address = ?
      `).bind(config.costGold, walletAddress).run();

      // 计算成功率
      const roll = Math.random();
      const success = roll < config.successRate;

      if (success) {
        // 强化成功
        await this.db.prepare(`
          UPDATE user_items SET enhance_level = ? WHERE id = ?
        `).bind(currentLevel + 1, itemId).run();

        // 计算属性加成
        const statBonus = Math.floor((currentLevel + 1) * 10 * (item.quality / 100));
        
        await this.logEnhance(walletAddress, itemId, currentLevel + 1, true, statBonus);

        return {
          success: true,
          newLevel: currentLevel + 1,
          statBonus,
          cost: config.costGold,
          message: `强化成功！属性+${statBonus}`,
        };
      } else {
        // 强化失败
        let newLevel = currentLevel;
        let message = '强化失败';

        if (ENHANCE_CONFIG.DOWNGRADE_ON_FAIL && currentLevel > 0) {
          newLevel = currentLevel - 1;
          await this.db.prepare(`
            UPDATE user_items SET enhance_level = ? WHERE id = ?
          `).bind(newLevel, itemId).run();
          message = '强化失败，等级下降';
        }

        await this.logEnhance(walletAddress, itemId, newLevel, false, 0);

        return {
          success: false,
          newLevel,
          cost: config.costGold,
          message,
        };
      }
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * 记录强化日志
   */
  private async logEnhance(walletAddress: string, itemId: number, newLevel: number, success: boolean, statBonus: number) {
    await this.db.prepare(`
      INSERT INTO enhance_logs (wallet_address, item_id, new_level, success, stat_bonus, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(walletAddress, itemId, newLevel, success ? 1 : 0, statBonus).run();
  }

  // ==================== 镶嵌系统 ====================

  /**
   * 获取物品镶嵌信息
   */
  async getGemSlots(walletAddress: string, itemId: number) {
    const item: any = await this.db.prepare(`
      SELECT ui.*, ic.type 
      FROM user_items ui
      JOIN items_config ic ON ui.item_id = ic.id
      WHERE ui.id = ? AND ui.wallet_address = ?
    `).bind(itemId, walletAddress).first();

    if (!item) {
      return { success: false, error: '物品不存在' };
    }

    // 获取已镶嵌的宝石
    const gems: any = await this.db.prepare(`
      SELECT ug.*, gc.name as gem_name, gc.type as gem_type, gc.atk, gc.def, gc.hp, gc.critical
      FROM user_gems ug
      JOIN gems_config gc ON ug.gem_id = gc.id
      WHERE ug.item_id = ?
    `).bind(itemId).all();

    return {
      success: true,
      itemId,
      maxSlots: GEM_SLOTS.MAX_SLOTS,
      currentSlots: (gems.results || []).length,
      gems: (gems.results || []).map((g: any) => ({
        id: g.id,
        gemId: g.gem_id,
        name: g.gem_name,
        type: g.gem_type,
        stats: {
          atk: g.atk,
          def: g.def,
          hp: g.hp,
          critical: g.critical,
        },
        slot: g.slot,
      })),
    };
  }

  /**
   * 镶嵌宝石
   */
  async equipGem(walletAddress: string, itemId: number, gemId: number, slot?: number) {
    // 检查物品
    const item: any = await this.db.prepare(`
      SELECT ui.*, ic.type 
      FROM user_items ui
      JOIN items_config ic ON ui.item_id = ic.id
      WHERE ui.id = ? AND ui.wallet_address = ?
    `).bind(itemId, walletAddress).first();

    if (!item) {
      return { success: false, error: '物品不存在' };
    }

    // 检查宝石
    const gem: any = await this.db.prepare(`
      SELECT ug.*, gc.name as gem_name, gc.type as gem_type
      FROM user_gems ug
      JOIN gems_config gc ON ug.gem_id = gc.id
      WHERE ug.id = ? AND ug.wallet_address = ?
    `).bind(gemId, walletAddress).first();

    if (!gem) {
      return { success: false, error: '宝石不存在' };
    }

    // 检查孔位
    const currentGems: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM user_gems WHERE item_id = ?
    `).bind(itemId).first();

    const usedSlots = (currentGems as any).count || 0;
    if (usedSlots >= GEM_SLOTS.MAX_SLOTS) {
      return { success: false, error: '镶嵌孔已满' };
    }

    // 确定镶嵌槽位
    const targetSlot = slot !== undefined ? slot : usedSlots;

    // 检查槽位是否已被占用
    const existing: any = await this.db.prepare(`
      SELECT id FROM user_gems WHERE item_id = ? AND slot = ?
    `).bind(itemId, targetSlot).first();

    if (existing) {
      return { success: false, error: `槽位${targetSlot}已被占用` };
    }

    // 执行镶嵌
    await this.db.prepare(`
      UPDATE user_gems SET item_id = ?, slot = ? WHERE id = ?
    `).bind(itemId, targetSlot, gemId).run();

    return {
      success: true,
      itemId,
      gemId,
      slot: targetSlot,
      message: '镶嵌成功',
    };
  }

  /**
   * 卸下宝石
   */
  async unequipGem(walletAddress: string, gemId: number) {
    const gem: any = await this.db.prepare(`
      SELECT * FROM user_gems WHERE id = ? AND wallet_address = ?
    `).bind(gemId, walletAddress).first();

    if (!gem) {
      return { success: false, error: '宝石不存在' };
    }

    await this.db.prepare(`
      UPDATE user_gems SET item_id = NULL, slot = NULL WHERE id = ?
    `).bind(gemId).run();

    return {
      success: true,
      gemId,
      message: '卸下成功',
    };
  }

  // ==================== 耐久度系统 ====================

  /**
   * 获取物品耐久度状态
   */
  async getDurability(walletAddress: string, itemId: number) {
    const item: any = await this.db.prepare(`
      SELECT ui.*, ic.durability as max_durability, ic.type, ic.name as item_name
      FROM user_items ui
      JOIN items_config ic ON ui.item_id = ic.id
      WHERE ui.id = ? AND ui.wallet_address = ?
    `).bind(itemId, walletAddress).first();

    if (!item) {
      return { success: false, error: '物品不存在' };
    }

    const currentDurability = item.durability || item.max_durability;
    const percent = Math.floor((currentDurability / item.max_durability) * 100);

    return {
      success: true,
      itemId,
      itemName: item.item_name,
      current: currentDurability,
      max: item.max_durability,
      percent,
      status: percent > 50 ? 'good' : percent > 20 ? 'warning' : 'critical',
    };
  }

  /**
   * 使用物品（减少耐久度）
   */
  async useWithDurability(walletAddress: string, itemId: number, decay: number = DURABILITY_CONFIG.DECAY_RATE) {
    const item: any = await this.db.prepare(`
      SELECT ui.*, ic.durability as max_durability
      FROM user_items ui
      JOIN items_config ic ON ui.item_id = ic.id
      WHERE ui.id = ? AND ui.wallet_address = ?
    `).bind(itemId, walletAddress).first();

    if (!item) {
      return { success: false, error: '物品不存在' };
    }

    const maxDurability = item.durability || item.max_durability;
    let currentDurability = item.durability || maxDurability;

    if (currentDurability <= 0) {
      return { success: false, error: '物品耐久度为0，无法使用' };
    }

    // 减少耐久度
    currentDurability = Math.max(0, currentDurability - decay);

    await this.db.prepare(`
      UPDATE user_items SET durability = ? WHERE id = ?
    `).bind(currentDurability, itemId).run();

    return {
      success: true,
      itemId,
      decay,
      remaining: currentDurability,
      destroyed: currentDurability <= 0,
    };
  }

  /**
   * 修理物品
   */
  async repairItem(walletAddress: string, itemId: number, repairAll: boolean = false) {
    const item: any = await this.db.prepare(`
      SELECT ui.*, ic.durability as max_durability, ic.type, ic.name as item_name, ic.repair_cost
      FROM user_items ui
      JOIN items_config ic ON ui.item_id = ic.id
      WHERE ui.id = ? AND ui.wallet_address = ?
    `).bind(itemId, walletAddress).first();

    if (!item) {
      return { success: false, error: '物品不存在' };
    }

    const currentDurability = item.durability || item.max_durability;
    if (currentDurability >= item.max_durability) {
      return { success: false, error: '物品无需修理' };
    }

    // 计算修理费用
    const lostDurability = item.max_durability - currentDurability;
    const cost = Math.floor(lostDurability * DURABILITY_CONFIG.REPAIR_COST_FACTOR * (item.repair_cost || 10));

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

    // 扣除金币并恢复耐久度
    await this.db.prepare(`
      UPDATE users SET gold = gold - ? WHERE wallet_address = ?
    `).bind(cost, walletAddress).run();

    await this.db.prepare(`
      UPDATE user_items SET durability = ? WHERE id = ?
    `).bind(item.max_durability, itemId).run();

    return {
      success: true,
      itemId,
      restored: lostDurability,
      cost,
      message: `修理成功，恢复${lostDurability}点耐久度`,
    };
  }

  // ==================== 物品分解系统 ====================

  /**
   * 检查分解材料
   */
  async checkDismantle(walletAddress: string, itemId: number) {
    const item: any = await this.db.prepare(`
      SELECT ui.*, ic.type, ic.quality, ic.name as item_name, ic.dismantle_materials
      FROM user_items ui
      JOIN items_config ic ON ui.item_id = ic.id
      WHERE ui.id = ? AND ui.wallet_address = ?
    `).bind(itemId, walletAddress).first();

    if (!item) {
      return { success: false, error: '物品不存在' };
    }

    if (item.count > 1) {
      return { success: false, error: '只能分解单个物品' };
    }

    const quality = item.quality || 1;
    const returnRate = DISMANTLE_CONFIG.RETURN_RATE * 
                       (DISMANTLE_CONFIG.QUALITY_BONUS[quality as keyof typeof DISMANTLE_CONFIG.QUALITY_BONUS] || 0.1);

    // 解析分解材料配置
    let materials: { itemId: number; count: number; rate: number }[] = [];
    if (item.dismantle_materials) {
      try {
        materials = JSON.parse(item.dismantle_materials);
      } catch {
        materials = [];
      }
    }

    // 根据品质计算返还材料
    const returnMaterials = materials.map(m => ({
      itemId: m.itemId,
      count: Math.ceil(m.count * returnRate),
    }));

    return {
      success: true,
      item,
      quality,
      returnRate,
      returnMaterials,
    };
  }

  /**
   * 执行物品分解
   */
  async dismantleItem(walletAddress: string, itemId: number) {
    const checkResult = await this.checkDismantle(walletAddress, itemId);
    if (!checkResult.success) {
      return checkResult;
    }

    const { item, returnMaterials } = checkResult;

    try {
      // 删除物品
      await this.db.prepare(`
        DELETE FROM user_items WHERE id = ?
      `).bind(itemId).run();

      // 添加返还材料
      for (const mat of returnMaterials) {
        if (mat.count > 0) {
          await this.addItem(walletAddress, {
            configId: mat.itemId,
            count: mat.count,
            source: 'dismantle',
          });
        }
      }

      // 记录日志
      await this.db.prepare(`
        INSERT INTO dismantle_logs (wallet_address, item_id, item_name, quality, materials, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        walletAddress, 
        itemId, 
        item.item_name, 
        item.quality, 
        JSON.stringify(returnMaterials)
      ).run();

      return {
        success: true,
        itemId,
        itemName: item.item_name,
        returnMaterials,
        message: `分解成功，获得${returnMaterials.map(m => `${m.count}个材料`).join(', ')}`,
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 添加物品（简化版，从 ItemService 复制适配）
   */
  private async addItem(walletAddress: string, options: {
    configId: number;
    count?: number;
    heroId?: number;
    type?: string;
    source?: string;
  }) {
    const { configId, count = 1, heroId, type = 'equipment', source = 'system' } = options;

    // 检查是否已存在相同物品
    const existing: any = await this.db.prepare(`
      SELECT id FROM user_items 
      WHERE wallet_address = ? AND item_id = ? AND (hero_id = ? OR (hero_id IS NULL AND ? IS NULL))
    `).bind(walletAddress, configId, heroId, heroId).first();

    if (existing) {
      await this.db.prepare(`
        UPDATE user_items SET count = count + ? WHERE id = ?
      `).bind(count, existing.id).run();
      return { success: true, itemId: existing.id, added: count };
    }

    // 获取物品配置
    const config: any = await this.db.prepare(`
      SELECT * FROM items_config WHERE id = ?
    `).bind(configId).first();

    if (!config) {
      return { success: false, error: '物品配置不存在' };
    }

    const result = await this.db.prepare(`
      INSERT INTO user_items (wallet_address, item_id, count, durability, hero_id, type, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      walletAddress,
      configId,
      count,
      config.durability || DURABILITY_CONFIG.MAX_DURABILITY,
      heroId || null,
      type,
      source
    ).run();

    return { success: true, itemId: result.meta.last_row_id, added: count };
  }
}
