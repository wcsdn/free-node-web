/**
 * PersistEffect Repository - 持久效果数据访问层
 * 参考原版 jx/DAL/PersistEffectAccess.cs (266 行)
 */
import type { D1Database } from '@cloudflare/workers-types';
import { BaseRepository, type BaseEntity } from './base.repo';

export interface PersistEffect extends BaseEntity {
  id: number;
  wallet_address: string;
  hero_id?: number;
  category: number;
  type: number;
  value: number;
  stack: number;
  max_stack: number;
  source: number;
  expires_at: string;
}

export interface EffectConfig {
  id: number;
  name: string;
  category: number;
  type: number;
  base_value: number;
  max_stack: number;
  duration: number;
  description: string;
}

export class PersistEffectRepository extends BaseRepository<PersistEffect> {
  constructor(db: D1Database) {
    super(db, 'user_effects');
  }

  // ==================== 查询操作 ====================

  /** 查询用户所有效果（未过期） */
  async findActive(walletAddress: string): Promise<PersistEffect[]> {
    return await this.db.prepare(
      `SELECT * FROM user_effects WHERE wallet_address = ? AND (expires_at IS NULL OR expires_at > datetime('now'))`
    ).bind(walletAddress).all<PersistEffect>().then(r => (r.results as PersistEffect[]) || []);
  }

  /** 查询武将效果 */
  async findByHero(heroId: number): Promise<PersistEffect[]> {
    return await this.db.prepare(
      `SELECT * FROM hero_effects WHERE hero_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))`
    ).bind(heroId).all<PersistEffect>().then(r => (r.results as PersistEffect[]) || []);
  }

  /** 查询过期效果 */
  async findExpired(walletAddress: string): Promise<PersistEffect[]> {
    return await this.db.prepare(
      `SELECT * FROM user_effects WHERE wallet_address = ? AND expires_at IS NOT NULL AND expires_at <= datetime('now')`
    ).bind(walletAddress).all<PersistEffect>().then(r => (r.results as PersistEffect[]) || []);
  }

  /** 根据类别查询 */
  async findByCategory(walletAddress: string, category: number): Promise<PersistEffect[]> {
    return await this.db.prepare(
      `SELECT * FROM user_effects WHERE wallet_address = ? AND category = ?`
    ).bind(walletAddress, category).all<PersistEffect>().then(r => (r.results as PersistEffect[]) || []);
  }

  // ==================== 写入操作 ====================

  /** 添加效果 */
  async add(walletAddress: string, data: {
    heroId?: number;
    category: number;
    type: number;
    value: number;
    stack?: number;
    maxStack?: number;
    source: number;
    duration?: number; // 秒
  }): Promise<number> {
    const now = new Date();
    const expiresAt = data.duration 
      ? new Date(now.getTime() + data.duration * 1000).toISOString()
      : null;

    if (data.heroId) {
      // 武将效果
      const result = await this.db.prepare(`
        INSERT INTO hero_effects (hero_id, category, type, value, stack, max_stack, source, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(data.heroId, data.category, data.type, data.value, data.stack || 1, data.maxStack || 1, data.source, expiresAt).run();
      return result.meta.last_row_id;
    } else {
      // 用户效果
      const result = await this.db.prepare(`
        INSERT INTO user_effects (wallet_address, category, type, value, stack, max_stack, source, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(walletAddress, data.category, data.type, data.value, data.stack || 1, data.maxStack || 1, data.source, expiresAt).run();
      return result.meta.last_row_id;
    }
  }

  /** 叠层效果 */
  async stack(effectId: number, maxStack: number): Promise<boolean> {
    const effect = await this.findById(effectId);
    if (!effect) return false;

    if (effect.stack >= maxStack) return false;

    await this.db.prepare(
      `UPDATE user_effects SET stack = stack + 1, updated_at = datetime('now') WHERE id = ?`
    ).bind(effectId).run();

    return true;
  }

  /** 移除效果 */
  async remove(effectId: number): Promise<boolean> {
    return await this.delete(effectId);
  }

  /** 移除所有效果 */
  async removeAll(walletAddress: string, heroId?: number): Promise<number> {
    if (heroId) {
      const result = await this.db.prepare(
        `DELETE FROM hero_effects WHERE hero_id = ?`
      ).bind(heroId).run();
      return result.meta.changes;
    } else {
      const result = await this.db.prepare(
        `DELETE FROM user_effects WHERE wallet_address = ?`
      ).bind(walletAddress).run();
      return result.meta.changes;
    }
  }

  /** 移除过期效果 */
  async cleanupExpired(): Promise<number> {
    const result = await this.db.prepare(
      `DELETE FROM user_effects WHERE expires_at IS NOT NULL AND expires_at <= datetime('now')`
    ).run();
    return result.meta.changes;
  }

  // ==================== 配置查询 ====================

  /** 获取效果配置 */
  async getEffectConfig(effectId: number): Promise<EffectConfig | null> {
    return await this.db.prepare(
      `SELECT * FROM effects_config WHERE id = ?`
    ).bind(effectId).first<EffectConfig>();
  }

  // ==================== 统计查询 ====================

  /** 获取当前效果数 */
  async getActiveCount(walletAddress: string): Promise<number> {
    return await this.findActive(walletAddress).then(effects => effects.length);
  }
}
