/**
 * Game Frontend Types - 前端类型定义
 * 原则：只定义数据结构，与后端 Model 对齐
 */

// ============ City ============
export interface City {
  id: number;
  name: string;
  position: number;
  prosperity: number;
  money: number;
  food: number;
  population: number;
  moneyRate: number;
  foodRate: number;
  level?: number;
  lastCollect?: string;
}

export interface CityListItem {
  ID: number;
  Name: string;
  Position: number;
  Money: number;
  Food: number;
  Population: number;
}

// ============ Building ============
export interface Building {
  id: number;
  configId: number;
  name: string;
  type: 'interior' | 'defense';
  level: number;
  position: number;
  state: number; // 0: idle, 1: building
}

export interface BuildingDetail extends Building {
  icon?: string;
  image?: string;
  maxLevel: number;
  effect: {
    type: number;
    value: number;
  };
  upgradeCost: {
    money: number;
    food: number;
    men: number;
    area: number;
    time: number;
  };
}

// ============ Hero ============
export interface Hero {
  id: number;
  name: string;
  quality: number;
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  skill?: string;
  state: number;
}

export interface HeroDetail extends Hero {
  qualityName: string;
  qualityColor: string;
}

// ============ Item ============
export interface Item {
  id: number;
  configId: number;
  name: string;
  type: number;
  count: number;
  quality?: number;
  equipped?: boolean;
}

export interface ShopItem {
  id: number;
  name: string;
  type: number;
  price: number;
  description: string;
  icon?: string;
  stock?: number;
  dailyLimit?: number;
  dailyPurchased?: number;
  canBuy?: boolean;
}

// ============ Battle ============
export interface BattleResult {
  success: boolean;
  damageDealt: number;
  damageTaken: number;
  expGained: number;
  itemsGained?: Array<{ id: number; count: number }>;
}

// ============ Chat ============
export interface ChatMessage {
  id: number;
  sender: string;
  content: string;
  time: string;
  channel: string;
}

// ============ Mail ============
export interface Mail {
  id: number;
  sender: string;
  title: string;
  content: string;
  time: string;
  read: boolean;
  hasAttachment: boolean;
}

// ============ Response ============
export interface ApiResponse<T = never> {
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

// ============ UI State ============
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
}

export function createAsyncState<T>(): AsyncState<T> {
  return { data: null, loading: 'idle', error: null };
}
