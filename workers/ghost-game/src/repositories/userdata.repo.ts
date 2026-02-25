/**
 * UserData Repository - 用户附属数据访问层
 * 参考原版 jx/DAL/UserDataAccess.cs
 */
import type { D1Database } from '@cloudflare/workers-types';
import { BaseRepository, type BaseEntity } from './base.repo';

export interface UserData extends BaseEntity {
  id: number;
  wallet_address: string;
  key: string;
  value: string;
  data_type: number;
  expire_time: string;
}

export class UserDataRepository extends BaseRepository<UserData> {
  constructor(db: D1Database) {
    super(db, 'user_data');
  }

  // ==================== 查询操作 ====================

  /** 根据键值查询 */
  async findByKey(walletAddress: string, key: string): Promise<UserData | null> {
    return await this.db.prepare(
      `SELECT * FROM user_data WHERE wallet_address = ? AND \`key\` = ?`
    ).bind(walletAddress, key).first<UserData>();
  }

  /** 获取用户所有数据 */
  async findAllByWallet(walletAddress: string): Promise<UserData[]> {
    return await this.where({ wallet_address: walletAddress });
  }

  /** 根据类型查询 */
  async findByType(walletAddress: string, dataType: number): Promise<UserData[]> {
    return await this.where({ wallet_address: walletAddress, data_type: dataType });
  }

  /** 批量获取多个键的值 */
  async getMultiple(walletAddress: string, keys: string[]): Promise<Record<string, string>> {
    if (keys.length === 0) return {};

    const placeholders = keys.map(() => '?').join(', ');
    const result = await this.db.prepare(
      `SELECT \`key\`, value FROM user_data WHERE wallet_address = ? AND \`key\` IN (${placeholders})`
    ).bind(walletAddress, ...keys).all<{ key: string; value: string }>();

    const data: Record<string, string> = {};
    for (const row of (result.results || [])) {
      data[row.key] = row.value;
    }
    return data;
  }

  // ==================== 写入操作 ====================

  /** 设置数据（插入或更新） */
  async set(walletAddress: string, key: string, value: string, dataType: number = 0, expireTime?: string): Promise<void> {
    const now = new Date().toISOString();
    
    // 尝试更新
    const updateResult = await this.db.prepare(`
      UPDATE user_data SET value = ?, expire_time = ?, updated_at = ?
      WHERE wallet_address = ? AND \`key\` = ?
    `).bind(value, expireTime || null, now, walletAddress, key).run();

    // 如果没有更新成功，则插入
    if (updateResult.meta.changes === 0) {
      await this.db.prepare(`
        INSERT INTO user_data (wallet_address, \`key\`, value, data_type, expire_time, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(walletAddress, key, value, dataType, expireTime || null, now, now).run();
    }
  }

  /** 批量设置数据 */
  async setMultiple(walletAddress: string, data: Record<string, { value: string; type?: number }>): Promise<void> {
    const now = new Date().toISOString();
    
    for (const [key, { value, type = 0 }] of Object.entries(data)) {
      await this.set(walletAddress, key, value, type);
    }
  }

  /** 删除指定键 */
  async deleteKey(walletAddress: string, key: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM user_data WHERE wallet_address = ? AND \`key\` = ?`
    ).bind(walletAddress, key).run();
    return result.meta.changes > 0;
  }

  /** 批量删除键 */
  async deleteKeys(walletAddress: string, keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;

    const placeholders = keys.map(() => '?').join(', ');
    const result = await this.db.prepare(
      `DELETE FROM user_data WHERE wallet_address = ? AND \`key\` IN (${placeholders})`
    ).bind(walletAddress, ...keys).run();
    return result.meta.changes;
  }

  /** 删除过期数据 */
  async deleteExpired(): Promise<number> {
    const result = await this.db.prepare(
      `DELETE FROM user_data WHERE expire_time IS NOT NULL AND expire_time < datetime('now')`
    ).run();
    return result.meta.changes;
  }

  // ==================== 便利方法 ====================

  /** 获取JSON数据（自动解析） */
  async getJson<T>(walletAddress: string, key: string): Promise<T | null> {
    const data = await this.findByKey(walletAddress, key);
    if (!data) return null;
    
    try {
      return JSON.parse(data.value) as T;
    } catch {
      return null;
    }
  }

  /** 设置JSON数据（自动序列化） */
  async setJson<T>(walletAddress: string, key: string, value: T, dataType: number = 1): Promise<void> {
    await this.set(walletAddress, key, JSON.stringify(value), dataType);
  }

  /** 累加数值数据 */
  async addNumber(walletAddress: string, key: string, delta: number): Promise<number> {
    const data = await this.findByKey(walletAddress, key);
    const current = data ? parseFloat(data.value) || 0 : 0;
    const newValue = current + delta;
    
    await this.set(walletAddress, key, newValue.toString(), 0);
    return newValue;
  }

  /** 获取或设置默认值 */
  async getOrSet(walletAddress: string, key: string, defaultValue: string): Promise<string> {
    const data = await this.findByKey(walletAddress, key);
    if (data) return data.value;
    
    await this.set(walletAddress, key, defaultValue);
    return defaultValue;
  }
}
