/**
 * Arena Service - 竞技场业务逻辑层
 * 从 jx/BLL/Arena.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { ArenaRanking, ServiceResult } from '../types/models';

export const arenaService = {
  /** 获取排行榜 */
  async getRanking(db: D1Database, limit = 100): Promise<ServiceResult<ArenaRanking[]>> {
    try {
      const result = await db.prepare(`
        SELECT * FROM arena_rankings ORDER BY rank ASC LIMIT ?
      `).bind(limit).all();
      
      return { ok: true, data: (result.results || []) as unknown as ArenaRanking[] };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取用户排名 */
  async getMyRanking(db: D1Database, walletAddress: string): Promise<ServiceResult<ArenaRanking | null>> {
    try {
      const result = await db.prepare(`
        SELECT * FROM arena_rankings WHERE wallet_address = ?
      `).bind(walletAddress).first();
      
      return { ok: true, data: (result || null) as unknown as ArenaRanking | null };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 更新排名 */
  async updateRanking(
    db: D1Database,
    walletAddress: string,
    name: string,
    score: number,
    isWin: boolean
  ): Promise<ServiceResult<ArenaRanking>> {
    try {
      const now = new Date().toISOString();
      
      // 检查是否已有记录
      const existing = await db.prepare(`
        SELECT * FROM arena_rankings WHERE wallet_address = ?
      `).bind(walletAddress).first();
      
      if (existing) {
        const r = existing as any;
        const newScore = isWin ? (r.score + score) : Math.max(0, r.score - score / 2);
        const newWinCount = isWin ? (r.win_count + 1) : r.win_count;
        const newLoseCount = !isWin ? (r.lose_count + 1) : r.lose_count;
        
        await db.prepare(`
          UPDATE arena_rankings 
          SET score = ?, win_count = ?, lose_count = ?, last_battle_time = ?, updated_at = ?
          WHERE wallet_address = ?
        `).bind(newScore, newWinCount, newLoseCount, now, now, walletAddress).run();
      } else {
        await db.prepare(`
          INSERT INTO arena_rankings (wallet_address, name, rank, score, win_count, lose_count, last_battle_time, created_at)
          VALUES (?, ?, 0, ?, 0, 0, ?, ?)
        `).bind(walletAddress, name, score, now, now).run();
      }
      
      // 重新计算排名
      await this.recalculateRanks(db);
      
      const ranking = await this.getMyRanking(db, walletAddress);
      return { ok: true, data: ranking.data! };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 重新计算所有排名 */
  async recalculateRanks(db: D1Database): Promise<void> {
    await db.prepare(`
      UPDATE arena_rankings 
      SET rank = (
        SELECT COUNT(*) + 1 FROM arena_rankings r2 
        WHERE r2.score > arena_rankings.score
      )
    `).run();
  },
};
