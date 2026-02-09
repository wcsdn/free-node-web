/**
 * Battle Repository - 战斗数据访问层
 */
import type { D1Database } from '@cloudflare/workers-types';

export const battleRepo = {
  /** 获取战斗记录 */
  async findById(db: D1Database, battleId: number) {
    const result = await db.prepare(`
      SELECT * FROM battles WHERE id = ?
    `).bind(battleId).first();
    return result;
  },

  /** 获取玩家战斗记录 */
  async findByWallet(db: D1Database, walletAddress: string, limit = 50) {
    const result = await db.prepare(`
      SELECT * FROM battles 
      WHERE attacker_address = ? OR defender_address = ?
      ORDER BY created_at DESC LIMIT ?
    `).bind(walletAddress, walletAddress, limit).all();
    return result.results || [];
  },

  /** 获取玩家战斗统计 */
  async getStats(db: D1Database, walletAddress: string) {
    const result = await db.prepare(`
      SELECT 
        COUNT(*) as total_battles,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN battle_type = 'pvp' THEN 1 ELSE 0 END) as pvp_battles,
        SUM(CASE WHEN battle_type = 'pve' THEN 1 ELSE 0 END) as pve_battles
      FROM battles 
      WHERE attacker_address = ?
    `).bind(walletAddress).first();
    return result;
  },

  /** 创建战斗记录 */
  async create(db: D1Database, data: {
    attackerAddress: string;
    defenderAddress?: string;
    battleType: string;
    result: string;
    report: any;
    dungeonId?: number;
    stageId?: number;
  }) {
    const result = await db.prepare(`
      INSERT INTO battles (attacker_address, defender_address, battle_type, result, report, dungeon_id, stage_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.attackerAddress,
      data.defenderAddress || null,
      data.battleType,
      data.result,
      JSON.stringify(data.report),
      data.dungeonId || null,
      data.stageId || null
    ).run();

    return { id: result.meta?.last_row_id };
  },

  /** 获取PVE战斗记录 */
  async getPveHistory(db: D1Database, walletAddress: string, limit = 20) {
    const result = await db.prepare(`
      SELECT * FROM battles 
      WHERE attacker_address = ? AND battle_type = 'pve'
      ORDER BY created_at DESC LIMIT ?
    `).bind(walletAddress, limit).all();
    return result.results || [];
  },
};

export default battleRepo;
