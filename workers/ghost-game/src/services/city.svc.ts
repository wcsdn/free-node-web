/**
 * City Service - 城市业务逻辑层
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { City, Building, ServiceResult } from '../models';
import { cityRepo } from '../repositories';

const MAX_CITIES_PER_ACCOUNT = 3;
const DEFAULT_CITY_NAME = '主城';

export const cityService = {
  /** 获取城市列表 */
  async getList(db: D1Database, walletAddress: string): Promise<ServiceResult<City[]>> {
    try {
      const cities = await cityRepo.findByWallet(db, walletAddress);
      return { ok: true, data: cities };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取城市详情 */
  async getDetail(
    db: D1Database,
    walletAddress: string,
    cityId?: number
  ): Promise<ServiceResult<{ city: City; buildings: Building[]; cityId: number }>> {
    try {
      let targetCityId = cityId;

      if (!targetCityId) {
        const firstCity = await cityRepo.findFirst(db, walletAddress);
        if (!firstCity) {
          return { ok: false, error: 'No cities found', status: 404 };
        }
        targetCityId = firstCity.id;
      }

      const isOwner = await cityRepo.isOwner(db, targetCityId, walletAddress);
      if (!isOwner) {
        return { ok: false, error: 'City not found', status: 404 };
      }

      const city = await cityRepo.findById(db, targetCityId);
      if (!city) {
        return { ok: false, error: 'City not found', status: 404 };
      }

      const buildings = await cityRepo.findByCity(db, targetCityId);

      return { ok: true, data: { city, buildings, cityId: targetCityId } };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取或创建城市 */
  async getOrCreate(
    db: D1Database,
    walletAddress: string
  ): Promise<ServiceResult<{ city: City; buildings: Building[]; isNew: boolean }>> {
    try {
      let city = await cityRepo.findFirst(db, walletAddress);
      const isNew = !city;

      if (isNew) {
        const count = await cityRepo.countByWallet(db, walletAddress);
        if (count >= MAX_CITIES_PER_ACCOUNT) {
          return { ok: false, error: 'Max cities reached', status: 400 };
        }

        city = await cityRepo.create(db, {
          wallet_address: walletAddress,
          name: DEFAULT_CITY_NAME,
        });
      }

      const buildings = await cityRepo.findByCity(db, city!.id);

      return { ok: true, data: { city: city!, buildings, isNew } };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 创建新城市 */
  async create(
    db: D1Database,
    walletAddress: string,
    name: string
  ): Promise<ServiceResult<City>> {
    try {
      const count = await cityRepo.countByWallet(db, walletAddress);
      if (count >= MAX_CITIES_PER_ACCOUNT) {
        return { ok: false, error: 'Max 3 cities per account', status: 400 };
      }

      if (name.length < 1 || name.length > 10) {
        return { ok: false, error: 'City name must be 1-10 characters', status: 400 };
      }

      const city = await cityRepo.create(db, {
        wallet_address: walletAddress,
        name,
      });

      return { ok: true, data: city };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 收集资源 */
  async collect(
    db: D1Database,
    walletAddress: string,
    cityId: number
  ): Promise<ServiceResult<{
    collected: { money: number; food: number };
    total: { money: number; food: number };
  }>> {
    try {
      const isOwner = await cityRepo.isOwner(db, cityId, walletAddress);
      if (!isOwner) {
        return { ok: false, error: 'City not found', status: 404 };
      }

      const result = await cityRepo.collectResources(db, cityId);
      if (!result) {
        return { ok: false, error: 'Too soon to collect', status: 400 };
      }

      return {
        ok: true,
        data: {
          collected: { money: result.moneyCollected, food: result.foodCollected },
          total: { money: result.newMoney, food: result.newFood },
        },
      };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取城市数量 */
  async count(db: D1Database, walletAddress: string): Promise<ServiceResult<number>> {
    try {
      const count = await cityRepo.countByWallet(db, walletAddress);
      return { ok: true, data: count };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },
};
