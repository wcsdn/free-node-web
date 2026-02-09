/**
 * Appendant NPC Service - 附属 NPC 业务逻辑层
 */

import { D1Database } from '@cloudflare/workers-types';
import { AppendantNPCRepository, AppendantNPC } from './appendant-npc.repo';

export interface OccupyResult {
  success: boolean;
  npc?: {
    id: number;
    npcPos: number;
    npcName: string;
    beginTime: string;
    endTime: string;
    needGold: number;
    needInsignia: number;
  };
  cost?: {
    gold: number;
    insignia: number;
  };
  error?: string;
  errorCode?: string;
}

export interface NPCListResult {
  npcs: Array<{
    npcPos: number;
    npcName: string;
    occupied: boolean;
    occupier?: string;
    endTime?: string;
    needGold: number;
    needInsignia: number;
  }>;
  myNPC?: AppendantNPC;
}

export class AppendantNPCService {
  private repo: AppendantNPCRepository;

  constructor(db: D1Database) {
    this.repo = new AppendantNPCRepository(db);
  }

  /**
   * 获取 NPC 列表
   */
  async getNPCList(walletAddress: string): Promise<NPCListResult> {
    const allNPCs = this.repo.getAllNPCConfig();
    const myNPC = await this.repo.getByWallet(walletAddress);
    const occupiedNPCs = await this.repo.getAllOccupied();

    const npcs = Object.entries(allNPCs).map(([pos, config]) => {
      const posNum = parseInt(pos);
      const occupiedInfo = occupiedNPCs.find(n => n.npc_pos === posNum);

      return {
        npcPos: posNum,
        npcName: config.name,
        occupied: !!occupiedInfo,
        occupier: occupiedInfo?.wallet_address,
        endTime: occupiedInfo?.end_time,
        needGold: config.gold,
        needInsignia: config.insignia,
      };
    });

    return {
      npcs,
      myNPC,
    };
  }

  /**
   * 占领 NPC
   */
  async occupy(
    walletAddress: string,
    npcPos: number,
    cost: { gold: number; insignia: number }
  ): Promise<OccupyResult> {
    // 1. 检查是否已占领
    const existing = await this.repo.getByWallet(walletAddress);
    if (existing) {
      return {
        success: false,
        error: '已经占领了一个NPC据点，请先放弃当前占领',
        errorCode: 'ALREADY_OCCUPIED',
      };
    }

    // 2. 获取 NPC 配置
    const config = this.repo.getNPCConfig(npcPos);
    if (!config) {
      return {
        success: false,
        error: '无效的NPC位置',
        errorCode: 'INVALID_NPC_POS',
      };
    }

    // 3. 验证消耗
    if (cost.gold < config.gold || cost.insignia < config.insignia) {
      return {
        success: false,
        error: `需要 ${config.gold} 元宝和 ${config.insignia} 战勋`,
        errorCode: 'INSUFFICIENT_COST',
      };
    }

    // 4. 检查位置是否被他人占领
    const status = await this.repo.isOccupied(npcPos);
    if (status.occupied) {
      return {
        success: false,
        error: `该位置已被 [${status.occupier?.slice(0, 8)}...] 占领`,
        errorCode: 'ALREADY_OCCUPIED_BY_OTHER',
      };
    }

    // 5. 执行占领
    const result = await this.repo.occupy(walletAddress, npcPos, 24);

    if (!result.success) {
      return {
        success: false,
        error: result.error || '占领失败',
        errorCode: 'OCCUPY_FAILED',
      };
    }

    return {
      success: true,
      npc: {
        id: 0,
        npcPos,
        npcName: config.name,
        beginTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        needGold: config.gold,
        needInsignia: config.insignia,
      },
      cost: {
        gold: config.gold,
        insignia: config.insignia,
      },
    };
  }

  /**
   * 放弃占领
   */
  async abandon(walletAddress: string, npcPos?: number): Promise<{ success: boolean; error?: string }> {
    // 如果未指定位置，获取当前占领
    if (!npcPos) {
      const myNPC = await this.repo.getByWallet(walletAddress);
      if (!myNPC) {
        return { success: false, error: '当前没有占领任何NPC据点' };
      }
      npcPos = myNPC.npc_pos;
    }

    const result = await this.repo.abandon(walletAddress, npcPos);

    if (!result.success) {
      return { success: false, error: result.error || '放弃失败' };
    }

    return { success: true };
  }

  /**
   * 获取我的占领信息
   */
  async getMyNPC(walletAddress: string): Promise<{
    npc: AppendantNPC | null;
    config: { name: string; gold: number; insignia: number } | null;
  }> {
    const npc = await this.repo.getByWallet(walletAddress);
    if (!npc) {
      return { npc: null, config: null };
    }

    const config = this.repo.getNPCConfig(npc.npc_pos);
    return { npc, config };
  }

  /**
   * 检查占领是否过期
   */
  async checkExpiration(walletAddress: string): Promise<boolean> {
    const npc = await this.repo.getByWallet(walletAddress);
    if (!npc) return false;

    const endTime = new Date(npc.end_time);
    if (endTime < new Date()) {
      // 自动清理过期占领
      await this.repo.abandon(walletAddress, npc.npc_pos);
      return true;
    }

    return false;
  }

  /**
   * 获取占领收益信息
   */
  getOccupationBenefits(npcPos: number): {
    name: string;
    duration: number;
    rewards: {
      type: string;
      amount: number;
      interval: string;
    }[];
  } | null {
    const config = this.repo.getNPCConfig(npcPos);
    if (!config) return null;

    return {
      name: config.name,
      duration: 24, // 小时
      rewards: [
        {
          type: 'exp',
          amount: config.insignia * 10,
          interval: '每小时',
        },
        {
          type: 'gold',
          amount: Math.floor(config.gold * 0.1),
          interval: '每小时',
        },
      ],
    };
  }
}
