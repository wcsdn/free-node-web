/**
 * Technic Repository - 科技数据访问层
 * 从 jx/BLL/Technic.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Technic, TechnicConfig } from '../types/models';

export const technicRepo = {
  /** 根据 ID 查找科技 */
  async findById(db: D1Database, technicId: number): Promise<Technic | null> {
    const result = await db.prepare(`
      SELECT * FROM technics WHERE id = ?
    `).bind(technicId).first();
    return result as unknown as Technic | null;
  },

  /** 根据钱包地址获取科技列表 */
  async findByWallet(db: D1Database, walletAddress: string): Promise<Technic[]> {
    const result = await db.prepare(`
      SELECT * FROM technics WHERE wallet_address = ? ORDER BY technic_id
    `).bind(walletAddress).all();
    return (result.results || []) as unknown as Technic[];
  },

  /** 根据科技 ID 获取用户科技 */
  async findByTechId(db: D1Database, walletAddress: string, technicId: number): Promise<Technic | null> {
    const result = await db.prepare(`
      SELECT * FROM technics WHERE wallet_address = ? AND technic_id = ?
    `).bind(walletAddress, technicId).first();
    return result as unknown as Technic | null;
  },

  /** 获取科技配置 */
  async getConfig(db: D1Database, technicId: number): Promise<TechnicConfig | null> {
    const result = await db.prepare(`
      SELECT * FROM technic_configs WHERE id = ?
    `).bind(technicId).first();
    return result as unknown as TechnicConfig | null;
  },

  /** 获取所有科技配置 */
  async getAllConfigs(db: D1Database): Promise<TechnicConfig[]> {
    const result = await db.prepare(`
      SELECT * FROM technic_configs ORDER BY type, id
    `).all();
    return (result.results || []) as unknown as TechnicConfig[];
  },

  /** 创建科技 */
  async create(db: D1Database, data: Technic): Promise<Technic | null> {
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO technics (wallet_address, technic_id, technic_level, technic_point, created_at)
      VALUES (?, ?, 1, 0, ?)
    `).bind(
      data.wallet_address,
      data.technic_id,
      now
    ).run();

    const id = await this.getLastInsertId(db);
    return this.findById(db, id);
  },

  /** 升级科技 */
  async levelUp(db: D1Database, technicId: number): Promise<Technic | null> {
    const technic = await this.findById(db, technicId);
    if (!technic) return null;

    await db.prepare(`
      UPDATE technics SET technic_level = technic_level + 1, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), technicId).run();

    return this.findById(db, technicId);
  },

  /** 增加科技点数 */
  async addPoint(db: D1Database, technicId: number, points: number): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE technics SET technic_point = technic_point + ?, updated_at = ? WHERE id = ?
    `).bind(points, new Date().toISOString(), technicId).run();
    return result.success;
  },

  /** 删除科技 */
  async delete(db: D1Database, technicId: number): Promise<boolean> {
    const result = await db.prepare(`
      DELETE FROM technics WHERE id = ?
    `).bind(technicId).run();
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
