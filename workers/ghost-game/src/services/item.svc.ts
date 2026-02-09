/**
 * Item Service - 物品业务逻辑层
 * 原则：处理业务规则，调用 Repository 层
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { ServiceResult } from '../models';
import { itemRepo } from '../repositories/item.repo';
import type { Item } from '../repositories/item.repo';

export interface ItemDetail extends Item {
  config?: {
    Name: string;
    Type: number;
    Des?: string;
    Icon?: string;
    EffectType?: number;
    EffectValue?: number;
  };
}

export const itemService = {
  /**
   * 获取用户物品列表
   */
  async getItems(db: D1Database, walletAddress: string): Promise<ServiceResult<ItemDetail[]>> {
    try {
      const items = await itemRepo.findByWallet(db, walletAddress);
      return { ok: true, data: items as ItemDetail[] };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 获取武将已装备物品
   */
  async getEquippedItems(db: D1Database, heroId: number): Promise<ServiceResult<Item[]>> {
    try {
      const items = await itemRepo.findEquippedByHero(db, heroId);
      return { ok: true, data: items };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 使用物品（消耗品）
   */
  async useItem(
    db: D1Database,
    itemId: number,
    walletAddress: string,
    count = 1
  ): Promise<ServiceResult<{ effect: string; remainingCount: number }>> {
    try {
      const item = await itemRepo.findById(db, itemId);
      if (!item) {
        return { ok: false, error: '物品不存在', status: 404 };
      }

      if (item.wallet_address !== walletAddress) {
        return { ok: false, error: '无权使用此物品', status: 403 };
      }

      if (item.count < count) {
        return { ok: false, error: '物品数量不足', status: 400 };
      }

      // 检查是否是消耗品
      if (item.type !== 1) { // Assuming type 1 is consumable
        return { ok: false, error: '此物品不可使用', status: 400 };
      }

      // 使用物品
      await itemRepo.use(db, itemId, count);

      const remainingCount = item.count - count;
      return {
        ok: true,
        data: {
          effect: '使用了物品',
          remainingCount,
        },
      };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 装备物品
   */
  async equipItem(
    db: D1Database,
    itemId: number,
    heroId: number,
    walletAddress: string
  ): Promise<ServiceResult<null>> {
    try {
      const item = await itemRepo.findById(db, itemId);
      if (!item) {
        return { ok: false, error: '物品不存在', status: 404 };
      }

      if (item.wallet_address !== walletAddress) {
        return { ok: false, error: '无权操作此物品', status: 403 };
      }

      if (item.equipped) {
        return { ok: false, error: '物品已装备', status: 400 };
      }

      if (item.type !== 2) { // Assuming type 2 is equipment
        return { ok: false, error: '此物品不可装备', status: 400 };
      }

      // 先卸下该武将已装备的同类型物品（简化处理：一件装备）
      const equippedItems = await itemRepo.findEquippedByHero(db, heroId);
      for (const equipped of equippedItems) {
        await itemRepo.setEquipped(db, equipped.id, null, false);
      }

      // 装备新物品
      await itemRepo.setEquipped(db, itemId, heroId, true);
      return { ok: true, data: null };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 卸下物品
   */
  async unequipItem(
    db: D1Database,
    itemId: number,
    walletAddress: string
  ): Promise<ServiceResult<null>> {
    try {
      const item = await itemRepo.findById(db, itemId);
      if (!item) {
        return { ok: false, error: '物品不存在', status: 404 };
      }

      if (item.wallet_address !== walletAddress) {
        return { ok: false, error: '无权操作此物品', status: 403 };
      }

      if (!item.equipped) {
        return { ok: false, error: '物品未装备', status: 400 };
      }

      await itemRepo.setEquipped(db, itemId, null, false);
      return { ok: true, data: null };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 添加物品
   */
  async addItem(
    db: D1Database,
    walletAddress: string,
    type: number,
    configId: number,
    count: number,
    source: string
  ): Promise<ServiceResult<{ itemId: number }>> {
    try {
      // 查找是否已有相同类型和配置的物品
      const existingItems = await itemRepo.findByWallet(db, walletAddress);
      const sameItem = existingItems.find(
        i => i.type === type && i.config_id === configId && !i.equipped
      );

      if (sameItem && type === 2) { // 装备类不叠加
        const newId = await itemRepo.create(db, {
          wallet_address: walletAddress,
          type,
          config_id: configId,
          count: 1,
          source,
        });
        return { ok: true, data: { itemId: newId } };
      }

      if (sameItem) {
        await itemRepo.updateCount(db, sameItem.id, sameItem.count + count);
        return { ok: true, data: { itemId: sameItem.id } };
      }

      const itemId = await itemRepo.create(db, {
        wallet_address: walletAddress,
        type,
        config_id: configId,
        count,
        source,
      });

      return { ok: true, data: { itemId } };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 删除物品
   */
  async deleteItem(
    db: D1Database,
    itemId: number,
    walletAddress: string
  ): Promise<ServiceResult<null>> {
    try {
      const item = await itemRepo.findById(db, itemId);
      if (!item) {
        return { ok: false, error: '物品不存在', status: 404 };
      }

      if (item.wallet_address !== walletAddress) {
        return { ok: false, error: '无权删除此物品', status: 403 };
      }

      if (item.equipped) {
        return { ok: false, error: '请先卸下物品', status: 400 };
      }

      await itemRepo.delete(db, itemId);
      return { ok: true, data: null };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },
};
