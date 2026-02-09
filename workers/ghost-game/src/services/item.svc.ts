/**
 * Item Service - 物品业务逻辑层
 * 从 jx/BLL/Item.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Item, ServiceResult } from '../types/models';
import { itemRepo } from '../repositories';

export const itemService = {
  /** 获取物品列表 */
  async getList(db: D1Database, walletAddress: string): Promise<ServiceResult<Item[]>> {
    try {
      const items = await itemRepo.findByWallet(db, walletAddress);
      return { ok: true, data: items };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取物品详情 */
  async getDetail(db: D1Database, itemId: number): Promise<ServiceResult<Item>> {
    try {
      const item = await itemRepo.findById(db, itemId);
      if (!item) return { ok: false, error: 'Item not found', status: 404 };
      return { ok: true, data: item };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取武将装备 */
  async getByHero(db: D1Database, heroId: number): Promise<ServiceResult<Item[]>> {
    try {
      const items = await itemRepo.findByHeroId(db, heroId);
      return { ok: true, data: items };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 添加物品 */
  async add(
    db: D1Database,
    walletAddress: string,
    configId: number,
    count = 1
  ): Promise<ServiceResult<Item>> {
    try {
      const item = await itemRepo.create(db, {
        wallet_address: walletAddress,
        type: 'equipment',
        config_id: configId,
        count,
        source: 'game',
      } as Item);

      return { ok: true, data: item! };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 穿戴装备 */
  async equip(db: D1Database, itemId: number, heroId: number): Promise<ServiceResult<void>> {
    try {
      const success = await itemRepo.equip(db, itemId, heroId);
      if (!success) return { ok: false, error: 'Equip failed', status: 400 };
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 卸下装备 */
  async unequip(db: D1Database, itemId: number): Promise<ServiceResult<void>> {
    try {
      const success = await itemRepo.unequip(db, itemId);
      if (!success) return { ok: false, error: 'Unequip failed', status: 400 };
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 删除物品 */
  async delete(db: D1Database, itemId: number): Promise<ServiceResult<void>> {
    try {
      const success = await itemRepo.delete(db, itemId);
      if (!success) return { ok: false, error: 'Delete failed', status: 400 };
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },
};
