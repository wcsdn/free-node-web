/**
 * City Service - 城市服务层
 * 从 jx/BLL/City.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { City, ServiceResult } from '../types/models';
import { cityRepo, buildingRepo } from '../repositories';

// 城市配置
export const CITY_CONFIG = {
  MAX_CITIES: 3,
  DEFAULT_NAME: '主城',
  MAX_PROSPERITY: 10000,
  MONEY_RATE: 99,
  FOOD_RATE: 99,
  POP_RATE: 99,
};

// 繁荣度等级映射
export const PROSPERITY_LEVELS = [
  { level: 1, minProsperity: 0, name: '村镇' },
  { level: 2, minProsperity: 500, name: '小镇' },
  { level: 3, minProsperity: 2000, name: '城池' },
  { level: 4, minProsperity: 5000, name: '名城' },
  { level: 5, minProsperity: 8000, name: '都城' },
];

class CityService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ============ 城市查询 ============

  /**
   * 获取城市列表
   */
  async getList(walletAddress: string) {
    const cities = await cityRepo.findByWallet(this.db, walletAddress);
    return { cities };
  }

  /**
   * 获取城市详情
   */
  async getDetail(walletAddress: string, cityId?: number) {
    let targetId = cityId;

    if (!targetId) {
      const first = await cityRepo.findFirst(this.db, walletAddress);
      if (!first) return null;
      targetId = first.id;
    }

    const city = await cityRepo.findById(this.db, targetId);
    if (!city || city.wallet_address !== walletAddress) return null;

    const buildings = await buildingRepo.findByCity(this.db, targetId);

    return { city, buildings };
  }

  /**
   * 获取城市资源
   */
  async getResources(walletAddress: string, cityId: number) {
    const city: any = await this.db.prepare(`
      SELECT money, food, population, prosperity FROM cities 
      WHERE id = ? AND wallet_address = ?
    `).bind(cityId, walletAddress).first();

    if (!city) return null;

    return {
      money: city.money,
      food: city.food,
      population: city.population,
      prosperity: city.prosperity,
      moneyRate: city.money_rate,
      foodRate: city.food_rate,
      popRate: city.population_rate,
    };
  }

  /**
   * 获取繁荣等级
   */
  getProsperityLevel(prosperity: number) {
    for (let i = PROSPERITY_LEVELS.length - 1; i >= 0; i--) {
      if (prosperity >= PROSPERITY_LEVELS[i].minProsperity) {
        return PROSPERITY_LEVELS[i];
      }
    }
    return PROSPERITY_LEVELS[0];
  }

  /**
   * 收取资源
   */
  async collectResources(walletAddress: string, cityId: number) {
    const city: any = await this.db.prepare(`
      SELECT money, food, population FROM cities 
      WHERE id = ? AND wallet_address = ?
    `).bind(cityId, walletAddress).first();

    if (!city) {
      return { success: false, error: '城市不存在' };
    }

    // 更新收取时间
    await this.db.prepare(`
      UPDATE cities SET last_collect = datetime('now') WHERE id = ?
    `).bind(cityId).run();

    return {
      success: true,
      money: city.money,
      food: city.food,
      population: city.population,
    };
  }

  /**
   * 计算资源产量
   */
  calculateProduction(city: any) {
    const now = new Date();
    const lastCollect = new Date(city.last_collect);
    const hours = Math.max(0, (now.getTime() - lastCollect.getTime()) / (1000 * 60 * 60));

    return {
      money: Math.floor(city.money * city.money_rate / 100 * hours),
      food: Math.floor(city.food * city.food_rate / 100 * hours),
      population: Math.floor(city.population * city.population_rate / 100 * hours),
    };
  }

  /**
   * 修改城市名称
   */
  async rename(walletAddress: string, cityId: number, newName: string) {
    if (newName.length < 2 || newName.length > 10) {
      return { success: false, error: '城市名称必须为2-10个字符' };
    }

    await this.db.prepare(`
      UPDATE cities SET name = ? WHERE id = ? AND wallet_address = ?
    `).bind(newName, cityId, walletAddress).run();

    return { success: true };
  }

  /**
   * 获取或创建用户城市
   */
  async getOrCreate(walletAddress: string) {
    // 检查是否已有城市
    const existing = await cityRepo.findByWallet(this.db, walletAddress);
    if (existing && existing.length > 0) {
      const city = existing[0];
      const buildings = await buildingRepo.findByCity(this.db, city.id!);
      return { city, buildings, isNew: false };
    }

    // 创建新城市
    const newCity = await cityRepo.create(this.db, {
      wallet_address: walletAddress,
      name: '主城',
      position: 0,
      prosperity: 0,
      money: 10000,
      food: 10000,
      population: 100,
      money_rate: 100,
      food_rate: 100,
      population_rate: 100,
    });

    return { city: newCity, buildings: [], isNew: true };
  }
}

export const cityService = {
  create(db: D1Database) {
    return new CityService(db);
  },

  async getList(db: D1Database, walletAddress: string) {
    const service = new CityService(db);
    return service.getList(walletAddress);
  },

  async getDetail(db: D1Database, walletAddress: string, cityId?: number) {
    const service = new CityService(db);
    return service.getDetail(walletAddress, cityId);
  },

  async getResources(db: D1Database, walletAddress: string, cityId: number) {
    const service = new CityService(db);
    return service.getResources(walletAddress, cityId);
  },

  async collectResources(db: D1Database, walletAddress: string, cityId: number) {
    const service = new CityService(db);
    return service.collectResources(walletAddress, cityId);
  },

  async rename(db: D1Database, walletAddress: string, cityId: number, newName: string) {
    const service = new CityService(db);
    return service.rename(walletAddress, cityId, newName);
  },

  getProsperityLevel(prosperity: number) {
    const service = new CityService(null as any);
    return service.getProsperityLevel(prosperity);
  },

  async getOrCreate(db: D1Database, walletAddress: string) {
    const service = new CityService(db);
    return service.getOrCreate(walletAddress);
  },
};

export default cityService;
