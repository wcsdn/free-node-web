/**
 * Festival Repository - 节日活动数据访问层
 * 参考原版 jx/DAL/FestivalActiveAccess.cs
 */
import type { D1Database } from '@cloudflare/workers-types';
import { BaseRepository, type BaseEntity } from './base.repo';

export interface Festival extends BaseEntity {
  id: number;
  wallet_address: string;
  festival_id: number;
  score: number;
  reward_claimed: string;
  join_count: number;
  start_time: string;
  end_time: string;
}

export interface FestivalConfig {
  id: number;
  name: string;
  type: number;
  start_time: string;
  end_time: string;
  description: string;
  rules: string;
  rewards: string;
}

export class FestivalRepository extends BaseRepository<Festival> {
  constructor(db: D1Database) {
    super(db, 'user_festivals');
  }

  // ==================== 查询操作 ====================

  /** 查询用户参与的活动 */
  async findByWallet(walletAddress: string): Promise<Festival[]> {
    return await this.where({ wallet_address: walletAddress });
  }

  /** 查询进行中的活动 */
  async findActive(walletAddress: string): Promise<Festival[]> {
    return await this.db.prepare(`
      SELECT uf.* FROM user_festivals uf
      JOIN festivals_config fc ON uf.festival_id = fc.id
      WHERE uf.wallet_address = ? AND fc.start_time <= datetime('now') AND fc.end_time >= datetime('now')
    `).bind(walletAddress).all<Festival>().then(r => (r.results as Festival[]) || []);
  }

  /** 查询可参与的活动 */
  async findAvailable(): Promise<FestivalConfig[]> {
    return await this.db.prepare(`
      SELECT * FROM festivals_config 
      WHERE start_time <= datetime('now') AND end_time >= datetime('now')
    `).all<FestivalConfig>().then(r => (r.results as FestivalConfig[]) || []);
  }

  // ==================== 写入操作 ====================

  /** 参与活动 */
  async join(walletAddress: string, festivalId: number): Promise<number> {
    const now = new Date().toISOString();
    
    const result = await this.db.prepare(`
      INSERT INTO user_festivals (wallet_address, festival_id, score, join_count, start_time, created_at, updated_at)
      VALUES (?, ?, 0, 1, datetime('now'), datetime('now'), datetime('now'))
    `).bind(walletAddress, festivalId).run();
    return result.meta.last_row_id;
  }

  /** 增加分数 */
  async addScore(festivalId: number, score: number): Promise<void> {
    await this.db.prepare(`
      UPDATE user_festivals SET score = score + ?, updated_at = datetime('now') WHERE id = ?
    `).bind(score, festivalId).run();
  }

  /** 领取奖励 */
  async claimReward(festivalId: number, rewardId: number): Promise<boolean> {
    const festival = await this.findById(festivalId);
    if (!festival) return false;

    try {
      const claimed = JSON.parse(festival.reward_claimed || '[]');
      if (claimed.includes(rewardId)) return false;

      claimed.push(rewardId);
      await this.db.prepare(`
        UPDATE user_festivals SET reward_claimed = ?, updated_at = datetime('now') WHERE id = ?
      `).bind(JSON.stringify(claimed), festivalId).run();
      return true;
    } catch {
      return false;
    }
  }

  /** 增加参与次数 */
  async incrementJoinCount(festivalId: number): Promise<void> {
    await this.db.prepare(
      `UPDATE user_festivals SET join_count = join_count + 1, updated_at = datetime('now') WHERE id = ?`
    ).bind(festivalId).run();
  }

  // ==================== 配置查询 ====================

  /** 获取活动配置 */
  async getFestivalConfig(festivalId: number): Promise<FestivalConfig | null> {
    return await this.db.prepare(
      `SELECT * FROM festivals_config WHERE id = ?`
    ).bind(festivalId).first<FestivalConfig>();
  }

  /** 获取所有活动配置 */
  async getAllConfigs(): Promise<FestivalConfig[]> {
    return await this.db.prepare(`SELECT * FROM festivals_config`).all<FestivalConfig>().then(r => (r.results as FestivalConfig[]) || []);
  }
}
