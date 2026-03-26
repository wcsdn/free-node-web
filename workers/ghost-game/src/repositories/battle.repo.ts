/**
 * Battle Repository - 战斗数据访问层
 * 
 * battles表实际结构 (参考 routes/battle.ts 中的 INSERT 语句):
 * - id: INTEGER PRIMARY KEY
 * - attacker_address: TEXT (攻击方钱包地址)
 * - defender_address: TEXT (防御方钱包地址，可为NULL表示PVE)
 * - battle_type: TEXT (战斗类型: 'pve', 'pvp', 'guild', 'arena')
 * - result: TEXT (结果: 'win', 'lose', 'draw', NULL表示进行中)
 * - report: TEXT (战报编码，可为NULL)
 * - created_at: TEXT (ISO8601时间戳)
 */
import type { D1Database } from '@cloudflare/workers-types';
import { BaseRepository, type BaseEntity } from './base.repo';

export interface Battle extends BaseEntity {
  id: number;
  attacker_address: string;
  defender_address: string | null;
  battle_type: string;
  result: string | null;
  report: string | null;
  created_at: string;
}

export class BattleRepository extends BaseRepository<Battle> {
  constructor(db: D1Database) {
    super(db, 'battles');
  }

  // ==================== 查询操作 ====================

  /** 根据钱包地址查询战斗记录 */
  async findByWallet(walletAddress: string, limit: number = 20): Promise<Battle[]> {
    const result = await this.db.prepare(
      `SELECT * FROM battles WHERE attacker_address = ? OR defender_address = ? ORDER BY created_at DESC LIMIT ?`
    ).bind(walletAddress, walletAddress, limit).all<Battle>();
    return (result.results as Battle[]) || [];
  }

  /** 根据类型查询 */
  async findByType(walletAddress: string, battleType: string): Promise<Battle[]> {
    const result = await this.db.prepare(`
      SELECT * FROM battles WHERE (attacker_address = ? OR defender_address = ?) AND battle_type = ?
    `).bind(walletAddress, walletAddress, battleType).all<Battle>();
    return (result.results as Battle[]) || [];
  }

  /** 查询战斗结果统计 */
  async getBattleStats(walletAddress: string): Promise<{
    total: number;
    wins: number;
    losses: number;
    draws: number;
  }> {
    const statsResult = await this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN result = 'win' AND attacker_address = ? THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'lose' AND attacker_address = ? THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws
      FROM battles 
      WHERE attacker_address = ? OR defender_address = ?
    `).bind(walletAddress, walletAddress, walletAddress, walletAddress).first();

    return {
      total: (statsResult as any)?.total || 0,
      wins: (statsResult as any)?.wins || 0,
      losses: (statsResult as any)?.losses || 0,
      draws: (statsResult as any)?.draws || 0,
    };
  }

  // ==================== 写入操作 ====================

  /** 创建战斗记录 */
  async create(data: {
    attackerAddress: string;
    defenderAddress?: string;
    battleType: string;
    result?: string;
    report?: string;
  }): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO battles (
        attacker_address, defender_address, battle_type, result, report, created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      data.attackerAddress,
      data.defenderAddress || null,
      data.battleType,
      data.result || null,
      data.report || null
    ).run();

    return result.meta.last_row_id;
  }

  /** 更新战斗结果 */
  async updateResult(battleId: number, result: {
    result: string;
    report?: string;
  }): Promise<void> {
    await this.db.prepare(`
      UPDATE battles SET 
        result = ?,
        report = ?
      WHERE id = ?
    `).bind(
      result.result,
      result.report || null,
      battleId
    ).run();
  }

  // ==================== 统计查询 ====================

  /** 获取今日战斗次数 */
  async getTodayBattleCount(walletAddress: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM battles 
      WHERE (attacker_address = ? OR defender_address = ?) AND DATE(created_at) = DATE(?)
    `).bind(walletAddress, walletAddress, today).first();
    return (result as any)?.count || 0;
  }

  /** 获取今日胜利次数 */
  async getTodayWinCount(walletAddress: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM battles 
      WHERE attacker_address = ? AND result = 'win' AND DATE(created_at) = DATE(?)
    `).bind(walletAddress, today).first();
    return (result as any)?.count || 0;
  }

  /** 获取进行中的战斗 */
  async getActiveBattle(walletAddress: string): Promise<Battle | null> {
    return await this.db.prepare(`
      SELECT * FROM battles 
      WHERE (attacker_address = ? OR defender_address = ?) AND result IS NULL
      ORDER BY created_at DESC LIMIT 1
    `).bind(walletAddress, walletAddress).first<Battle>() || null;
  }

  /** 获取连续胜利次数 */
  async getWinStreak(walletAddress: string): Promise<number> {
    const battles = await this.findByWallet(walletAddress, 10);
    let streak = 0;
    
    for (const battle of battles) {
      if (battle.result === 'win') {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }
}
