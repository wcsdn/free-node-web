/**
 * Ghost Game Models - 从 jx/Model/ 迁移的核心数据模型
 * 原则：只定义数据结构，不包含任何业务逻辑
 */

// ============ User / Character ============
export interface User {
  id: number;
  wallet_address: string;
  name: string;
  level: number;
  exp: number;
  gold: number;
  vip_level: number;
  last_login: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
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
  map_image: string;
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
  money_rate?: number;
  food_rate?: number;
  population_rate?: number;
}

export interface CityInterior {
  id: number;
  wallet_address: string;
  city_id: number;
  position: number;
  building_id: number;
  building_level: number;
  building_state: number;
  image: string;
  icon: string;
  created_at: string;
}

export interface CityInteriorCreate {
  wallet_address: string;
  city_id: number;
  position: number;
  building_id: number;
  building_level?: number;
  building_state?: number;
  image?: string;
  icon?: string;
}

// ============ Building (内政建筑) ============
export interface Building {
  id?: number;
  city_id: number;
  type: 'interior' | 'defense';
  level?: number;
  position: number;
  state?: number; // 0: idle, 1: building, 2: upgrading
  config_id: number;
  created_at?: string;
}

export interface BuildingCreate {
  city_id: number;
  type: 'interior' | 'defense';
  level?: number;
  position: number;
  config_id: number;
}

// 建筑配置
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

// ============ Defence (城防建筑) ============
export interface Defence {
  id: number;
  wallet_address: string;
  city_id: number;
  position: number;
  state: number;
  defence_level: number;
  static_index: number;
  created_at: string;
}

export interface DefenceCreate {
  wallet_address: string;
  city_id: number;
  position: number;
  state?: number;
  defence_level?: number;
  static_index: number;
}

// 城防配置
export interface DefenceConfig {
  ID: number;
  Name: string;
  Type: number;
  MaxLevel: number;
  Icon: string;
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

// 武将配置
export interface HeroConfig {
  ID: number;
  Name: string;
  BaseHp: number;
  BaseAtk: number;
  BaseDef?: number;
  Quality: number;
  Skill?: string;
}

// ============ Skill ============
export interface Skill {
  id: number;
  wallet_address: string;
  static_index: number;
  skill_level: number;
  exp: number;
  created_at: string;
}

export interface SkillCreate {
  wallet_address: string;
  static_index: number;
  skill_level?: number;
  exp?: number;
}

export interface SkillConfig {
  ID: number;
  Name: string;
  Des?: string;
  Type: number;
  EffID?: number;
  EffRange?: number;
  EffValue?: number;
  NeedItemType?: number;
  Probability?: number;
}

// ============ Technic ============
export interface Technic {
  id: number;
  wallet_address: string;
  technic_id: number;
  technic_level: number;
  technic_point: number;
  created_at: string;
}

export interface TechnicCreate {
  wallet_address: string;
  technic_id: number;
  technic_level?: number;
  technic_point?: number;
}

export interface TechnicConfig {
  ID: number;
  Name: string;
  Des?: string;
  Type: number;
  MaxLevel: number;
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

export interface ItemCreate {
  wallet_address: string;
  hero_id?: number;
  type: 'consumable' | 'material' | 'equipment';
  config_id: number;
  count: number;
  source: string;
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

// ============ Chat ============
export interface ChatMessage {
  id: number;
  sender: string;
  sender_name: string;
  content: string;
  channel: string;
  type: number;
  target?: string;
  created_at: string;
}

export interface ChatMessageCreate {
  sender: string;
  sender_name: string;
  content: string;
  channel?: string;
  type?: number;
  target?: string;
}

// ============ Mail ============
export interface Mail {
  id: number;
  wallet_address: string;
  title: string;
  content: string;
  type: number;
  is_read: number;
  has_attachment: number;
  attachment?: string;
  created_at: string;
}

export interface MailCreate {
  wallet_address: string;
  title: string;
  content: string;
  type?: number;
  has_attachment?: number;
  attachment?: string;
}

// ============ Event ============
export interface GameEvent {
  id: number;
  event_type: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_active: number;
  created_at: string;
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

export interface BattleCreate {
  wallet_address: string;
  battle_type: 'pve' | 'pvp';
  enemy_name: string;
  enemy_level: number;
  result: 'win' | 'lose';
  damage_dealt: number;
  damage_taken: number;
  reward_exp: number;
  reward_items?: string;
}

// ============ Corps (军团) ============
export interface Corps {
  id: number;
  name: string;
  leader_id: string;
  city_id: number;
  level: number;
  exp: number;
  state: number;
  notice?: string;
  member_count: number;
  created_at: string;
  updated_at?: string;
}

export interface CorpsMember {
  id: number;
  corps_id: number;
  wallet_address: string;
  name: string;
  position: number; // 1: leader, 2: deputy, 3: member
  contribution: number;
  joined_at: string;
}

export interface CorpsApply {
  id: number;
  corps_id: number;
  wallet_address: string;
  message?: string;
  status: number; // 0: pending, 1: approved, 2: rejected
  created_at: string;
}

// ============ Task ============
export interface UserTask {
  id: number;
  wallet_address: string;
  task_id: number;
  status: number; // 0: not started, 1: in progress, 2: completed, 3: rewarded
  progress: number;
  completed_at?: string;
  created_at: string;
}

export interface TaskConfig {
  ID: number;
  Name: string;
  Des?: string;
  Type: number;
  Target: number;
  RewardGold?: number;
  RewardExp?: number;
  NeedItem?: number;
}

// ============ NPCFloor ============
export interface NPCFloor {
  id: number;
  floor: number;
  name: string;
  enemy_id: number;
  enemy_level: number;
  difficulty: number;
  exp_reward: number;
  gold_reward: number;
  drop_item_id?: number;
  drop_rate?: number;
}

// ============ Arena ============
export interface ArenaRanking {
  id: number;
  wallet_address: string;
  name: string;
  rank: number;
  score: number;
  win_count: number;
  lose_count: number;
  last_battle_time?: string;
  created_at: string;
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

// ============ Chess (棋类/战棋) ============
export interface ChessPiece {
  id: string;
  type: string; // 'soldier', 'horse', 'chariot', etc.
  player: 1 | 2;
  row: number;
  col: number;
  captured: boolean;
}

export interface ChessBoard {
  id?: number;
  wallet_address: string;
  board_data: ChessPiece[];
  current_turn: 1 | 2;
  status: number; // 0: playing, 1: player1 win, 2: player2 win
  created_at?: string;
  updated_at?: string;
}

// ============ Dungeon (副本) ============
export interface Dungeon {
  id: number;
  name: string;
  description: string;
  difficulty: number; // 1: easy, 2: normal, 3: hard, 4: nightmare
  recommended_level: number;
  floors: number;
  reward_exp: number;
  reward_gold: number;
  drop_item_ids?: string;
  is_active: number;
}

export interface DungeonProgress {
  id?: number;
  wallet_address: string;
  dungeon_id: number;
  best_floor: number;
  win_count: number;
  last_time: string;
  created_at?: string;
  updated_at?: string;
}

// ============ Arena (竞技场) ============
export interface ArenaRanking {
  id: number;
  wallet_address: string;
  name: string;
  rank: number;
  score: number;
  win_count: number;
  lose_count: number;
  last_battle_time?: string;
  created_at: string;
}

// ============ Battle (战斗) ============
export interface BattleRecord {
  id?: number;
  wallet_address: string;
  battle_type: string;
  opponent_id: string;
  result: 'win' | 'lose' | 'draw';
  attacker_power: number;
  defender_power: number;
  attacker_loss: number;
  defender_loss: number;
  created_at?: string;
}
