/**
 * Skill Repository - 技能数据访问层
 * 从 jx/DALEX/SkillExAccess.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Skill, SkillConfig } from '../types/models';

export const skillRepo = {
  /** 根据 ID 查找技能 */
  async findById(db: D1Database, skillId: number): Promise<Skill | null> {
    const result = await db.prepare(`
      SELECT * FROM skills WHERE id = ?
    `).bind(skillId).first();
    return result as unknown as Skill | null;
  },

  /** 根据武将 ID 获取技能列表 */
  async findByHeroId(db: D1Database, heroId: number): Promise<Skill[]> {
    const result = await db.prepare(`
      SELECT s.* FROM skills s
      INNER JOIN heroes h ON s.wallet_address = h.wallet_address
      WHERE h.id = ?
      ORDER BY s.id
    `).bind(heroId).all();
    return (result.results || []) as unknown as Skill[];
  },

  /** 根据钱包地址获取技能列表 */
  async findByWallet(db: D1Database, walletAddress: string): Promise<Skill[]> {
    const result = await db.prepare(`
      SELECT * FROM skills WHERE wallet_address = ? ORDER BY id
    `).bind(walletAddress).all();
    return (result.results || []) as unknown as Skill[];
  },

  /** 获取技能配置 */
  async getConfig(db: D1Database, staticIndex: number): Promise<SkillConfig | null> {
    const result = await db.prepare(`
      SELECT * FROM skill_configs WHERE id = ?
    `).bind(staticIndex).first();
    return result as unknown as SkillConfig | null;
  },

  /** 获取所有技能配置 */
  async getConfigs(db: D1Database): Promise<SkillConfig[]> {
    const result = await db.prepare(`
      SELECT * FROM skill_configs ORDER BY type, id
    `).all();
    return (result.results || []) as unknown as SkillConfig[];
  },

  /** 创建技能 */
  async create(db: D1Database, data: Skill): Promise<Skill | null> {
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO skills (wallet_address, static_index, skill_level, exp, created_at)
      VALUES (?, ?, 1, 0, ?)
    `).bind(
      data.wallet_address,
      data.static_index,
      now
    ).run();

    const id = await this.getLastInsertId(db);
    return this.findById(db, id);
  },

  /** 升级技能 */
  async levelUp(db: D1Database, skillId: number): Promise<Skill | null> {
    const skill = await this.findById(db, skillId);
    if (!skill) return null;

    await db.prepare(`
      UPDATE skills SET skill_level = skill_level + 1, exp = 0, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), skillId).run();

    return this.findById(db, skillId);
  },

  /** 增加经验 */
  async addExp(db: D1Database, skillId: number, exp: number): Promise<boolean> {
    const skill = await this.findById(db, skillId);
    if (!skill) return false;

    const newExp = skill.exp + exp;
    // 简单升级逻辑：每100经验一级
    const newLevel = Math.floor(newExp / 100) + 1;

    await db.prepare(`
      UPDATE skills SET exp = ?, skill_level = ?, updated_at = ? WHERE id = ?
    `).bind(newExp, newLevel, new Date().toISOString(), skillId).run();

    return true;
  },

  /** 删除技能 */
  async delete(db: D1Database, skillId: number): Promise<boolean> {
    const result = await db.prepare(`
      DELETE FROM skills WHERE id = ?
    `).bind(skillId).run();
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
