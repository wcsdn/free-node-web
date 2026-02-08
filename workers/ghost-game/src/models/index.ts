/**
 * Core Models - 核心数据模型定义
 * 原则：只定义数据结构，不包含任何业务逻辑
 */

// ============ Character ============
export interface Character {
  id: number;
  wallet_address: string;
  name: string;
  level: number;
  exp: number;
  gold: number;
  vip_level: number;
  created_at: string;
  updated_at: string;
}

export interface CharacterCreate {
  wallet_address: string;
  name: string;
  level?: number;
  exp?: number;
  gold?: number;
  vip_level?: number;
}

// ============ City ============
export interface City {
  id: number;
  wallet_address: string;
  name: string;
  position: number;
  prosperity: number;
  money: number;
  food: number;
  population: number;
  money_rate: number;
  food_rate: number;
  population_rate: number;
  last_collect: string;
  created_at: string;
}

export interface CityCreate {
  wallet_address: string;
  name: string;
  position?: number;
  prosperity?: number;
  money?: number;
  food?: number;
  population?: number;
}

// ============ Building ============
export interface Building {
  id: number;
  city_id: number;
  type: 'interior' | 'defense';
  level: number;
  position: number;
  state: number; // 0: idle, 1: building/upgrading
  config_id: number;
  created_at: string;
}

export interface BuildingConfig {
  ID: number;
  Name: string;
  Type: 'interior' | 'defense';
  InteriorData?: BuildingLevelData[];
  DefenseData?: BuildingLevelData[];
}

export interface BuildingLevelData {
  Level: number;
  Icon: string;
  EffType?: number;
  EffValue?: number;
  CostMoney?: number;
  CostFood?: number;
  CostTime?: number;
}

// ============ Hero ============
export interface Hero {
  id: number;
  city_id: number;
  wallet_address: string;
  name: string;
  quality: number;
  level: number;
  exp: number;
  hp: number;
  max_hp: number;
  atk: number;
  def: number;
  skill?: string;
  state: number; // 0: idle, 1: in-battle
  created_at: string;
}

export interface HeroCreate {
  city_id: number;
  wallet_address: string;
  name: string;
  quality?: number;
  level?: number;
}

export interface HeroConfig {
  ID: number;
  Name: string;
  BaseHp: number;
  BaseAtk: number;
  BaseDef?: number;
  Quality: number;
  Skill?: string;
}

// ============ Item ============
export interface Item {
  id: number;
  wallet_address: string;
  hero_id?: number;
  type: 'consumable' | 'material' | 'equipment';
  config_id: number;
  count: number;
  durability?: number;
  equipped: boolean;
  source: string;
  created_at: string;
}

export interface ItemConfig {
  ID: number;
  Name: string;
  Type: number;
  Des?: string;
  Icon?: string;
  Price?: number;
  EffectType?: number;
  EffectValue?: number;
}

// ============ Battle ============
export interface Battle {
  id: number;
  wallet_address: string;
  battle_type: 'pve' | 'pvp';
  enemy_name: string;
  enemy_level: number;
  result: 'win' | 'lose';
  damage_dealt: number;
  damage_taken: number;
  reward_exp: number;
  reward_items?: string;
  created_at: string;
}

export interface BattleResult {
  win: boolean;
  damageDealt: number;
  damageTaken: number;
  expGained: number;
  itemsGained?: Array<{ id: number; count: number }>;
}

// ============ API Response ============
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ============ Service Result ============
export type ServiceResult<T = never> = 
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

// ============ Helper Functions ============
export function toServiceResult<T>(result: T): ServiceResult<T> {
  return { ok: true, data: result };
}

export function toServiceError(error: string, status = 400): ServiceResult<never> {
  return { ok: false, error, status };
}
