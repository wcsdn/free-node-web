/**
 * 武将服务 - HeroService
 * 
 * 提供武将相关的所有 API 操作：
 * - 武将列表获取
 * - 武将雇佣/解雇
 * - 武将升级
 * - 装备穿戴/卸下
 * - 武将属性转换
 */

import type { HeroData } from '../types';

// API 基础配置
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8788';

// 开发模式配置
const DEV_MODE = import.meta.env.DEV;
const DEV_TEST_WALLET = '0x1234567890123456789012345678901234567890';

// 获取钱包地址
const getWalletAddress = () => DEV_MODE ? DEV_TEST_WALLET : '';

// 通用 API 请求（带钱包认证）
async function heroApiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  data?: any
): Promise<{ success: boolean; data?: T; error?: string }> {
  const url = `${API_BASE}/api${endpoint}`;
  const walletAddress = getWalletAddress();

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Wallet-Auth': DEV_MODE ? `${DEV_TEST_WALLET}:test_signature` : '',
      },
      body: method !== 'GET' ? JSON.stringify({ wallet_address: walletAddress, ...data }) : undefined,
    });

    if (!response.ok) {
      const errMsg = `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errMsg);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error(`Hero API Error [${endpoint}]:`, error);
    return { success: false, error: error.message || 'Network error' };
  }
}

// ============ 武将数据模型 ============

/** 武将等级经验配置 */
export const HERO_EXP_TABLE: Record<number, number> = {
  1: 100,   // 升2级需要100经验
  2: 200,   // 升3级需要200经验
  3: 300,
  4: 400,
  5: 500,
  6: 600,
  7: 700,
  8: 800,
  9: 900,
  10: 1000,
  // ... 以此类推
};

/** 武将升级金币消耗表 */
export const HERO_LEVELUP_COST: Record<number, number> = {
  1: 500,   // 1级升2级需要500金币
  2: 1000,  // 2级升3级需要1000金币
  3: 1500,
  4: 2000,
  5: 3000,
  6: 4000,
  7: 5000,
  8: 6000,
  9: 8000,
  10: 10000,
  // ... 以此类推
};

/** 武将品质枚举 */
export enum HeroQuality {
  White = 1,    // 白色 - 普通
  Green = 2,    // 绿色 - 优秀
  Blue = 3,     // 蓝色 - 精良
  Purple = 4,   // 紫色 - 史诗
  Orange = 5,   // 橙色 - 传说
}

/** 武将品质名称 */
export const HERO_QUALITY_NAMES: Record<number, string> = {
  [HeroQuality.White]: '普通',
  [HeroQuality.Green]: '优秀',
  [HeroQuality.Blue]: '精良',
  [HeroQuality.Purple]: '史诗',
  [HeroQuality.Orange]: '传说',
};

/** 武将品质颜色 */
export const HERO_QUALITY_COLORS: Record<number, string> = {
  [HeroQuality.White]: '#9ca3af',
  [HeroQuality.Green]: '#22c55e',
  [HeroQuality.Blue]: '#3b82f6',
  [HeroQuality.Purple]: '#a855f7',
  [HeroQuality.Orange]: '#f59e0b',
};

/** 兵种类型枚举 */
export enum ArmyType {
  Infantry = 1,   // 步兵
  Cavalry = 2,    // 骑兵
  Archer = 3,     // 弓兵
  Spearman = 4,   // 枪兵
}

/** 兵种名称 */
export const ARMY_TYPE_NAMES: Record<number, string> = {
  [ArmyType.Infantry]: '步兵',
  [ArmyType.Cavalry]: '骑兵',
  [ArmyType.Archer]: '弓兵',
  [ArmyType.Spearman]: '枪兵',
};

/** 兵种图标 */
export const ARMY_TYPE_ICONS: Record<number, string> = {
  [ArmyType.Infantry]: '🗡️',
  [ArmyType.Cavalry]: '🐎',
  [ArmyType.Archer]: '🏹',
  [ArmyType.Spearman]: '⚔️',
};

/** 装备槽位类型 */
export enum EquipSlotType {
  Weapon = 1,     // 武器
  Armor = 2,     // 防具
  Accessory = 3,  // 饰品
}

/** 装备槽位名称 */
export const EQUIP_SLOT_NAMES: Record<number, string> = {
  [EquipSlotType.Weapon]: '武器',
  [EquipSlotType.Armor]: '防具',
  [EquipSlotType.Accessory]: '饰品',
};

// ============ 武将详细数据（包含装备）============

export interface HeroDetailData extends HeroData {
  quality: number;           // 品质
  armyType: number;          // 兵种类型
  attackBase: number;        // 基础攻击
  defenseBase: number;       // 基础防御
  healthBase: number;        // 基础生命
  attackEquip: number;       // 装备加成攻击
  defenseEquip: number;      // 装备加成防御
  healthEquip: number;       // 装备加成生命
  attackGrowth: number;      // 攻击成长
  defenseGrowth: number;     // 防御成长
  healthGrowth: number;      // 生命成长
  maxExp: number;            // 升级所需经验
  levelupCost: number;       // 升级所需金币
  expProgress: number;       // 经验进度百分比
  equippedItems: EquippedItem[];  // 已装备物品
}

/** 已装备物品 */
export interface EquippedItem {
  slotType: EquipSlotType;
  itemId: number;
  itemName: string;
  itemIcon: string;
  quality: number;
  attackBonus: number;
  defenseBonus: number;
  healthBonus: number;
}

// ============ 武将 API 操作 ============

/**
 * 获取武将列表
 * @param cityId 城市ID
 */
export async function getHeroList(cityId: number = 1) {
  return heroApiRequest<any>('/hero/list', 'POST', { city_id: cityId });
}

/**
 * 雇佣武将
 * @param cityId 城市ID
 * @param heroId 武将ID
 */
export async function engageHero(cityId: number, heroId: number) {
  return heroApiRequest<any>('/hero/engage', 'POST', {
    city_id: cityId,
    hero_id: heroId,
  });
}

/**
 * 解雇武将
 * @param cityId 城市ID
 * @param heroId 武将ID
 */
export async function fireHero(cityId: number, heroId: number) {
  return heroApiRequest<any>('/hero/fire', 'POST', {
    city_id: cityId,
    hero_id: heroId,
  });
}

/**
 * 卸下装备
 * @param cityId 城市ID
 * @param heroId 武将ID
 */
export async function unequipHeroItem(cityId: number, heroId: number) {
  return heroApiRequest<any>('/hero/unequip', 'POST', {
    city_id: cityId,
    hero_id: heroId,
  });
}

/**
 * 获取可雇佣武将列表
 * @param cityId 城市ID
 */
export async function getHireableHeroes(cityId: number = 1) {
  return heroApiRequest<any>('/hero/hireable', 'POST', { city_id: cityId });
}

/**
 * 获取武将详情
 * @param cityId 城市ID
 * @param heroId 武将ID
 */
export async function getHeroDetail(cityId: number, heroId: number) {
  return heroApiRequest<HeroDetailData>('/hero/detail', 'POST', {
    city_id: cityId,
    hero_id: heroId,
  });
}

// ============ 武将升级相关 ============

/**
 * 武将升级
 * @param cityId 城市ID
 * @param heroId 武将ID
 * @param useGold 是否使用金币立即完成（否则使用经验）
 */
export async function upgradeHeroLevel(cityId: number, heroId: number, useGold: boolean = false) {
  return heroApiRequest<any>('/hero/levelup', 'POST', {
    city_id: cityId,
    hero_id: heroId,
    use_gold: useGold,
  });
}

/**
 * 计算武将战斗力
 * 公式：战斗力 = 攻击 * 1.5 + 防御 * 1.2 + 生命 * 0.5 + 技能 * 2
 */
export function calculateHeroPower(hero: HeroData): number {
  return Math.floor(
    hero.attack * 1.5 +
    hero.defense * 1.2 +
    hero.health * 0.5 +
    hero.skill * 2
  );
}

/**
 * 计算升级所需经验
 * @param currentLevel 当前等级
 */
export function getLevelupExp(currentLevel: number): number {
  return HERO_EXP_TABLE[currentLevel] || currentLevel * 100;
}

/**
 * 计算升级所需金币
 * @param currentLevel 当前等级
 */
export function getLevelupCost(currentLevel: number): number {
  return HERO_LEVELUP_COST[currentLevel] || currentLevel * 500;
}

/**
 * 获取升级后属性预览
 */
export function getLevelupPreview(hero: HeroData): {
  attack: number;
  defense: number;
  health: number;
  expRequired: number;
  costGold: number;
} {
  const expRequired = getLevelupExp(hero.level);
  const costGold = getLevelupCost(hero.level);
  
  // 假设每级属性成长：攻击+5，防御+3，生命+20，技能+2
  const growthMultiplier = 1; // 可根据品质调整
  
  return {
    attack: hero.attack + 5 * growthMultiplier,
    defense: hero.defense + 3 * growthMultiplier,
    health: hero.health + 20 * growthMultiplier,
    expRequired,
    costGold,
  };
}

// ============ 数据转换函数 ============

/**
 * 转换武将数据（基础）
 */
export function transformHeroData(heroes: any[]): HeroData[] {
  if (!Array.isArray(heroes)) return [];
  
  return heroes.map(h => ({
    id: h.ID || h.id || 0,
    name: h.Name || h.name || '未知',
    level: h.Level || h.level || 1,
    exp: h.ExpCount || h.exp || 0,
    attack: h.Attack || h.attack || 10,
    defense: h.Defence || h.defense || 5,
    health: h.Health || h.health || 100,
    skill: h.Skill || h.skill || 0,
    avatar: h.Icon || h.avatar,
    status: h.State === 0 ? 'idle' : h.State === 1 ? 'fighting' : 'resting',
  }));
}

/**
 * 转换武将详细数据
 */
export function transformHeroDetailData(hero: any): HeroDetailData {
  const baseData = transformHeroData([hero])[0];
  const quality = hero.Quality || hero.quality || HeroQuality.White;
  const armyType = hero.ArmyType || hero.armyType || ArmyType.Infantry;
  
  // 基础属性（不含装备）
  const attackBase = hero.AttackBase || hero.attackBase || baseData.attack;
  const defenseBase = hero.DefenceBase || hero.defenseBase || baseData.defense;
  const healthBase = hero.HealthBase || hero.healthBase || baseData.health;
  
  // 装备加成
  const attackEquip = hero.AttackEquip || hero.attackEquip || 0;
  const defenseEquip = hero.DefenceEquip || hero.defenseEquip || 0;
  const healthEquip = hero.HealthEquip || hero.healthEquip || 0;
  
  // 成长值
  const attackGrowth = hero.AttackGrowth || hero.attackGrowth || 5;
  const defenseGrowth = hero.DefenceGrowth || hero.defenseGrowth || 3;
  const healthGrowth = hero.HealthGrowth || hero.healthGrowth || 20;
  
  // 经验进度
  const maxExp = getLevelupExp(baseData.level);
  const expProgress = maxExp > 0 ? Math.min(100, (baseData.exp / maxExp) * 100) : 0;
  
  // 升级消耗
  const levelupCost = getLevelupCost(baseData.level);
  
  // 已装备物品
  const equippedItems: EquippedItem[] = [];
  if (hero.EquippedItems && Array.isArray(hero.EquippedItems)) {
    hero.EquippedItems.forEach((item: any) => {
      equippedItems.push({
        slotType: item.SlotType || item.slotType || EquipSlotType.Weapon,
        itemId: item.ItemID || item.item_id || 0,
        itemName: item.ItemName || item.item_name || '未知',
        itemIcon: item.ItemIcon || item.item_icon || '',
        quality: item.Quality || item.quality || 1,
        attackBonus: item.AttackBonus || item.attackBonus || 0,
        defenseBonus: item.DefenceBonus || item.defenseBonus || 0,
        healthBonus: item.HealthBonus || item.healthBonus || 0,
      });
    });
  }
  
  return {
    ...baseData,
    quality,
    armyType,
    attackBase,
    defenseBase,
    healthBase,
    attackEquip,
    defenseEquip,
    healthEquip,
    attackGrowth,
    defenseGrowth,
    healthGrowth,
    maxExp,
    levelupCost,
    expProgress,
    equippedItems,
  };
}

// ============ 排序和筛选工具 ============

export type HeroSortType = 'level' | 'power' | 'name' | 'quality';
export type HeroFilterType = 'all' | 'idle' | 'fighting' | 'resting';

/**
 * 排序武将列表
 */
export function sortHeroes(heroes: HeroData[], sortBy: HeroSortType): HeroData[] {
  return [...heroes].sort((a, b) => {
    switch (sortBy) {
      case 'level':
        return b.level - a.level;
      case 'power':
        return calculateHeroPower(b) - calculateHeroPower(a);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'quality':
        // 需要 quality 字段，如果没有则按 level 排序
        return b.level - a.level;
      default:
        return 0;
    }
  });
}

/**
 * 筛选武将列表
 */
export function filterHeroes(heroes: HeroData[], filterBy: HeroFilterType): HeroData[] {
  if (filterBy === 'all') return heroes;
  return heroes.filter(hero => hero.status === filterBy);
}

// ============ 武将战斗力计算 ============

/**
 * 计算带装备的武将战斗力
 */
export function calculateHeroPowerWithEquip(hero: HeroDetailData): number {
  const totalAttack = hero.attackBase + hero.attackEquip;
  const totalDefense = hero.defenseBase + hero.defenseEquip;
  const totalHealth = hero.healthBase + hero.healthEquip;
  
  return Math.floor(
    totalAttack * 1.5 +
    totalDefense * 1.2 +
    totalHealth * 0.5 +
    hero.skill * 2
  );
}

/**
 * 获取武将品质颜色
 */
export function getHeroQualityColor(quality: number): string {
  return HERO_QUALITY_COLORS[quality] || HERO_QUALITY_COLORS[HeroQuality.White];
}

/**
 * 获取武将品质名称
 */
export function getHeroQualityName(quality: number): string {
  return HERO_QUALITY_NAMES[quality] || HERO_QUALITY_NAMES[HeroQuality.White];
}

/**
 * 获取兵种名称
 */
export function getArmyTypeName(armyType: number): string {
  return ARMY_TYPE_NAMES[armyType] || ARMY_TYPE_NAMES[ArmyType.Infantry];
}

/**
 * 获取兵种图标
 */
export function getArmyTypeIcon(armyType: number): string {
  return ARMY_TYPE_ICONS[armyType] || ARMY_TYPE_ICONS[ArmyType.Infantry];
}
