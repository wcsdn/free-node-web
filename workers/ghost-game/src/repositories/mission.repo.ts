/**
 * Mission Repository - 任务数据访问层
 * 参考原版 jx/DAL/MissionAccess.cs (621 行)
 */
import type { D1Database } from '@cloudflare/workers-types';
import { BaseRepository, type BaseEntity } from './base.repo';

export interface Mission extends BaseEntity {
  id: number;
  wallet_address: string;
  mission_id: number;
  state: number;
  progress: number;
  progress_target: number;
  accept_time: string;
  complete_time: string;
  reward_gold: number;
  reward_exp: number;
  reward_items: string;
}

export interface MissionConfig {
  id: number;
  name: string;
  type: number;
  description: string;
  target_type: number;
  target_param: string;
  reward_gold: number;
  reward_exp: number;
  reward_items: string;
  prerequisite: string;
  level_req: number;
  chain_id: number;
  chain_order: number;
}

export class MissionRepository extends BaseRepository<Mission> {
  constructor(db: D1Database) {
    super(db, 'user_missions');
  }

  // ==================== 查询操作 ====================

  /** 查询用户进行中任务 */
  async findActive(walletAddress: string): Promise<Mission[]> {
    return await this.where({ wallet_address: walletAddress, state: 1 });
  }

  /** 查询已完成任务 */
  async findCompleted(walletAddress: string): Promise<Mission[]> {
    return await this.where({ wallet_address: walletAddress, state: 2 });
  }

  /** 查询可接任务 */
  async findAvailable(walletAddress: string, level: number): Promise<MissionConfig[]> {
    const completed = await this.findCompleted(walletAddress);
    const completedIds = new Set(completed.map(m => m.mission_id));

    const result = await this.db.prepare(`
      SELECT * FROM missions_config 
      WHERE level_req <= ? AND id NOT IN (${completedIds.size > 0 ? [...completedIds].join(',') : '0'})
      ORDER BY level_req ASC
    `).bind(level).all<MissionConfig>();
    
    return (result.results as MissionConfig[]) || [];
  }

  // ==================== 写入操作 ====================

  /** 接受任务 */
  async accept(walletAddress: string, missionId: number): Promise<number> {
    const now = new Date().toISOString();
    
    const result = await this.db.prepare(`
      INSERT INTO user_missions (wallet_address, mission_id, state, progress, progress_target, accept_time, created_at, updated_at)
      VALUES (?, ?, 1, 0, 1, ?, datetime('now'), datetime('now'))
    `).bind(walletAddress, missionId, now).run();

    return result.meta.last_row_id;
  }

  /** 更新进度 */
  async updateProgress(missionId: number, delta: number): Promise<{
    completed: boolean;
    newProgress: number;
  }> {
    const mission = await this.findById(missionId);
    if (!mission) return { completed: false, newProgress: 0 };

    const newProgress = Math.min(mission.progress + delta, mission.progress_target);
    const completed = newProgress >= mission.progress_target;

    await this.db.prepare(`
      UPDATE user_missions SET progress = ?, state = ?, complete_time = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newProgress, completed ? 2 : 1, completed ? new Date().toISOString() : null, missionId).run();

    return { completed, newProgress };
  }

  /** 设置进度 */
  async setProgress(missionId: number, progress: number): Promise<boolean> {
    const mission = await this.findById(missionId);
    if (!mission) return false;

    const completed = progress >= mission.progress_target;
    await this.db.prepare(`
      UPDATE user_missions SET progress = ?, state = ?, complete_time = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(progress, completed ? 2 : 1, completed ? new Date().toISOString() : null, missionId).run();

    return true;
  }

  /** 放弃任务 */
  async abandon(missionId: number): Promise<void> {
    await this.db.prepare(
      `UPDATE user_missions SET state = 3, updated_at = datetime('now') WHERE id = ?`
    ).bind(missionId).run();
  }

  // ==================== 配置查询 ====================

  /** 获取任务配置 */
  async getMissionConfig(missionId: number): Promise<MissionConfig | null> {
    return await this.db.prepare(
      `SELECT * FROM missions_config WHERE id = ?`
    ).bind(missionId).first<MissionConfig>();
  }

  /** 根据类型获取配置 */
  async getConfigsByType(type: number): Promise<MissionConfig[]> {
    const result = await this.db.prepare(
      `SELECT * FROM missions_config WHERE type = ?`
    ).bind(type).all<MissionConfig>();
    return (result.results as MissionConfig[]) || [];
  }

  // ==================== 统计查询 ====================

  /** 获取今日完成任务数 */
  async getTodayCompleteCount(walletAddress: string): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM user_missions 
      WHERE wallet_address = ? AND state = 2 AND complete_time >= date('now', 'start of day')
    `).bind(walletAddress).first<{ count: number }>();
    return result?.count || 0;
  }
}
