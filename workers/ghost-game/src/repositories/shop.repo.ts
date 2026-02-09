/**
 * Shop Repository - 商店数据访问层
 * 原则：只负责 SQL 操作，不包含业务逻辑
 */
import type { D1Database } from '@cloudflare/workers-types';

export interface ShopItem {
  id: number;
  shop_type: number;
  config_id: number;
  price: number;
  stock: number | null;
  daily_limit: number;
  refresh_time: string;
  created_at: string;
}

export interface ShopTransaction {
  id: number;
  wallet_address: string;
  shop_item_id: number;
  count: number;
  total_price: number;
  created_at: string;
}

export const shopRepo = {
  /**
   * 根据 ID 查找商品
   */
  async findById(db: D1Database, itemId: number): Promise<ShopItem | null> {
    const result = await db.prepare(`
      SELECT * FROM shop_items WHERE id = ?
    `).bind(itemId).first();
    return result as unknown as ShopItem | null;
  },

  /**
   * 根据商店类型获取商品列表
   */
  async findByType(db: D1Database, shopType: number): Promise<ShopItem[]> {
    const result = await db.prepare(`
      SELECT * FROM shop_items WHERE shop_type = ? ORDER BY id
    `).bind(shopType).all();
    return (result.results || []) as unknown as ShopItem[];
  },

  /**
   * 获取用户今日购买记录
   */
  async getUserDailyPurchases(db: D1Database, walletAddress: string, shopItemId: number): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.prepare(`
      SELECT COALESCE(SUM(count), 0) as total
      FROM shop_transactions
      WHERE wallet_address = ?
        AND shop_item_id = ?
        AND DATE(created_at) = ?
    `).bind(walletAddress, shopItemId, today).first() as { total: number };
    return result.total;
  },

  /**
   * 创建交易记录
   */
  async createTransaction(db: D1Database, data: {
    wallet_address: string;
    shop_item_id: number;
    count: number;
    total_price: number;
  }): Promise<ShopTransaction> {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO shop_transactions (wallet_address, shop_item_id, count, total_price, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      data.wallet_address,
      data.shop_item_id,
      data.count,
      data.total_price,
      now
    ).run();

    const id = await this.getLastInsertId(db);
    return { id, ...data, created_at: now } as ShopTransaction;
  },

  /**
   * 更新库存（减少）
   */
  async decrementStock(db: D1Database, itemId: number, count: number): Promise<boolean> {
    const item = await this.findById(db, itemId);
    if (!item || (item.stock !== null && item.stock < count)) return false;

    if (item.stock === null) return true; // 无限制库存

    const result = await db.prepare(`
      UPDATE shop_items SET stock = stock - ? WHERE id = ?
    `).bind(count, itemId).run();
    return result.success;
  },

  /**
   * 刷新商店（重置每日限购）
   */
  async refreshShop(db: D1Database, shopType: number): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await db.prepare(`
      UPDATE shop_items SET refresh_time = ? WHERE shop_type = ?
    `).bind(now, shopType).run();
    return result.success;
  },

  /**
   * 获取用户交易历史
   */
  async getUserTransactions(db: D1Database, walletAddress: string, limit = 50): Promise<ShopTransaction[]> {
    const result = await db.prepare(`
      SELECT * FROM shop_transactions
      WHERE wallet_address = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(walletAddress, limit).all();
    return (result.results || []) as unknown as ShopTransaction[];
  },

  /**
   * 获取最后插入 ID
   */
  async getLastInsertId(db: D1Database): Promise<number> {
    const r = await db.prepare('SELECT last_insert_rowid() as id').first() as { id: number };
    return r.id;
  },
};
