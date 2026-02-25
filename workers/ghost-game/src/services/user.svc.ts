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
  vip_expire?: string;
 体力?: number;
  max_体力?: number;
  last_login: string;
  created_at: string;
  updated_at?: string;
}

// 经验值升级表
const EXP_LEVELS = [
  0, 100, 200, 300, 500, 800, 1200, 1700, 2300, 3000,
  3800, 4700, 5700, 6800, 8000, 9500, 11000, 13000, 15000, 17500,
  20000, 23000, 26000, 30000, 35000, 40000, 46000, 53000, 61000, 70000
];

// VIP 配置
const VIP_CONFIG = {
  1: { daily_gold: 100, discount: 0.01 },
  2: { daily_gold: 200, discount: 0.02 },
  3: { daily_gold: 300, discount: 0.03 },
  4: { daily_gold: 500, discount: 0.05 },
  5: { daily_gold: 800, discount: 0.08 },
  6: { daily_gold: 1000, discount: 0.10 },
  7: { daily_gold: 1500, discount: 0.12 },
  8: { daily_gold: 2000, discount: 0.15 },
  9: { daily_gold: 3000, discount: 0.18 },
  10: { daily_gold: 5000, discount: 0.20 },
};

// 用户名验证
function validateUsername(name: string): { valid: boolean; error?: string } {
  if (!name || name.length === 0) return { valid: false, error: '用户名不能为空' };
  if (name.length > 20) return { valid: false, error: '用户名不能超过20个字符' };

  // 只允许中文、英文、数字
  const validChars = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/;
  if (!validChars.test(name)) return { valid: false, error: '用户名只能包含中文、英文、数字' };

  return { valid: true };
}

// 城市名验证
function validateCityName(name: string): { valid: boolean; error?: string } {
  if (!name || name.length === 0) return { valid: false, error: '城市名不能为空' };
  if (name.length > 20) return { valid: false, error: '城市名不能超过20个字符' };

  const validChars = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/;
  if (!validChars.test(name)) return { valid: false, error: '城市名只能包含中文、英文、数字' };

  return { valid: true };
}

// 计算等级
function calculateLevel(exp: number): number {
  for (let i = EXP_LEVELS.length - 1; i >= 0; i--) {
    if (exp >= EXP_LEVELS[i]) {
      return i + 1;
    }
  }
  return 1;
}

// 计算升级所需经验
function getExpForLevel(level: number): number {
  if (level >= EXP_LEVELS.length) return EXP_LEVELS[EXP_LEVELS.length - 1];
  return EXP_LEVELS[level - 1] || 0;
}

export const userService = {
  /** 用户注册 */
  async register(
    db: D1Database,
    walletAddress: string,
    options: {
      username?: string;
      cityName?: string;
      sex?: number;
    } = {}
  ): Promise<ServiceResult<{ user: Character; city: any }>> {
    try {
      const username = options.username || `玩家_${walletAddress.slice(2, 8)}`;
      const cityName = options.cityName || `${username}的城池`;

      // 验证用户名
      const nameValidation = validateUsername(username);
      if (!nameValidation.valid) {
        return { ok: false, error: nameValidation.error || '用户名无效', status: 400 };
      }

      // 验证城市名
      const cityValidation = validateCityName(cityName);
      if (!cityValidation.valid) {
        return { ok: false, error: cityValidation.error || '城市名无效', status: 400 };
      }

      // 检查用户是否已存在
      const existing = await this.getByWallet(db, walletAddress);
      if (existing) {
        return { ok: false, error: '用户已存在', status: 400 };
      }

      const now = new Date().toISOString();

      // 创建用户
      await db.prepare(`
        INSERT INTO characters (wallet_address, name, level, exp, gold, vip_level, last_login, created_at)
        VALUES (?, ?, 1, 0, 1000, 0, ?, ?)
      `).bind(walletAddress, username, now, now).run();

      // 创建城市
      const cityResult = await cityService.getOrCreate(db, walletAddress);

      const user = await this.getByWallet(db, walletAddress);

      return {
        ok: true,
        data: { user: user!, city: cityResult },
      };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

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
      const user = await this.getByWallet(db, walletAddress);

      if (!user) {
        return { ok: false, error: '用户不存在', status: 404 };
      }

      const cityResult = await cityService.getList(db, walletAddress);

      return {
        ok: true,
        data: {
          user,
          cities: cityResult.cities || [],
          cityCount: (cityResult.cities || []).length,
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

  /** 检查用户是否存在 */
  async exists(db: D1Database, walletAddress: string): Promise<boolean> {
    const user = await this.getByWallet(db, walletAddress);
    return user !== null;
  },

  /** 用户名验证 */
  async validateUsername(db: D1Database, username: string): Promise<{ valid: boolean; error?: string }> {
    const validation = validateUsername(username);
    if (!validation.valid) return validation;

    const existing = await db.prepare(`
      SELECT id FROM characters WHERE name = ?
    `).bind(username).first();

    if (existing) {
      return { valid: false, error: '用户名已存在' };
    }

    return { valid: true };
  },

  /** 城市名验证 */
  async validateCityName(db: D1Database, cityName: string): Promise<{ valid: boolean; error?: string }> {
    const validation = validateCityName(cityName);
    if (!validation.valid) return validation;

    const existing = await db.prepare(`
      SELECT id FROM cities WHERE name = ?
    `).bind(cityName).first();

    if (existing) {
      return { valid: false, error: '城市名已存在' };
    }

    return { valid: true };
  },

  /** 创建或更新用户 (自动注册) - 简化版 */
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

  /** 增加经验并检查升级 */
  async addExp(db: D1Database, walletAddress: string, exp: number): Promise<ServiceResult<{
    user: Character;
    leveledUp: boolean;
    newLevel: number;
  }>> {
    try {
      const user = await this.getByWallet(db, walletAddress);
      if (!user) return { ok: false, error: '用户不存在', status: 404 };

      const newExp = user.exp + exp;
      const newLevel = calculateLevel(newExp);
      const leveledUp = newLevel > user.level;

      await db.prepare(`
        UPDATE characters SET exp = ?, level = ?, updated_at = ? WHERE wallet_address = ?
      `).bind(newExp, newLevel, new Date().toISOString(), walletAddress).run();

      const updatedUser = await this.getByWallet(db, walletAddress);

      return {
        ok: true,
        data: {
          user: updatedUser!,
          leveledUp,
          newLevel,
        },
      };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 增加金币 */
  async addGold(db: D1Database, walletAddress: string, gold: number): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE characters SET gold = gold + ?, updated_at = ? WHERE wallet_address = ?
    `).bind(gold, new Date().toISOString(), walletAddress).run();
    return result.success;
  },

  /** 消耗金币 */
  async consumeGold(db: D1Database, walletAddress: string, gold: number): Promise<ServiceResult<boolean>> {
    const user = await this.getByWallet(db, walletAddress);
    if (!user) return { ok: false, error: '用户不存在', status: 404 };

    if (user.gold < gold) {
      return { ok: false, error: '金币不足', status: 400 };
    }

    const result = await db.prepare(`
      UPDATE characters SET gold = gold - ?, updated_at = ? WHERE wallet_address = ?
    `).bind(gold, new Date().toISOString(), walletAddress).run();

    return { ok: true, data: result.success };
  },

  /** 设置 VIP 等级 */
  async setVipLevel(db: D1Database, walletAddress: string, vipLevel: number, expireDays: number = 30): Promise<boolean> {
    const expireTime = new Date();
    expireTime.setDate(expireTime.getDate() + expireDays);

    const result = await db.prepare(`
      UPDATE characters SET vip_level = ?, vip_expire = ?, updated_at = ? WHERE wallet_address = ?
    `).bind(vipLevel, expireTime.toISOString(), new Date().toISOString(), walletAddress).run();

    return result.success;
  },

  /** 获取 VIP 奖励 */
  async claimVipReward(db: D1Database, walletAddress: string): Promise<ServiceResult<{ gold: number }>> {
    const user = await this.getByWallet(db, walletAddress);
    if (!user) return { ok: false, error: '用户不存在', status: 404 };

    if (user.vip_level <= 0) {
      return { ok: false, error: '不是VIP用户', status: 400 };
    }

    const vipConfig = VIP_CONFIG[user.vip_level as keyof typeof VIP_CONFIG];
    if (!vipConfig) {
      return { ok: false, error: 'VIP配置不存在', status: 400 };
    }

    // 检查今天是否已领取
    const lastClaim = user.last_login;
    const today = new Date().toDateString();
    if (lastClaim && new Date(lastClaim).toDateString() === today) {
      return { ok: false, error: '今日奖励已领取', status: 400 };
    }

    await this.addGold(db, walletAddress, vipConfig.daily_gold);

    return { ok: true, data: { gold: vipConfig.daily_gold } };
  },

  /** 获取等级信息 */
  getLevelInfo(level: number): { level: number; currentExp: number; nextExp: number; progress: number } {
    const currentExp = EXP_LEVELS[level - 1] || 0;
    const nextExp = EXP_LEVELS[level] || EXP_LEVELS[EXP_LEVELS.length - 1];
    const progress = level >= EXP_LEVELS.length ? 100 :
      Math.floor(((EXP_LEVELS[level - 1] || 0) - currentExp) / (nextExp - currentExp) * 100);

    return { level, currentExp, nextExp, progress };
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
