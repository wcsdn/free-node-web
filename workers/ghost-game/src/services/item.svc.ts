/**
 * Item Service - 物品服务层
 * 从 jx/BLL/Item.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Item, ServiceResult } from '../types/models';
import { itemRepo } from '../repositories';

// 物品类型
export const ITEM_TYPES = {
  CONSUMABLE: 'consumable',   // 消耗品
  MATERIAL: 'material',       // 材料
  EQUIPMENT: 'equipment',    // 装备
  QUEST: 'quest',            // 任务物品
  CURRENCY: 'currency',      // 货币
};

// 物品稀有度
export const ITEM_QUALITY = {
  COMMON: 1,      // 普通
  UNCOMMON: 2,     // 优秀
  RARE: 3,        // 稀有
  EPIC: 4,        // 史诗
  LEGENDARY: 5,   // 传说
};

// 物品配置
export const ITEM_CONFIG = {
  MAX_STACK: 99,        // 最大堆叠数
  MAX_BAG_SLOTS: 200,    // 背包最大格子
  DISMANTLE_RATE: 0.3,   // 分解返还比例
};

// 物品使用效果
export const ITEM_EFFECTS = {
  HP_RECOVERY: 1,      // 生命恢复
  MP_RECOVERY: 2,      // 法力恢复
  EXP_BOOST: 3,         // 经验加成
  BUFF: 4,             // 增益效果
};

class ItemService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ============ 物品查询 ============

  /**
   * 获取物品列表
   */
  async getList(walletAddress: string, options: {
    type?: string;
    equipped?: boolean;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { type, equipped, page = 1, pageSize = 50 } = options;
    const offset = (page - 1) * pageSize;

    let query = 'SELECT * FROM items WHERE wallet_address = ?';
    const params: any[] = [walletAddress];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (equipped !== undefined) {
      query += ' AND equipped = ?';
      params.push(equipped);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const result = await this.db.prepare(query).bind(...params).all();

    const totalCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM items WHERE wallet_address = ?
    `).bind(walletAddress).first();

    return {
      items: (result.results || []).map(this.formatItem),
      total: (totalCount as any).count,
      page,
      pageSize,
    };
  }

  /**
   * 获取物品详情
   */
  async getDetail(itemId: number) {
    const item: any = await this.db.prepare(`
      SELECT i.*, ic.Name as config_name, ic.Type as config_type, ic.Des as config_des, ic.Icon as config_icon
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ?
    `).bind(itemId).first();

    if (!item) return null;

    return this.formatItem(item);
  }

  /**
   * 获取武将装备
   */
  async getByHero(heroId: number) {
    const items: any = await this.db.prepare(`
      SELECT i.*, ic.Name as config_name, ic.Type as config_type, ic.EffectType, ic.EffectValue
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.hero_id = ? AND i.equipped = 1
    `).bind(heroId).all();

    return (items.results || []).map(this.formatItem);
  }

  /**
   * 获取背包空位
   */
  async getBagSlots(walletAddress: string) {
    const usedSlots: any = await this.db.prepare(`
      SELECT COUNT(DISTINCT config_id) as count FROM items WHERE wallet_address = ?
    `).bind(walletAddress).first();

    const used = (usedSlots as any).count || 0;
    const total = ITEM_CONFIG.MAX_BAG_SLOTS;

    return {
      used,
      available: total - used,
      total,
    };
  }

  /**
   * 搜索物品
   */
  async search(walletAddress: string, keyword: string) {
    const items: any = await this.db.prepare(`
      SELECT i.*, ic.Name as config_name
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.wallet_address = ? AND ic.Name LIKE ?
      LIMIT 50
    `).bind(walletAddress, `%${keyword}%`).all();

    return (items.results || []).map(this.formatItem);
  }

  // ============ 物品操作 ============

  /**
   * 添加物品
   */
  async add(walletAddress: string, options: {
    configId: number;
    count?: number;
    heroId?: number;
    type?: string;
    source?: string;
  }) {
    const { configId, count = 1, heroId, type = 'equipment', source = 'system' } = options;

    // 检查是否可堆叠
    const existing: any = await this.db.prepare(`
      SELECT * FROM items 
      WHERE wallet_address = ? AND config_id = ? AND hero_id IS NULL AND equipped = 0
    `).bind(walletAddress, configId).first();

    if (existing && existing.count + count <= ITEM_CONFIG.MAX_STACK) {
      // 合并堆叠
      await this.db.prepare(`
        UPDATE items SET count = count + ? WHERE id = ?
      `).bind(count, existing.id).run();

      return { success: true, itemId: existing.id, stacked: true };
    }

    // 创建新物品
    const result = await this.db.prepare(`
      INSERT INTO items (wallet_address, hero_id, type, config_id, count, equipped, source)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).bind(walletAddress, heroId || null, type, configId, count, source).run();

    return { success: true, itemId: result.meta.last_row_id, stacked: false };
  }

  /**
   * 使用物品
   */
  async use(walletAddress: string, itemId: number) {
    const item: any = await this.db.prepare(`
      SELECT * FROM items WHERE id = ? AND wallet_address = ?
    `).bind(itemId, walletAddress).first();

    if (!item) {
      return { success: false, error: '物品不存在' };
    }

    if (item.type !== 'consumable') {
      return { success: false, error: '该物品不可使用' };
    }

    if (item.count <= 0) {
      return { success: false, error: '物品数量不足' };
    }

    // 获取物品配置
    const config: any = await this.db.prepare(`
      SELECT * FROM items_config WHERE ID = ?
    `).bind(item.config_id).first();

    // 应用效果
    const effect = this.applyItemEffect(config);

    // 减少数量
    if (item.count > 1) {
      await this.db.prepare(`
        UPDATE items SET count = count - 1 WHERE id = ?
      `).bind(itemId).run();
    } else {
      await this.db.prepare(`
        DELETE FROM items WHERE id = ?
      `).bind(itemId).run();
    }

    return { success: true, effect };
  }

  /**
   * 穿戴装备
   */
  async equip(walletAddress: string, itemId: number, heroId: number) {
    const item: any = await this.db.prepare(`
      SELECT * FROM items WHERE id = ? AND wallet_address = ?
    `).bind(itemId, walletAddress).first();

    if (!item) {
      return { success: false, error: '物品不存在' };
    }

    if (item.type !== 'equipment') {
      return { success: false, error: '非装备物品不能穿戴' };
    }

    // 检查是否已有同类型装备装备
    const equippedItem: any = await this.db.prepare(`
      SELECT * FROM items 
      WHERE hero_id = ? AND equipped = 1 AND config_id IN (
        SELECT ID FROM items_config WHERE Type = ?
      )
    `).bind(heroId, item.type).first();

    if (equippedItem) {
      // 卸下原装备
      await this.db.prepare(`
        UPDATE items SET equipped = 0, hero_id = NULL WHERE id = ?
      `).bind(equippedItem.id).run();
    }

    // 穿戴新装备
    await this.db.prepare(`
      UPDATE items SET equipped = 1, hero_id = ? WHERE id = ?
    `).bind(heroId, itemId).run();

    return { success: true };
  }

  /**
   * 卸下装备
   */
  async unequip(walletAddress: string, itemId: number) {
    const item: any = await this.db.prepare(`
      SELECT * FROM items WHERE id = ? AND wallet_address = ?
    `).bind(itemId, walletAddress).first();

    if (!item) {
      return { success: false, error: '物品不存在' };
    }

    await this.db.prepare(`
      UPDATE items SET equipped = 0, hero_id = NULL WHERE id = ?
    `).bind(itemId).run();

    return { success: true };
  }

  /**
   * 删除物品
   */
  async delete(walletAddress: string, itemId: number, count?: number) {
    const item: any = await this.db.prepare(`
      SELECT * FROM items WHERE id = ? AND wallet_address = ?
    `).bind(itemId, walletAddress).first();

    if (!item) {
      return { success: false, error: '物品不存在' };
    }

    const deleteCount = Math.min(count || item.count, item.count);

    if (item.count > deleteCount) {
      await this.db.prepare(`
        UPDATE items SET count = count - ? WHERE id = ?
      `).bind(deleteCount, itemId).run();
    } else {
      await this.db.prepare(`
        DELETE FROM items WHERE id = ?
      `).bind(itemId).run();
    }

    return { success: true, deletedCount: deleteCount };
  }

  /**
   * 分解物品
   */
  async dismantle(walletAddress: string, itemId: number) {
    const item: any = await this.db.prepare(`
      SELECT * FROM items WHERE id = ? AND wallet_address = ?
    `).bind(itemId, walletAddress).first();

    if (!item) {
      return { success: false, error: '物品不存在' };
    }

    if (item.type !== 'equipment') {
      return { success: false, error: '只有装备可分解' };
    }

    // 获取物品配置
    const config: any = await this.db.prepare(`
      SELECT * FROM items_config WHERE ID = ?
    `).bind(item.config_id).first();

    // 计算返还材料
    const returnMaterials = this.calculateDismantleReturn(config);

    // 删除物品
    await this.db.prepare(`
      DELETE FROM items WHERE id = ?
    `).bind(itemId).run();

    return { success: true, materials: returnMaterials };
  }

  /**
   * 物品移动
   */
  async move(walletAddress: string, itemId: number, targetHeroId?: number) {
    const item: any = await this.db.prepare(`
      SELECT * FROM items WHERE id = ? AND wallet_address = ?
    `).bind(itemId, walletAddress).first();

    if (!item) {
      return { success: false, error: '物品不存在' };
    }

    await this.db.prepare(`
      UPDATE items SET hero_id = ? WHERE id = ?
    `).bind(targetHeroId || null, itemId).run();

    return { success: true };
  }

  /**
   * 物品合成
   */
  async synthesize(walletAddress: string, recipeId: number) {
    // 获取合成配方
    const recipe: any = await this.db.prepare(`
      * FROM items_synthesis WHERE id = ?
    `).bind(recipeId).first();

    if (!recipe) {
      return { success: false, error: '合成配方不存在' };
    }

    // 检查材料是否足够
    const materials = JSON.parse(recipe.materials || '[]');
    for (const mat of materials) {
      const existing: any = await this.db.prepare(`
        SELECT * FROM items WHERE wallet_address = ? AND config_id = ? AND count >= ?
      `).bind(walletAddress, mat.configId, mat.count).first();

      if (!existing) {
        return { success: false, error: `材料不足: ${mat.configId}` };
      }
    }

    // 扣除材料
    for (const mat of materials) {
      await this.db.prepare(`
        UPDATE items SET count = count - ? WHERE wallet_address = ? AND config_id = ?
      `).bind(mat.count, walletAddress, mat.configId).run();

      // 删除数量为0的物品
      await this.db.prepare(`
        DELETE FROM items WHERE wallet_address = ? AND config_id = ? AND count <= 0
      `).bind(walletAddress, mat.configId).run();
    }

    // 添加成品
    const result = await this.add(walletAddress, {
      configId: recipe.resultId,
      count: 1,
      type: 'equipment',
      source: 'synthesis',
    });

    return {
      success: true,
      resultItem: result,
      message: '合成成功',
    };
  }

  /**
   * 物品强化
   */
  async enhance(walletAddress: string, itemId: number, materials: { configId: number; count: number }[]) {
    const item: any = await this.db.prepare(`
      SELECT * FROM items WHERE id = ? AND wallet_address = ?
    `).bind(itemId, walletAddress).first();

    if (!item) {
      return { success: false, error: '物品不存在' };
    }

    if (item.type !== 'equipment') {
      return { success: false, error: '只有装备可以强化' };
    }

    // 检查强化材料
    for (const mat of materials) {
      const existing: any = await this.db.prepare(`
        SELECT * FROM items WHERE wallet_address = ? AND config_id = ? AND count >= ?
      `).bind(walletAddress, mat.configId, mat.count).first();

      if (!existing) {
        return { success: false, error: `强化材料不足` };
      }
    }

    // 扣除材料
    for (const mat of materials) {
      await this.db.prepare(`
        UPDATE items SET count = count - ? WHERE wallet_address = ? AND config_id = ?
      `).bind(mat.count, walletAddress, mat.configId).run();
    }

    // 增加装备属性（简化版）
    const enhanceBonus = 10; // 每次强化增加10%属性
    await this.db.prepare(`
      UPDATE items SET durability = COALESCE(durability, 0) + ? WHERE id = ?
    `).bind(enhanceBonus, itemId).run();

    return { success: true, message: '强化成功' };
  }

  /**
   * 宝石镶嵌
   */
  async inlay(walletAddress: string, equipmentId: number, gemId: number) {
    const equipment: any = await this.db.prepare(`
      SELECT * FROM items WHERE id = ? AND wallet_address = ?
    `).bind(equipmentId, walletAddress).first();

    if (!equipment) {
      return { success: false, error: '装备不存在' };
    }

    if (equipment.type !== 'equipment') {
      return { success: false, error: '只有装备可以镶嵌宝石' };
    }

    const gem: any = await this.db.prepare(`
      SELECT * FROM items WHERE id = ? AND wallet_address = ?
    `).bind(gemId, walletAddress).first();

    if (!gem || gem.type !== 'gem') {
      return { success: false, error: '宝石不存在' };
    }

    // 获取已有镶嵌槽
    const sockets = JSON.parse(equipment.sockets || '[]');
    if (sockets.length >= 4) {
      return { success: false, error: '镶嵌槽已满' };
    }

    // 添加镶嵌
    sockets.push(gem.config_id);
    await this.db.prepare(`
      UPDATE items SET sockets = ? WHERE id = ?
    `).bind(JSON.stringify(sockets), equipmentId).run();

    // 消耗宝石
    await this.db.prepare(`
      DELETE FROM items WHERE id = ?
    `).bind(gemId).run();

    return { success: true, message: '镶嵌成功' };
  }

  // ============ 内部方法 ============

  private applyItemEffect(config: any) {
    if (!config) return null;

    return {
      effectType: config.EffectType,
      effectValue: config.EffectValue,
    };
  }

  private calculateDismantleReturn(config: any) {
    if (!config) return [];

    // 根据稀有度计算返还
    const qualityMultipliers = {
      1: 1,   // 普通
      2: 2,   // 优秀
      3: 3,   // 稀有
      4: 4,   // 史诗
      5: 5,   // 传说
    };

    const multiplier = qualityMultipliers[config.Quality as keyof typeof qualityMultipliers] || 1;

    return [{
      type: 'material',
      itemId: 1,  // 材料ID
      count: Math.floor(ITEM_CONFIG.DISMANTLE_RATE * multiplier),
    }];
  }

  private formatItem(item: any) {
    return {
      id: item.id,
      configId: item.config_id,
      configName: item.config_name,
      type: item.type,
      count: item.count,
      durability: item.durability,
      equipped: item.equipped === 1,
      heroId: item.hero_id,
      source: item.source,
      effectType: item.EffectType,
      effectValue: item.EffectValue,
      createdAt: item.created_at,
    };
  }
}

export const itemService = {
  create(db: D1Database) {
    return new ItemService(db);
  },

  async getList(db: D1Database, walletAddress: string, options?: any) {
    const service = new ItemService(db);
    return service.getList(walletAddress, options);
  },

  async getDetail(db: D1Database, itemId: number) {
    const service = new ItemService(db);
    return service.getDetail(itemId);
  },

  async getByHero(db: D1Database, heroId: number) {
    const service = new ItemService(db);
    return service.getByHero(heroId);
  },

  async getBagSlots(db: D1Database, walletAddress: string) {
    const service = new ItemService(db);
    return service.getBagSlots(walletAddress);
  },

  async search(db: D1Database, walletAddress: string, keyword: string) {
    const service = new ItemService(db);
    return service.search(walletAddress, keyword);
  },

  async add(db: D1Database, walletAddress: string, options: any) {
    const service = new ItemService(db);
    return service.add(walletAddress, options);
  },

  async use(db: D1Database, walletAddress: string, itemId: number) {
    const service = new ItemService(db);
    return service.use(walletAddress, itemId);
  },

  async equip(db: D1Database, walletAddress: string, itemId: number, heroId: number) {
    const service = new ItemService(db);
    return service.equip(walletAddress, itemId, heroId);
  },

  async unequip(db: D1Database, walletAddress: string, itemId: number) {
    const service = new ItemService(db);
    return service.unequip(walletAddress, itemId);
  },

  async delete(db: D1Database, walletAddress: string, itemId: number, count?: number) {
    const service = new ItemService(db);
    return service.delete(walletAddress, itemId, count);
  },

  async dismantle(db: D1Database, walletAddress: string, itemId: number) {
    const service = new ItemService(db);
    return service.dismantle(walletAddress, itemId);
  },

  async move(db: D1Database, walletAddress: string, itemId: number, targetHeroId?: number) {
    const service = new ItemService(db);
    return service.move(walletAddress, itemId, targetHeroId);
  },
};

export default itemService;
