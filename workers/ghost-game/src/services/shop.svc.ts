/**
 * Shop Service - 商店业务逻辑层
 * 原则：处理业务规则，调用 Repository 层
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { ServiceResult } from '../models';
import { shopRepo } from '../repositories/shop.repo';
import type { ShopItem } from '../repositories/shop.repo';
import { characterRepo } from '../repositories/character.repo';
import { itemRepo } from '../repositories/item.repo';

export interface ShopItemDetail extends ShopItem {
  itemConfig?: {
    Name: string;
    Type: number;
    Des?: string;
    Icon?: string;
  };
  canBuy?: boolean;
  dailyPurchased?: number;
}

export const shopService = {
  /**
   * 获取商店列表
   */
  async getShopItems(
    db: D1Database,
    shopType: number,
    walletAddress: string
  ): Promise<ServiceResult<ShopItemDetail[]>> {
    try {
      const items = await shopRepo.findByType(db, shopType);

      // 获取每日购买数量
      const detailedItems = await Promise.all(
        items.map(async (item) => {
          const dailyPurchased = await shopRepo.getUserDailyPurchases(
            db,
            walletAddress,
            item.id
          );
          return {
            ...item,
            dailyPurchased,
            canBuy: dailyPurchased < item.daily_limit,
          } as ShopItemDetail;
        })
      );

      return { ok: true, data: detailedItems };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 购买物品
   */
  async buyItem(
    db: D1Database,
    itemId: number,
    walletAddress: string,
    count = 1
  ): Promise<ServiceResult<{
    itemId: number;
    itemName: string;
    count: number;
    totalPrice: number;
    remainingGold: number;
  }>> {
    try {
      // 获取商品信息
      const item = await shopRepo.findById(db, itemId);
      if (!item) {
        return { ok: false, error: '商品不存在', status: 404 };
      }

      // 检查库存
      if (item.stock !== null && item.stock < count) {
        return { ok: false, error: '库存不足', status: 400 };
      }

      // 检查每日限购
      const dailyPurchased = await shopRepo.getUserDailyPurchases(db, walletAddress, itemId);
      if (dailyPurchased + count > item.daily_limit) {
        return { ok: false, error: `今日限购 ${item.daily_limit} 个`, status: 400 };
      }

      // 计算总价
      const totalPrice = item.price * count;

      // 检查金币是否足够
      const character = await characterRepo.findByWallet(db, walletAddress);
      if (!character) {
        return { ok: false, error: '角色不存在', status: 404 };
      }

      if (character.gold < totalPrice) {
        return { ok: false, error: '金币不足', status: 400 };
      }

      // 扣除金币
      const deducted = await characterRepo.deductGold(db, walletAddress, totalPrice);
      if (!deducted) {
        return { ok: false, error: '金币扣除失败', status: 500 };
      }

      // 创建交易记录
      await shopRepo.createTransaction(db, {
        wallet_address: walletAddress,
        shop_item_id: itemId,
        count,
        total_price: totalPrice,
      });

      // 更新库存
      await shopRepo.decrementStock(db, itemId, count);

      return {
        ok: true,
        data: {
          itemId,
          itemName: `商品 #${item.config_id}`,
          count,
          totalPrice,
          remainingGold: character.gold - totalPrice,
        },
      };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 刷新商店
   */
  async refreshShop(db: D1Database, shopType: number): Promise<ServiceResult<{ refreshed: boolean }>> {
    try {
      const refreshed = await shopRepo.refreshShop(db, shopType);
      return { ok: true, data: { refreshed } };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 获取购买历史
   */
  async getPurchaseHistory(
    db: D1Database,
    walletAddress: string,
    limit = 50
  ): Promise<ServiceResult<any[]>> {
    try {
      const transactions = await shopRepo.getUserTransactions(db, walletAddress, limit);
      return { ok: true, data: transactions };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 出售物品给商店
   */
  async sellItem(
    db: D1Database,
    itemId: number,
    walletAddress: string,
    count = 1,
    sellPrice: number
  ): Promise<ServiceResult<{ goldReceived: number; remainingCount: number }>> {
    try {
      const item = await itemRepo.findById(db, itemId);
      if (!item) {
        return { ok: false, error: '物品不存在', status: 404 };
      }

      if (item.wallet_address !== walletAddress) {
        return { ok: false, error: '无权操作此物品', status: 403 };
      }

      if (item.count < count) {
        return { ok: false, error: '物品数量不足', status: 400 };
      }

      const totalGold = sellPrice * count;

      // 增加金币
      await characterRepo.addGold(db, walletAddress, totalGold);

      // 减少物品数量
      if (item.count <= count) {
        await itemRepo.delete(db, itemId);
        return { ok: true, data: { goldReceived: totalGold, remainingCount: 0 } };
      } else {
        await itemRepo.updateCount(db, itemId, item.count - count);
        return { ok: true, data: { goldReceived: totalGold, remainingCount: item.count - count } };
      }
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },
};
