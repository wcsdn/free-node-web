/**
 * Building Repository - 建筑数据访问层
 * 原则：只负责 SQL 操作，不包含业务逻辑
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Building } from '../models';

// ============ Base Operations ============
export const buildingRepo = {
  /**
   * 根据 ID 查找建筑
   */
  async findById(db: D1Database, buildingId: number): Promise<Building | null> {
    const result = await db.prepare(`
      SELECT * FROM buildings WHERE id = ?
    `).bind(buildingId).first();
    return result as Building | null;
  },

  /**
   * 根据城市 ID 获取所有建筑
   */
  async findByCity(db: D1Database, cityId: number): Promise<Building[]> {
    const result = await db.prepare(`
      SELECT * FROM buildings WHERE city_id = ? ORDER BY position
    `).bind(cityId).all();
    return (result.results || []) as Building[];
  },

  /**
   * 获取城市建筑数量
   */
  async countByCity(db: D1Database, cityId: number): Promise<number> {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM buildings WHERE city_id = ?
    `).bind(cityId).first() as { count: number };
    return result.count;
  },

  /**
   * 获取城市建筑总等级
   */
  async sumLevelByCity(db: D1Database, cityId: number): Promise<number> {
    const result = await db.prepare(`
      SELECT SUM(level) as total FROM buildings WHERE city_id = ?
    `).bind(cityId).first() as { total: number | null };
    return result.total ?? 0;
  },

  /**
   * 创建建筑
   */
  async create(
    db: D1Database,
    data: Pick<Building, 'city_id' | 'type' | 'level' | 'position' | 'config_id'>
  ): Promise<Building> {
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO buildings (city_id, type, level, position, state, config_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.city_id,
      data.type,
      data.level,
      data.position,
      0, // state: idle
      data.config_id,
      now
    ).run();

    return this.findById(db, (await this.getLastInsertId(db)) as Promise<Building>;
  },

  /**
   * 升级建筑
   */
  async levelUp(db: D1Database, buildingId: number): Promise<Building | null> {
    const building = await this.findById(db, buildingId);
    if (!building) return null;

    await db.prepare(`
      UPDATE buildings SET level = level + 1, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), buildingId).run();

    return this.findById(db, buildingId);
  },

  /**
   * 批量创建初始建筑
   */
  async createInitialBuildings(
    db: D1Database,
    cityId: number,
    buildings: Array<Pick<Building, 'type' | 'level' | 'position' | 'config_id'>>
  ): Promise<void> {
    const now = new Date().toISOString();
    
    for (const b of buildings) {
      await db.prepare(`
        INSERT INTO buildings (city_id, type, level, position, state, config_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(cityId, b.type, b.level, b.position, 0, b.config_id, now).run();
    }
  },

  /**
   * 删除建筑
   */
  async delete(db: D1Database, buildingId: number): Promise<boolean> {
    const result = await db.prepare(`
      DELETE FROM buildings WHERE id = ?
    `).bind(buildingId).run();
    return result.success;
  },

  /**
   * 获取最后插入 ID (辅助方法)
   */
  private async getLastInsertId(db: D1Database): Promise<number> {
    const result = await db.prepare(`
      SELECT last_insert_rowid() as id
    `).first() as { id: number };
    return result.id;
  },
};
