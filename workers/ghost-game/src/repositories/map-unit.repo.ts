/**
 * MapUnit Repository - 地图单位数据访问层
 * 参考原版 jx/DAL/MapUnitAccess.cs
 */
import type { D1Database } from '@cloudflare/workers-types';
import { BaseRepository, type BaseEntity } from './base.repo';

export interface MapUnit extends BaseEntity {
  id: number;
  wallet_address: string;
  unit_id: number;
  position_x: number;
  position_y: number;
  level: number;
  hp: number;
  max_hp: number;
  status: number;
  spawn_time: string;
  despawn_time: string;
}

export interface MapUnitConfig {
  id: number;
  name: string;
  type: number;
  level: number;
  hp: number;
  atk: number;
  def: number;
  speed: number;
  drop_items: string;
  drop_rate: number;
  spawn_area: string;
  spawn_time: string;
  despawn_time: string;
}

export class MapUnitRepository extends BaseRepository<MapUnit> {
  constructor(db: D1Database) {
    super(db, 'map_units');
  }

  // ==================== 查询操作 ====================

  /** 查询用户占领的单位 */
  async findByWallet(walletAddress: string): Promise<MapUnit[]> {
    return await this.where({ wallet_address: walletAddress });
  }

  /** 查询地图上的单位 */
  async findOnMap(mapId: number = 1): Promise<MapUnit[]> {
    return await this.db.prepare(
      `SELECT * FROM map_units WHERE status = 1 AND position_x IS NOT NULL AND position_y IS NOT NULL`
    ).all<MapUnit>().then(r => (r.results as MapUnit[]) || []);
  }

  /** 查询某位置的单位 */
  async findByPosition(mapId: number, x: number, y: number): Promise<MapUnit | null> {
    return await this.db.prepare(
      `SELECT * FROM map_units WHERE position_x = ? AND position_y = ?`
    ).bind(x, y).first<MapUnit>();
  }

  // ==================== 写入操作 ====================

  /** 放置单位 */
  async placeUnit(walletAddress: string, unitId: number, x: number, y: number): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO map_units (wallet_address, unit_id, position_x, position_y, level, hp, max_hp, status, spawn_time, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, 100, 100, 1, datetime('now'), datetime('now'), datetime('now'))
    `).bind(walletAddress, unitId, x, y).run();
    return result.meta.last_row_id;
  }

  /** 移动单位 */
  async moveUnit(unitId: number, x: number, y: number): Promise<boolean> {
    const result = await this.db.prepare(
      `UPDATE map_units SET position_x = ?, position_y = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(x, y, unitId).run();
    return result.meta.changes > 0;
  }

  /** 更新单位状态 */
  async updateStatus(unitId: number, status: number): Promise<void> {
    await this.db.prepare(
      `UPDATE map_units SET status = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(status, unitId).run();
  }

  /** 更新单位血量 */
  async updateHp(unitId: number, hp: number): Promise<void> {
    await this.db.prepare(
      `UPDATE map_units SET hp = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(hp, unitId).run();
  }

  /** 移除单位 */
  async removeUnit(unitId: number): Promise<boolean> {
    return await this.delete(unitId);
  }

  // ==================== 配置查询 ====================

  /** 获取单位配置 */
  async getUnitConfig(unitId: number): Promise<MapUnitConfig | null> {
    return await this.db.prepare(
      `SELECT * FROM map_units_config WHERE id = ?`
    ).bind(unitId).first<MapUnitConfig>();
  }

  /** 获取所有配置 */
  async getAllConfigs(): Promise<MapUnitConfig[]> {
    return await this.db.prepare(`SELECT * FROM map_units_config`).all<MapUnitConfig>().then(r => (r.results as MapUnitConfig[]) || []);
  }

  /** 根据类型获取配置 */
  async getConfigsByType(type: number): Promise<MapUnitConfig[]> {
    return await this.db.prepare(
      `SELECT * FROM map_units_config WHERE type = ?`
    ).bind(type).all<MapUnitConfig>().then(r => (r.results as MapUnitConfig[]) || []);
  }
}
