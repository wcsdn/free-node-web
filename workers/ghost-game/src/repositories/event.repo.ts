/**
 * Event Repository - 事件数据访问层
 * 参考原版 jx/DAL/EventAccess.cs + jx/DALEX/EventExAccess.cs (3,122 行)
 */
import type { D1Database } from '@cloudflare/workers-types';
import { BaseRepository, type BaseEntity } from './base.repo';

export interface UserEvent extends BaseEntity {
  id: number;
  wallet_address: string;
  event_id: number;
  state: number;
  progress: number;
  target: number;
  start_time: string;
  expire_time: string;
  completed_at: string;
  reward_gold: number;
  reward_exp: number;
  reward_items: string;
  created_at: string;
}

export interface EventConfig {
  id: number;
  name: string;
  type: number;
  subtype: number;
  description: string;
  reward_gold: number;
  reward_exp: number;
  reward_items: string;
  duration: number;
  level_req: number;
  repeatable: number;
}

export class EventRepository extends BaseRepository<UserEvent> {
  constructor(db: D1Database) {
    super(db, 'user_events');
  }

  // ==================== 查询操作 ====================

  /** 查询用户进行中事件 */
  async findActive(walletAddress: string): Promise<UserEvent[]> {
    return await this.db.prepare(
      `SELECT * FROM user_events WHERE wallet_address = ? AND state = 1 AND expire_time > datetime('now')`
    ).bind(walletAddress).all<UserEvent>().then(r => (r.results as UserEvent[]) || []);
  }

  /** 查询已完成事件 */
  async findCompleted(walletAddress: string): Promise<UserEvent[]> {
    return await this.db.prepare(
      `SELECT * FROM user_events WHERE wallet_address = ? AND state = 2`
    ).bind(walletAddress).all<UserEvent>().then(r => (r.results as UserEvent[]) || []);
  }

  /** 查询过期事件 */
  async findExpired(walletAddress: string): Promise<UserEvent[]> {
    return await this.db.prepare(
      `SELECT * FROM user_events WHERE wallet_address = ? AND state = 1 AND expire_time <= datetime('now')`
    ).bind(walletAddress).all<UserEvent>().then(r => (r.results as UserEvent[]) || []);
  }

  // ==================== 写入操作 ====================

  /** 接受事件 */
  async accept(walletAddress: string, eventId: number, duration: number = 3600): Promise<number> {
    const now = new Date();
    const expireTime = new Date(now.getTime() + duration * 1000).toISOString();
    
    const result = await this.db.prepare(`
      INSERT INTO user_events (wallet_address, event_id, state, progress, target, start_time, expire_time, created_at, updated_at)
      VALUES (?, ?, 1, 0, 1, datetime('now'), ?, datetime('now'), datetime('now'))
    `).bind(walletAddress, eventId, expireTime).run();

    return result.meta.last_row_id;
  }

  /** 更新进度 */
  async updateProgress(eventId: number, delta: number): Promise<{
    completed: boolean;
    newProgress: number;
  }> {
    const event = await this.findById(eventId);
    if (!event) return { completed: false, newProgress: 0 };

    const newProgress = Math.min(event.progress + delta, event.target);
    const completed = newProgress >= event.target;

    await this.db.prepare(`
      UPDATE user_events SET progress = ?, state = ?, completed_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newProgress, completed ? 2 : 1, completed ? new Date().toISOString() : null, eventId).run();

    return { completed, newProgress };
  }

  /** 放弃事件 */
  async abandon(eventId: number): Promise<void> {
    await this.db.prepare(
      `UPDATE user_events SET state = 3, updated_at = datetime('now') WHERE id = ?`
    ).bind(eventId).run();
  }

  /** 清理过期事件 */
  async cleanupExpired(): Promise<number> {
    const result = await this.db.prepare(
      `UPDATE user_events SET state = 4 WHERE state = 1 AND expire_time <= datetime('now')`
    ).run();
    return result.meta.changes;
  }

  // ==================== 配置查询 ====================

  /** 获取事件配置 */
  async getEventConfig(eventId: number): Promise<EventConfig | null> {
    return await this.db.prepare(
      `SELECT * FROM events_config WHERE id = ?`
    ).bind(eventId).first<EventConfig>();
  }

  /** 根据类型获取配置 */
  async getConfigsByType(type: number): Promise<EventConfig[]> {
    const result = await this.db.prepare(
      `SELECT * FROM events_config WHERE type = ?`
    ).bind(type).all<EventConfig>();
    return (result.results as EventConfig[]) || [];
  }

  // ==================== 统计查询 ====================

  /** 获取今日完成次数 */
  async getTodayCompleteCount(walletAddress: string): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM user_events 
      WHERE wallet_address = ? AND state = 2 AND completed_at >= date('now', 'start of day')
    `).bind(walletAddress).first<{ count: number }>();
    return result?.count || 0;
  }
}
