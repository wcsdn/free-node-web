/**
 * Item Repository - 物品数据访问层
 * 参考原版 jx/DAL/ItemAccess.cs (1,378 行)
 */
import type { D1Database } from '@cloudflare/workers-types';
import { BaseRepository, type BaseEntity } from './base.repo';

export interface Item extends BaseEntity {
  id: number;
  wallet_address: string;
  item_id: number;
  count: number;
  level: number;
  quality: number;
  durablity: number;
  max_durability: number;
  enchant: string;
  gem1: number;
  gem2: number;
  gem3: number;
  gem4: number;
  strengthen_level: number;
  hole_num: number;
  exp: number;
  binded: number;
  used: number;
  create_time: string;
  end_time: string;
  buy_time: string;
}

export interface ItemConfig {
  id: number;
  name: string;
  type: number;
  subtype: number;
  quality: number;
  level: number;
  base_price: number;
  max_stack: number;
  icon: string;
  description: string;
  effect: string;
  usable: number;
  tradable: number;
  destroyable: number;
}

export class ItemRepository extends BaseRepository<Item> {
  constructor(db: D1Database) {
    super(db, 'user_items');
  }

  // ==================== 查询操作 ====================

  /** 根据钱包地址查询所有物品 */
  async findByWallet(walletAddress: string): Promise<Item[]> {
    return await this.where({ wallet_address: walletAddress });
  }

  /** 根据物品配置ID查询 */
  async findByItemId(walletAddress: string, itemId: number): Promise<Item[]> {
    return await this.where({ wallet_address: walletAddress, item_id: itemId });
  }

  /** 获取用户拥有的物品ID列表（去重） */
  async findItemIdsByWallet(walletAddress: string): Promise<number[]> {
    const items = await this.findByWallet(walletAddress);
    return [...new Set(items.map(i => i.item_id))];
  }

  /** 检查是否拥有某物品 */
  async hasItem(walletAddress: string, itemId: number, count: number = 1): Promise<boolean> {
    const result = await this.db.prepare(`
      SELECT SUM(count) as total FROM user_items 
      WHERE wallet_address = ? AND item_id = ?
    `).bind(walletAddress, itemId).first<{ total: number }>();
    return (result?.total || 0) >= count;
  }

  /** 获取物品总数量 */
  async getItemCount(walletAddress: string, itemId: number): Promise<number> {
    const result = await this.db.prepare(`
      SELECT SUM(count) as total FROM user_items 
      WHERE wallet_address = ? AND item_id = ?
    `).bind(walletAddress, itemId).first<{ total: number }>();
    return result?.total || 0;
  }

  /** 根据类型查询 */
  async findByType(walletAddress: string, type: number): Promise<Item[]> {
    const items = await this.findByWallet(walletAddress);
    const configIds = items.map(i => i.item_id);
    if (configIds.length === 0) return [];

    const placeholders = configIds.map(() => '?').join(', ');
    const configs = await this.db.prepare(
      `SELECT id FROM items_config WHERE type = ? AND id IN (${placeholders})`
    ).bind(type, ...configIds).all<{ id: number }>();

    const typeItemIds = new Set(configs.results?.map(c => c.id) || []);
    return items.filter(i => typeItemIds.has(i.item_id));
  }

  /** 根据品质查询 */
  async findByQuality(walletAddress: string, quality: number): Promise<Item[]> {
    return await this.db.prepare(
      `SELECT * FROM user_items WHERE wallet_address = ? AND quality = ?`
    ).bind(walletAddress, quality).all<Item>().then(r => (r.results as Item[]) || []);
  }

  /** 获取所有装备 */
  async findEquipment(walletAddress: string): Promise<Item[]> {
    return await this.db.prepare(`
      SELECT ui.* FROM user_items ui
      JOIN items_config ic ON ui.item_id = ic.id
      WHERE ui.wallet_address = ? AND ic.type = 1
    `).bind(walletAddress).all<Item>().then(r => (r.results as Item[]) || []);
  }

  /** 获取所有消耗品 */
  async findConsumables(walletAddress: string): Promise<Item[]> {
    return await this.db.prepare(`
      SELECT ui.* FROM user_items ui
      JOIN items_config ic ON ui.item_id = ic.id
      WHERE ui.wallet_address = ? AND ic.type = 2
    `).bind(walletAddress).all<Item>().then(r => (r.results as Item[]) || []);
  }

  // ==================== 物品配置查询 ====================

  /** 获取单个物品配置 */
  async getItemConfig(itemId: number): Promise<ItemConfig | null> {
    return await this.db.prepare(
      `SELECT * FROM items_config WHERE id = ?`
    ).bind(itemId).first<ItemConfig>();
  }

  /** 获取所有物品配置 */
  async getAllConfigs(): Promise<ItemConfig[]> {
    const result = await this.db.prepare(`SELECT * FROM items_config`).all<ItemConfig>();
    return (result.results as ItemConfig[]) || [];
  }

  /** 根据类型获取配置 */
  async getConfigsByType(type: number): Promise<ItemConfig[]> {
    const result = await this.db.prepare(
      `SELECT * FROM items_config WHERE type = ?`
    ).bind(type).all<ItemConfig>();
    return (result.results as ItemConfig[]) || [];
  }

  // ==================== 写入操作 ====================

  /** 添加物品 */
  async addItem(walletAddress: string, itemId: number, count: number = 1): Promise<number> {
    const now = new Date().toISOString();
    
    // 检查是否已有此物品（可堆叠）
    const config = await this.getItemConfig(itemId);
    if (config && config.max_stack > 1) {
      const existing = await this.findByItemId(walletAddress, itemId);
      if (existing.length > 0) {
        // 更新已有物品数量
        const existingItem = existing[0];
        const newCount = Math.min(existingItem.count + count, config.max_stack);
        const overflow = (existingItem.count + count) - newCount;

        await this.db.prepare(`
          UPDATE user_items SET count = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(newCount, existingItem.id).run();

        // 如果有溢出，创建新物品
        if (overflow > 0) {
          await this.db.prepare(`
            INSERT INTO user_items (wallet_address, item_id, count, level, quality, binded, used, created_at, updated_at)
            VALUES (?, ?, ?, 1, 0, 0, 0, datetime('now'), datetime('now'))
          `).bind(walletAddress, itemId, overflow).run();
        }

        return existingItem.id;
      }
    }

    // 创建新物品
    const result = await this.db.prepare(`
      INSERT INTO user_items (wallet_address, item_id, count, level, quality, binded, used, created_at, updated_at)
      VALUES (?, ?, ?, 1, 0, 0, 0, datetime('now'), datetime('now'))
    `).bind(walletAddress, itemId, count).run();

    return result.meta.last_row_id;
  }

  /** 批量添加物品 */
  async bulkAdd(walletAddress: string, items: { itemId: number; count: number }[]): Promise<Map<number, number>> {
    const results = new Map<number, number>();
    
    for (const { itemId, count } of items) {
      const id = await this.addItem(walletAddress, itemId, count);
      results.set(itemId, id);
    }
    
    return results;
  }

  /** 移除物品 */
  async removeItem(walletAddress: string, itemId: number, count: number = 1): Promise<boolean> {
    const items = await this.findByItemId(walletAddress, itemId);
    
    for (const item of items) {
      if (item.count <= count) {
        await this.delete(item.id);
        count -= item.count;
        if (count <= 0) break;
      } else {
        await this.db.prepare(`
          UPDATE user_items SET count = count - ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(count, item.id).run();
        count = 0;
        break;
      }
    }
    
    return count === 0;
  }

  /** 更新物品数量 */
  async updateCount(itemId: number, newCount: number): Promise<void> {
    if (newCount <= 0) {
      await this.delete(itemId);
    } else {
      await this.db.prepare(`
        UPDATE user_items SET count = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(newCount, itemId).run();
    }
  }

  // ==================== 装备强化 ====================

  /** 强化装备 */
  async strengthen(itemId: number): Promise<{
    success: boolean;
    newLevel: number;
    destroy: boolean;
  }> {
    const item = await this.findById(itemId);
    if (!item) return { success: false, newLevel: 0, destroy: true };

    // 简化：强化成功率 90%，失败不降级
    const success = Math.random() < 0.9;
    
    if (success) {
      await this.db.prepare(`
        UPDATE user_items SET strengthen_level = strengthen_level + 1, updated_at = datetime('now')
        WHERE id = ?
      `).bind(itemId).run();

      return { success: true, newLevel: item.strengthen_level + 1, destroy: false };
    }

    return { success: false, newLevel: item.strengthen_level, destroy: false };
  }

  /** 设置强化等级 */
  async setStrengthenLevel(itemId: number, level: number): Promise<void> {
    await this.db.prepare(
      `UPDATE user_items SET strengthen_level = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(level, itemId).run();
  }

  // ==================== 装备精炼 ====================

  /** 精炼装备 */
  async refine(itemId: number): Promise<boolean> {
    const item = await this.findById(itemId);
    if (!item) return false;

    await this.db.prepare(`
      UPDATE user_items SET quality = quality + 1, updated_at = datetime('now')
      WHERE id = ?
    `).bind(itemId).run();

    return true;
  }

  // ==================== 装备打孔 ====================

  /** 打孔 */
  async addHole(itemId: number): Promise<boolean> {
    const item = await this.findById(itemId);
    if (!item || item.hole_num >= 4) return false;

    await this.db.prepare(`
      UPDATE user_items SET hole_num = hole_num + 1, updated_at = datetime('now')
      WHERE id = ?
    `).bind(itemId).run();

    return true;
  }

  /** 镶嵌宝石 */
  async setGem(itemId: number, holeIndex: number, gemId: number): Promise<boolean> {
    const item = await this.findById(itemId);
    if (!item || holeIndex >= item.hole_num) return false;

    const gemField = `gem${holeIndex + 1}`;
    await this.db.prepare(
      `UPDATE user_items SET ${gemField} = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(gemId, itemId).run();

    return true;
  }

  /** 卸下宝石 */
  async removeGem(itemId: number, holeIndex: number): Promise<boolean> {
    const item = await this.findById(itemId);
    if (!item) return false;

    const gemField = `gem${holeIndex + 1}`;
    await this.db.prepare(
      `UPDATE user_items SET ${gemField} = 0, updated_at = datetime('now') WHERE id = ?`
    ).bind(itemId).run();

    return true;
  }

  // ==================== 装备附魔 ====================

  /** 设置附魔 */
  async setEnchant(itemId: number, enchantData: Record<string, any>): Promise<void> {
    await this.db.prepare(
      `UPDATE user_items SET enchant = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(JSON.stringify(enchantData), itemId).run();
  }

  /** 清除附魔 */
  async clearEnchant(itemId: number): Promise<void> {
    await this.db.prepare(
      `UPDATE user_items SET enchant = '', updated_at = datetime('now') WHERE id = ?`
    ).bind(itemId).run();
  }

  // ==================== 耐久度 ====================

  /** 消耗耐久度 */
  async consumeDurability(itemId: number, amount: number = 1): Promise<{
    broken: boolean;
    remaining: number;
  }> {
    const item = await this.findById(itemId);
    if (!item) return { broken: true, remaining: 0 };

    const newDurability = Math.max(0, item.durablity - amount);
    const broken = newDurability <= 0;

    await this.db.prepare(`
      UPDATE user_items SET durablity = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newDurability, itemId).run();

    return { broken, remaining: newDurability };
  }

  /** 修复装备 */
  async repair(itemId: number): Promise<void> {
    await this.db.prepare(
      `UPDATE user_items SET durablity = max_durability, updated_at = datetime('now') WHERE id = ?`
    ).bind(itemId).run();
  }

  /** 修复所有装备 */
  async repairAll(walletAddress: string): Promise<number> {
    const result = await this.db.prepare(`
      UPDATE user_items SET durablity = max_durability, updated_at = datetime('now')
      WHERE wallet_address = ? AND durablity < max_durability
    `).bind(walletAddress).run();

    return result.meta.changes;
  }

  // ==================== 装备操作 ====================

  /** 绑定装备 */
  async bind(itemId: number): Promise<void> {
    await this.db.prepare(
      `UPDATE user_items SET binded = 1, updated_at = datetime('now') WHERE id = ?`
    ).bind(itemId).run();
  }

  /** 设置等级 */
  async setLevel(itemId: number, level: number): Promise<void> {
    await this.db.prepare(
      `UPDATE user_items SET level = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(level, itemId).run();
  }

  /** 设置经验 */
  async setExp(itemId: number, exp: number): Promise<void> {
    await this.db.prepare(
      `UPDATE user_items SET exp = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(exp, itemId).run();
  }

  // ==================== 统计查询 ====================

  /** 获取用户物品数量（按配置ID去重） */
  async getUniqueItemCount(walletAddress: string): Promise<number> {
    const itemIds = await this.findItemIdsByWallet(walletAddress);
    return itemIds.length;
  }

  /** 获取用户装备数量 */
  async getEquipmentCount(walletAddress: string): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM user_items ui
      JOIN items_config ic ON ui.item_id = ic.id
      WHERE ui.wallet_address = ? AND ic.type = 1
    `).bind(walletAddress).first<{ count: number }>();
    return result?.count || 0;
  }

  /** 获取用户物品总数量 */
  async getTotalItemCount(walletAddress: string): Promise<number> {
    const result = await this.db.prepare(`
      SELECT SUM(count) as total FROM user_items WHERE wallet_address = ?
    `).bind(walletAddress).first<{ total: number }>();
    return result?.total || 0;
  }

  /** 检查背包是否已满 */
  async isBagFull(walletAddress: string, maxSlots: number = 100): Promise<boolean> {
    const count = await this.count({ wallet_address: walletAddress });
    return count >= maxSlots;
  }
}

// 导出便捷使用对象
export const itemRepo = {
  async findByWallet(db: D1Database, walletAddress: string) {
    const repo = new ItemRepository(db);
    return repo.findByWallet(walletAddress);
  },
  async findById(db: D1Database, id: number) {
    const repo = new ItemRepository(db);
    return repo.findById(id);
  },
  async create(db: D1Database, data: Partial<Item>) {
    const repo = new ItemRepository(db);
    return repo.insert(data);
  },
  async update(db: D1Database, id: number, data: Partial<Item>) {
    const repo = new ItemRepository(db);
    return repo.update(id, data);
  },
  async delete(db: D1Database, id: number) {
    const repo = new ItemRepository(db);
    return repo.delete(id);
  },
};
