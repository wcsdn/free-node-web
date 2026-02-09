/**
 * Item Repository - 物品数据访问层
 */
import type { D1Database } from '@cloudflare/workers-types';

export interface Item {
  id: number;
  wallet_address: string;
  hero_id?: number;
  type: number;
  config_id: number;
  count: number;
  equipped: boolean;
  source: string;
  created_at: string;
}

export const itemRepo = {
  /** 根据 ID 查找物品 */
  async findById(db: D1Database, itemId: number): Promise<any | null> {
    return await db.prepare(`SELECT * FROM items WHERE id = ?`).bind(itemId).first();
  },

  /** 根据钱包地址获取物品列表 */
  async findByWallet(db: D1Database, walletAddress: string): Promise<any[]> {
    const result = await db.prepare(`
      SELECT * FROM items WHERE wallet_address = ? ORDER BY created_at DESC
    `).bind(walletAddress).all();
    return (result.results || []) as any[];
  },

  /** 根据武将 ID 获取已装备物品 */
  async findEquippedByHero(db: D1Database, heroId: number): Promise<any[]> {
    const result = await db.prepare(`
      SELECT * FROM items WHERE hero_id = ? AND equipped = 1
    `).bind(heroId).all();
    return (result.results || []) as any[];
  },

  /** 创建物品 */
  async create(db: D1Database, data: {
    wallet_address: string;
    type: number;
    config_id: number;
    count: number;
    source: string;
  }): Promise<number> {
    const result = await db.prepare(`
      INSERT INTO items (wallet_address, type, config_id, count, equipped, source)
      VALUES (?, ?, ?, ?, 0, ?)
    `).bind(data.wallet_address, data.type, data.config_id, data.count, data.source).run();
    return (result.meta.last_row_id as number);
  },

  /** 更新物品数量 */
  async updateCount(db: D1Database, itemId: number, count: number): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE items SET count = ? WHERE id = ?
    `).bind(count, itemId).run();
    return result.success;
  },

  /** 装备/卸下物品 */
  async setEquipped(db: D1Database, itemId: number, heroId: number | null, equipped: boolean): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE items SET hero_id = ?, equipped = ? WHERE id = ?
    `).bind(heroId, equipped ? 1 : 0, itemId).run();
    return result.success;
  },

  /** 删除物品 */
  async delete(db: D1Database, itemId: number): Promise<boolean> {
    const result = await db.prepare(`DELETE FROM items WHERE id = ?`).bind(itemId).run();
    return result.success;
  },

  /** 使用物品 (消耗) */
  async use(db: D1Database, itemId: number, count = 1): Promise<boolean> {
    const item = await this.findById(db, itemId);
    if (!item || item.count < count) return false;

    const newCount = item.count - count;
    if (newCount <= 0) return this.delete(db, itemId);
    return this.updateCount(db, itemId, newCount);
  },
};
