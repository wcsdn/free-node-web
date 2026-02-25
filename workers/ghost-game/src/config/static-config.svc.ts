/**
 * Static Config Service - 静态配置服务
 * 负责加载和管理游戏静态配置数据
 * 从 jx/DALEX/StaticDataAccess.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';

// 配置缓存
const configCache = new Map<string, any>();
const CACHE_TTL = 60 * 60 * 1000; // 1小时
const cacheTimestamps = new Map<string, number>();

// 配置表名
const CONFIG_TABLES = {
  ITEMS: 'items_config',
  BUILDINGS: 'buildings_config',
  HEROES: 'heroes_config',
  SKILLS: 'skills_config',
  TASKS: 'tasks_config',
  EFFECTS: 'persist_effects_config',
  EVENTS: 'events_config',
};

class StaticConfigService {
  private db: D1Database | null;

  constructor(db: D1Database | null = null) {
    this.db = db;
  }

  /**
   * 通用配置获取方法
   */
  async getConfig(tableName: string, id: number): Promise<any> {
    const cacheKey = `${tableName}_${id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    if (!this.db) return null;

    const result = await this.db.prepare(
      `SELECT * FROM ${tableName} WHERE id = ?`
    ).bind(id).first();

    if (result) {
      this.setCache(cacheKey, result);
    }

    return result;
  }

  /**
   * 获取所有配置
   */
  async getAllConfigs(tableName: string): Promise<any[]> {
    const cacheKey = `${tableName}_all`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    if (!this.db) return [];

    const result = await this.db.prepare(
      `SELECT * FROM ${tableName}`
    ).all();

    const configs = result.results || [];
    this.setCache(cacheKey, configs);

    return configs;
  }

  /**
   * 条件查询配置
   */
  async queryConfigs(tableName: string, conditions: Record<string, any>): Promise<any[]> {
    if (!this.db) return [];

    const clauses = Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ');
    const values = Object.values(conditions);

    const result = await this.db.prepare(
      `SELECT * FROM ${tableName} WHERE ${clauses}`
    ).bind(...values).all();

    return result.results || [];
  }

  // ============ 物品配置 ============

  /**
   * 获取物品配置
   */
  async getItemConfig(itemId: number): Promise<any> {
    return this.getConfig(CONFIG_TABLES.ITEMS, itemId);
  }

  /**
   * 获取所有物品配置
   */
  async getAllItemConfigs(): Promise<any[]> {
    return this.getAllConfigs(CONFIG_TABLES.ITEMS);
  }

  /**
   * 按类型获取物品配置
   */
  async getItemConfigsByType(type: number): Promise<any[]> {
    return this.queryConfigs(CONFIG_TABLES.ITEMS, { type });
  }

  // ============ 建筑配置 ============

  /**
   * 获取建筑配置
   */
  async getBuildingConfig(buildingId: number): Promise<any> {
    return this.getConfig(CONFIG_TABLES.BUILDINGS, buildingId);
  }

  /**
   * 获取所有建筑配置
   */
  async getAllBuildingConfigs(): Promise<any[]> {
    return this.getAllConfigs(CONFIG_TABLES.BUILDINGS);
  }

  /**
   * 按类型获取建筑配置
   */
  async getBuildingConfigsByType(type: number): Promise<any[]> {
    return this.queryConfigs(CONFIG_TABLES.BUILDINGS, { type });
  }

  // ============ 武将配置 ============

  /**
   * 获取武将配置
   */
  async getHeroConfig(heroId: number): Promise<any> {
    return this.getConfig(CONFIG_TABLES.HEROES, heroId);
  }

  /**
   * 获取所有武将配置
   */
  async getAllHeroConfigs(): Promise<any[]> {
    return this.getAllConfigs(CONFIG_TABLES.HEROES);
  }

  /**
   * 按品质获取武将配置
   */
  async getHeroConfigsByQuality(quality: number): Promise<any[]> {
    return this.queryConfigs(CONFIG_TABLES.HEROES, { quality });
  }

  // ============ 技能配置 ============

  /**
   * 获取技能配置
   */
  async getSkillConfig(skillId: number): Promise<any> {
    return this.getConfig(CONFIG_TABLES.SKILLS, skillId);
  }

  /**
   * 获取所有技能配置
   */
  async getAllSkillConfigs(): Promise<any[]> {
    return this.getAllConfigs(CONFIG_TABLES.SKILLS);
  }

  // ============ 任务配置 ============

  /**
   * 获取任务配置
   */
  async getTaskConfig(taskId: number): Promise<any> {
    return this.getConfig(CONFIG_TABLES.TASKS, taskId);
  }

  /**
   * 获取所有任务配置
   */
  async getAllTaskConfigs(): Promise<any[]> {
    return this.getAllConfigs(CONFIG_TABLES.TASKS);
  }

  /**
   * 按章节获取任务配置
   */
  async getTaskConfigsByChapter(chapterId: number): Promise<any[]> {
    return this.queryConfigs(CONFIG_TABLES.TASKS, { chapter_id: chapterId });
  }

  // ============ 效果配置 ============

  /**
   * 获取效果配置
   */
  async getEffectConfig(effectId: number): Promise<any> {
    return this.getConfig(CONFIG_TABLES.EFFECTS, effectId);
  }

  /**
   * 获取所有效果配置
   */
  async getAllEffectConfigs(): Promise<any[]> {
    return this.getAllConfigs(CONFIG_TABLES.EFFECTS);
  }

  // ============ 事件配置 ============

  /**
   * 获取事件配置
   */
  async getEventConfig(eventId: number): Promise<any> {
    return this.getConfig(CONFIG_TABLES.EVENTS, eventId);
  }

  /**
   * 获取所有事件配置
   */
  async getAllEventConfigs(): Promise<any[]> {
    return this.getAllConfigs(CONFIG_TABLES.EVENTS);
  }

  // ============ 缓存管理 ============

  private getFromCache(key: string): any | null {
    const timestamp = cacheTimestamps.get(key);
    if (!timestamp) return null;

    if (Date.now() - timestamp > CACHE_TTL) {
      configCache.delete(key);
      cacheTimestamps.delete(key);
      return null;
    }

    return configCache.get(key);
  }

  private setCache(key: string, value: any): void {
    configCache.set(key, value);
    cacheTimestamps.set(key, Date.now());
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    configCache.clear();
    cacheTimestamps.clear();
  }

  /**
   * 清除指定缓存
   */
  invalidateCache(prefix: string): void {
    for (const key of configCache.keys()) {
      if (key.startsWith(prefix)) {
        configCache.delete(key);
        cacheTimestamps.delete(key);
      }
    }
  }
}

// 导出单例
let staticConfigService: StaticConfigService | null = null;

export function getStaticConfigService(db?: D1Database): StaticConfigService {
  if (!staticConfigService) {
    staticConfigService = new StaticConfigService(db || null);
  } else if (db) {
    staticConfigService = new StaticConfigService(db);
  }
  return staticConfigService;
}

export { StaticConfigService, CONFIG_TABLES };
export default { getStaticConfigService, StaticConfigService, CONFIG_TABLES };
