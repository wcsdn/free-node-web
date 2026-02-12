/**
 * User Service - 用户业务逻辑层
 * 从 jx/BLL/User.cs 迁移
 * 使用 characters 表
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { ServiceResult } from '../types/models';
import { cityService } from './city.svc';
import { serverRepo } from '../repositories';

interface Character {
  id: number;
  wallet_address: string;
  name: string;
  level: number;
  exp: number;
  gold: number;
  vip_level: number;
  last_login: string;
  created_at: string;
  updated_at?: string;
}

export const userService = {
  /** 获取用户信息 (包含城市) */
  async getInfo(
    db: D1Database,
    walletAddress: string
  ): Promise<ServiceResult<{
    user: Character;
    cities: any[];
    cityCount: number;
  }>> {
    try {
      // 先确保用户存在
      const user = await this.getOrCreate(db, walletAddress);
      
      // 然后确保城市存在
      const cityResult = await cityService.getOrCreate(db, walletAddress);

      return {
        ok: true,
        data: {
          user: user,
          cities: [cityResult.city],
          cityCount: 1,
        },
      };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 根据钱包地址获取用户 */
  async getByWallet(db: D1Database, walletAddress: string): Promise<Character | null> {
    const result = await db.prepare(`
      SELECT * FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();
    return result as unknown as Character | null;
  },

  /** 创建或更新用户 (自动注册) */
  async getOrCreate(db: D1Database, walletAddress: string): Promise<Character> {
    let user = await this.getByWallet(db, walletAddress);
    
    if (!user) {
      const now = new Date().toISOString();
      const name = `玩家_${walletAddress.slice(2, 8)}`;
      
      await db.prepare(`
        INSERT INTO characters (wallet_address, name, level, exp, gold, vip_level, last_login, created_at)
        VALUES (?, ?, 1, 0, 1000, 0, ?, ?)
      `).bind(walletAddress, name, now, now).run();
      
      user = await this.getByWallet(db, walletAddress);
    }
    
    return user!;
  },

  /** 更新用户最后登录 */
  async updateLastLogin(db: D1Database, walletAddress: string): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE characters SET last_login = ?, updated_at = ? WHERE wallet_address = ?
    `).bind(new Date().toISOString(), new Date().toISOString(), walletAddress).run();
    return result.success;
  },

  /** 增加经验 */
  async addExp(db: D1Database, walletAddress: string, exp: number): Promise<Character | null> {
    await db.prepare(`
      UPDATE characters SET exp = exp + ?, updated_at = ? WHERE wallet_address = ?
    `).bind(exp, new Date().toISOString(), walletAddress).run();
    
    return this.getByWallet(db, walletAddress);
  },

  /** 增加金币 */
  async addGold(db: D1Database, walletAddress: string, gold: number): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE characters SET gold = gold + ?, updated_at = ? WHERE wallet_address = ?
    `).bind(gold, new Date().toISOString(), walletAddress).run();
    return result.success;
  },

  /** 获取服务器统计 */
  async getServerStats(db: D1Database): Promise<ServiceResult<{
    totalUsers: number;
    todayUsers: number;
    activeUsers: number;
    totalCities: number;
    totalCorps: number;
  }>> {
    try {
      const stats = await serverRepo.getStats(db);
      return { ok: true, data: stats };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },
};
