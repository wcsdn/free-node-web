/**
 * Defence Repository - 城防建筑数据访问层
 * 从 jx/DALEX/BuildingExAccess.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Defence } from '../types/models';

export const defenceRepo = {
  /** 根据 ID 查找城防 */
  async findById(db: D1Database, defenceId: number): Promise<Defence | null> {
    const result = await db.prepare(`
      SELECT * FROM defences WHERE id = ?
    `).bind(defenceId).first();
    return result as unknown as Defence | null;
  },

  /** 根据城市 ID 获取所有城防 */
  async findByCity(db: D1Database, cityId: number): Promise<Defence[]> {
    const result = await db.prepare(`
      SELECT * FROM defences WHERE city_id = ? ORDER BY position
    `).bind(cityId).all();
    return (result.results || []) as unknown as Defence[];
  },

  /** 根据位置查找城防 */
  async findByPos(db: D1Database, walletAddress: string, cityId: number, position: number): Promise<Defence | null> {
    const result = await db.prepare(`
      SELECT * FROM defences 
      WHERE wallet_address = ? AND city_id = ? AND position = ?
    `).bind(walletAddress, cityId, position).first();
    return result as unknown as Defence | null;
  },

  /** 根据钱包地址获取所有城防 */
  async findByWallet(db: D1Database, walletAddress: string): Promise<Defence[]> {
    const result = await db.prepare(`
      SELECT d.* FROM defences d
      INNER JOIN cities c ON d.city_id = c.id
      WHERE c.wallet_address = ?
      ORDER BY d.city_id, d.position
    `).bind(walletAddress).all();
    return (result.results || []) as unknown as Defence[];
  },

  /** 获取城防数量 */
  async countByCity(db: D1Database, cityId: number): Promise<number> {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM defences WHERE city_id = ?
    `).bind(cityId).first() as { count: number };
    return result.count;
  },

  /** 创建城防 */
  async create(db: D1Database, data: Defence): Promise<Defence> {
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO defences (wallet_address, city_id, position, state, defence_level, static_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.wallet_address,
      data.city_id,
      data.position,
      data.state ?? 0,
      data.defence_level ?? 1,
      data.static_index,
      now
    ).run();

    const id = await this.getLastInsertId(db);
    return this.findById(db, id) as Promise<Defence>;
  },

  /** 升级城防 */
  async levelUp(db: D1Database, defenceId: number): Promise<Defence | null> {
    const defence = await this.findById(db, defenceId);
    if (!defence) return null;

    await db.prepare(`
      UPDATE defences SET defence_level = defence_level + 1, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), defenceId).run();

    return this.findById(db, defenceId);
  },

  /** 修复城防 */
  async repair(db: D1Database, defenceId: number): Promise<boolean> {
    const defence = await this.findById(db, defenceId);
    if (!defence) return false;

    const result = await db.prepare(`
      UPDATE defences SET state = 0, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), defenceId).run();
    return result.success;
  },

  /** 获取城防总防御力 */
  async getTotalDefence(db: D1Database, cityId: number): Promise<number> {
    const result = await db.prepare(`
      SELECT SUM(defence_level) as total FROM defences WHERE city_id = ? AND state = 0
    `).bind(cityId).first() as { total: number | null };
    return result.total ?? 0;
  },

  /** 删除城防 */
  async delete(db: D1Database, defenceId: number): Promise<boolean> {
    const result = await db.prepare(`
      DELETE FROM defences WHERE id = ?
    `).bind(defenceId).run();
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
