/**
 * Ghost Game Worker 类型定义
 */

/**
 * 游戏相关类型扩展
 */
declare module 'hono' {
  interface ContextVariableMap {
    walletAddress: string;
  }
}

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  FEISHU_APP_ID: string;
  FEISHU_APP_SECRET: string;
}

export interface Character {
  wallet_address: string;
  name: string;
  level: number;
  exp: number;
  gold: number;
  vip_level: number;
  created_at: string;
  last_login: string;
}

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
  map_image: string;  // 地图背景图，如 m1.JPG
  last_collect: string;
  created_at: string;
}

export interface Building {
  id: number;
  city_id: number;
  type: string;
  level: number;
  position: number | null;
  state: number;
  config_id: number;
  created_at: string;
}

export interface Hero {
  id: number;
  wallet_address: string;
  city_id: number;
  name: string;
  level: number;
  exp: number;
  quality: number;
  training: number;
  hp: number;
  max_hp: number;
  attack: number;
  defense: number;
  config_id: number;
  state: number;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface JWTPayload {
  address: string;
  iat: number;
  exp: number;
}

// 技能相关类型
export interface DBSkill {
  SkillID: number;
  HeroID: number;
  StaticIndex: number;
  SkillLevel: number;
  EXP: number;
}

export interface SkillInfo {
  SkillID?: number;
  HeroID?: number;
  StaticIndex: number;
  SkillLevel: number;
  EXP: number;
  Name?: string;
  Des?: string;
  Type?: number;
  EffID?: number;
  EffRange?: number;
  EffValue?: number;
  NeedItemType?: number;
  Probability?: number;
}

// 科技相关类型
export interface DBTechnic {
  id: number;
  user_name: string;
  technic_id: number;
  technic_level: number;
  technic_point: number;
  created_at: string;
}

export interface TechnicInfo {
  id: number;
  technic_id: number;
  technic_level: number;
  technic_point: number;
}

export interface TechnicAccess {
  id: number;
  technic_id: number;
  city_id: number;
  technic_level: number;
  technic_point: number;
  user_name: string;
  created_at: string;
}
