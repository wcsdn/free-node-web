/**
 * 战斗引擎 - 核心逻辑
 * 
 * 实现完整的战斗系统：
 * - 回合制战斗
 * - 胜负判定
 * - 奖励发放
 * - 战报生成
 */

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
    action: 'attack' | 'skill' | 'defend' | 'escape';
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
    action: 'attack' | 'skill' | 'defend' | 'escape';
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

/**
 * 计算伤害
 */
export function calculateDamage(
  attacker: BattleUnit,
  defender: BattleUnit,
  config: BattleConfig = DEFAULT_CONFIG
): { damage: number; isCrit: boolean; isMiss: boolean } {
  // 基础伤害
  let damage = config.baseDamage * (attacker.attack / 100);
  
  // 防御减免 (简单公式)
  const defenseReduction = defender.defense / (defender.defense + 1000);
  damage = damage * (1 - defenseReduction);
  
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
  };
}

/**
 * 生成战斗回合
 */
export function generateBattleRounds(
  attackerUnits: BattleUnit[],
  defenderUnits: BattleUnit[],
  terrainBonus: number = 0,
  config: BattleConfig = DEFAULT_CONFIG
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
        action: 'defend',
      },
      defender: {
        unitId: -1,
        name: 'wait',
        action: 'defend',
      },
    };
    
    // 检查是否结束
    const attackerAlive = attackers.filter(u => u.hp > 0);
    const defenderAlive = defenders.filter(u => u.hp > 0);
    
    if (attackerAlive.length === 0 && defenderAlive.length === 0) {
      // 平局
      roundData.winner = 'draw';
      break;
    } else if (attackerAlive.length === 0) {
      roundData.winner = 'defender';
      break;
    } else if (defenderAlive.length === 0) {
      roundData.winner = 'attacker';
      break;
    }
    
    // 每回合攻击
    for (const attacker of attackers.filter(u => u.hp > 0)) {
      const target = defenderAlive[Math.floor(Math.random() * defenderAlive.length)];
      if (!target) break;
      
      const { damage, isCrit, isMiss } = calculateDamage(attacker, target, config);
      target.hp = Math.max(0, target.hp - damage);
      
      roundData.attacker = {
        unitId: attacker.id,
        name: attacker.name,
        action: 'attack',
        target: target.id,
        damage,
        hp: target.hp,
        crit: isCrit,
        miss: isMiss,
      };
      
      // 检查是否胜利
      if (target.hp === 0) {
        break;
      }
    }
    
    // 防守方反击
    for (const defender of defenders.filter(u => u.hp > 0)) {
      const target = attackerAlive.filter(u => u.hp > 0)[Math.floor(Math.random() * attackerAlive.length)];
      if (!target) break;
      
      const { damage, isCrit, isMiss } = calculateDamage(defender, target, config);
      target.hp = Math.max(0, target.hp - damage);
      
      roundData.defender = {
        unitId: defender.id,
        name: defender.name,
        action: 'attack',
        target: target.id,
        damage,
        hp: target.hp,
        crit: isCrit,
        miss: isMiss,
      };
      
      if (target.hp === 0) {
        break;
      }
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
