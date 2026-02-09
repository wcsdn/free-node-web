/**
 * Server Repository - 服务器统计数据访问层
 * 从 jx/DALEX/ServerExAccess.cs 迁移
 * 用于统计服务器级别的数据
 */
import type { D1Database } from '@cloudflare/workers-types';

export const serverRepo = {
  /** 获取注册用户数 */
  async getUserCount(db: D1Database): Promise<number> {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM characters
    `).first() as { count: number };
    return result.count;
  },

  /** 获取今日注册用户数 */
  async getTodayUserCount(db: D1Database): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM characters WHERE DATE(created_at) = ?
    `).bind(today).first() as { count: number };
    return result.count;
  },

  /** 获取活跃用户数 (最近N天有活动的用户) */
  async getActiveUserCount(db: D1Database, days = 7): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const cutoff = date.toISOString();
    
    const result = await db.prepare(`
      SELECT COUNT(DISTINCT wallet_address) as count FROM characters 
      WHERE updated_at > ?
    `).bind(cutoff).first() as { count: number };
    return result.count;
  },

  /** 获取城市总数 */
  async getCityCount(db: D1Database): Promise<number> {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM cities
    `).first() as { count: number };
    return result.count;
  },

  /** 获取军团总数 */
  async getCorpsCount(db: D1Database): Promise<number> {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM corps
    `).first() as { count: number };
    return result.count;
  },

  /** 获取服务器统计数据 */
  async getStats(db: D1Database): Promise<{
    totalUsers: number;
    todayUsers: number;
    activeUsers: number;
    totalCities: number;
    totalCorps: number;
  }> {
    const [totalUsers, todayUsers, activeUsers, totalCities, totalCorps] = await Promise.all([
      this.getUserCount(db),
      this.getTodayUserCount(db),
      this.getActiveUserCount(db),
      this.getCityCount(db),
      this.getCorpsCount(db),
    ]);

    return {
      totalUsers,
      todayUsers,
      activeUsers,
      totalCities,
      totalCorps,
    };
  },
};
