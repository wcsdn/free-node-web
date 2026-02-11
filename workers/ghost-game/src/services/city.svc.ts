/**
 * City Service - 城市业务逻辑层
 * 从 jx/BLL/City.cs 迁移
 * 原则：处理业务规则，调用 Repository 执行数据操作
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { City, CityCreate, Building, ServiceResult } from '../types/models';
import { cityRepo, buildingRepo } from '../repositories';

// ============ Constants ============
const MAX_CITIES_PER_ACCOUNT = 3;
const DEFAULT_CITY_NAME = '主城';

// ============ Service Operations ============
export const cityService = {
  /**
   * 获取城市列表
   */
  async getList(db: D1Database, walletAddress: string): Promise<ServiceResult<City[]>> {
    try {
      const cities = await cityRepo.findByWallet(db, walletAddress);
      return { ok: true, data: cities };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 获取城市详情 (包含建筑)
   */
  async getDetail(
    db: D1Database,
    walletAddress: string,
    cityId?: number
  ): Promise<ServiceResult<{
    city: City;
    buildings: Building[];
    cityId: number;
  }>> {
    try {
      let targetCityId = cityId;

      // 如果没有指定城市 ID，查找第一个城市
      if (!targetCityId) {
        const firstCity = await cityRepo.findFirst(db, walletAddress);
        if (!firstCity) {
          return { ok: false, error: 'No cities found', status: 404 };
        }
        targetCityId = firstCity.id;
      }

      // 验证城市属于用户
      const isOwner = await cityRepo.isOwner(db, targetCityId, walletAddress);
      if (!isOwner) {
        return { ok: false, error: 'City not found', status: 404 };
      }

      const city = await cityRepo.findById(db, targetCityId);
      if (!city) {
        return { ok: false, error: 'City not found', status: 404 };
      }

      const buildings = await buildingRepo.findByCity(db, targetCityId);

      return { ok: true, data: { city, buildings, cityId: targetCityId } };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 获取或创建城市 (自动注册时调用)
   */
  async getOrCreate(
    db: D1Database,
    walletAddress: string
  ): Promise<ServiceResult<{
    city: City;
    buildings: Building[];
    isNew: boolean;
  }>> {
    try {
      let city = await cityRepo.findFirst(db, walletAddress);
      const isNew = !city;

      if (isNew) {
        // 检查城市数量限制
        const count = await cityRepo.countByWallet(db, walletAddress);
        if (count >= MAX_CITIES_PER_ACCOUNT) {
          return { ok: false, error: 'Max cities reached', status: 400 };
        }

        // 创建新城市
        city = await cityRepo.create(db, {
          wallet_address: walletAddress,
          name: DEFAULT_CITY_NAME,
        } as CityCreate);

        // 创建初始建筑(只有聚义厅)
        await createInitialBuildings(db, city.id, buildingRepo);
      }

      const buildings = await buildingRepo.findByCity(db, city!.id);

      return { ok: true, data: { city: city!, buildings, isNew } };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 创建新城市
   */
  async create(
    db: D1Database,
    walletAddress: string,
    name: string
  ): Promise<ServiceResult<City>> {
    try {
      // 检查城市数量限制
      const count = await cityRepo.countByWallet(db, walletAddress);
      if (count >= MAX_CITIES_PER_ACCOUNT) {
        return { ok: false, error: 'Max 3 cities per account', status: 400 };
      }

      // 验证名称长度
      if (name.length < 1 || name.length > 10) {
        return { ok: false, error: 'City name must be 1-10 characters', status: 400 };
      }

      // 检查名称是否重复
      const existing = await cityRepo.findByName(db, name);
      if (existing) {
        return { ok: false, error: 'City name already exists', status: 400 };
      }

      const city = await cityRepo.create(db, {
        wallet_address: walletAddress,
        name,
      } as CityCreate);

      return { ok: true, data: city };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 收集资源
   */
  async collect(
    db: D1Database,
    walletAddress: string,
    cityId: number
  ): Promise<ServiceResult<{
    collected: { money: number; food: number };
    total: { money: number; food: number };
  }>> {
    try {
      // 验证城市属于用户
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

  /**
   * 获取城市数量
   */
  async count(db: D1Database, walletAddress: string): Promise<ServiceResult<number>> {
    try {
      const count = await cityRepo.countByWallet(db, walletAddress);
      return { ok: true, data: count };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },
};

// ============ Helper Functions ============

/**
 * 创建初始建筑 (私有辅助函数)
 * 新号只创建聚义厅(位置1),其他建筑需要玩家自己建造
 */
async function createInitialBuildings(db: D1Database, cityId: number, buildingRepo: any): Promise<void> {
  // 检查是否已有建筑
  const existing = await db.prepare(`
    SELECT id FROM buildings WHERE city_id = ? AND position = 1
  `).bind(cityId).first();

  // 只创建聚义厅(config_id: 1, position: 1)
  if (!existing) {
    await buildingRepo.create(db, {
      city_id: cityId,
      type: 'interior' as const,
      level: 1,
      position: 1,
      state: 0,
      config_id: 1, // 聚义厅
    });
  }
}
