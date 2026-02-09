/**
 * Item Repository - 物品数据访问层
 * 从 jx/DALEX/ItemExAccess.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Item, ItemConfig } from '../types/models';

export const itemRepo = {
  /** 根据 ID 查找物品 */
  async findById(db: D1Database, itemId: number): Promise<Item | null> {
    const result = await db.prepare(`
      SELECT * FROM items WHERE id = ?
    `).bind(itemId).first();
    return result as unknown as Item | null;
  },

  /** 根据钱包地址获取物品列表 */
  async findByWallet(db: D1Database, walletAddress: string): Promise<Item[]> {
    const result = await db.prepare(`
      SELECT * FROM items WHERE wallet_address = ? ORDER BY id
    `).bind(walletAddress).all();
    return (result.results || []) as unknown as Item[];
  },

  /** 根据武将 ID 获取装备 */
  async findByHeroId(db: D1Database, heroId: number): Promise<Item[]> {
    const result = await db.prepare(`
      SELECT * FROM items WHERE hero_id = ? ORDER BY id
    `).bind(heroId).all();
    return (result.results || []) as unknown as Item[];
  },

  /** 获取物品配置 */
  async getConfig(db: D1Database, configId: number): Promise<ItemConfig | null> {
    const result = await db.prepare(`
      SELECT * FROM item_configs WHERE id = ?
    `).bind(configId).first();
    return result as unknown as ItemConfig | null;
  },

  /** 获取所有物品配置 */
  async getAllConfigs(db: D1Database): Promise<ItemConfig[]> {
    const result = await db.prepare(`
      SELECT * FROM item_configs ORDER BY type, id
    `).all();
    return (result.results || []) as unknown as ItemConfig[];
  },

  /** 创建物品 */
  async create(db: D1Database, data: Item): Promise<Item | null> {
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO items (wallet_address, hero_id, type, config_id, count, durability, equipped, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.wallet_address,
      data.hero_id ?? null,
      data.type,
      data.config_id,
      data.count ?? 1,
      data.durability ?? 100,
      data.equipped ? 1 : 0,
      data.source,
      now
    ).run();

    const id = await this.getLastInsertId(db);
    return this.findById(db, id);
  },

  /** 更新物品数量 */
  async updateCount(db: D1Database, itemId: number, count: number): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE items SET count = ?, updated_at = ? WHERE id = ?
    `).bind(count, new Date().toISOString(), itemId).run();
    return result.success;
  },

  /** 穿戴装备 */
  async equip(db: D1Database, itemId: number, heroId: number): Promise<boolean> {
    // 先卸下该武将的其他装备
    await db.prepare(`
      UPDATE items SET hero_id = NULL, equipped = 0 WHERE hero_id = ? AND type = 'equipment'
    `).bind(heroId).run();

    // 穿戴新装备
    const result = await db.prepare(`
      UPDATE items SET hero_id = ?, equipped = 1, updated_at = ? WHERE id = ?
    `).bind(heroId, new Date().toISOString(), itemId).run();
    return result.success;
  },

  /** 卸下装备 */
  async unequip(db: D1Database, itemId: number): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE items SET hero_id = NULL, equipped = 0, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), itemId).run();
    return result.success;
  },

  /** 删除物品 */
  async delete(db: D1Database, itemId: number): Promise<boolean> {
    const result = await db.prepare(`
      DELETE FROM items WHERE id = ?
    `).bind(itemId).run();
    return result.success;
  },

  /** 获取最后插入 ID */
  async getLastInsertId(db: D1Database): Promise<number> {
    const result = await db.prepare(`
      SELECT last_insert_rowid() as id
    `).first() as { id: number };
    return result.id;
  },
};
