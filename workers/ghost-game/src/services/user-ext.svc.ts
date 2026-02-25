/**
 * User System Extensions - 用户系统扩展
 * 从 jx/BLL/UserEx.cs 迁移 (部分扩展方法)
 */
import type { D1Database } from '@cloudflare/workers-types';

// 每日签到配置
export const SIGNIN_CONFIG = {
  DAYS: 7,
  REWARDS: [
    { day: 1, gold: 100, items: [] },
    { day: 2, gold: 150, items: [] },
    { day: 3, gold: 200, items: [{ itemId: 1001, count: 1 }] },
    { day: 4, gold: 250, items: [] },
    { day: 5, gold: 300, items: [{ itemId: 1002, count: 1 }] },
    { day: 6, gold: 400, items: [] },
    { day: 7, gold: 500, items: [{ itemId: 8001, count: 1 }] },
  ],
  EXTRA_BONUS_DAY: 28,  // 月额外奖励
};

// VIP配置
export const VIP_CONFIG = {
  MAX_LEVEL: 15,
  LEVELS: {
    1: { days: 30, goldBonus: 1.1, dropBonus: 1.05 },
    2: { days: 30, goldBonus: 1.15, dropBonus: 1.08 },
    3: { days: 30, goldBonus: 1.2, dropBonus: 1.1 },
    // ...省略中间等级
    15: { days: 30, goldBonus: 2.0, dropBonus: 1.5 },
  },
};

// 等级配置
export const LEVEL_CONFIG = {
  MAX_LEVEL: 100,
  EXP_TABLE: [0, 100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200, 102400, 204800, 409600, 819200],
  SKILL_POINTS: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7],
};

export class UserServiceExtension {
  private db: D1Database;
  constructor(db: D1Database) { this.db = db; }

  /** 获取每日签到信息 */
  async getSigninInfo(walletAddress: string) {
    const today = new Date().toISOString().split('T')[0];
    const signin: any = await this.db.prepare(`
      SELECT * FROM daily_signin WHERE wallet_address = ? ORDER BY signin_date DESC LIMIT 1
    `).bind(walletAddress).first();

    const lastDate = signin?.signin_date;
    const isToday = lastDate === today;
    const consecutiveDays = isToday ? (signin?.consecutive_days || 0) : (lastDate ? 0 : 0);
    
    // 计算连续天数
    let actualConsecutive = 0;
    if (lastDate && !isToday) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastDate === yesterday) actualConsecutive = (signin?.consecutive_days || 0);
    } else if (isToday) {
      actualConsecutive = signin?.consecutive_days || 0;
    }

    return {
      success: true,
      today,
      isToday,
      consecutiveDays: actualConsecutive,
      canSignin: !isToday,
      todayReward: SIGNIN_CONFIG.REWARDS[actualConsecutive % 7],
      weekReward: SIGNIN_CONFIG.REWARDS,
    };
  }

  /** 执行签到 */
  async signin(walletAddress: string) {
    const info = await this.getSigninInfo(walletAddress);
    if (!info.success || !info.canSignin) {
      return { success: false, error: '今日已签到' };
    }

    const today = new Date().toISOString().split('T')[0];
    const consecutiveDays = info.consecutiveDays + 1;
    const reward = SIGNIN_CONFIG.REWARDS[(consecutiveDays - 1) % 7];

    try {
      await this.db.prepare(`
        INSERT INTO daily_signin (wallet_address, signin_date, consecutive_days, reward)
        VALUES (?, ?, ?, ?)
      `).bind(walletAddress, today, consecutiveDays, JSON.stringify(reward)).run();

      // 发放奖励
      if (reward.gold > 0) {
        await this.db.prepare(`UPDATE users SET gold = gold + ? WHERE wallet_address = ?`)
          .bind(reward.gold, walletAddress).run();
      }
      for (const item of reward.items) {
        await this.addItem(walletAddress, item.itemId, item.count);
      }

      return {
        success: true,
        day: consecutiveDays,
        reward,
        message: `签到成功！第${consecutiveDays}天获得 ${reward.gold} 金币`,
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  /** 获取VIP信息 */
  async getVipInfo(walletAddress: string) {
    const user: any = await this.db.prepare(`
      SELECT vip_level, vip_expire FROM users WHERE wallet_address = ?
    `).bind(walletAddress).first();

    const level = user?.vip_level || 0;
    const expire = user?.vip_expire;
    const isActive = expire && new Date(expire) > new Date();

    const config = VIP_CONFIG.LEVELS[level as keyof typeof VIP_CONFIG.LEVELS];

    return {
      success: true,
      level,
      isActive,
      expire,
      daysRemaining: expire ? Math.max(0, Math.ceil((new Date(expire).getTime() - Date.now()) / 86400000)) : 0,
      bonuses: isActive && config ? config : null,
    };
  }

  /** 获取用户统计 */
  async getUserStats(walletAddress: string) {
    const user: any = await this.db.prepare(`
      SELECT level, exp, gold, gems, vip_level FROM users WHERE wallet_address = ?
    `).bind(walletAddress).first();

    const heroes: any = await this.db.prepare(`SELECT COUNT(*) as count FROM heroes WHERE wallet_address = ?`)
      .bind(walletAddress).first();
    const cities: any = await this.db.prepare(`SELECT COUNT(*) as count FROM cities WHERE wallet_address = ?`)
      .bind(walletAddress).first();
    const buildings: any = await this.db.prepare(`SELECT COUNT(*) as count FROM buildings WHERE wallet_address = ?`)
      .bind(walletAddress).first();
    const items: any = await this.db.prepare(`SELECT COUNT(*) as count FROM user_items WHERE wallet_address = ?`)
      .bind(walletAddress).first();

    const nextExp = LEVEL_CONFIG.EXP_TABLE[user?.level] || 0;

    return {
      success: true,
      user: {
        level: user?.level || 1,
        exp: user?.exp || 0,
        nextExp,
        gold: user?.gold || 0,
        gems: user?.gems || 0,
        vipLevel: user?.vip_level || 0,
      },
      stats: {
        heroCount: (heroes as any).count || 0,
        cityCount: (cities as any).count || 0,
        buildingCount: (buildings as any).count || 0,
        itemCount: (items as any).count || 0,
      },
    };
  }

  private async addItem(wallet: string, configId: number, count: number) {
    const existing: any = await this.db.prepare(`SELECT id FROM user_items WHERE wallet_address = ? AND item_id = ?`)
      .bind(wallet, configId).first();
    if (existing) {
      await this.db.prepare(`UPDATE user_items SET count = count + ? WHERE id = ?`).bind(count, existing.id).run();
    } else {
      await this.db.prepare(`INSERT INTO user_items (wallet_address, item_id, count, created_at) VALUES (?, ?, ?, datetime('now'))`)
        .bind(wallet, configId, count).run();
    }
}
}
