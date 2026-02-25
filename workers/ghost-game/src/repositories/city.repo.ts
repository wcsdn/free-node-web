/**
 * City Repository - 城市数据访问层
 * 参考原版 jx/DAL/CityInteriorAccess.cs (215 行)
 */
import type { D1Database } from '@cloudflare/workers-types';
import { BaseRepository, type BaseEntity } from './base.repo';

export interface City extends BaseEntity {
  id: number;
  wallet_address: string;
  name: string;
  position?: number;
  level: number;
  prosperity: number;
  population: number;
  max_population: number;
  money: number;
  gold: number;
  food: number;
  wood: number;
  iron: number;
  stone: number;
  money_rate?: number;
  food_rate?: number;
  population_rate?: number;
  last_collect?: string;
  map_image?: string;
  created_at: string;
  updated_at: string;
}

export interface Building extends BaseEntity {
  id: number;
  city_id: number;
  building_id: number;
  level: number;
  position: number;
  start_time: string;
  end_time: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface BuildingConfig {
  id: number;
  name: string;
  type: number;
  max_level: number;
  base_output: string;
  upgrade_cost: string;
  description: string;
  icon: string;
}

export class CityRepository extends BaseRepository<City> {
  constructor(db: D1Database) {
    super(db, 'cities');
  }

  // ==================== 查询操作 ====================

  /** 根据钱包地址查询城市 */
  async findByWallet(walletAddress: string): Promise<City | null> {
    return await this.findByWalletSimple(walletAddress);
  }

  /** 简单查询（不用关联表） */
  async findByWalletSimple(walletAddress: string): Promise<City | null> {
    return await this.db.prepare(
      `SELECT * FROM cities WHERE wallet_address = ?`
    ).bind(walletAddress).first<City>();
  }

  /** 根据城市名称查询 */
  async findByName(name: string): Promise<City | null> {
    return await this.db.prepare(
      `SELECT * FROM cities WHERE name = ?`
    ).bind(name).first<City>();
  }

  /** 检查城市是否存在 */
  async existsByWallet(walletAddress: string): Promise<boolean> {
    const result = await this.db.prepare(
      `SELECT 1 FROM cities WHERE wallet_address = ? LIMIT 1`
    ).bind(walletAddress).first();
    return result !== null;
  }

  // ==================== 写入操作 ====================

  /** 创建城市 */
  async create(walletAddress: string, name: string = '默认城市', position: number = 1): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO cities (
        wallet_address, name, position, prosperity, money, food, population,
        money_rate, food_rate, population_rate, map_image, created_at, updated_at
      ) VALUES (?, ?, ?, 0, 10000, 10000, 100, 99, 99, 99, 'm1.JPG', datetime('now'), datetime('now'))
    `).bind(walletAddress, name, position).run();

    return result.meta.last_row_id;
  }

  /** 更新城市名称 */
  async updateName(walletAddress: string, name: string): Promise<boolean> {
    const result = await this.db.prepare(
      `UPDATE cities SET name = ?, updated_at = datetime('now') WHERE wallet_address = ?`
    ).bind(name, walletAddress).run();
    return result.meta.changes > 0;
  }

  /** 更新繁荣度 */
  async updateProsperity(walletAddress: string, delta: number): Promise<{
    newProsperity: number;
    levelUp: boolean;
    newLevel: number;
  }> {
    const city = await this.findByWallet(walletAddress);
    if (!city) return { newProsperity: 0, levelUp: false, newLevel: 1 };

    const newProsperity = Math.max(0, Math.min(city.prosperity + delta, 10000));
    const newLevel = this.calculateCityLevel(newProsperity);
    const levelUp = newLevel > city.level;

    await this.db.prepare(`
      UPDATE cities SET prosperity = ?, level = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(newProsperity, newLevel, walletAddress).run();

    return { newProsperity, levelUp, newLevel };
  }

  /** 设置繁荣度 */
  async setProsperity(walletAddress: string, prosperity: number): Promise<void> {
    const level = this.calculateCityLevel(prosperity);
    await this.db.prepare(`
      UPDATE cities SET prosperity = ?, level = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(prosperity, level, walletAddress).run();
  }

  /** 更新人口 */
  async updatePopulation(walletAddress: string, delta: number): Promise<void> {
    const city = await this.findByWallet(walletAddress);
    if (!city) return;

    const newPopulation = Math.max(0, Math.min(city.population + delta, city.max_population));
    await this.db.prepare(`
      UPDATE cities SET population = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(newPopulation, walletAddress).run();
  }

  /** 设置人口上限 */
  async setMaxPopulation(walletAddress: string, maxPop: number): Promise<void> {
    await this.db.prepare(`
      UPDATE cities SET max_population = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(maxPop, walletAddress).run();
  }

  /** 更新资源 */
  async updateResources(walletAddress: string, updates: {
    gold?: number;
    food?: number;
    wood?: number;
    iron?: number;
    stone?: number;
  }): Promise<boolean> {
    const clauses = Object.keys(updates)
      .map(key => `${key} = ${key} + ?`)
      .join(', ');

    if (!clauses) return false;

    const values = Object.values(updates);
    const result = await this.db.prepare(
      `UPDATE cities SET ${clauses}, updated_at = datetime('now') WHERE wallet_address = ?`
    ).bind(...values, walletAddress).run();

    return result.meta.changes > 0;
  }

  /** 增加城市等级 */
  async levelUp(walletAddress: string): Promise<boolean> {
    const city = await this.findByWallet(walletAddress);
    if (!city) return false;

    await this.db.prepare(`
      UPDATE cities SET level = level + 1, max_population = max_population + 100, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(walletAddress).run();

    return true;
  }

  // ==================== 辅助方法 ====================

  /** 根据繁荣度计算城市等级 */
  private calculateCityLevel(prosperity: number): number {
    if (prosperity < 500) return 1;
    if (prosperity < 1000) return 2;
    if (prosperity < 2000) return 3;
    if (prosperity < 3000) return 4;
    if (prosperity < 4000) return 5;
    if (prosperity < 5000) return 6;
    if (prosperity < 6000) return 7;
    if (prosperity < 7000) return 8;
    if (prosperity < 8000) return 9;
    if (prosperity < 9000) return 10;
    return 11;
  }

  // ==================== 统计查询 ====================

  /** 获取城市资源产出（简化） */
  async getResourceOutput(walletAddress: string): Promise<{
    gold: number;
    food: number;
    wood: number;
    iron: number;
    stone: number;
  }> {
    const city = await this.findByWallet(walletAddress);
    if (!city) {
      return { gold: 0, food: 0, wood: 0, iron: 0, stone: 0 };
    }

    // 简化计算：繁荣度加成
    const bonus = 1 + (city.prosperity / 10000);
    
    return {
      gold: Math.floor(10 * bonus),
      food: Math.floor(10 * bonus),
      wood: Math.floor(5 * bonus),
      iron: Math.floor(5 * bonus),
      stone: Math.floor(5 * bonus),
    };
  }
}

/**
 * Building Repository - 建筑数据访问层
 */
export class BuildingRepository extends BaseRepository<Building> {
  constructor(db: D1Database) {
    super(db, 'buildings');
  }

  // ==================== 查询操作 ====================

  /** 根据城市ID查询所有建筑 */
  async findByCityId(cityId: number): Promise<Building[]> {
    return await this.where({ city_id: cityId });
  }

  /** 根据城市ID和位置查询 */
  async findByCityAndPosition(cityId: number, position: number): Promise<Building | null> {
    return await this.db.prepare(
      `SELECT * FROM buildings WHERE city_id = ? AND position = ?`
    ).bind(cityId, position).first<Building>();
  }

  /** 根据配置ID查询 */
  async findByBuildingId(cityId: number, buildingId: number): Promise<Building[]> {
    return await this.db.prepare(
      `SELECT * FROM buildings WHERE city_id = ? AND building_id = ?`
    ).bind(cityId, buildingId).all<Building>().then(r => (r.results as Building[]) || []);
  }

  /** 获取在建建筑 */
  async findUnderConstruction(cityId: number): Promise<Building[]> {
    return await this.db.prepare(
      `SELECT * FROM buildings WHERE city_id = ? AND status = 1 AND end_time > datetime('now')`
    ).bind(cityId).all<Building>().then(r => (r.results as Building[]) || []);
  }

  /** 获取已完成建筑 */
  async findCompleted(cityId: number): Promise<Building[]> {
    return await this.db.prepare(
      `SELECT * FROM buildings WHERE city_id = ? AND status = 2`
    ).bind(cityId).all<Building>().then(r => (r.results as Building[]) || []);
  }

  // ==================== 建筑配置查询 ====================

  /** 获取建筑配置 */
  async getBuildingConfig(buildingId: number): Promise<BuildingConfig | null> {
    return await this.db.prepare(
      `SELECT * FROM buildings_config WHERE id = ?`
    ).bind(buildingId).first<BuildingConfig>();
  }

  /** 获取所有建筑配置 */
  async getAllConfigs(): Promise<BuildingConfig[]> {
    const result = await this.db.prepare(`SELECT * FROM buildings_config`).all<BuildingConfig>();
    return (result.results as BuildingConfig[]) || [];
  }

  // ==================== 写入操作 ====================

  /** 建造建筑 */
  async build(cityId: number, buildingId: number, position: number): Promise<number> {
    const now = new Date().toISOString();
    
    const result = await this.db.prepare(`
      INSERT INTO buildings (city_id, building_id, level, position, status, created_at, updated_at)
      VALUES (?, ?, 1, ?, 2, datetime('now'), datetime('now'))
    `).bind(cityId, buildingId, position).run();

    return result.meta.last_row_id;
  }

  /** 开始升级 */
  async startUpgrade(buildingId: number, duration: number): Promise<void> {
    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 1000).toISOString();

    await this.db.prepare(`
      UPDATE buildings SET status = 1, start_time = ?, end_time = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(now.toISOString(), endTime, buildingId).run();
  }

  /** 完成升级（完成建造） */
  async completeUpgrade(buildingId: number): Promise<boolean> {
    const building = await this.findById(buildingId);
    if (!building) return false;

    await this.db.prepare(`
      UPDATE buildings SET level = level + 1, status = 2, start_time = NULL, end_time = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).bind(buildingId).run();

    return true;
  }

  /** 拆除建筑 */
  async demolish(buildingId: number): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM buildings WHERE id = ?`
    ).bind(buildingId).run();
    return result.meta.changes > 0;
  }

  /** 移动建筑位置 */
  async move(buildingId: number, newPosition: number): Promise<boolean> {
    // 检查位置是否被占用
    const existing = await this.findByCityAndPosition(0, newPosition); // city_id 需要从 building 获取
    if (existing) return false;

    const result = await this.db.prepare(
      `UPDATE buildings SET position = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(newPosition, buildingId).run();

    return result.meta.changes > 0;
  }

  /** 升级建筑 */
  async upgrade(buildingId: number): Promise<boolean> {
    const building = await this.findById(buildingId);
    if (!building || building.status !== 2) return false;

    // 获取配置计算升级时间
    const config = await this.getBuildingConfig(building.building_id);
    const duration = config ? (JSON.parse(config.upgrade_cost || '{}').time || 60) : 60;

    await this.startUpgrade(buildingId, duration);
    return true;
  }

  // ==================== 定时任务 ====================

  /** 检查并完成过期建造 */
  async checkAndCompleteConstruction(): Promise<number> {
    const result = await this.db.prepare(`
      UPDATE buildings SET status = 2, level = level + 1, start_time = NULL, end_time = NULL, updated_at = datetime('now')
      WHERE status = 1 AND end_time <= datetime('now')
    `).run();

    return result.meta.changes;
  }

  // ==================== 统计查询 ====================

  /** 获取城市建筑数量 */
  async getBuildingCount(cityId: number): Promise<number> {
    return await this.count({ city_id: cityId });
  }

  /** 获取某类型建筑数量 */
  async getBuildingTypeCount(cityId: number, buildingType: number): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM buildings b
      JOIN buildings_config bc ON b.building_id = bc.id
      WHERE b.city_id = ? AND bc.type = ?
    `).bind(cityId, buildingType).first<{ count: number }>();
    return result?.count || 0;
  }
}

// 导出便捷使用对象
export const cityRepo = {
  async findByWallet(db: D1Database, walletAddress: string) {
    const repo = new CityRepository(db);
    return repo.findByWallet(walletAddress);
  },
  async findFirst(db: D1Database, walletAddress: string) {
    const repo = new CityRepository(db);
    return repo.findByWalletSimple(walletAddress);
  },
  async findById(db: D1Database, id: number) {
    const repo = new CityRepository(db);
    return repo.findById(id);
  },
  async create(db: D1Database, data: Partial<City>) {
    const repo = new CityRepository(db);
    return repo.insert(data);
  },
  async update(db: D1Database, id: number, data: Partial<City>) {
    const repo = new CityRepository(db);
    return repo.update(id, data);
  },
};
