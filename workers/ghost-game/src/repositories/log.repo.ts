/**
 * Log Repository - 日志数据访问层
 * 参考原版 jx/DAL/LogAccess.cs
 */
import type { D1Database } from '@cloudflare/workers-types';
import { BaseRepository, type BaseEntity } from './base.repo';

export interface Log extends BaseEntity {
  id: number;
  wallet_address: string;
  log_type: number;
  action: string;
  before_value: string;
  after_value: string;
  ip: string;
  user_agent: string;
  created_at: string;
}

export class LogRepository extends BaseRepository<Log> {
  constructor(db: D1Database) {
    super(db, 'logs');
  }

  // ==================== 查询操作 ====================

  /** 查询用户日志 */
  async findByWallet(walletAddress: string, limit: number = 100): Promise<Log[]> {
    const result = await this.db.prepare(
      `SELECT * FROM logs WHERE wallet_address = ? ORDER BY created_at DESC LIMIT ?`
    ).bind(walletAddress, limit).all<Log>();
    return (result.results as Log[]) || [];
  }

  /** 按类型查询 */
  async findByType(walletAddress: string, logType: number, limit: number = 50): Promise<Log[]> {
    const result = await this.db.prepare(
      `SELECT * FROM logs WHERE wallet_address = ? AND log_type = ? ORDER BY created_at DESC LIMIT ?`
    ).bind(walletAddress, logType, limit).all<Log>();
    return (result.results as Log[]) || [];
  }

  /** 查询时间段日志 */
  async findByTimeRange(walletAddress: string, startTime: string, endTime: string): Promise<Log[]> {
    const result = await this.db.prepare(
      `SELECT * FROM logs WHERE wallet_address = ? AND created_at BETWEEN ? AND ? ORDER BY created_at DESC`
    ).bind(walletAddress, startTime, endTime).all<Log>();
    return (result.results as Log[]) || [];
  }

  // ==================== 写入操作 ====================

  /** 添加日志 */
  async add(walletAddress: string, data: {
    logType: number;
    action: string;
    beforeValue?: string;
    afterValue?: string;
    ip?: string;
    userAgent?: string;
  }): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO logs (wallet_address, log_type, action, before_value, after_value, ip, user_agent, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      walletAddress, data.logType, data.action, 
      data.beforeValue || '', data.afterValue || '', 
      data.ip || '', data.userAgent || ''
    ).run();
    return result.meta.last_row_id;
  }

  /** 批量添加日志 */
  async bulkAdd(logs: Array<{
    walletAddress: string;
    logType: number;
    action: string;
  }>): Promise<number> {
    let count = 0;
    for (const log of logs) {
      await this.add(log.walletAddress, log);
      count++;
    }
    return count;
  }

  // ==================== 统计查询 ====================

  /** 获取今日操作次数 */
  async getTodayOperationCount(walletAddress: string): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM logs 
      WHERE wallet_address = ? AND created_at >= date('now', 'start of day')
    `).bind(walletAddress).first<{ count: number }>();
    return result?.count || 0;
  }

  /** 获取日志类型统计 */
  async getTypeStatistics(walletAddress: string, startTime?: string): Promise<Map<number, number>> {
    const query = startTime
      ? `SELECT log_type, COUNT(*) as count FROM logs WHERE wallet_address = ? AND created_at >= ? GROUP BY log_type`
      : `SELECT log_type, COUNT(*) as count FROM logs WHERE wallet_address = ? GROUP BY log_type`;
    
    const params = startTime ? [walletAddress, startTime] : [walletAddress];
    const result = await this.db.prepare(query).bind(...params).all<{ log_type: number; count: number }>();

    const stats = new Map<number, number>();
    for (const row of (result.results || [])) {
      stats.set(row.log_type, row.count);
    }
    return stats;
  }

  /** 清理旧日志 */
  async cleanup(days: number = 30): Promise<number> {
    const result = await this.db.prepare(`
      DELETE FROM logs WHERE created_at < date('now', '-? days')
    `).bind(days).run();
    return result.meta.changes;
  }
}
