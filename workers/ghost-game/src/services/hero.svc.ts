/**
 * Hero Service - 武将服务层
 * 从 jx/BLL/Hero.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Hero, ServiceResult } from '../types/models';
import { heroRepo } from '../repositories';
import heroesConfig from '../config/heroes.json';

// 武将品质
export const HERO_QUALITY = {
  NORMAL: 1,    // 普通
  RARE: 2,       // 稀有
  EPIC: 3,       // 史诗
  LEGENDARY: 4,   // 传说
  MYTHIC: 5,     // 神话
};

// 武将状态 (C# 值: 1=驻守, 2=出征, 4=负伤, 6=未雇佣)
export const HERO_STATES = {
  DEFEND: 1,       // 驻守 (garrison/defend)
  ATTACK: 2,       // 出征 (fighting/attack)
  INJURED: 4,      // 负伤 (wounded/injured)
  UNHIRED: 6,      // 未雇佣 (not hired)
};

// 武将配置
export const HERO_CONFIG = {
  MAX_PER_CITY: 10,        // 城市最大武将数
  MAX_LEVEL: 100,          // 最大等级
  BASE_EXP: 100,            // 基础经验需求
  EXP_MULTIPLIER: 1.5,      // 经验增长系数
  TRAINING_COST: 100,       // 训练消耗银两/元宝
  UP_TRAINING: 10,          // 每次训练增加的训练度
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

// 根据 AbilityIndex 获取能力配置
function getAbilityByIndex(abilityIndex: number): any {
  if (!heroesConfig.Ability) return null;
  return heroesConfig.Ability.find((a: any) => a.Index === abilityIndex);
}

// 格式化武将 - 使用 AbilityIndex 计算动态属性
function formatHeroWithAbility(hero: any): any {
  const bonus = QUALITY_BONUS[hero.quality as keyof typeof QUALITY_BONUS] || QUALITY_BONUS[1];
  
  // 从 AbilityIndex 获取基础能力配置
  const abilityIndex = hero.AbilityIndex || hero.ability_index || hero.config_id || 1;
  const ability = getAbilityByIndex(abilityIndex);
  
  // 计算动态属性
  let attack = hero.attack || 0;
  let defense = hero.defense || 0;
  let hp = hero.hp || hero.max_hp || 0;
  let maxHp = hero.max_hp || hp;
  
  // 如果有 Ability 配置，基于等级计算属性
  if (ability) {
    const level = hero.level || 1;
    // 基础属性 + (等级-1) * 每级成长
    attack = ability.Attack + (level - 1) * (ability.UpAttack || 0);
    defense = ability.Defence + (level - 1) * (ability.UpDefence || 0);
    maxHp = (ability.MaxPrenticeNum || 10) * 10 + (level - 1) * 10;
    hp = Math.min(hp, maxHp); // 确保当前HP不超过最大HP
    
    // 应用品质加成
    attack = Math.floor(attack * bonus.atk);
    defense = Math.floor(defense * bonus.def);
    maxHp = Math.floor(maxHp * bonus.hp);
    if (hp > 0) hp = Math.floor(hp * bonus.hp);
  }
  
  return {
    // C# HeroInfo 完整字段
    id: hero.id,
    ID: hero.id,
    cityId: hero.city_id,
    CityID: hero.city_id,
    walletAddress: hero.wallet_address,
    UserName: hero.wallet_address,
    cityName: hero.city_name,
    name: hero.name,
    Name: hero.name,
    quality: hero.quality,
    Quality: hero.quality,
    level: hero.level,
    Level: hero.level,
    exp: hero.exp || 0,
    Exp: hero.exp || 0,
    attack: attack,
    defense: defense,
    hp: hp,
    maxHp: maxHp,
    MaxHp: maxHp,
    training: hero.training || 0,
    Training: hero.training || 0,
    skill: hero.skill ?? 0,
    Skill: hero.skill ?? 0,
    state: hero.state,
    State: hero.state,
    createdAt: hero.created_at,
    // Ability 相关字段
    AbilityIndex: abilityIndex,
    AttackRange: ability?.AttackRange || 2,
    MoveRange: ability?.MoveRange || 9,
    CrushBlow: ability?.CrushBlow || 0,
    Dodge: ability?.Dodge || 0,
    // C# 额外字段
    Sex: hero.Sex || 1,
    Junta: hero.Junta || 1,
    Icon: hero.Icon || '/hero/1.gif',
    Image: hero.Image || '/hero/1.png',
    PortraitIndex: hero.PortraitIndex || hero.portrait_index || 1,
    DefencePos: hero.DefencePos || 0,
    PrenticeNum: hero.PrenticeNum || 0,
    HeroType: hero.HeroType || hero.hero_type || 1,
    ExpCount: hero.ExpCount || 0,
    NoSkillReason: hero.NoSkillReason || 0,
    PropertyCounteract: hero.PropertyCounteract || [0,0,0,0,0],
    WuXing: hero.WuXing || ability?.Element || 1,
    UpTraining: hero.UpTraining || 0,
    AutoExpGold: hero.AutoExpGold || 0,
    AutoExpCount: hero.AutoExpCount || 0,
    AutoExpResFood: hero.AutoExpResFood || 0,
    AutoExpResMoney: hero.AutoExpResMoney || 0,
    AutoExpResFoodByGold: hero.AutoExpResFoodByGold || 0,
    AutoExpResMoneyByGold: hero.AutoExpResMoneyByGold || 0,
    AutoExpResMen: hero.AutoExpResMen || 0,
    AutoExpNum: hero.AutoExpNum || 0,
    FastTrainCostMoney: ability?.TrainCostMoney || 100,
    FastTrainCostFood: ability?.TrainCostFood || 100,
    FastTrainCostMen: ability?.TrainCostMen || 100,
    FastTrainCostGold: ability?.TrainCostGold || 10,
    FastTrainCostTime: ability?.TrainCostTime || 60,
    FastConscriptionCostMoney: ability?.ConscriptionCostMoney || 100,
    FastConscriptionCostFood: ability?.ConscriptionCostFood || 100,
    FastConscriptionCostMen: ability?.ConscriptionCostMen || 100,
    FastConscriptionCostGold: ability?.ConscriptionCostGold || 10,
    FastConscriptionCostTime: ability?.ConscriptionCostTime || 60,
  };
}

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

    const heroes = (result.results || []).map((h: any) => formatHeroWithAbility(h));

    return {
      heroes,
      total: (totalCount as any)?.count || 0,
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

    return formatHeroWithAbility(hero);
  }

  /**
   * 根据城市获取武将
   */
  async getByCity(cityId: number) {
    const heroes: any = await this.db.prepare(`
      SELECT * FROM heroes WHERE city_id = ? ORDER BY state ASC, level DESC
    `).bind(cityId).all();

    return (heroes.results || []).map(formatHeroWithAbility);
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

    return (heroes.results || []).map(formatHeroWithAbility);
  }

  // ============ 武将操作 ============

  /**
   * 招募武将
   * C# 签名: AddHero(string userName, int cityID, int objID)
   * objID: 建筑槽位索引 (1-based)，用于确定最大招募等级
   * 名称从 NPC 配置中随机生成
   */
  async recruit(walletAddress: string, cityId: number, objID: number) {
    // 检查城市武将数量 (排除 state=6 未雇佣)
    const heroCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM heroes WHERE city_id = ? AND state != ?
    `).bind(cityId, HERO_STATES.UNHIRED).first();

    if ((heroCount as any).count >= HERO_CONFIG.MAX_PER_CITY) {
      return { success: false, error: '城市武将数量已达上限' };
    }

    // C#: 从建筑等级确定最大可招募等级
    // 获取城市内政建筑等级 (简化: 使用城市等级作为基础)
    const city: any = await this.db.prepare(`
      SELECT * FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(cityId, walletAddress).first();

    if (!city) {
      return { success: false, error: '城市不存在' };
    }

    // 简化: 使用 objID 对应的建筑槽位等级
    // C#: level = rand.Next(1, interInfo.InteriorBuildingLevel[objID-1] + 1)
    const maxHeroLevel = Math.max(1, Math.min(objID * 5, (city.level || 1) * 2));
    const heroLevel = Math.floor(Math.random() * maxHeroLevel) + 1;

    // C#: union = 3 (hardcoded in AddHero)
    // 从 heroes.json Portrait 中随机选择一个模板
    const portraits = (heroesConfig as any).Portrait || [];
    if (portraits.length === 0) {
      return { success: false, error: '武将配置不存在' };
    }

    const portraitTemplate = portraits[Math.floor(Math.random() * portraits.length)];
    const firstNameIdx = portraitTemplate.FirstNameIndex || 1;
    const lastNameIdx = portraitTemplate.LastNameIndex || 1;

    // 从 names.json Name 数组中查找名字
    const namesData = heroesConfig as any;
    const nameList: Array<{Index: number, Value: string}> = namesData.Name || [];
    
    // 构造名字: 姓(LastName) + 名(FirstName)
    // C# MenFirstName 是姓, MenLastName 是名
    const firstNameEntry = nameList.find(n => n.Index === firstNameIdx);
    const lastNameEntry = nameList.find(n => n.Index === lastNameIdx);
    
    const firstName = firstNameEntry?.Value || '侠';
    const lastName = lastNameEntry?.Value || '客';
    const heroName = firstName + lastName;

    // 品质从配置中获取或默认为 1
    const quality = portraitTemplate.Quality || 1;
    const abilityIndex = portraitTemplate.AbilityIndex || 1;

    // 获取基础属性
    const baseStats = this.getBaseStats(quality);

    const result = await this.db.prepare(`
      INSERT INTO heroes (city_id, wallet_address, name, quality, level, exp, attack, defense, hp, max_hp, training, state, config_id, ability_index, sex, icon, image)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
    `).bind(
      cityId,
      walletAddress,
      heroName,
      quality,
      heroLevel,
      baseStats.atk,
      baseStats.def,
      baseStats.hp,
      baseStats.hp,
      HERO_STATES.UNHIRED,  // C#: state = 6 (未雇佣)
      portraitTemplate.Index || 1,
      abilityIndex,
      portraitTemplate.Sex || 1,
      portraitTemplate.Icon || '/hero/1.gif',
      portraitTemplate.Image || '/hero/1.png'
    ).run();

    return { success: true, heroId: result.meta.last_row_id };
  }

  /**
   * 训练武将
   * C#: AddHeroTrain(userName, cityID, EventInfo eventSingle)
   * 消耗资源(money, food) 并创建训练事件，完成后增加训练度
   * 状态变为 DEFEND(1) = 驻守
   */
  async train(walletAddress: string, cityId: number, heroId: number) {
    const hero: any = await this.db.prepare(`
      SELECT * FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(heroId, walletAddress).first();

    if (!hero) {
      return { success: false, error: '武将不存在' };
    }

    // C#: 训练度已满(100)则不能训练
    if ((hero.training || 0) >= HERO_CONFIG.MAX_TRAINING) {
      return { success: false, error: '训练度已满' };
    }

    // C#: 如果英雄在外(CorpsID != 0)不能训练
    if ((hero as any).corps_id && (hero as any).corps_id !== 0) {
      return { success: false, error: '英雄正在外出' };
    }

    // 获取训练消耗 (C#: TrainCostMoney, TrainCostFood)
    // 简化: 使用固定消耗
    const costMoney = HERO_CONFIG.TRAINING_COST;
    const costFood = HERO_CONFIG.TRAINING_COST;

    // 检查玩家资源
    const player: any = await this.db.prepare(`
      SELECT gold, money, food FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!player) {
      return { success: false, error: '角色不存在' };
    }

    if ((player as any).gold < costMoney) {
      return { success: false, error: '元宝不足' };
    }
    if ((player as any).money < costMoney) {
      return { success: false, error: '银两不足' };
    }
    if ((player as any).food < costFood) {
      return { success: false, error: '粮食不足' };
    }

    // C#: 扣除资源
    await this.db.prepare(`
      UPDATE characters SET gold = gold - ?, money = money - ?, food = food - ?
      WHERE wallet_address = ?
    `).bind(costMoney, costMoney, costFood, walletAddress).run();

    // C#: 计算训练时间并创建事件 (简化: 立即完成训练)
    // C#: AddHeroTrain 在事件完成时增加训练度
    // 这里简化处理: 立即增加训练度
    const trainingGain = HERO_CONFIG.UP_TRAINING || 10;
    const newTraining = Math.min((hero.training || 0) + trainingGain, HERO_CONFIG.MAX_TRAINING);

    // C#: 训练完成后状态变为 DEFEND(1) = 驻守
    await this.db.prepare(`
      UPDATE heroes SET training = ?, state = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newTraining, HERO_STATES.DEFEND, heroId).run();

    // C#: 调用事件系统记录训练日志 (EventExAccess.AddEventHeroState)
    // 这里记录到 events 表
    await this.db.prepare(`
      INSERT INTO events (wallet_address, city_id, event_type, action_type, obj_id, obj_level, obj_type, start_time, end_time, state)
      VALUES (?, ?, 9, 9, ?, ?, 3, datetime('now'), datetime('now'), 1)
    `).bind(walletAddress, cityId, heroId, trainingGain).run();

    return { success: true, trainingGain, newTraining };
  }

  /**
   * 升级武将
   * C#: HeroUpLevel(ref HeroInfo heroSingle, out int upFlag)
   * - 消耗 LevelExpStatic 经验
   * - 检查 maxLevel 防止超过最大等级
   * - C# 公式: Level <= 80 用一套公式, > 80 用另一套公式
   */
  async levelUp(walletAddress: string, heroId: number) {
    const hero: any = await this.db.prepare(`
      SELECT * FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(heroId, walletAddress).first();

    if (!hero) {
      return { success: false, error: '武将不存在' };
    }

    // C#: 计算最大等级 (简化: 使用城市等级和 AbilityIndex 的最大值)
    const city: any = await this.db.prepare(`
      SELECT level FROM cities WHERE id = ? AND wallet_address = ?
    `).bind((hero as any).city_id, walletAddress).first();

    const cityLevel = city?.level || 1;
    // C#: maxLevel 由建筑等级和 HeroAbility.MaxLevel 共同决定
    // 简化: maxLevel = min(cityLevel * 5, 100)
    const maxLevel = Math.min(cityLevel * 5, HERO_CONFIG.MAX_LEVEL);

    if ((hero as any).level >= maxLevel) {
      return { success: false, error: '已达到最大等级' };
    }

    // C#: 计算当前级别所需经验 HeroUpNeedExp
    // Level <= 80: LevelExp + 10 + UpLevelExp * level^1.8 * 0.2
    // Level > 80: 上述 + (level-80)^2.8 * UpLevelExp * (3 - Quality * 0.3)
    const ability = getAbilityByIndex((hero as any).ability_index || 1);
    const baseLevelExp = (ability?.LevelExp as number) || 100;
    const upLevelExp = (ability?.UpLevelExp as number) || 50;
    const quality = (hero as any).quality || 1;
    const currentLevel = (hero as any).level || 1;

    let requiredExp: number;
    if (currentLevel <= 80) {
      requiredExp = Math.floor(
        baseLevelExp + 10 + upLevelExp * Math.pow(currentLevel, 1.8) * 0.2
      );
    } else {
      requiredExp = Math.floor(
        baseLevelExp + 10 + upLevelExp * Math.pow(currentLevel, 1.8) * 0.2 +
        Math.pow(currentLevel - 80, 2.8) * (upLevelExp * (3 - quality * 0.3))
      );
    }

    const currentExp = (hero as any).exp || 0;

    // C#: while (LevelExp >= LevelExpStatic) { LevelExp -= LevelExpStatic; Level++; }
    if (currentExp < requiredExp) {
      return { success: false, error: '经验不足' };
    }

    // C#: 扣除经验并升级
    const remainingExp = currentExp - requiredExp;
    const newLevel = currentLevel + 1;

    // 获取升级后属性
    const newStats = this.getLevelUpStats(quality, newLevel);

    await this.db.prepare(`
      UPDATE heroes SET exp = ?, level = ?, attack = ?, defense = ?, max_hp = ?, hp = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      remainingExp,
      newLevel,
      newStats.atk,
      newStats.def,
      newStats.hp,
      newStats.hp,
      heroId
    ).run();

    return { success: true, newLevel, expConsumed: requiredExp };
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

  private formatHeroWithLegacy(hero: any) {
    const bonus = QUALITY_BONUS[hero.quality as keyof typeof QUALITY_BONUS] || QUALITY_BONUS[1];
    return {
      // C# HeroInfo 完整字段
      id: hero.id,
      ID: hero.id,
      cityId: hero.city_id,
      CityID: hero.city_id,
      walletAddress: hero.wallet_address,
      UserName: hero.wallet_address,
      cityName: hero.city_name,
      name: hero.name,
      Name: hero.name,
      quality: hero.quality,
      Quality: hero.quality,
      level: hero.level,
      Level: hero.level,
      exp: hero.exp || 0,
      Exp: hero.exp || 0,
      attack: hero.attack,
      defense: hero.defense,
      hp: hero.hp,
      maxHp: hero.max_hp,
      MaxHp: hero.max_hp,
      training: hero.training || 0,
      Training: hero.training || 0,
      skill: hero.skill ?? 0,
      Skill: hero.skill ?? 0,
      state: hero.state,
      State: hero.state,
      createdAt: hero.created_at,
      // C# 额外字段
      Sex: 1,
      Junta: 1,
      Icon: '/hero/1.gif',
      Image: '/hero/1.png',
      PortraitIndex: 1,
      AbilityIndex: 1,
      DefencePos: 0,
      PrenticeNum: 0,
      HeroType: 1,
      ExpCount: 0,
      NoSkillReason: 0,
      PropertyCounteract: [0,0,0,0,0],
      WuXing: 1,
      UpTraining: 0,
      AutoExpGold: 0,
      AutoExpCount: 0,
      AutoExpResFood: 0,
      AutoExpResMoney: 0,
      AutoExpResFoodByGold: 0,
      AutoExpResMoneyByGold: 0,
      AutoExpResMen: 0,
      AutoExpNum: 0,
      FastTrainCostMoney: 100,
      FastTrainCostFood: 100,
      FastTrainCostMen: 100,
      FastTrainCostGold: 10,
      FastTrainCostTime: 60,
      FastConscriptionCostMoney: 100,
      FastConscriptionCostFood: 100,
      FastConscriptionCostMen: 100,
      FastConscriptionCostGold: 10,
      FastConscriptionCostTime: 60,
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

  async recruit(db: D1Database, walletAddress: string, cityId: number, objID: number) {
    const service = new HeroService(db);
    return service.recruit(walletAddress, cityId, objID);
  },

  async train(db: D1Database, walletAddress: string, cityId: number, heroId: number) {
    const service = new HeroService(db);
    return service.train(walletAddress, cityId, heroId);
  },

  async levelUp(db: D1Database, walletAddress: string, heroId: number) {
    const service = new HeroService(db);
    return service.levelUp(walletAddress, heroId);
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
