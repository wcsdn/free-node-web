/**
 * 战斗引擎 - 核心逻辑
 *
 * 实现完整的战斗系统：
 * - 回合制战斗
 * - 胜负判定
 * - 奖励发放
 * - 战报生成
 */

import { Buffer } from 'buffer';

export interface BattleConfig {
  maxRounds: number;
  baseDamage: number;
  damageVariance: number;
  criticalRate: number;
  criticalDamage: number;
  expBase: number;
  maxExp: number;
  winExpMultiplier: number;
  loseExpMultiplier: number;
  goldMultiplier: number;
  fameMultiplier: number;
}

export interface BattleUnit {
  id: number;
  configId: number;
  name: string;
  type?: number;  // 兵种类型 (1=步兵, 2=骑兵, 3=弓兵, 4=枪兵)
  attack: number;
  defense: number;
  hp: number;
  maxHp: number;
  speed: number;
  critRate: number;
  critDamage: number;
  skill?: number[];
  position?: number;
}

export interface BattleRound {
  round: number;
  winner?: 'attacker' | 'defender' | 'draw' | null;  // 回合胜负
  attacker: {
    unitId: number;
    name: string;
    action: 'attack' | 'skill' | 'defend' | 'escape' | 'wait';
    target?: number;
    damage?: number;
    hp?: number;
    skillEffect?: string;
    crit?: boolean;
    miss?: boolean;
  };
  defender: {
    unitId: number;
    name: string;
    action: 'attack' | 'skill' | 'defend' | 'escape' | 'wait';
    target?: number;
    damage?: number;
    hp?: number;
    skillEffect?: string;
    crit?: boolean;
    miss?: boolean;
  };
}

export interface BattleReport {
  battleId: number;
  timestamp: string;
  attacker: string;
  defender: string;
  terrain: string;
  rounds: BattleRound[];
  winner: 'attacker' | 'defender' | 'draw';
  winType: 'annihilation' | 'breakthrough' | 'escape';
  rewards: {
    exp: number;
    gold: number;
    food: number;
    fame: number;
    prestige: number;
  };
  losses: {
    attacker: { killed: number; wounded: number };
    defender: { killed: number; wounded: number };
  };
}

export const DEFAULT_CONFIG: BattleConfig = {
  maxRounds: 10,
  baseDamage: 100,
  damageVariance: 0.2,
  criticalRate: 0.15,
  criticalDamage: 1.5,
  expBase: 100,
  maxExp: 10000,
  winExpMultiplier: 1.5,
  loseExpMultiplier: 0.5,
  goldMultiplier: 0.1,
  fameMultiplier: 0.05,
};

// ==================== 技能系统 ====================

export interface SkillEffect {
  id: number;
  name: string;
  type: 'attack' | 'heal' | 'buff' | 'debuff';
  value: number;
  range: 'single' | 'all' | 'self';
  duration?: number; // 回合数
}

export interface BattleSkill {
  id: number;
  configId: number;
  name: string;
  probability: number; // 触发概率
  effect: SkillEffect;
  level: number;
}

// 技能配置类型
const SKILL_CONFIGS: Record<string, any> = {};

/**
 * 设置技能配置
 */
export function setSkillConfigs(configs: Record<string, any>) {
  Object.assign(SKILL_CONFIGS, configs);
}

/**
 * 获取技能效果
 */
export function getSkillEffect(configId: number): BattleSkill | null {
  // 从配置中查找技能
  for (const category of Object.values(SKILL_CONFIGS)) {
    if (Array.isArray(category)) {
      const skill = (category as any[]).find((s: any) => s.id === configId || s.randomID === configId);
      if (skill) {
        return {
          id: skill.id,
          configId: skill.randomID,
          name: skill.name,
          probability: (skill.probability || 30) / 100,
          effect: {
            id: skill.effID,
            name: skill.name,
            type: 'attack',
            value: skill.effectValue || 100,
            range: 'single',
          },
          level: 1,
        };
      }
    }
  }
  return null;
}

/**
 * 技能触发判定
 */
export function tryTriggerSkill(
  unit: BattleUnit,
  skillId: number,
  config: BattleConfig = DEFAULT_CONFIG
): { triggered: boolean; effect: SkillEffect | null } {
  const skill = getSkillEffect(skillId);
  if (!skill) return { triggered: false, effect: null };

  const triggered = Math.random() < skill.probability;
  return {
    triggered,
    effect: triggered ? skill.effect : null,
  };
}

/**
 * 应用技能效果
 */
export function applySkillEffect(
  target: BattleUnit,
  effect: SkillEffect
): { damage?: number; heal?: number; buff?: { stat: string; value: number; duration: number } } {
  switch (effect.type) {
    case 'attack':
      return { damage: effect.value };
    case 'heal':
      return { heal: effect.value };
    case 'buff':
      return { buff: { stat: 'attack', value: effect.value, duration: effect.duration || 2 } };
    case 'debuff':
      return { buff: { stat: 'defense', value: -effect.value, duration: effect.duration || 2 } };
  }
  return {};
}

/**
 * 计算伤害 (支持兵种相克)
 */
export function calculateDamage(
  attacker: BattleUnit,
  defender: BattleUnit,
  config: BattleConfig = DEFAULT_CONFIG,
  attackerType?: number,
  defenderType?: number
): { damage: number; isCrit: boolean; isMiss: boolean; bonus?: number } {
  // 基础伤害
  let damage = config.baseDamage * (attacker.attack / 100);

  // 防御减免 (简单公式)
  const defenseReduction = defender.defense / (defender.defense + 1000);
  damage = damage * (1 - defenseReduction);

  // 兵种相克加成
  let typeBonus = 1;
  if (attackerType !== undefined && defenderType !== undefined) {
    typeBonus = getUnitTypeBonus(attackerType, defenderType);
    damage = damage * typeBonus;
  }

  // 浮动 (±20%)
  const variance = 1 - config.damageVariance + Math.random() * config.damageVariance * 2;
  damage = damage * variance;

  // 暴击判定
  const isCrit = Math.random() < attacker.critRate;
  if (isCrit) {
    damage = damage * attacker.critDamage * config.criticalDamage;
  }

  // 闪避判定 (简单)
  const isMiss = Math.random() < 0.1; // 10% 闪避率

  if (isMiss) {
    damage = 0;
  }

  return {
    damage: Math.max(1, Math.floor(damage)),
    isCrit,
    isMiss,
    bonus: typeBonus > 1 ? typeBonus : undefined,
  };
}

/**
 * 生成战斗回合 (支持技能触发)
 */
export function generateBattleRounds(
  attackerUnits: BattleUnit[],
  defenderUnits: BattleUnit[],
  terrainBonus: number = 0,
  config: BattleConfig = DEFAULT_CONFIG,
  skillOverrides?: Record<number, number[]> // unitId -> skillIds
): BattleRound[] {
  const rounds: BattleRound[] = [];

  // 复制单位数据（避免修改原始数据）
  const attackers = attackerUnits.map(u => ({ ...u, hp: u.maxHp }));
  const defenders = defenderUnits.map(u => ({ ...u, hp: u.maxHp }));

  // 按速度排序
  const allUnits = [...attackers, ...defenders].sort((a, b) => b.speed - a.speed);

  for (let round = 1; round <= config.maxRounds; round++) {
    const roundData: BattleRound = {
      round,
      attacker: {
        unitId: -1,
        name: 'wait',
        action: 'wait',
      },
      defender: {
        unitId: -1,
        name: 'wait',
        action: 'wait',
      },
    };

    // 检查是否结束
    const attackerAlive = attackers.filter(u => u.hp > 0);
    const defenderAlive = defenders.filter(u => u.hp > 0);

    if (attackerAlive.length === 0 && defenderAlive.length === 0) {
      roundData.winner = 'draw';
      break;
    } else if (attackerAlive.length === 0) {
      roundData.winner = 'defender';
      break;
    } else if (defenderAlive.length === 0) {
      roundData.winner = 'attacker';
      break;
    }

    // 攻击方行动
    for (const attacker of attackers.filter(u => u.hp > 0)) {
      const target = defenderAlive[Math.floor(Math.random() * defenderAlive.length)];
      if (!target) break;

      // 检查是否触发技能
      const unitSkills = skillOverrides?.[attacker.id];
      let useSkill = false;
      let skillEffect = '';

      if (unitSkills && unitSkills.length > 0) {
        const skillId = unitSkills[Math.floor(Math.random() * unitSkills.length)];
        const { triggered, effect } = tryTriggerSkill(attacker, skillId, config);
        if (triggered && effect) {
          useSkill = true;
          const result = applySkillEffect(target, effect);
          if (result.damage) {
            target.hp = Math.max(0, target.hp - result.damage);
            skillEffect = `${effect.name}`;
          }
        }
      }

      // 普通攻击
      if (!useSkill) {
        const result = calculateDamage(attacker, target, config, attacker.type, target.type);
        target.hp = Math.max(0, target.hp - result.damage);

        roundData.attacker = {
          unitId: attacker.id,
          name: attacker.name,
          action: result.isMiss ? 'defend' : 'attack',
          target: target.id,
          damage: result.damage,
          hp: target.hp,
          crit: result.isCrit,
          miss: result.isMiss,
        };
      } else {
        // 技能攻击
        roundData.attacker = {
          unitId: attacker.id,
          name: attacker.name,
          action: 'skill',
          target: target.id,
          damage: target.hp,
          hp: target.hp,
          skillEffect,
        };
      }

      if (target.hp === 0) break;
    }

    // 防守方反击
    for (const defender of defenders.filter(u => u.hp > 0)) {
      const target = attackerAlive.filter(u => u.hp > 0)[Math.floor(Math.random() * attackerAlive.length)];
      if (!target) break;

      // 检查是否触发技能
      const unitSkills = skillOverrides?.[defender.id];
      let useSkill = false;
      let skillEffect = '';

      if (unitSkills && unitSkills.length > 0) {
        const skillId = unitSkills[Math.floor(Math.random() * unitSkills.length)];
        const { triggered, effect } = tryTriggerSkill(defender, skillId, config);
        if (triggered && effect) {
          useSkill = true;
          const result = applySkillEffect(target, effect);
          if (result.damage) {
            target.hp = Math.max(0, target.hp - result.damage);
            skillEffect = `${effect.name}`;
          }
        }
      }

      // 普通攻击
      if (!useSkill) {
        const result = calculateDamage(defender, target, config, defender.type, target.type);
        target.hp = Math.max(0, target.hp - result.damage);

        roundData.defender = {
          unitId: defender.id,
          name: defender.name,
          action: result.isMiss ? 'defend' : 'attack',
          target: target.id,
          damage: result.damage,
          hp: target.hp,
          crit: result.isCrit,
          miss: result.isMiss,
        };
      } else {
        // 技能攻击
        roundData.defender = {
          unitId: defender.id,
          name: defender.name,
          action: 'skill',
          target: target.id,
          damage: target.hp,
          hp: target.hp,
          skillEffect,
        };
      }

      if (target.hp === 0) break;
    }

    rounds.push(roundData);
  }

  return rounds;
}

/**
 * 计算战斗奖励
 */
export function calculateRewards(
  isWin: boolean,
  defenderPower: number,
  battleType: 'pve' | 'pvp' | 'arena',
  config: BattleConfig = DEFAULT_CONFIG
): { exp: number; gold: number; food: number; fame: number; prestige: number } {
  let exp: number;
  let gold = 0;
  let fame = 0;
  let prestige = 0;
  
  if (isWin) {
    exp = Math.floor(config.expBase * (1 + defenderPower / 2000) * config.winExpMultiplier);
    gold = Math.floor(defenderPower * config.goldMultiplier);
    fame = Math.floor(defenderPower * config.fameMultiplier);
    prestige = 10;
    
    if (battleType === 'pvp') {
      prestige = 20;
    } else if (battleType === 'arena') {
      prestige = 30;
    }
  } else {
    exp = Math.floor(config.expBase * config.loseExpMultiplier);
    gold = 0;
    fame = Math.floor(defenderPower * config.fameMultiplier * 0.1);
    prestige = -5;
  }
  
  return {
    exp: Math.min(exp, config.maxExp),
    gold,
    food: Math.floor(gold * 0.5),
    fame: Math.max(0, fame),
    prestige,
  };
}

/**
 * 判断胜负类型
 */
export function determineWinType(
  rounds: BattleRound[],
  totalAttackerUnits: number,
  totalDefenderUnits: number
): 'annihilation' | 'breakthrough' | 'escape' {
  const lastRound = rounds[rounds.length - 1];
  const attackerKilled = lastRound?.attacker?.damage ? 1 : 0; // 简化
  const defenderKilled = lastRound?.defender?.damage ? 1 : 0;
  
  // 全歼
  if (defenderKilled >= totalDefenderUnits) {
    return 'annihilation';
  }
  
  // 突围（提前结束）
  if (rounds.length < DEFAULT_CONFIG.maxRounds) {
    return 'breakthrough';
  }
  
  // 默认
  return 'escape';
}

/**
 * 验证战斗合法性
 */
export function validateBattle(
  attackerPower: number,
  defenderPower: number,
  levelDiff: number = 5
): { valid: boolean; reason?: string; adjustedRate?: number } {
  // 等级差距检查 (超过5级)
  if (levelDiff > 5) {
    return {
      valid: false,
      reason: 'Level difference too large (>5)',
    };
  }
  
  // 战斗力差距检查 (超过10倍)
  if (attackerPower > defenderPower * 10) {
    return {
      valid: false,
      reason: 'Power difference too large (>10x)',
    };
  }
  
  return { valid: true };
}

/**
 * 计算胜率（用于前端显示）
 */
export function calculateWinRate(
  attackerPower: number,
  defenderPower: number
): number {
  // 简单公式：50% 基准 + 战斗力差距
  const baseRate = 0.5;
  const powerRatio = attackerPower / (attackerPower + defenderPower);
  
  return Math.min(0.95, Math.max(0.05, baseRate + (powerRatio - 0.5) * 0.4));
}

/**
 * 计算战斗力（从数据库数据）
 */
export function calculatePowerFromHeroes(heroes: any[], heroConfigs: any): number {
  let totalPower = 0;
  
  for (const hero of heroes) {
    const portrait = (heroConfigs.Portrait || []).find((p: any) => p.Index === hero.config_id);
    const ability = (heroConfigs.Ability || []).find((a: any) => a.Index === portrait?.AbilityIndex);
    
    if (ability) {
      // 计算武将战力
      const baseAttack = ability.Attack || 10;
      const baseDefence = ability.Defence || 8;
      const baseHp = (ability as any).MaxHp || 100;
      
      const qualityBonus = 1 + ((hero as any).quality - 1) * 0.2;
      const levelBonus = 1 + ((hero as any).level - 1) * 0.1;
      
      const attack = Math.floor(baseAttack * qualityBonus * levelBonus);
      const defense = Math.floor(baseDefence * qualityBonus * levelBonus);
      const hp = Math.floor(baseHp * qualityBonus * levelBonus);
      
      const power = Math.floor((attack + defense + hp / 10) * qualityBonus);
      totalPower += power;
    }
  }
  
  return totalPower;
}

// ==================== 战斗录像系统 ====================

/**
 * 战斗录像编码
 * 将战斗数据编码为紧凑的字符串格式
 */
export function encodeBattleReplay(
  rounds: BattleRound[],
  attackerUnits: BattleUnit[],
  defenderUnits: BattleUnit[],
  winner: 'attacker' | 'defender' | 'draw',
  config: BattleConfig = DEFAULT_CONFIG
): string {
  const replay = {
    v: 1, // 版本
    c: config, // 配置快照
    a: attackerUnits.map(u => ({
      i: u.id,
      c: u.configId,
      n: u.name,
      m: u.maxHp,
    })),
    d: defenderUnits.map(u => ({
      i: u.id,
      c: u.configId,
      n: u.name,
      m: u.maxHp,
    })),
    w: winner,
    r: rounds.map(r => ({
      aa: r.attacker.action !== 'wait' ? {
        i: r.attacker.unitId,
        t: r.attacker.target,
        d: r.attacker.damage,
        c: r.attacker.crit ? 1 : 0,
        m: r.attacker.miss ? 1 : 0,
      } : null,
      da: r.defender.action !== 'wait' ? {
        i: r.defender.unitId,
        t: r.defender.target,
        d: r.defender.damage,
        c: r.defender.crit ? 1 : 0,
        m: r.defender.miss ? 1 : 0,
      } : null,
    })),
  };

  return Buffer.from(JSON.stringify(replay)).toString('base64');
}

/**
 * 战斗录像解码
 */
export function decodeBattleReplay(encoded: string): {
  rounds: BattleRound[];
  attackerUnits: BattleUnit[];
  defenderUnits: BattleUnit[];
  winner: 'attacker' | 'defender' | 'draw';
} | null {
  try {
    const replay = JSON.parse(Buffer.from(encoded, 'base64').toString());

    // 重建完整回合数据
    const rounds: BattleRound[] = replay.r.map((r: any, idx: number) => ({
      round: idx + 1,
      winner: idx === replay.r.length - 1 ? replay.w : undefined,
      attacker: r.aa ? {
        unitId: r.aa.i,
        name: getUnitName(r.aa.i, replay.a, replay.d),
        action: 'attack' as const,
        target: r.aa.t,
        damage: r.aa.d,
        crit: r.aa.c === 1,
        miss: r.aa.m === 1,
      } : {
        unitId: -1,
        name: 'wait',
        action: 'defend' as const,
      },
      defender: r.da ? {
        unitId: r.da.i,
        name: getUnitName(r.da.i, replay.d, replay.a),
        action: 'attack' as const,
        target: r.da.t,
        damage: r.da.d,
        crit: r.da.c === 1,
        miss: r.da.m === 1,
      } : {
        unitId: -1,
        name: 'wait',
        action: 'defend' as const,
      },
    }));

    return {
      rounds,
      attackerUnits: replay.a,
      defenderUnits: replay.d,
      winner: replay.w,
    };
  } catch {
    return null;
  }
}

function getUnitName(unitId: number, units: any[], fallback: any[]): string {
  const unit = units.find(u => u.i === unitId);
  return unit?.n || fallback.find(u => u.i === unitId)?.n || 'Unknown';
}

// ==================== 增强战报 ====================

/**
 * 生成详细战报
 */
export function generateDetailedReport(
  rounds: BattleRound[],
  attackerUnits: BattleUnit[],
  defenderUnits: BattleUnit[],
  winner: 'attacker' | 'defender' | 'draw',
  isWin: boolean,
  rewards: { exp: number; gold: number; food: number; fame: number; prestige: number },
  battleType: 'pve' | 'pvp' | 'arena',
  defenderPower: number,
  attackerPower: number
): BattleReport {
  // 计算伤亡
  const attackerInitial = attackerUnits.reduce((sum, u) => sum + u.maxHp, 0);
  const defenderInitial = defenderUnits.reduce((sum, u) => sum + u.maxHp, 0);

  const attackerRemaining = rounds[rounds.length - 1]?.attacker?.hp || 0;
  const defenderRemaining = rounds[rounds.length - 1]?.defender?.hp || 0;

  const attackerLoss = Math.max(0, attackerInitial - attackerRemaining);
  const defenderLoss = Math.max(0, defenderInitial - defenderRemaining);

  // 生成战报
  const report: BattleReport = {
    battleId: Date.now(),
    timestamp: new Date().toISOString(),
    attacker: 'player',
    defender: battleType === 'pve' ? 'dungeon' : 'enemy',
    terrain: 'plain',
    rounds,
    winner,
    winType: determineWinType(rounds, attackerUnits.length, defenderUnits.length),
    rewards,
    losses: {
      attacker: {
        killed: Math.floor(attackerLoss / 100), // 简化：每100血量=1死
        wounded: 0,
      },
      defender: {
        killed: Math.floor(defenderLoss / 100),
        wounded: 0,
      },
    },
  };

  return report;
}

// ==================== 兵种相克系统 ====================

export type UnitType = 'infantry' | 'cavalry' | 'archer' | 'spearman' | 'hero';

// 兵种相克矩阵 (攻击方 -> 防御方 = 加成倍数)
const UNIT_TYPE_BONUS: Record<UnitType, Partial<Record<UnitType, number>>> = {
  infantry: { cavalry: 1.5, archer: 0.8 },   // 枪兵克骑，被弓克
  cavalry: { infantry: 1.5, archer: 0.8 },   // 骑克枪，被弓克
  archer: { infantry: 1.3, cavalry: 1.5 },   // 弓对步1.3，对骑1.5
  spearman: { cavalry: 1.4 },                 // 枪兵特殊
  hero: {},                                    // 英雄无相克
};

// 兵种名称映射 (武将配置中的类型)
const UNIT_TYPE_MAP: Record<number, UnitType> = {
  1: 'infantry',   // 步兵
  2: 'cavalry',    // 骑兵
  3: 'archer',     // 弓兵
  4: 'spearman',   // 枪兵
  5: 'hero',       // 英雄
};

/**
 * 获取兵种类型
 */
export function getUnitType(configType: number): UnitType {
  return UNIT_TYPE_MAP[configType] || 'hero';
}

/**
 * 计算兵种相克加成
 */
export function getUnitTypeBonus(
  attackerType: UnitType | number,
  defenderType: UnitType | number
): number {
  const attType = typeof attackerType === 'number' ? getUnitType(attackerType) : attackerType;
  const defType = typeof defenderType === 'number' ? getUnitType(defenderType) : defenderType;

  // 查找加成
  const bonuses = UNIT_TYPE_BONUS[attType];
  if (!bonuses) return 1;

  const bonus = bonuses[defType];
  return bonus || 1;
}

/**
 * 应用兵种相克到伤害
 */
export function applyUnitTypeBonus(
  baseDamage: number,
  attackerType: UnitType | number,
  defenderType: UnitType | number
): number {
  const bonus = getUnitTypeBonus(attackerType, defenderType);
  return Math.floor(baseDamage * bonus);
}

/**
 * 获取相克描述
 */
export function getTypeBonusDescription(): string[] {
  return [
    '枪兵 → 骑兵: +50% 伤害',
    '骑兵 → 步兵: +50% 伤害',
    '弓兵 → 骑兵: +50% 伤害',
    '弓兵 → 步兵: +30% 伤害',
  ];
}

export interface SkillCombo {
  id: number;
  name: string;
  skills: number[]; // 技能ID列表
  effect: SkillEffect;
  bonus: number; // 组合加成 (如 1.5 表示 50% 加成)
}

/**
 * 技能组合配置
 */
const SKILL_COMBOS: SkillCombo[] = [
  {
    id: 1,
    name: '火凤燎原',
    skills: [101, 102], // 烈火 + 爆燃
    effect: { id: 999, name: '火焰爆发', type: 'attack', value: 200, range: 'all' },
    bonus: 1.5,
  },
  {
    id: 2,
    name: '冰封千里',
    skills: [201, 202], // 寒冰 + 暴雪
    effect: { id: 998, name: '群体冻结', type: 'debuff', value: 30, range: 'all', duration: 2 },
    bonus: 1.8,
  },
];

/**
 * 检查技能组合
 */
export function checkSkillCombo(skillIds: number[]): { combo: SkillCombo | null; bonus: number } {
  for (const combo of SKILL_COMBOS) {
    const matched = combo.skills.every(s => skillIds.includes(s));
    if (matched) {
      return { combo, bonus: combo.bonus };
    }
  }
  return { combo: null, bonus: 1 };
}

/**
 * 应用技能组合效果
 */
export function applyComboEffect(
  targets: BattleUnit[],
  combo: SkillCombo
): { damages: number[]; effectType: string } {
  const baseDamage = combo.effect.value * combo.bonus;

  return {
    damages: targets.map(t => Math.floor(baseDamage * (100 / (t.defense + 100)))),
    effectType: combo.effect.name,
  };
}

// ==================== 技能冷却系统 ====================

export interface SkillCooldown {
  skillId: number;
  remainingRounds: number;
  maxRounds: number;
}

/**
 * 初始化技能冷却
 */
export function initSkillCooldowns(skillIds: number[]): SkillCooldown[] {
  return skillIds.map(id => ({
    skillId: id,
    remainingRounds: 0,
    maxRounds: 3, // 默认3回合冷却
  }));
}

/**
 * 更新技能冷却
 */
export function updateSkillCooldowns(cooldowns: SkillCooldown[]): SkillCooldown[] {
  return cooldowns.map(cd => ({
    ...cd,
    remainingRounds: Math.max(0, cd.remainingRounds - 1),
  }));
}

/**
 * 检查技能是否在冷却中
 */
export function isSkillOnCooldown(skillId: number, cooldowns: SkillCooldown[]): boolean {
  const cd = cooldowns.find(c => c.skillId === skillId);
  return cd ? cd.remainingRounds > 0 : false;
}

/**
 * 设置技能冷却
 */
export function setSkillCooldown(skillId: number, cooldowns: SkillCooldown[]): SkillCooldown[] {
  return cooldowns.map(cd =>
    cd.skillId === skillId
      ? { ...cd, remainingRounds: cd.maxRounds }
      : cd
  );
}
