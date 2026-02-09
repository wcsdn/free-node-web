/**
 * Hero Repository - 武将数据访问层
 * 从 jx/BLL/Hero.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Hero, HeroConfig } from '../types/models';

export const heroRepo = {
  /** 根据 ID 查找武将 */
  async findById(db: D1Database, heroId: number): Promise<Hero | null> {
    const result = await db.prepare(`
      SELECT * FROM heroes WHERE id = ?
    `).bind(heroId).first();
    return result as unknown as Hero | null;
  },

  /** 根据钱包地址获取武将列表 */
  async findByWallet(db: D1Database, walletAddress: string): Promise<Hero[]> {
    const result = await db.prepare(`
      SELECT * FROM heroes WHERE wallet_address = ? ORDER BY id
    `).bind(walletAddress).all();
    return (result.results || []) as unknown as Hero[];
  },

  /** 根据城市获取武将列表 */
  async findByCity(db: D1Database, cityId: number): Promise<Hero[]> {
    const result = await db.prepare(`
      SELECT * FROM heroes WHERE city_id = ? ORDER BY id
    `).bind(cityId).all();
    return (result.results || []) as unknown as Hero[];
  },

  /** 获取武将数量 */
  async countByWallet(db: D1Database, walletAddress: string): Promise<number> {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM heroes WHERE wallet_address = ?
    `).bind(walletAddress).first() as { count: number };
    return result.count;
  },

  /** 获取武将配置 */
  async getConfig(db: D1Database, staticIndex: number): Promise<HeroConfig | null> {
    const result = await db.prepare(`
      SELECT * FROM hero_configs WHERE id = ?
    `).bind(staticIndex).first();
    return result as unknown as HeroConfig | null;
  },

  /** 获取所有武将配置 */
  async getAllConfigs(db: D1Database): Promise<HeroConfig[]> {
    const result = await db.prepare(`
      SELECT * FROM hero_configs ORDER BY quality DESC, id
    `).all();
    return (result.results || []) as unknown as HeroConfig[];
  },

  /** 创建武将 */
  async create(db: D1Database, data: Hero): Promise<Hero | null> {
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO heroes (city_id, wallet_address, name, quality, level, exp, hp, max_hp, atk, def, skill, state, created_at)
      VALUES (?, ?, ?, ?, 1, 0, 100, 100, 10, 5, ?, 0, ?)
    `).bind(
      data.city_id,
      data.wallet_address,
      data.name,
      data.quality ?? 1,
      data.skill ?? '',
      now
    ).run();

    const id = await this.getLastInsertId(db);
    return this.findById(db, id);
  },

  /** 升级武将 */
  async levelUp(db: D1Database, heroId: number): Promise<Hero | null> {
    const hero = await this.findById(db, heroId);
    if (!hero) return null;

    await db.prepare(`
      UPDATE heroes SET 
        level = level + 1,
        hp = hp + 20,
        max_hp = max_hp + 20,
        atk = atk + 2,
        def = def + 1,
        updated_at = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), heroId).run();

    return this.findById(db, heroId);
  },

  /** 设置技能 */
  async setSkill(db: D1Database, heroId: number, skill: string): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE heroes SET skill = ?, updated_at = ? WHERE id = ?
    `).bind(skill, new Date().toISOString(), heroId).run();
    return result.success;
  },

  /** 更新武将状态 */
  async updateState(db: D1Database, heroId: number, state: number): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE heroes SET state = ?, updated_at = ? WHERE id = ?
    `).bind(state, new Date().toISOString(), heroId).run();
    return result.success;
  },

  /** 增加经验 */
  async addExp(db: D1Database, heroId: number, exp: number): Promise<{ levelUp: boolean; newLevel: number }> {
    const hero = await this.findById(db, heroId);
    if (!hero) return { levelUp: false, newLevel: 0 };

    const newExp = hero.exp + exp;
    const newLevel = Math.floor(newExp / 500) + hero.level;

    await db.prepare(`
      UPDATE heroes SET exp = ?, level = ?, updated_at = ? WHERE id = ?
    `).bind(newExp, newLevel, new Date().toISOString(), heroId).run();

    return { levelUp: true, newLevel };
  },

  /** 删除武将 */
  async delete(db: D1Database, heroId: number): Promise<boolean> {
    const result = await db.prepare(`
      DELETE FROM heroes WHERE id = ?
    `).bind(heroId).run();
    return result.success;
  },

  /** 获取最后插入 ID */
  async getLastInsertId(db: D1Database): Promise<number> {
    const result = await db.prepare(`
      SELECT last_insert_rowid() as id
    `).first() as { id: number };
    return result.id;
  },
};
