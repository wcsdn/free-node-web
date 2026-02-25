/**
 * Hero Repository - 武将数据访问层
 * 参考原版 jx/DAL/HeroAccess.cs (1,414 行)
 */
import type { D1Database } from '@cloudflare/workers-types';
import { BaseRepository, type BaseEntity } from './base.repo';

export interface Hero extends BaseEntity {
  id: number;
  wallet_address: string;
  hero_id: number;
  level: number;
  exp: number;
  star: number;
  quality: number;
  break_level: number;
  hp: number;
  max_hp: number;
  atk: number;
  def: number;
  speed: number;
  skill_level: number;
  skill_exp: number;
  equipped_items: string;
  equips: string;
  add_point: number;
  atk_point: number;
  def_point: number;
  hp_point: number;
  adapt_infantry: string;
  adapt_cavalry: string;
  adapt_archer: string;
  injury: number;
  injury_time: string;
  locked: number;
  used: number;
  create_time: string;
  end_time: string;
  buy_time: string;
  is_take: number;
}

export interface HeroConfig {
  id: number;
  name: string;
  quality: number;
  star: number;
  camp: string;
  profession: string;
  base_hp: number;
  base_atk: number;
  base_def: number;
  base_speed: number;
  skill_id: number;
  fate_id: number;
  introduce: string;
  icon: string;
}

export class HeroRepository extends BaseRepository<Hero> {
  constructor(db: D1Database) {
    super(db, 'heroes');
  }

  // ==================== 查询操作 ====================

  /** 根据钱包地址查询所有武将 */
  async findByWallet(walletAddress: string): Promise<Hero[]> {
    return await this.where({ wallet_address: walletAddress });
  }

  /** 获取用户拥有的武将ID列表 */
  async findHeroIdsByWallet(walletAddress: string): Promise<number[]> {
    const heroes = await this.findByWallet(walletAddress);
    return heroes.map(h => h.hero_id);
  }

  /** 根据武将配置ID查询 */
  async findByHeroId(walletAddress: string, heroId: number): Promise<Hero | null> {
    return await this.db.prepare(
      `SELECT * FROM heroes WHERE wallet_address = ? AND hero_id = ?`
    ).bind(walletAddress, heroId).first<Hero>();
  }

  /** 检查是否拥有某武将 */
  async hasHero(walletAddress: string, heroId: number): Promise<boolean> {
    const result = await this.db.prepare(
      `SELECT 1 FROM heroes WHERE wallet_address = ? AND hero_id = ? LIMIT 1`
    ).bind(walletAddress, heroId).first();
    return result !== null;
  }

  /** 获取某品质的武将 */
  async findByQuality(walletAddress: string, quality: number): Promise<Hero[]> {
    return await this.db.prepare(
      `SELECT * FROM heroes WHERE wallet_address = ? AND quality = ?`
    ).bind(walletAddress, quality).all<Hero>().then(r => (r.results as Hero[]) || []);
  }

  /** 获取某星级的武将 */
  async findByStar(walletAddress: string, star: number): Promise<Hero[]> {
    return await this.db.prepare(
      `SELECT * FROM heroes WHERE wallet_address = ? AND star = ?`
    ).bind(walletAddress, star).all<Hero>().then(r => (r.results as Hero[]) || []);
  }

  /** 获取上阵武将（未锁定且在使用中） */
  async findActiveHeroes(walletAddress: string): Promise<Hero[]> {
    return await this.db.prepare(
      `SELECT * FROM heroes WHERE wallet_address = ? AND is_take = 1 AND locked = 0`
    ).bind(walletAddress).all<Hero>().then(r => (r.results as Hero[]) || []);
  }

  /** 获取未上锁武将 */
  async findUnlockedHeroes(walletAddress: string): Promise<Hero[]> {
    return await this.where({ wallet_address: walletAddress, locked: 0 });
  }

  /** 根据ID查询（包含配置信息） */
  async findByIdWithConfig(id: number): Promise<{ hero: Hero; config: HeroConfig | null }> {
    const hero = await this.findById(id);
    if (!hero) return { hero: null as any, config: null };

    const config = await this.getHeroConfig(hero.hero_id);
    return { hero, config };
  }

  /** 批量获取武将配置 */
  async getHeroConfigs(heroIds: number[]): Promise<Map<number, HeroConfig>> {
    if (heroIds.length === 0) return new Map();

    const placeholders = heroIds.map(() => '?').join(', ');
    const result = await this.db.prepare(
      `SELECT * FROM heroes_config WHERE id IN (${placeholders})`
    ).bind(...heroIds).all<HeroConfig>();

    const map = new Map<number, HeroConfig>();
    for (const config of (result.results as HeroConfig[]) || []) {
      map.set(config.id, config);
    }
    return map;
  }

  // ==================== 写入操作 ====================

  /** 获取单个武将配置 */
  async getHeroConfig(heroId: number): Promise<HeroConfig | null> {
    return await this.db.prepare(
      `SELECT * FROM heroes_config WHERE id = ?`
    ).bind(heroId).first<HeroConfig>();
  }

  /** 获取所有武将配置 */
  async getAllConfigs(): Promise<HeroConfig[]> {
    const result = await this.db.prepare(`SELECT * FROM heroes_config`).all<HeroConfig>();
    return (result.results as HeroConfig[]) || [];
  }

  /** 创建新武将 */
  async create(walletAddress: string, heroId: number): Promise<number> {
    const now = new Date().toISOString();
    
    // 获取武将配置
    const config = await this.getHeroConfig(heroId);
    if (!config) {
      throw new Error(`Hero config not found: ${heroId}`);
    }

    const result = await this.db.prepare(`
      INSERT INTO heroes (
        wallet_address, hero_id, level, exp, star, quality, break_level,
        hp, max_hp, atk, def, speed, skill_level, skill_exp,
        equipped_items, equips, add_point, atk_point, def_point, hp_point,
        adapt_infantry, adapt_cavalry, adapt_archer, injury, locked,
        used, create_time, buy_time, is_take, created_at, updated_at
      ) VALUES (?, ?, 1, 0, ?, ?, 0, ?, ?, ?, ?, 1, 0, '', '', 0, 0, 0, 0,
        'D', 'D', 'D', 0, 0, 0, datetime('now'), datetime('now'), 0, datetime('now'), datetime('now'))
    `).bind(
      walletAddress, heroId, config.star, config.quality,
      config.base_hp, config.base_atk, config.base_def, config.base_speed
    ).run();

    return result.meta.last_row_id;
  }

  /** 批量创建武将 */
  async bulkCreate(walletAddress: string, heroIds: number[]): Promise<number[]> {
    const ids: number[] = [];
    for (const heroId of heroIds) {
      const id = await this.create(walletAddress, heroId);
      ids.push(id);
    }
    return ids;
  }

  // ==================== 升级相关 ====================

  /** 武将升级 */
  async addExp(heroId: number, expToAdd: number): Promise<{
    newExp: number;
    newLevel: number;
    levelUp: boolean;
  }> {
    const hero = await this.findById(heroId);
    if (!hero) {
      return { newExp: 0, newLevel: 1, levelUp: false };
    }

    const newExp = hero.exp + expToAdd;
    const newLevel = this.calculateLevel(newExp, hero.hero_id);
    const levelUp = newLevel > hero.level;

    await this.db.prepare(`
      UPDATE heroes SET exp = ?, level = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newExp, newLevel, heroId).run();

    // 更新属性
    if (levelUp) {
      await this.updateStats(heroId);
    }

    return { newExp, newLevel, levelUp };
  }

  /** 突破 */
  async breakthrough(heroId: number): Promise<boolean> {
    const hero = await this.findById(heroId);
    if (!hero) return false;

    await this.db.prepare(`
      UPDATE heroes SET break_level = break_level + 1, updated_at = datetime('now')
      WHERE id = ?
    `).bind(heroId).run();

    await this.updateStats(heroId);
    return true;
  }

  /** 升星 */
  async upgradeStar(heroId: number): Promise<boolean> {
    const hero = await this.findById(heroId);
    if (!hero) return false;

    await this.db.prepare(`
      UPDATE heroes SET star = star + 1, updated_at = datetime('now')
      WHERE id = ?
    `).bind(heroId).run();

    await this.updateStats(heroId);
    return true;
  }

  /** 升品 */
  async upgradeQuality(heroId: number): Promise<boolean> {
    const hero = await this.findById(heroId);
    if (!hero) return false;

    await this.db.prepare(`
      UPDATE heroes SET quality = quality + 1, updated_at = datetime('now')
      WHERE id = ?
    `).bind(heroId).run();

    await this.updateStats(heroId);
    return true;
  }

  /** 更新武将属性 */
  async updateStats(heroId: number): Promise<void> {
    const hero = await this.findById(heroId);
    if (!hero) return;

    const config = await this.getHeroConfig(hero.hero_id);
    if (!config) return;

    // 基础属性 + 等级加成 + 突破加成 + 星级加成 + 品阶加成
    const levelBonus = hero.level * 10;
    const breakBonus = hero.break_level * 50;
    const starBonus = hero.star * 20;
    const qualityBonus = hero.quality * 100;

    const maxHp = config.base_hp + levelBonus + breakBonus + starBonus + qualityBonus;
    const atk = config.base_atk + Math.floor(levelBonus * 0.8) + Math.floor(breakBonus * 0.5) + starBonus + qualityBonus;
    const def = config.base_def + Math.floor(levelBonus * 0.6) + Math.floor(breakBonus * 0.3) + starBonus + qualityBonus;
    const speed = config.base_speed;

    await this.db.prepare(`
      UPDATE heroes SET hp = ?, max_hp = ?, atk = ?, def = ?, speed = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(maxHp, maxHp, atk, def, speed, heroId).run();
  }

  // ==================== 技能相关 ====================

  /** 技能升级 */
  async upgradeSkill(heroId: number): Promise<boolean> {
    const hero = await this.findById(heroId);
    if (!hero) return false;

    await this.db.prepare(`
      UPDATE heroes SET skill_level = skill_level + 1, skill_exp = 0, updated_at = datetime('now')
      WHERE id = ?
    `).bind(heroId).run();

    return true;
  }

  // ==================== 兵种适性 ====================

  /** 更新兵种适性 */
  async updateAdapt(heroId: number, adaptType: 'infantry' | 'cavalry' | 'archer', level: string): Promise<void> {
    const field = `adapt_${adaptType}`;
    await this.db.prepare(
      `UPDATE heroes SET ${field} = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(level, heroId).run();
  }

  // ==================== 伤病系统 ====================

  /** 设置伤病 */
  async setInjury(heroId: number, injuryRate: number): Promise<void> {
    const now = new Date().toISOString();
    await this.db.prepare(`
      UPDATE heroes SET injury = ?, injury_time = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(injuryRate, now, heroId).run();
  }

  /** 治疗伤病 */
  async healInjury(heroId: number): Promise<void> {
    await this.db.prepare(`
      UPDATE heroes SET injury = 0, injury_time = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).bind(heroId).run();
  }

  // ==================== 锁定/解锁 ====================

  /** 锁定武将 */
  async lock(heroId: number): Promise<void> {
    await this.db.prepare(
      `UPDATE heroes SET locked = 1, updated_at = datetime('now') WHERE id = ?`
    ).bind(heroId).run();
  }

  /** 解锁武将 */
  async unlock(heroId: number): Promise<void> {
    await this.db.prepare(
      `UPDATE heroes SET locked = 0, updated_at = datetime('now') WHERE id = ?`
    ).bind(heroId).run();
  }

  // ==================== 上阵/下阵 ====================

  /** 设置上阵 */
  async setActive(heroId: number, isActive: boolean): Promise<void> {
    await this.db.prepare(
      `UPDATE heroes SET is_take = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(isActive ? 1 : 0, heroId).run();
  }

  // ==================== 属性点分配 ====================

  /** 分配属性点 */
  async allocatePoint(heroId: number, pointType: 'atk' | 'def' | 'hp', amount: number = 1): Promise<boolean> {
    const hero = await this.findById(heroId);
    if (!hero || hero.add_point <= 0) return false;

    const field = `${pointType}_point`;
    await this.db.prepare(`
      UPDATE heroes SET ${field} = ${field} + ?, add_point = add_point - 1, 
        atk = atk + ?, def = def + ?, hp = hp + ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(amount, pointType === 'atk' ? amount : 0, pointType === 'def' ? amount : 0, pointType === 'hp' ? amount * 10 : 0, heroId).run();

    return true;
  }

  // ==================== 装备管理 ====================

  /** 设置装备 */
  async setEquipment(heroId: number, slot: number, itemId: number): Promise<void> {
    const hero = await this.findById(heroId);
    if (!hero) return;

    try {
      const equips = hero.equips ? JSON.parse(hero.equips) : {};
      equips[slot] = itemId;
      
      await this.db.prepare(
        `UPDATE heroes SET equips = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(JSON.stringify(equips), heroId).run();
    } catch {
      // JSON解析失败，忽略
    }
  }

  // ==================== 删除操作 ====================

  /** 删除武将 */
  async remove(heroId: number): Promise<boolean> {
    return await this.delete(heroId);
  }

  /** 批量删除武将 */
  async bulkRemove(heroIds: number[]): Promise<number> {
    return await this.bulkDelete(heroIds);
  }

  // ==================== 辅助方法 ====================

  /** 根据经验计算等级 */
  private calculateLevel(exp: number, heroId: number): number {
    // 每级需要 100 * level 经验
    let level = 1;
    let requiredExp = 100;
    
    while (exp >= requiredExp && level < 100) {
      exp -= requiredExp;
      level++;
      requiredExp = 100 * level;
    }
    
    return Math.min(level, 100);
  }

  // ==================== 统计查询 ====================

  /** 获取用户武将数量 */
  async getHeroCount(walletAddress: string): Promise<number> {
    return await this.count({ wallet_address: walletAddress });
  }

  /** 获取用户高品质武将数量 */
  async getQualityCount(walletAddress: string, minQuality: number): Promise<number> {
    const result = await this.db.prepare(
      `SELECT COUNT(*) as count FROM heroes WHERE wallet_address = ? AND quality >= ?`
    ).bind(walletAddress, minQuality).first<{ count: number }>();
    return result?.count || 0;
  }

  /** 获取用户武将总战力 */
  async getTotalPower(walletAddress: string): Promise<number> {
    const heroes = await this.findByWallet(walletAddress);
    return heroes.reduce((total, hero) => {
      return total + (hero.atk + hero.def * 2 + hero.hp * 0.1);
    }, 0);
  }

  /** 获取用户最强武将 */
  async getStrongestHero(walletAddress: string): Promise<Hero | null> {
    const heroes = await this.findByWallet(walletAddress);
    if (heroes.length === 0) return null;

    return heroes.reduce((strongest, hero) => {
      const power = hero.atk + hero.def * 2 + hero.hp * 0.1;
      const strongestPower = strongest.atk + strongest.def * 2 + strongest.hp * 0.1;
      return power > strongestPower ? hero : strongest;
    });
  }
}

// 导出便捷使用对象
export const heroRepo = {
  async findByWallet(db: D1Database, walletAddress: string) {
    const repo = new HeroRepository(db);
    return repo.findByWallet(walletAddress);
  },
  async findById(db: D1Database, id: number) {
    const repo = new HeroRepository(db);
    return repo.findById(id);
  },
  async create(db: D1Database, data: Partial<Hero>) {
    const repo = new HeroRepository(db);
    return repo.insert(data);
  },
  async update(db: D1Database, id: number, data: Partial<Hero>) {
    const repo = new HeroRepository(db);
    return repo.update(id, data);
  },
  async delete(db: D1Database, id: number) {
    const repo = new HeroRepository(db);
    return repo.delete(id);
  },
};
