/**
 * Dungeon Service - 副本/地下城业务逻辑层
 * 从 jx/BLL/Dungeon.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Dungeon, DungeonProgress, ServiceResult } from '../types/models';

export const dungeonService = {
  /** 获取所有副本列表 */
  async getList(db: D1Database): Promise<ServiceResult<Dungeon[]>> {
    try {
      const result = await db.prepare(`
        SELECT * FROM dungeons ORDER BY difficulty, id
      `).all();
      
      return { ok: true, data: (result.results || []) as unknown as Dungeon[] };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取用户副本进度 */
  async getProgress(db: D1Database, walletAddress: string): Promise<ServiceResult<DungeonProgress[]>> {
    try {
      const result = await db.prepare(`
        SELECT * FROM dungeon_progresses WHERE wallet_address = ? ORDER BY dungeon_id
      `).bind(walletAddress).all();
      
      return { ok: true, data: (result.results || []) as unknown as DungeonProgress[] };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 更新副本进度 */
  async updateProgress(
    db: D1Database,
    walletAddress: string,
    dungeonId: number,
    floor: number,
    isWin: boolean
  ): Promise<ServiceResult<DungeonProgress>> {
    try {
      const now = new Date().toISOString();
      
      const existing = await db.prepare(`
        SELECT * FROM dungeon_progresses WHERE wallet_address = ? AND dungeon_id = ?
      `).bind(walletAddress, dungeonId).first();
      
      if (existing) {
        const p = existing as any;
        const newBestFloor = isWin ? Math.max(p.best_floor, floor) : p.best_floor;
        const newWinCount = isWin ? (p.win_count + 1) : p.win_count;
        
        await db.prepare(`
          UPDATE dungeon_progresses 
          SET best_floor = ?, win_count = ?, last_time = ?, updated_at = ?
          WHERE wallet_address = ? AND dungeon_id = ?
        `).bind(newBestFloor, newWinCount, now, now, walletAddress, dungeonId).run();
      } else {
        await db.prepare(`
          INSERT INTO dungeon_progresses (wallet_address, dungeon_id, best_floor, win_count, last_time, created_at)
          VALUES (?, ?, ?, 1, ?, ?)
        `).bind(walletAddress, dungeonId, floor, now, now).run();
      }
      
      const progress = await db.prepare(`
        SELECT * FROM dungeon_progresses WHERE wallet_address = ? AND dungeon_id = ?
      `).bind(walletAddress, dungeonId).first();
      
      return { ok: true, data: progress as unknown as DungeonProgress };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 检查副本是否开放 */
  async isDungeonOpen(db: D1Database, dungeonId: number): Promise<boolean> {
    const dungeon = await db.prepare(`
      SELECT * FROM dungeons WHERE id = ?
    `).bind(dungeonId).first();
    
    if (!dungeon) return false;
    
    // 检查等级要求等
    return true;
  },
};
