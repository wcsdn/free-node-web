/**
 * Chess Repository - 棋类/战棋数据访问层
 * 从 jx/DALEX/ChessExAccess.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { ChessBoard } from '../types/models';

export const chessRepo = {
  /** 保存棋盘状态 */
  async saveBoard(db: D1Database, data: ChessBoard): Promise<boolean> {
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT OR REPLACE INTO chess_boards (id, wallet_address, board_data, current_turn, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.id,
      data.wallet_address,
      JSON.stringify(data.board_data),
      data.current_turn,
      data.status,
      data.created_at ?? now,
      now
    ).run();
    
    return true;
  },

  /** 获取棋盘 */
  async getBoard(db: D1Database, boardId: number): Promise<ChessBoard | null> {
    const result = await db.prepare(`
      SELECT * FROM chess_boards WHERE id = ?
    `).bind(boardId).first();
    
    if (!result) return null;
    
    return {
      ...result,
      board_data: JSON.parse((result.board_data as string) || '[]'),
    } as unknown as ChessBoard;
  },

  /** 获取用户棋盘列表 */
  async getUserBoards(db: D1Database, walletAddress: string): Promise<ChessBoard[]> {
    const result = await db.prepare(`
      SELECT * FROM chess_boards WHERE wallet_address = ? ORDER BY updated_at DESC
    `).bind(walletAddress).all();
    
    return (result.results || []).map(r => ({
      ...r,
      board_data: JSON.parse((r.board_data as string) || '[]'),
    })) as unknown as ChessBoard[];
  },
};
