/**
 * City Repository - 城市数据访问层
 * 从 jx/BLL/City.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { City, CityCreate } from '../types/models';

export const cityRepo = {
  /** 根据 ID 查找城市 */
  async findById(db: D1Database, cityId: number): Promise<City | null> {
    const result = await db.prepare(`
      SELECT * FROM cities WHERE id = ?
    `).bind(cityId).first();
    return result as unknown as City | null;
  },

  /** 根据钱包地址查找城市列表 */
  async findByWallet(db: D1Database, walletAddress: string): Promise<City[]> {
    const result = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC
    `).bind(walletAddress).all();
    return (result.results || []) as unknown as City[];
  },

  /** 获取用户的第一个城市 */
  async findFirst(db: D1Database, walletAddress: string): Promise<City | null> {
    const result = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();
    return result as unknown as City | null;
  },

  /** 根据名称查找城市 */
  async findByName(db: D1Database, name: string): Promise<City | null> {
    const result = await db.prepare(`
      SELECT * FROM cities WHERE name = ?
    `).bind(name).first();
    return result as unknown as City | null;
  },

  /** 检查城市是否属于用户 */
  async isOwner(db: D1Database, cityId: number, walletAddress: string): Promise<boolean> {
    const result = await db.prepare(`
      SELECT id FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(cityId, walletAddress).first();
    return !!result;
  },

  /** 创建新城市 */
  async create(db: D1Database, data: CityCreate): Promise<City> {
    const now = new Date().toISOString();
    const position = data.position ?? Math.floor(Math.random() * 100) + 1;
    
    await db.prepare(`
      INSERT INTO cities (wallet_address, name, position, prosperity, money, food, population, money_rate, food_rate, population_rate, last_collect, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.wallet_address,
      data.name,
      position,
      data.prosperity ?? 100,
      data.money ?? 3000,
      data.food ?? 3000,
      data.population ?? 300,
      data.money_rate ?? 10,
      data.food_rate ?? 10,
      data.population_rate ?? 1,
      now,
      now,
      now
    ).run();

    const id = await this.getLastInsertId(db);
    return this.findById(db, id) as Promise<City>;
  },

  /** 收集资源 */
  async collectResources(db: D1Database, cityId: number): Promise<{
    moneyCollected: number;
    foodCollected: number;
    newMoney: number;
    newFood: number;
  } | null> {
    const city = await this.findById(db, cityId);
    if (!city) return null;

    const lastCollect = new Date(city.last_collect ?? Date.now());
    const now = new Date();
    const hoursPassed = (now.getTime() - lastCollect.getTime()) / (1000 * 60 * 60);

    if (hoursPassed < 0.1) return null; // 收集间隔太短

    const moneyProduced = Math.floor((city.money_rate ?? 10) * hoursPassed);
    const foodProduced = Math.floor((city.food_rate ?? 10) * hoursPassed);

    await db.prepare(`
      UPDATE cities SET money = money + ?, food = food + ?, last_collect = ?, updated_at = ?
      WHERE id = ?
    `).bind(moneyProduced, foodProduced, now.toISOString(), now.toISOString(), cityId).run();

    return {
      moneyCollected: moneyProduced,
      foodCollected: foodProduced,
      newMoney: (city.money ?? 0) + moneyProduced,
      newFood: (city.food ?? 0) + foodProduced,
    };
  },

  /** 获取城市数量 */
  async countByWallet(db: D1Database, walletAddress: string): Promise<number> {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM cities WHERE wallet_address = ?
    `).bind(walletAddress).first() as { count: number };
    return result.count;
  },

  /** 获取最后插入 ID */
  async getLastInsertId(db: D1Database): Promise<number> {
    const result = await db.prepare(`
      SELECT last_insert_rowid() as id
    `).first() as { id: number };
    return result.id;
  },
};
