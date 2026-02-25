/**
 * Technic Repository - 科技数据访问层
 * 参考原版 jx/DAL/TechnicAccess.cs
 */
import type { D1Database } from '@cloudflare/workers-types';
import { BaseRepository, type BaseEntity } from './base.repo';

export interface Technic extends BaseEntity {
  id: number;
  wallet_address: string;
  technic_id: number;
  technic_level: number;
  technic_point: number;
  created_at: string;
}

export interface TechnicConfig {
  id: number;
  name: string;
  type: number;
  max_level: number;
  base_cost: string;
  effect: string;
  description: string;
  icon: string;
  prerequisite: number;
}

export class TechnicRepository extends BaseRepository<Technic> {
  constructor(db: D1Database) {
    super(db, 'user_technics');
  }

  // ==================== 查询操作 ====================

  /** 查询用户所有科技 */
  async findByWallet(walletAddress: string): Promise<Technic[]> {
    return await this.where({ wallet_address: walletAddress });
  }

  /** 查询进行中的科技 (基于 technic_point > 0) */
  async findResearching(walletAddress: string): Promise<Technic[]> {
    return await this.db.prepare(
      `SELECT * FROM user_technics WHERE wallet_address = ? AND technic_point > 0`
    ).bind(walletAddress).all<Technic>().then(r => (r.results as Technic[]) || []);
  }

  /** 查询已激活的科技 (基于 technic_level > 0) */
  async findActive(walletAddress: string): Promise<Technic[]> {
    return await this.where({ wallet_address: walletAddress, technic_level: { $gt: 0 } });
  }

  // ==================== 写入操作 ====================

  /** 开始研究科技 */
  async startResearch(walletAddress: string, technicId: number): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO user_technics (wallet_address, technic_id, technic_level, technic_point, created_at)
      VALUES (?, ?, 0, 0, datetime('now'))
    `).bind(walletAddress, technicId).run();
    return result.meta.last_row_id;
  }

  /** 完成研究 - 激活科技 */
  async completeResearch(technicId: number): Promise<boolean> {
    const technic = await this.findById(technicId);
    if (!technic || technic.technic_level < 1) return false;

    await this.db.prepare(`
      UPDATE user_technics SET technic_level = 1, updated_at = datetime('now') WHERE id = ?
    `).bind(technicId).run();
    return true;
  }

  /** 升级科技 */
  async upgrade(technicId: number, pointsToAdd: number): Promise<{
    newPoints: number;
    newLevel: number;
    levelUp: boolean;
  }> {
    const technic = await this.findById(technicId);
    if (!technic) return { newPoints: 0, newLevel: 0, levelUp: false };

    const newPoints = technic.technic_point + pointsToAdd;
    const newLevel = this.calculateLevel(newPoints);
    const levelUp = newLevel > technic.technic_level;

    await this.db.prepare(`
      UPDATE user_technics SET technic_point = ?, technic_level = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(newPoints, newLevel, technicId).run();

    return { newPoints, newLevel, levelUp };
  }

  // ==================== 配置查询 ====================

  /** 获取科技配置 */
  async getTechnicConfig(technicId: number): Promise<TechnicConfig | null> {
    return await this.db.prepare(
      `SELECT * FROM technics_config WHERE id = ?`
    ).bind(technicId).first<TechnicConfig>();
  }

  /** 根据类型获取配置 */
  async getConfigsByType(type: number): Promise<TechnicConfig[]> {
    const result = await this.db.prepare(
      `SELECT * FROM technics_config WHERE type = ?`
    ).bind(type).all<TechnicConfig>();
    return (result.results as TechnicConfig[]) || [];
  }

  // ==================== 辅助方法 ====================

  /** 根据科技点数计算等级 */
  private calculateLevel(points: number): number {
    // 简化计算：每100点升一级，最高20级
    let level = Math.floor(points / 100) + 1;
    return Math.min(level, 20);
  }
}

// 导出便捷使用对象
export const technicRepo = {
  /** 查询用户所有科技 */
  async findByWallet(db: D1Database, walletAddress: string): Promise<Technic[]> {
    const repo = new TechnicRepository(db);
    return repo.findByWallet(walletAddress);
  },

  /** 根据ID查询科技 */
  async findById(db: D1Database, id: number): Promise<Technic | null> {
    const repo = new TechnicRepository(db);
    return repo.findById(id);
  },

  /** 创建科技 */
  async create(db: D1Database, data: Partial<Technic>): Promise<number> {
    const repo = new TechnicRepository(db);
    return repo.insert(data);
  },

  /** 升级科技等级 */
  async levelUp(db: D1Database, technicId: number): Promise<Technic | null> {
    const repo = new TechnicRepository(db);
    const success = await repo.increment(technicId, 'technic_level');
    if (success) {
      return repo.findById(technicId);
    }
    return null;
  },

  /** 增加科技点数 */
  async addPoint(db: D1Database, technicId: number, points: number): Promise<boolean> {
    const repo = new TechnicRepository(db);
    return repo.increment(technicId, 'technic_point', points);
  },

  /** 开始研究科技 */
  async startResearch(db: D1Database, walletAddress: string, technicId: number): Promise<number> {
    const repo = new TechnicRepository(db);
    return repo.startResearch(walletAddress, technicId);
  },

  /** 完成研究 */
  async completeResearch(db: D1Database, technicId: number): Promise<boolean> {
    const repo = new TechnicRepository(db);
    return repo.completeResearch(technicId);
  },
};
