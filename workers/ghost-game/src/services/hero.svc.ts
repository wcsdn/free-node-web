/**
 * Hero Service - 武将服务层
 * 从 jx/BLL/Hero.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Hero, ServiceResult } from '../types/models';
import { heroRepo } from '../repositories';

// 武将品质
export const HERO_QUALITY = {
  NORMAL: 1,    // 普通
  RARE: 2,       // 稀有
  EPIC: 3,       // 史诗
  LEGENDARY: 4,   // 传说
  MYTHIC: 5,     // 神话
};

// 武将状态
export const HERO_STATES = {
  IDLE: 0,        // 空闲
  TRAINING: 1,     // 训练中
  FIGHTING: 2,     // 出战中
  RESERVE: 3,     // 后备队
  INJURED: 4,     // 负伤
};

// 武将配置
export const HERO_CONFIG = {
  MAX_PER_CITY: 10,        // 城市最大武将数
  MAX_LEVEL: 100,           // 最大等级
  BASE_EXP: 100,            // 基础经验需求
  EXP_MULTIPLIER: 1.5,      // 经验增长系数
  TRAINING_COST: 100,        // 训练消耗金币
  TRAINING_EXP: 50,         // 训练获得经验
  MAX_TRAINING: 100,        // 最大训练度
};

// 品质属性加成
export const QUALITY_BONUS = {
  1: { atk: 1.0, def: 1.0, hp: 1.0 },   // 普通
  2: { atk: 1.2, def: 1.1, hp: 1.15 }, // 稀有
  3: { atk: 1.5, def: 1.3, hp: 1.4 },  // 史诗
  4: { atk: 2.0, def: 1.6, hp: 1.8 },  // 传说
  5: { atk: 2.5, def: 2.0, hp: 2.2 }, // 神话
};

class HeroService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ============ 武将查询 ============

  /**
   * 获取武将列表
   */
  async getList(walletAddress: string, options: {
    state?: number;
    cityId?: number;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { state, cityId, page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    let query = 'SELECT h.*, c.name as city_name FROM heroes h LEFT JOIN cities c ON h.city_id = c.id WHERE h.wallet_address = ?';
    const params: any[] = [walletAddress];

    if (state !== undefined) {
      query += ' AND h.state = ?';
      params.push(state);
    }

    if (cityId) {
      query += ' AND h.city_id = ?';
      params.push(cityId);
    }

    query += ' ORDER BY h.level DESC, h.quality DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const result = await this.db.prepare(query).bind(...params).all();

    const totalCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM heroes WHERE wallet_address = ?
    `).bind(walletAddress).first();

    return {
      heroes: (result.results || []).map(this.formatHero),
      total: (totalCount as any).count,
      page,
      pageSize,
    };
  }

  /**
   * 获取武将详情
   */
  async getDetail(heroId: number) {
    const hero: any = await this.db.prepare(`
      SELECT h.*, c.name as city_name 
      FROM heroes h 
      LEFT JOIN cities c ON h.city_id = c.id 
      WHERE h.id = ?
    `).bind(heroId).first();

    if (!hero) return null;

    return this.formatHero(hero);
  }

  /**
   * 根据城市获取武将
   */
  async getByCity(cityId: number) {
    const heroes: any = await this.db.prepare(`
      SELECT * FROM heroes WHERE city_id = ? ORDER BY state ASC, level DESC
    `).bind(cityId).all();

    return (heroes.results || []).map(this.formatHero);
  }

  /**
   * 获取武将战斗力
   */
  async getBattlePower(heroId: number) {
    const hero: any = await this.db.prepare(`
      SELECT * FROM heroes WHERE id = ?
    `).bind(heroId).first();

    if (!hero) return 0;

    const bonus = QUALITY_BONUS[hero.quality as keyof typeof QUALITY_BONUS] || QUALITY_BONUS[1];
    
    // 战斗力 = (攻击 + 防御 + 生命/10) * (1 + 训练度/100)
    const basePower = (hero.attack * bonus.atk + hero.defense * bonus.def + hero.hp / 10 * bonus.hp);
    const trainingBonus = 1 + (hero.training || 0) / HERO_CONFIG.MAX_TRAINING;

    return Math.floor(basePower * trainingBonus);
  }

  /**
   * 搜索武将
   */
  async search(walletAddress: string, keyword: string) {
    const heroes: any = await this.db.prepare(`
      SELECT * FROM heroes WHERE wallet_address = ? AND name LIKE ?
      ORDER BY level DESC, quality DESC
      LIMIT 50
    `).bind(walletAddress, `%${keyword}%`).all();

    return (heroes.results || []).map(this.formatHero);
  }

  // ============ 武将操作 ============

  /**
   * 招募武将
   */
  async recruit(walletAddress: string, cityId: number, name: string, quality = 1) {
    // 检查城市武将数量
    const heroCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM heroes WHERE city_id = ?
    `).bind(cityId).first();

    if ((heroCount as any).count >= HERO_CONFIG.MAX_PER_CITY) {
      return { success: false, error: '城市武将数量已达上限' };
    }

    // 获取基础属性
    const baseStats = this.getBaseStats(quality);

    const result = await this.db.prepare(`
      INSERT INTO heroes (city_id, wallet_address, name, quality, level, exp, attack, defense, hp, max_hp, training, state)
      VALUES (?, ?, ?, ?, 1, 0, ?, ?, ?, ?, 0, 0)
    `).bind(
      cityId,
      walletAddress,
      name,
      quality,
      baseStats.atk,
      baseStats.def,
      baseStats.hp,
      baseStats.hp
    ).run();

    return { success: true, heroId: result.meta.last_row_id };
  }

  /**
   * 训练武将
   */
  async train(heroId: number) {
    const hero: any = await this.db.prepare(`
      SELECT * FROM heroes WHERE id = ?
    `).bind(heroId).first();

    if (!hero) {
      return { success: false, error: '武将不存在' };
    }

    if ((hero.training || 0) >= HERO_CONFIG.MAX_TRAINING) {
      return { success: false, error: '训练度已满' };
    }

    // 训练消耗
    const cost = HERO_CONFIG.TRAINING_COST;
    
    // 检查玩家金币
    const player: any = await this.db.prepare(`
      SELECT gold FROM characters WHERE wallet_address = ?
    `).bind(hero.wallet_address).first();

    if ((player as any).gold < cost) {
      return { success: false, error: '金币不足' };
    }

    // 扣除金币
    await this.db.prepare(`
      UPDATE characters SET gold = gold - ? WHERE wallet_address = ?
    `).bind(cost, hero.wallet_address).run();

    // 增加训练度
    const trainingGain = 10;
    await this.db.prepare(`
      UPDATE heroes SET training = MIN(?, ?) WHERE id = ?
    `).bind(
      (hero.training || 0) + trainingGain,
      HERO_CONFIG.MAX_TRAINING,
      heroId
    ).run();

    return { success: true, trainingGain };
  }

  /**
   * 升级武将
   */
  async levelUp(heroId: number) {
    const hero: any = await this.db.prepare(`
      SELECT * FROM heroes WHERE id = ?
    `).bind(heroId).first();

    if (!hero) {
      return { success: false, error: '武将不存在' };
    }

    // 计算所需经验
    const requiredExp = this.calculateRequiredExp(hero.level);

    if ((hero.exp || 0) < requiredExp) {
      return { success: false, error: '经验不足' };
    }

    // 扣除经验并升级
    await this.db.prepare(`
      UPDATE heroes SET exp = exp - ?, level = level + 1 WHERE id = ?
    `).bind(requiredExp, heroId).run();

    // 获取升级后属性
    const bonus = QUALITY_BONUS[hero.quality as keyof typeof QUALITY_BONUS] || QUALITY_BONUS[1];
    const newStats = this.getLevelUpStats(hero.quality, hero.level + 1);

    await this.db.prepare(`
      UPDATE heroes SET attack = ?, defense = ?, max_hp = ?, hp = ? WHERE id = ?
    `).bind(
      newStats.atk,
      newStats.def,
      newStats.hp,
      newStats.hp,
      heroId
    ).run();

    return { success: true, newLevel: hero.level + 1 };
  }

  /**
   * 设置武将状态
   */
  async setState(heroId: number, state: number) {
    const hero: any = await this.db.prepare(`
      SELECT * FROM heroes WHERE id = ?
    `).bind(heroId).first();

    if (!hero) {
      return { success: false, error: '武将不存在' };
    }

    await this.db.prepare(`
      UPDATE heroes SET state = ? WHERE id = ?
    `).bind(state, heroId).run();

    return { success: true };
  }

  /**
   * 设置武将技能
   */
  async setSkill(heroId: number, skillId: number) {
    const hero: any = await this.db.prepare(`
      SELECT * FROM heroes WHERE id = ?
    `).bind(heroId).first();

    if (!hero) {
      return { success: false, error: '武将不存在' };
    }

    await this.db.prepare(`
      UPDATE heroes SET skill = ? WHERE id = ?
    `).bind(skillId, heroId).run();

    return { success: true };
  }

  /**
   * 设置武将名称
   */
  async rename(heroId: number, newName: string) {
    if (newName.length < 2 || newName.length > 10) {
      return { success: false, error: '名称必须为2-10个字符' };
    }

    await this.db.prepare(`
      UPDATE heroes SET name = ? WHERE id = ?
    `).bind(newName, heroId).run();

    return { success: true };
  }

  /**
   * 恢复武将体力
   */
  async recover(heroId: number) {
    const hero: any = await this.db.prepare(`
      SELECT * FROM heroes WHERE id = ?
    `).bind(heroId).first();

    if (!hero) {
      return { success: false, error: '武将不存在' };
    }

    // 恢复满血
    await this.db.prepare(`
      UPDATE heroes SET hp = max_hp WHERE id = ?
    `).bind(heroId).run();

    return { success: true };
  }

  // ============ 内部方法 ============

  private getBaseStats(quality: number) {
    const bonus = QUALITY_BONUS[quality as keyof typeof QUALITY_BONUS] || QUALITY_BONUS[1];
    return {
      atk: Math.floor(10 * bonus.atk),
      def: Math.floor(5 * bonus.def),
      hp: Math.floor(100 * bonus.hp),
    };
  }

  private getLevelUpStats(quality: number, level: number) {
    const bonus = QUALITY_BONUS[quality as keyof typeof QUALITY_BONUS] || QUALITY_BONUS[1];
    return {
      atk: Math.floor(10 * bonus.atk + level * 2),
      def: Math.floor(5 * bonus.def + level * 1),
      hp: Math.floor(100 * bonus.hp + level * 10),
    };
  }

  private calculateRequiredExp(level: number) {
    return Math.floor(HERO_CONFIG.BASE_EXP * Math.pow(HERO_CONFIG.EXP_MULTIPLIER, level));
  }

  private formatHero(hero: any) {
    const bonus = QUALITY_BONUS[hero.quality as keyof typeof QUALITY_BONUS] || QUALITY_BONUS[1];
    return {
      id: hero.id,
      cityId: hero.city_id,
      walletAddress: hero.wallet_address,
      cityName: hero.city_name,
      name: hero.name,
      quality: hero.quality,
      level: hero.level,
      exp: hero.exp || 0,
      attack: hero.attack,
      defense: hero.defense,
      hp: hero.hp,
      maxHp: hero.max_hp,
      training: hero.training || 0,
      skill: hero.skill,
      state: hero.state,
      createdAt: hero.created_at,
    };
  }
}

export const heroService = {
  create(db: D1Database) {
    return new HeroService(db);
  },

  async getList(db: D1Database, walletAddress: string, options?: any) {
    const service = new HeroService(db);
    return service.getList(walletAddress, options);
  },

  async getDetail(db: D1Database, heroId: number) {
    const service = new HeroService(db);
    return service.getDetail(heroId);
  },

  async getByCity(db: D1Database, cityId: number) {
    const service = new HeroService(db);
    return service.getByCity(cityId);
  },

  async getBattlePower(db: D1Database, heroId: number) {
    const service = new HeroService(db);
    return service.getBattlePower(heroId);
  },

  async search(db: D1Database, walletAddress: string, keyword: string) {
    const service = new HeroService(db);
    return service.search(walletAddress, keyword);
  },

  async recruit(db: D1Database, walletAddress: string, cityId: number, name: string, quality?: number) {
    const service = new HeroService(db);
    return service.recruit(walletAddress, cityId, name, quality);
  },

  async train(db: D1Database, heroId: number) {
    const service = new HeroService(db);
    return service.train(heroId);
  },

  async levelUp(db: D1Database, heroId: number) {
    const service = new HeroService(db);
    return service.levelUp(heroId);
  },

  async setState(db: D1Database, heroId: number, state: number) {
    const service = new HeroService(db);
    return service.setState(heroId, state);
  },

  async setSkill(db: D1Database, heroId: number, skillId: number) {
    const service = new HeroService(db);
    return service.setSkill(heroId, skillId);
  },

  async rename(db: D1Database, heroId: number, newName: string) {
    const service = new HeroService(db);
    return service.rename(heroId, newName);
  },

  async recover(db: D1Database, heroId: number) {
    const service = new HeroService(db);
    return service.recover(heroId);
  },
};

export default heroService;
