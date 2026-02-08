/**
 * Hero Repository - 武将数据访问层
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Hero, HeroCreate } from '../models';

export const heroRepo = {
  /** 根据 ID 查找武将 */
  async findById(db: D1Database, heroId: number): Promise<Hero | null> {
    const result = await db.prepare(`
      SELECT * FROM heroes WHERE id = ?
    `).bind(heroId).first();
    return result as Hero | null;
  },

  /** 根据钱包地址获取武将列表 */
  async findByWallet(db: D1Database, walletAddress: string): Promise<Hero[]> {
    const result = await db.prepare(`
      SELECT * FROM heroes WHERE wallet_address = ? ORDER BY id
    `).bind(walletAddress).all();
    return (result.results || []) as Hero[];
  },

  /** 根据城市获取武将列表 */
  async findByCity(db: D1Database, cityId: number): Promise<Hero[]> {
    const result = await db.prepare(`
      SELECT * FROM heroes WHERE city_id = ? ORDER BY id
    `).bind(cityId).all();
    return (result.results || []) as Hero[];
  },

  /** 创建武将 */
  async create(db: D1Database, data: HeroCreate): Promise<Hero | null> {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO heroes (city_id, wallet_address, name, quality, level, exp, hp, max_hp, atk, def, state)
      VALUES (?, ?, ?, ?, 1, 0, 100, 100, 10, 5, 0)
    `).bind(data.city_id, data.wallet_address, data.name, data.quality ?? 1).run();

    const id = await this.getLastInsertId(db);
    return this.findById(db, id);
  },

  /** 更新武将状态 */
  async updateState(db: D1Database, heroId: number, state: number): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE heroes SET state = ?, updated_at = ? WHERE id = ?
    `).bind(state, new Date().toISOString(), heroId).run();
    return result.success;
  },

  /** 升级武将 */
  async levelUp(db: D1Database, heroId: number): Promise<Hero | null> {
    const result = await db.prepare(`
      UPDATE heroes SET level = level + 1, hp = hp + 20, max_hp = max_hp + 20, atk = atk + 2, def = def + 1, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), heroId).run();
    return result.success ? this.findById(db, heroId) : null;
  },

  /** 设置技能 */
  async setSkill(db: D1Database, heroId: number, skill: string): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE heroes SET skill = ?, updated_at = ? WHERE id = ?
    `).bind(skill, new Date().toISOString(), heroId).run();
    return result.success;
  },

  private async getLastInsertId(db: D1Database): Promise<number> {
    const r = await db.prepare('SELECT last_insert_rowid() as id').first() as { id: number };
    return r.id;
  },
};
