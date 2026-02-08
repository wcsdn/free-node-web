/**
 * Character Service - 角色业务逻辑层
 * 原则：处理业务规则，调用 Repository 执行数据操作
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { ServiceResult } from '../models';
import { characterRepo } from '../repositories';

// ============ Service Operations ============
export const characterService = {
  /**
   * 获取或创建角色 (自动注册)
   */
  async getOrCreate(db: D1Database, walletAddress: string): ServiceResult<{
    character: ReturnType<typeof characterRepo.findByWallet>;
    isNew: boolean;
  }> {
    try {
      let character = await characterRepo.findByWallet(db, walletAddress);
      const isNew = !character;

      if (isNew) {
        // 自动创建角色
        character = await characterRepo.create(db, {
          wallet_address: walletAddress,
          name: `玩家_${walletAddress.substring(2, 8)}`,
        });
      }

      return { ok: true, data: { character, isNew } };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 获取角色信息
   */
  async getInfo(db: D1Database, walletAddress: string): ServiceResult<ReturnType<typeof characterRepo.findByWallet>> {
    try {
      const character = await characterRepo.findByWallet(db, walletAddress);
      if (!character) {
        return { ok: false, error: 'Character not found', status: 404 };
      }
      return { ok: true, data: character };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 增加经验并检查升级
   */
  async addExp(db: D1Database, walletAddress: string, exp: number): ServiceResult<{
    levelUp: boolean;
    newLevel: number;
    currentExp: number;
  }> {
    try {
      const character = await characterRepo.findByWallet(db, walletAddress);
      if (!character) {
        return { ok: false, error: 'Character not found', status: 404 };
      }

      const { levelUp, newLevel } = await characterRepo.addExp(db, walletAddress, exp);
      const updatedCharacter = await characterRepo.findByWallet(db, walletAddress);

      return {
        ok: true,
        data: {
          levelUp,
          newLevel,
          currentExp: updatedCharacter?.exp ?? 0,
        },
      };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 验证并扣除金币
   */
  async verifyAndDeductGold(
    db: D1Database,
    walletAddress: string,
    amount: number
  ): ServiceResult<never> {
    try {
      const character = await characterRepo.findByWallet(db, walletAddress);
      if (!character) {
        return { ok: false, error: 'Character not found', status: 404 };
      }

      if (character.gold < amount) {
        return { ok: false, error: 'Not enough gold', status: 400 };
      }

      const success = await characterRepo.deductGold(db, walletAddress, amount);
      if (!success) {
        return { ok: false, error: 'Failed to deduct gold', status: 500 };
      }

      return { ok: true };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 添加金币
   */
  async addGold(db: D1Database, walletAddress: string, amount: number): ServiceResult<never> {
    try {
      const success = await characterRepo.addGold(db, walletAddress, amount);
      if (!success) {
        return { ok: false, error: 'Failed to add gold', status: 500 };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 验证角色是否存在
   */
  async exists(db: D1Database, walletAddress: string): Promise<boolean> {
    const character = await characterRepo.findByWallet(db, walletAddress);
    return !!character;
  },
};
