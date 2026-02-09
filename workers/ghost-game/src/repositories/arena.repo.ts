/**
 * Arena Repository - 竞技场数据访问层
 */
import type { D1Database } from '@cloudflare/workers-types';

export const arenaRepo = {
  /** 获取玩家竞技场记录 */
  async findByWallet(db: D1Database, walletAddress: string) {
    const result = await db.prepare(`
      SELECT * FROM arena_records WHERE wallet_address = ?
    `).bind(walletAddress).first();
    return result;
  },

  /** 获取排行榜 */
  async getRankList(db: D1Database, limit = 100) {
    const result = await db.prepare(`
      SELECT wallet_address, score, rank, win_count, lose_count, created_at
      FROM arena_records ORDER BY score DESC LIMIT ?
    `).bind(limit).all();
    return result.results || [];
  },

  /** 创建/更新玩家记录 */
  async upsert(db: D1Database, walletAddress: string, data: {
    score?: number;
    rank?: number;
    winCount?: number;
    loseCount?: number;
  }) {
    const sets: string[] = [];
    const values: any[] = [];

    if (data.score !== undefined) { sets.push('score = ?'); values.push(data.score); }
    if (data.rank !== undefined) { sets.push('rank = ?'); values.push(data.rank); }
    if (data.winCount !== undefined) { sets.push('win_count = ?'); values.push(data.winCount); }
    if (data.loseCount !== undefined) { sets.push('lose_count = ?'); values.push(data.loseCount); }

    values.push(walletAddress);

    await db.prepare(`
      UPDATE arena_records SET ${sets.join(', ')}, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(...values).run();
  },

  /** 创建新记录 */
  async create(db: D1Database, walletAddress: string) {
    await db.prepare(`
      INSERT INTO arena_records (wallet_address, score, rank, win_count, lose_count)
      VALUES (?, 1000, 0, 0, 0)
    `).bind(walletAddress).run();
  },
};

export default arenaRepo;
