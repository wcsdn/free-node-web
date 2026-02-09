/**
 * City Repository - 城市数据访问层
 * 原则：只负责 SQL 操作，不包含业务逻辑
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { City, CityCreate, Building } from '../models';

// ============ Base Operations ============
export const cityRepo = {
  /**
   * 根据 ID 查找城市
   */
  async findById(db: D1Database, cityId: number): Promise<City | null> {
    const result = await db.prepare(`
      SELECT * FROM cities WHERE id = ?
    `).bind(cityId).first();
    return result as unknown as City | null;
  },

  /**
   * 根据钱包地址查找城市列表
   */
  async findByWallet(db: D1Database, walletAddress: string): Promise<City[]> {
    const result = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC
    `).bind(walletAddress).all();
    return (result.results || []) as unknown as City[];
  },

  /**
   * 获取用户的第一个城市
   */
  async findFirst(db: D1Database, walletAddress: string): Promise<City | null> {
    const result = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();
    return result as unknown as City | null;
  },

  /**
   * 创建新城市
   */
  async create(db: D1Database, data: CityCreate): Promise<City> {
    const now = new Date().toISOString();
    const position = data.position ?? Math.floor(Math.random() * 100) + 1;
    
    const result = await db.prepare(`
      INSERT INTO cities (wallet_address, name, position, prosperity, money, food, population, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.wallet_address,
      data.name,
      position,
      data.prosperity ?? 100,
      data.money ?? 3000,
      data.food ?? 3000,
      data.population ?? 300,
      now,
      now
    ).run();

    return this.findById(db, result.meta.last_row_id as number) as Promise<City>;
  },

  /**
   * 检查城市是否属于用户
   */
  async isOwner(db: D1Database, cityId: number, walletAddress: string): Promise<boolean> {
    const result = await db.prepare(`
      SELECT id FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(cityId, walletAddress).first();
    return !!result;
  },

  /**
   * 更新城市资源
   */
  async updateResources(
    db: D1Database,
    cityId: number,
    updates: Partial<Pick<City, 'money' | 'food' | 'population' | 'prosperity'>>
  ): Promise<boolean> {
    const setClause: string[] = [];
    const values: unknown[] = [];

    if (updates.money !== undefined) {
      setClause.push('money = ?');
      values.push(updates.money);
    }
    if (updates.food !== undefined) {
      setClause.push('food = ?');
      values.push(updates.food);
    }
    if (updates.population !== undefined) {
      setClause.push('population = ?');
      values.push(updates.population);
    }
    if (updates.prosperity !== undefined) {
      setClause.push('prosperity = ?');
      values.push(updates.prosperity);
    }

    if (setClause.length === 0) return false;

    setClause.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(cityId);

    const result = await db.prepare(`
      UPDATE cities SET ${setClause.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return result.success;
  },

  /**
   * 收集资源
   */
  async collectResources(db: D1Database, cityId: number): Promise<{
    moneyCollected: number;
    foodCollected: number;
    newMoney: number;
    newFood: number;
  } | null> {
    const city = await this.findById(db, cityId);
    if (!city) return null;

    const lastCollect = new Date(city.last_collect);
    const now = new Date();
    const hoursPassed = (now.getTime() - lastCollect.getTime()) / (1000 * 60 * 60);

    if (hoursPassed < 0.1) return null; // 收集间隔太短

    const moneyProduced = Math.floor(city.money_rate * hoursPassed);
    const foodProduced = Math.floor(city.food_rate * hoursPassed);

    await db.prepare(`
      UPDATE cities SET money = money + ?, food = food + ?, last_collect = ?, updated_at = ?
      WHERE id = ?
    `).bind(moneyProduced, foodProduced, now.toISOString(), now.toISOString(), cityId).run();

    return {
      moneyCollected: moneyProduced,
      foodCollected: foodProduced,
      newMoney: city.money + moneyProduced,
      newFood: city.food + foodProduced,
    };
  },

  /**
   * 获取用户城市数量
   */
  async countByWallet(db: D1Database, walletAddress: string): Promise<number> {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM cities WHERE wallet_address = ?
    `).bind(walletAddress).first() as { count: number };
    return result.count;
  },

  /**
   * 根据城市 ID 获取建筑列表
   */
  async findByCity(db: D1Database, cityId: number): Promise<Building[]> {
    const result = await db.prepare(`
      SELECT * FROM buildings WHERE city_id = ? ORDER BY position
    `).bind(cityId).all();
    return (result.results || []) as unknown as Building[];
  },
};
