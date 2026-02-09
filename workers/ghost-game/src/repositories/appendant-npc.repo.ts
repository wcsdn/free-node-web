/**
 * Appendant NPC Repository - 附属 NPC 数据访问层
 */

import { D1Database } from '@cloudflare/workers-types';

export interface AppendantNPC {
  id: number;
  wallet_address: string;
  npc_pos: number;
  state: number;
  begin_time: string;
  end_time: string;
  created_at?: string;
}

export interface AppendantNPCInfo {
  npc_pos: number;
  npc_name: string;
  need_gold: number;
  need_insignia: number;
  occupied: boolean;
  occupier?: string;
  end_time?: string;
  begin_time?: string;
}

const NPC_CONFIG: Record<number, { name: string; gold: number; insignia: number }> = {
  1: { name: '黑风寨', gold: 20, insignia: 200 },
  2: { name: '猛虎岗', gold: 30, insignia: 300 },
  3: { name: '飞龙岭', gold: 50, insignia: 500 },
  4: { name: '卧虎山', gold: 80, insignia: 800 },
  5: { name: '藏龙渊', gold: 100, insignia: 1000 },
  6: { name: '破天关', gold: 150, insignia: 1500 },
  7: { name: '镇远城', gold: 200, insignia: 2000 },
  8: { name: '雄霸天', gold: 300, insignia: 3000 },
};

export class AppendantNPCRepository {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * 获取用户占领的 NPC
   */
  async getByWallet(walletAddress: string): Promise<AppendantNPC | null> {
    const result = await this.db.prepare(`
      SELECT * FROM appendant_npc 
      WHERE wallet_address = ? 
      AND end_time > datetime('now')
      LIMIT 1
    `).bind(walletAddress).first();

    return result as AppendantNPC | null;
  }

  /**
   * 获取指定位置的 NPC 占领信息
   */
  async getByPosition(walletAddress: string, npcPos: number): Promise<AppendantNPC | null> {
    const result = await this.db.prepare(`
      SELECT * FROM appendant_npc 
      WHERE wallet_address = ? AND npc_pos = ?
      LIMIT 1
    `).bind(walletAddress, npcPos).first();

    return result as AppendantNPC | null;
  }

  /**
   * 获取所有被占领的 NPC
   */
  async getAllOccupied(): Promise<AppendantNPC[]> {
    const result = await this.db.prepare(`
      SELECT * FROM appendant_npc 
      WHERE end_time > datetime('now')
      ORDER BY end_time ASC
    `).all();

    return result.results as AppendantNPC[];
  }

  /**
   * 检查位置是否已被占领
   */
  async isOccupied(npcPos: number): Promise<{ occupied: boolean; occupier?: string; endTime?: string }> {
    const result = await this.db.prepare(`
      SELECT wallet_address, end_time FROM appendant_npc 
      WHERE npc_pos = ? AND end_time > datetime('now')
      ORDER BY end_time DESC
      LIMIT 1
    `).bind(npcPos).first();

    if (result) {
      return { occupied: true, occupier: result.wallet_address as string, endTime: result.end_time as string };
    }
    return { occupied: false };
  }

  /**
   * 占领 NPC
   */
  async occupy(
    walletAddress: string,
    npcPos: number,
    hours: number = 24
  ): Promise<{ success: boolean; error?: string }> {
    // 检查是否已占领
    const existing = await this.getByWallet(walletAddress);
    if (existing) {
      return { success: false, error: '已经占领了一个NPC据点' };
    }

    // 检查位置是否被他人占领
    const status = await this.isOccupied(npcPos);
    if (status.occupied) {
      return { success: false, error: '该位置已被其他玩家占领' };
    }

    // 获取 NPC 配置
    const npcConfig = NPC_CONFIG[npcPos];
    if (!npcConfig) {
      return { success: false, error: '无效的NPC位置' };
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    try {
      await this.db.prepare(`
        INSERT INTO appendant_npc (wallet_address, npc_pos, state, begin_time, end_time)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        walletAddress,
        npcPos,
        0,
        now.toISOString(),
        endTime.toISOString()
      ).run();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 放弃占领
   */
  async abandon(walletAddress: string, npcPos: number): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.db.prepare(`
        DELETE FROM appendant_npc 
        WHERE wallet_address = ? AND npc_pos = ?
      `).bind(walletAddress, npcPos).run();

      if (result.success) {
        return { success: true };
      }
      return { success: false, error: '放弃失败' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 清理过期占领 (定时任务调用)
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.db.prepare(`
      DELETE FROM appendant_npc WHERE end_time <= datetime('now')
    `).run();

    return result.meta?.changes || 0;
  }

  /**
   * 获取 NPC 配置
   */
  getNPCConfig(npcPos: number): { name: string; gold: number; insignia: number } | null {
    return NPC_CONFIG[npcPos] || null;
  }

  /**
   * 获取所有 NPC 配置
   */
  getAllNPCConfig(): Record<number, { name: string; gold: number; insignia: number }> {
    return NPC_CONFIG;
  }
}
