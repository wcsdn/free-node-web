/**
 * Building Repository - 内政建筑数据访问层
 * 从 jx/DALEX/BuildingExAccess.cs 迁移
 * 原则：只负责 SQL 操作，不包含业务逻辑
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Building, BuildingConfig } from '../types/models';

export const buildingRepo = {
  /** 根据 ID 查找建筑 */
  async findById(db: D1Database, buildingId: number): Promise<Building | null> {
    const result = await db.prepare(`
      SELECT * FROM buildings WHERE id = ?
    `).bind(buildingId).first();
    return result as unknown as Building | null;
  },

  /** 根据城市 ID 获取所有建筑 */
  async findByCity(db: D1Database, cityId: number): Promise<Building[]> {
    const result = await db.prepare(`
      SELECT * FROM buildings WHERE city_id = ? ORDER BY position
    `).bind(cityId).all();
    return (result.results || []) as unknown as Building[];
  },

  /** 根据钱包地址获取所有城市建筑 */
  async findByWallet(db: D1Database, walletAddress: string): Promise<Building[]> {
    const result = await db.prepare(`
      SELECT b.* FROM buildings b
      INNER JOIN cities c ON b.city_id = c.id
      WHERE c.wallet_address = ?
      ORDER BY b.city_id, b.position
    `).bind(walletAddress).all();
    return (result.results || []) as unknown as Building[];
  },

  /** 获取城市建筑数量 */
  async countByCity(db: D1Database, cityId: number): Promise<number> {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM buildings WHERE city_id = ?
    `).bind(cityId).first() as { count: number };
    return result.count;
  },

  /** 获取城市建筑总等级 */
  async sumLevelByCity(db: D1Database, cityId: number): Promise<number> {
    const result = await db.prepare(`
      SELECT SUM(level) as total FROM buildings WHERE city_id = ?
    `).bind(cityId).first() as { total: number | null };
    return result.total ?? 0;
  },

  /** 创建建筑 */
  async create(db: D1Database, data: Building): Promise<Building> {
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO buildings (city_id, type, level, position, state, config_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.city_id,
      data.type,
      data.level ?? 1,
      data.position,
      data.state ?? 0,
      data.config_id,
      now
    ).run();

    const id = await this.getLastInsertId(db);
    return this.findById(db, id) as Promise<Building>;
  },

  /** 升级建筑 */
  async upgrade(db: D1Database, buildingId: number, newLevel?: number): Promise<Building | null> {
    const building = await this.findById(db, buildingId);
    if (!building) return null;

    await db.prepare(`
      UPDATE buildings SET level = ?, updated_at = ? WHERE id = ?
    `).bind(newLevel ?? ((building.level ?? 0) + 1), new Date().toISOString(), buildingId).run();

    return this.findById(db, buildingId);
  },

  /** 获取建筑配置 */
  async getConfig(db: D1Database, configId: number): Promise<BuildingConfig | null> {
    const result = await db.prepare(`
      SELECT * FROM building_configs WHERE ID = ?
    `).bind(configId).first();
    return result as unknown as BuildingConfig | null;
  },

  /** 更新建筑状态 */
  async updateState(db: D1Database, buildingId: number, state: number): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE buildings SET state = ?, updated_at = ? WHERE id = ?
    `).bind(state, new Date().toISOString(), buildingId).run();
    return result.success;
  },

  /** 删除建筑 */
  async delete(db: D1Database, buildingId: number): Promise<boolean> {
    const result = await db.prepare(`
      DELETE FROM buildings WHERE id = ?
    `).bind(buildingId).run();
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
