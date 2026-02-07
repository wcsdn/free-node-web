/**
 * 游戏核心配置 - 包含所有数值公式和配置
 */

// 战斗配置
export const BATTLE_CONFIG = {
  // 基础伤害公式
  BASE_DAMAGE: 100,
  DAMAGE_VARIANCE: 0.2, // 伤害浮动 20%
  
  // 经验公式
  EXP_BASE: 100,
  EXP_GROWTH: 1.5,
  EXP_PER_LEVEL: 50,
  
  // 战斗轮次限制
  MAX_ROUNDS: 10,
  
  // 战力加成
  POWER_BONUS_THRESHOLD: 1.2, // 战力超过对方 20% 有优势
  
  // 士气系统
  MORALE_WIN_BONUS: 10,
  MORALE_LOSS_PENALTY: 5,
  MAX_MORALE: 100,
};

// 建筑配置
export const BUILDING_CONFIG = {
  // 升级时间系数 (秒)
  UPGRADE_TIME_BASE: 60,
  UPGRADE_TIME_MULTIPLIER: 1.5,
  
  // 资源消耗增长
  COST_GROWTH: 1.5,
  
  // 建筑类型
  TYPES: {
    INTERIOR: 'interior',
    DEFENSE: 'defense',
  },
  
  // 资源类型
  RESOURCES: {
    MONEY: 'money',
    FOOD: 'food',
    POPULATION: 'population',
    PROSPERITY: 'prosperity',
  },
};

// 武将配置
export const HERO_CONFIG = {
  // 基础属性
  BASE_ATTACK: 10,
  BASE_DEFENSE: 8,
  BASE_HP: 100,
  
  // 成长系数
  ATTACK_GROWTH: 2,
  DEFENSE_GROWTH: 1.5,
  HP_GROWTH: 10,
  
  // 品质加成
  QUALITY_MULTIPLIER: {
    1: 1.0,  // 白色
    2: 1.2,  // 绿色
    3: 1.5,  // 蓝色
    4: 2.0,  // 紫色
    5: 3.0,  // 橙色
  },
  
  // 状态
  STATE: {
    FREE: 0,
    GUARD: 1,
    TRAINING: 2,
    MARCHING: 3,
    IN_CITY: 6,
  },
};

// 技能效果类型
export const SKILL_EFFECT_TYPE = {
  ATTACK_BOOST: 1,      // 攻击加成
  DEFENSE_BOOST: 2,     // 防御加成
  HP_BOOST: 3,          // 血量加成
  CRITICAL_RATE: 4,     // 暴击率
  CRITICAL_DAMAGE: 5,   // 暴击伤害
  DODGE_RATE: 6,        // 闪避率
  HIT_RATE: 7,          // 命中率
  ATTACK_SPEED: 8,      // 攻击速度
};

// 科技配置
export const TECH_CONFIG = {
  // 科技类型
  TYPES: {
    ATTACK: 'attack',
    DEFENSE: 'defense',
    ECONOMY: 'economy',
    MANAGEMENT: 'management',
  },
  
  // 研究消耗增长
  COST_GROWTH: 1.3,
  
  // 效果增长
  EFFECT_GROWTH: 1.1,
};

// 道具类型
export const ITEM_TYPE = {
  CONSUMABLE: 'consumable',     // 消耗品
  EQUIPMENT: 'equipment',      // 装备
  MATERIAL: 'material',         // 材料
  SPECIAL: 'special',           // 特殊
};

// 道具效果
export const ITEM_EFFECT = {
  HEAL_HP: 1,
  ADD_EXP: 2,
  BUFF_ATTACK: 3,
  BUFF_DEFENSE: 4,
  PROTECTION: 5,    // 免战
  SPEED_UP: 6,      // 加速
};

// 军团配置
export const CORPS_CONFIG = {
  // 最大成员数
  MAX_MEMBERS: 50,
  
  // 最大军团数
  MAX_CORPS: 100,
  
  // 行军速度 (格/分钟)
  MARCH_SPEED: 1,
  
  // 阵型加成
  FORMATION_BONUS: {
    ATTACK: 1.1,
    DEFENSE: 1.1,
    HP: 1.2,
  },
};

// 副本配置
export const DUNGEON_CONFIG = {
  // 副本难度
  DIFFICULTY: {
    NORMAL: 1,
    HARD: 2,
    NIGHTMARE: 3,
    HEROIC: 4,
    LEGENDARY: 5,
  },
  
  // 通关奖励系数
  REWARD_MULTIPLIER: 1.5,
  
  // 每日限制
  DAILY_LIMIT: {
    NORMAL: 100,
    HARD: 50,
    NIGHTMARE: 20,
    HEROIC: 10,
    LEGENDARY: 5,
  },
};

// 等级配置
export const LEVEL_CONFIG = {
  // 繁荣度到等级的转换 (每 100 繁荣度 1 级)
  PROSPERITY_PER_LEVEL: 100,
  
  // 最大等级
  MAX_LEVEL: 100,
  
  // 等级经验公式
  EXP_TO_LEVEL: (level: number) => Math.floor(100 * Math.pow(1.5, level - 1)),
  
  // 繁荣度获取公式
  PROSPERITY_GAIN: (buildings: number) => Math.floor(50 * buildings),
};

// 格式化时间 (秒 -> 人类可读)
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟${seconds % 60}秒`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`;
  return `${Math.floor(seconds / 86400)}天${Math.floor((seconds % 86400) / 3600)}小时`;
}

// 计算战斗伤害
export function calculateDamage(
  attack: number,
  defense: number,
  skillBonus: number = 0,
  isCritical: boolean = false
): number {
  const baseDamage = attack * BATTLE_CONFIG.BASE_DAMAGE / (defense + 100);
  const variance = 1 + (Math.random() - 0.5) * BATTLE_CONFIG.DAMAGE_VARIANCE;
  const totalDamage = baseDamage * variance * (1 + skillBonus);
  
  if (isCritical) {
    return Math.floor(totalDamage * 1.5);
  }
  
  return Math.floor(totalDamage);
}

// 计算升级所需资源
export function calculateUpgradeCost(
  currentLevel: number,
  baseCost: { money: number; food: number; men: number }
) {
  const multiplier = Math.pow(BUILDING_CONFIG.COST_GROWTH, currentLevel - 1);
  
  return {
    money: Math.floor(baseCost.money * multiplier),
    food: Math.floor(baseCost.food * multiplier),
    men: Math.floor(baseCost.men * multiplier),
  };
}

// 计算武将属性
export function calculateHeroStats(
  level: number,
  quality: number,
  baseStats: { attack: number; defense: number; hp: number }
) {
  const qualityBonus = HERO_CONFIG.QUALITY_MULTIPLIER[quality as keyof typeof HERO_CONFIG.QUALITY_MULTIPLIER] || 1;
  
  return {
    attack: Math.floor((baseStats.attack + (level - 1) * HERO_CONFIG.ATTACK_GROWTH) * qualityBonus),
    defense: Math.floor((baseStats.defense + (level - 1) * HERO_CONFIG.DEFENSE_GROWTH) * qualityBonus),
    hp: Math.floor((baseStats.hp + (level - 1) * HERO_CONFIG.HP_GROWTH) * qualityBonus),
  };
}

// 验证资源是否足够
export function checkResources(
  available: { money: number; food: number; men: number },
  required: { money: number; food: number; men: number }
): boolean {
  return available.money >= required.money &&
         available.food >= required.food &&
         available.men >= required.men;
}
