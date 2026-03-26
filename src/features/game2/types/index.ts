/**
 * 游戏2 - 类型定义
 */

// 城市数据
export interface CityData {
  id: number;
  name: string;
  level: number;
  population: number;
  gold: number;
  food: number;
  wood: number;
  stone: number;
  iron: number;
}

// 武将数据
export interface HeroData {
  id: number;
  name: string;
  level: number;
  exp: number;
  attack: number;
  defense: number;
  health: number;
  skill: number;
  avatar?: string;
  status: 'idle' | 'fighting' | 'resting';
}

// 建筑数据
export interface BuildingData {
  id: number;
  type: BuildingType;
  name: string;
  level: number;
  maxLevel: number;
  status: 'normal' | 'upgrading' | 'damaged';
  position: { x: number; y: number };
}

export type BuildingType = 
  | 'town_hall'      // 城主府
  | 'barracks'       // 兵营
  | 'academy'        // 校场
  | 'warehouse'      // 仓库
  | 'farm'           // 农田
  | 'lumber_mill'    // 伐木场
  | 'quarry'         // 采石场
  | 'iron_mine'      // 铁矿
  | 'market'         // 市场
  | 'wall'           // 城墙
  | 'watchtower'     // 瞭望塔
  | 'hospital';      // 医馆

// 资源数据
export interface ResourceData {
  gold: number;
  food: number;
  wood: number;
  stone: number;
  iron: number;
}

// 游戏状态
export interface GameState {
  playerId: number;
  playerName: string;
  city: CityData;
  heroes: HeroData[];
  buildings: BuildingData[];
  resources: ResourceData;
  lastUpdate: number;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

// 武将状态
export type HeroStatus = 'idle' | 'fighting' | 'resting' | 'dead';

// 建筑升级状态
export type BuildingStatus = 'normal' | 'upgrading' | 'damaged';

// 面板类型
export type PanelType = 
  | 'dashboard' 
  | 'city' 
  | 'hero' 
  | 'building' 
  | 'defense' 
  | 'arena' 
  | 'mail' 
  | 'rank' 
  | 'task' 
  | 'warfare' 
  | 'battle' 
  | 'tech' 
  | 'map' 
  | 'market' 
  | 'trade' 
  | 'item'
  | 'event'
  | 'help'
  | 'signin'
  | 'giftcode'
  | 'settings';

// ============ 邮件相关类型 ============

// 邮件类型
export type MailType = 0 | 1 | 2; // 0=系统, 1=玩家, 2=战报

// 邮件附件
export interface MailAttachment {
  id?: number;
  name: string;
  type: string;
  count?: number;
  claimed?: boolean;
}

// 邮件数据
export interface MailData {
  id: number;
  title: string;
  content: string;
  from_user: string;
  to_user: string;
  type: MailType;
  read: boolean;
  claimed?: boolean;
  attachments?: MailAttachment[];
  created_at: string;
}

// 邮件详情
export interface MailDetail extends MailData {
  wallet_address?: string;
}

// 邮件列表响应
export interface MailListResponse {
  mails: MailData[];
  total: number;
  page: number;
}

// 发送邮件请求
export interface SendMailRequest {
  to_user: string;
  title: string;
  content: string;
  attachments?: MailAttachment[];
}

// 邮件统计
export interface MailStats {
  total: number;
  unread: number;
}

// ============ 排行榜相关类型 ============

// 排行榜类型
export type RankType = 1 | 2 | 3 | 4;

// 排行榜类型枚举（对应后端 rank_type）
export enum RankTypeEnum {
  Level = 1,   // 等级/城等级排行榜
  Power = 2,   // 战斗力排行榜
  Wealth = 3,  // 财富排行榜
  Hero = 4,    // 武将强弱排行榜
}

// 排行榜条目
export interface RankItem {
  rank: number;
  wallet_address: string;
  name: string;
  level: number;
  value: number;
  isMe?: boolean;
  hero_id?: number;
  attack?: number;
  winCount?: number;
}

// 排行榜响应数据
export interface RankListResponse {
  rankings: RankItem[];
  page: number;
  pageSize: number;
  rank_type: RankType;
  myRank?: number;
  myValue?: number;
  total: number;
}

// 个人排名响应
export interface MyRankResponse {
  rank: number;
  rank_type: RankType;
  value: number;
}

// 排行榜标签页配置
export interface RankTabConfig {
  type: RankType;
  label: string;
  icon: string;
  valueLabel: string;
}

// 排行榜筛选类型
export type RankFilterType = 'level' | 'power' | 'wealth' | 'city';

// ==================== 战役系统 (Warfare) 类型 ====================

// 竞技类型
export type AthleticsType = 1 | 2 | 3;
// 1=个人竞技, 2=组队竞技, 3=帮派竞技

// 竞技模式
export type AthleticsMode = 1 | 2 | 3;
// 1=死战模式, 2=夺旗模式, 3=竞速模式

// 战役战斗状态
export type WarfareBattleState = 0 | 1 | 2;
// 0=未报名, 1=已报名等待, 2=战斗中

// 战区信息
export interface WarfareArea {
  ID: number;
  Area: string;
  AthleticsType: AthleticsType;
  AthleticsMode: AthleticsMode;
  ManHow: number;
  Description?: string;
}

// 战区详情
export interface WarfareDetail {
  ID: number;
  RoomName: string;
  RoomShow: string;
  AthleticsType: AthleticsType;
  AthleticsMode: AthleticsMode;
  ManHow: number;
  Description: string;
}

// 等待中的名城战
export interface WaitingWarfare {
  EventID: number;
  CityID: number;
  CityName: string;
  CityPos: number;
  UserName: string;
  AthleticsType: AthleticsType;
  BattleType: number;
  LevelSegment: number;
  StartTime: string;
  EndTime: string;
  State: number;
}

// 等待列表响应
export interface WaitingListResponse {
  waitingByLevel: number[];
  waitingList: WaitingWarfare[];
}

// 用户参战状态
export interface UserBattleInfo {
  battleState: WarfareBattleState;
  battleType: number;
  AthleticsType: AthleticsType;
  cityId: number;
  cityName: string;
  cityPos: number;
  heroName: string | null;
  heroLevel: number;
  levelSegment: number;
  startTime: string;
  endTime: string;
  message: string;
}

// 战场信息
export interface BattleInfo {
  matched: boolean;
  pos: number;
  battleState: WarfareBattleState;
  battleType: number;
  AthleticsType: AthleticsType;
  battleId?: number;
  cityId?: number;
  levelSegment?: number;
  heroName?: string | null;
  heroLevel?: number;
  startTime?: string;
  endTime?: string;
  message: string;
}

// 战斗结果
export interface BattleResult {
  result: 1 | 0 | null;
  battleId: number | null;
  cityId: number;
  athleticsType: AthleticsType;
  battleType: number;
  roomName: string;
  rewards: BattleRewards | null;
  battleReport: any;
  isWarfare: boolean;
  startTime: string;
  endTime: string;
  message: string;
}

// 战斗奖励
export interface BattleRewards {
  victoryPoint: number;
  warExploit: number;
  exp: number;
  gold: number;
  rating: string;
}

// 战场配置
export interface WarfareConfig {
  AthleticsTypes: Record<AthleticsType, { name: string; description: string }>;
  AthleticsModes: Record<AthleticsMode, { name: string; description: string }>;
  PersonalAreas: WarfareArea[];
  TeamAreas: WarfareArea[];
  GuildAreas: WarfareArea[];
}

// 战役状态
export interface WarfareState {
  areas: WarfareArea[];
  selectedArea: WarfareArea | null;
  userBattleInfo: UserBattleInfo | null;
  battleInfo: BattleInfo | null;
  battleResult: BattleResult | null;
  waitingList: WaitingListResponse | null;
  isLoading: boolean;
  error: string | null;
}

// 匹配结果
export interface MatchResult {
  matched: boolean;
  battleId?: number;
  pos?: number;
  opponentAddress?: string;
  opponentCityId?: number;
  waitingCount?: number;
  requiredCount?: number;
  message: string;
}

// 报名请求
export interface SignupRequest {
  area: number;
  warfare_type: number;
  city_id: number;
  pos?: number;
}

// 战役操作结果
export interface WarfareActionResult {
  success: boolean;
  message: string;
  cityId?: number;
  battleType?: number;
  athleticsType?: number;
  levelSegment?: number;
  endTime?: string;
}

// ==================== 任务系统类型 ====================

// 任务类型枚举
export enum TaskType {
  Story = 1,        // 剧情任务
  Daily = 2,         // 日常任务
  Promotion = 3,     // 推广任务
  Compose = 4,       // 合成任务
  Master = 5,        // 名匠任务
  Festival = 6,      // 节日任务
  Exchange = 7,      // 交换任务
  Collection = 8,    // 收集任务
}

// 任务状态枚举
export enum TaskState {
  InProgress = 1,    // 进行中
  Completed = 2,     // 已完成（可领取）
  Locked = 0,        // 未解锁/已领取
}

// 任务颜色枚举 (NameColor)
export enum TaskNameColor {
  Default = 0,       // 默认色
  Red = 1,           // 红色
  Blue = 2,          // 蓝色
  Purple = 3,        // 紫色
  Gold = 4,          // 金黄色
}

// 任务奖励类型
export enum TaskRewardType {
  None = 0,
  Gold = 1,          // 金币
  Food = 2,          // 粮食
  Wood = 3,          // 木材
  Stone = 4,         // 石料
  Iron = 5,          // 铁矿
  Item = 6,          // 物品
}

// 任务条件类型
export enum TaskConditionType {
  None = 0,
  KillMonster = 1,       // 击杀怪物
  CollectItem = 2,       // 收集物品
  VisitCity = 3,         // 访问城市
  TalkToNPC = 4,         // 与NPC对话
  DeliverItem = 5,       // 递送物品
  DefendCity = 6,        // 防守城市
  Explore = 7,           // 探索
  WinRate = 8,           // 胜率
  ReachLevel = 9,        // 达到等级
  PayMoney = 10,         // 消耗铜钱
  PayFood = 11,          // 消耗粮食
  PaySoldiers = 12,      // 消耗士兵
  PayGold = 13,          // 消耗元宝
}

// 任务数据
export interface TaskData {
  ID: number;
  TaskType: number;
  SubType: number;
  Name: string;
  NameColor: number;
  Description: string;
  ConditionType: number;
  ConditionValue: number;
  ConditionTarget: number;
  GainType: number;
  GainValue: number;
  GainIndex: number;
  State: number;
  HasCondition: number;
  taskItemNum: number;
  hasTaskItemNum: number;
  hasCondition: number;
  CostInsignia: number;
  GetTaskGroupName: string;
  ConditonTargetName: string;
  ConditonTargetPos: number;
  OverTime: string;
  GetTaskIndex: string;
  AppendItemProbability: number;
  AppendItemIndex: number;
  TaskItemProbability: number;
  TaskItemCondition: number;
  OverFlag: number;
  // 扩展字段 (来自后端)
  BeginDes?: string;         // 任务开始描述
  EndDes?: string;           // 任务结束描述
  ActionDes?: string;        // 任务行动描述
  TaskItemName?: string;     // 任务物品名称
  NeedObjType?: number;      // 需求对象类型
  NeedObjName?: string;      // 需求对象名称
  NeedObjValue?: number;     // 需求对象值
  MainIndex?: number;        // 主线索引
}

// 任务列表响应
export interface TaskListResponse {
  tasks: TaskData[];
}

// 任务详情响应
export interface TaskDetailResponse {
  task: TaskData;
}

// 任务操作响应
export interface TaskActionResponse {
  success: boolean;
  message?: string;
  reward?: {
    gold?: number;
    food?: number;
    wood?: number;
    stone?: number;
    iron?: number;
    exp?: number;
    item?: string;
  };
}

// 日常任务配置
export interface DailyTaskConfig {
  id: number;
  type: number;
  name: string;
  description: string;
  target_value: number;
  reward_exp: number;
  reward_gold: number;
  sort_order: number;
}

// 日常任务进度
export interface DailyTaskProgress {
  task_id: number;
  current_value: number;
  status: number;  // 0=进行中, 1=已完成可领取, 2=已领取
  date: string;
}

// 日常任务列表响应
export interface DailyTaskListResponse {
  tasks: (DailyTaskConfig & DailyTaskProgress)[];
}

// 合成任务数据
export interface ComposeTaskData {
  id: number;
  taskId: number;
  name: string;
  materialsRequired: Record<string, number>;
  reward: Record<string, number>;
  status: number;
  createdAt?: string;
}

// 节日任务数据
export interface FeastTaskData {
  id: number;
  taskId: number;
  name: string;
  description: string;
  reward: {
    gold?: number;
    item?: string;
  };
  status: number;
  endTime?: string;
}

// 资源兑换任务数据
export interface ExchangeTaskData {
  id: number;
  type: string;
  name: string;
  cost: number;
  reward: number;
  subType: number;
}

// 任务筛选类型
export type TaskFilterType = 'all' | 'story' | 'daily' | 'compose' | 'festival' | 'exchange' | 'other';

// ==================== 竞技场类型 ====================

// 竞技场对手
export interface ArenaOpponent {
  name: string;
  level: number;
  power: number;
  walletAddress: string;
}

// 竞技场信息
export interface ArenaInfo {
  myRank: number;
  score: number;
  winCount: number;
  loseCount: number;
  challengeTimes: number;
  maxTimes: number;
  userName: string;
  userLevel: number;
  opponents: ArenaOpponent[];
}

// 挑战结果
export interface ChallengeResult {
  result: 'win' | 'lose';
  myPower: number;
  oppPower: number;
  scoreChange: number;
  newScore: number;
  newRank: number;
  reward: {
    gold: number;
    exp: number;
  };
  myName: string;
  oppName: string;
}

// 竞技场挑战记录
export interface ArenaRecord {
  id: string;
  opponentName: string;
  result: 'win' | 'lose';
  scoreChange: number;
  timestamp: string;
}

// 竞技场奖励信息
export interface ArenaReward {
  dailyReward: {
    gold: number;
    exp: number;
    rankBonus: number;
  };
  seasonReward: {
    rank: number;
    gold: number;
    exp: number;
    title: string;
  } | null;
}

// ==================== 市场系统 (Market) 类型 ====================

// 挂单状态
export enum MarketListingState {
  Active = 1,    // 挂单中
  Sold = 2,      // 已售出
  Cancelled = 3, // 已取消
}

// 物品品质颜色
export const ITEM_QUALITY_COLORS: Record<number, string> = {
  1: '#9ca3af',  // 灰色 - 普通
  2: '#22c55e',  // 绿色 - 优秀
  3: '#3b82f6',  // 蓝色 - 精良
  4: '#a855f7',  // 紫色 - 史诗
  5: '#f59e0b',  // 金色 - 传说
};

// 物品品质名称
export const ITEM_QUALITY_NAMES: Record<number, string> = {
  1: '普通',
  2: '优秀',
  3: '精良',
  4: '史诗',
  5: '传说',
};

// 物品类型
export type MarketItemType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
// 1=武器 2=防具 3=饰品 4=消耗品 5=材料 6=时装 7=坐骑 8=称号 9=礼包 10=其他

// 市场挂单物品
export interface MarketListingItem {
  ListingID: number;
  SellerAddr: string;
  ItemID: number;
  ConfigID: number;
  ItemType: number;
  ItemName: string;
  ItemIcon: string;
  ItemDes: string;
  ItemQuality: number;
  Price: number;
  State: MarketListingState;
  CreatedAt: string;
  IsMine: boolean;
}

// 我的挂单物品
export interface MyListingItem {
  ListingID: number;
  ItemID: number;
  ConfigID: number;
  ItemType: number;
  ItemName: string;
  ItemIcon: string;
  ItemDes: string;
  Price: number;
  State: MarketListingState;
  StateName: string;
  CreatedAt: string;
}

// 市场挂单列表响应
export interface MarketItemsResponse {
  items: MarketListingItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 我的挂单列表响应
export interface MyListingsResponse {
  items: MyListingItem[];
  total: number;
  page: number;
  pageSize: number;
}

// 市场信息
export interface MarketInfo {
  marketStatus: string;
  taxRate: number;
  maxListings: number;
  currentListings: number;
  myListings: number;
  todaySold: number;
  transactionFee: number;
}

// 市场统计
export interface MarketStats {
  today: { soldCount: number; volume: number };
  yesterday: { soldCount: number; volume: number };
  total: { soldCount: number; volume: number };
  activeListings: number;
  hotItems: HotItem[];
}

// 热门物品
export interface HotItem {
  configId: number;
  itemName: string;
  sellCount: number;
  avgPrice: number;
}

// 价格历史记录
export interface PriceHistoryItem {
  price: number;
  soldAt: string;
}

// 价格走势响应
export interface PriceHistoryResponse {
  configId: number;
  history: PriceHistoryItem[];
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  totalSold: number;
}

// 挂牌请求
export interface ListItemRequest {
  item_id: number;
  price: number;
}

// 挂牌响应
export interface ListItemResponse {
  listingId: number;
  itemId: number;
  itemName: string;
  price: number;
  tax: number;
  sellerReceives: number;
  message: string;
}

// 购买请求
export interface BuyItemRequest {
  listing_id: number;
  city_id?: number;
}

// 购买响应
export interface BuyItemResponse {
  listingId: number;
  itemId: number;
  itemName: string;
  itemIcon: string;
  itemQuality: number;
  price: number;
  tax: number;
  sellerReceived: number;
  buyerGoldRemaining: number;
  message: string;
}

// 取消挂单请求
export interface CancelListingRequest {
  listing_id: number;
}

// 取消挂单响应
export interface CancelListingResponse {
  listingId: number;
  itemId: number;
  itemName: string;
  price: number;
  message: string;
}

// 用户背包物品（来自 /item/list 接口）
export interface UserInventoryItem {
  itemId: number;
  configId: number;
  itemName: string;
  itemType: number;
  itemIcon: string;
  itemDes: string;
  quality: number;
  durability: number;
  heroId: number;
  equipped: boolean;
  price: number;
  sellDate: string;
}

// 用户背包响应
export interface UserInventoryResponse {
  items: UserInventoryItem[];
  total: number;
}

// 搜索请求参数
export interface SearchMarketParams {
  item_name?: string;
  item_type?: number;
  page?: number;
  order_by?: string;
  order_type?: string;
}

// 市场面板 Tab 类型
export type MarketTab = 'market' | 'my' | 'stats';

// ==================== 科技系统类型 ====================

// 科技分类
export type TechCategory = 'all' | 'military' | 'defense' | 'economy' | 'development';

// 科技效果类型
export enum TechEffectType {
  Area = 1,              // 区域/面积
  BuildingLevel = 2,     // 建筑等级上限
  TrainSpeed = 3,        // 训练速度
  BuildSpeed = 4,        // 建造速度
  WallUpgrade = 5,       // 城墙升级
  ArrowTowerUpgrade = 6, // 箭塔升级
  TrapUpgrade = 7,       // 陷阱升级
  RollingLogUpgrade = 8, // 滚木升级
  BoulderUpgrade = 9,    // 礌石升级
  TrainingBonus = 10,    // 训练加成
  MoraleBonus = 11,      // 士气加成
  GarrisonBonus = 12,    // 驻守加成
  WarehouseCapacity = 13, // 仓库扩容
  SiegeWeaponBonus = 14,  // 器械应用
  MarchSpeed = 15,       // 行军速度
}

// 科技数据
export interface TechData {
  id: number;
  staticIndex: number;
  name: string;
  icon?: string;
  description?: string;
  effectType: number;
  currentLevel: number;
  maxLevel: number;
  currentEffect: number;
  nextEffect: number;
  canUpgrade: boolean;
  isUnlocked: boolean;
  state: number;
  // 升级消耗
  upgradeCost: {
    money: number;
    food: number;
    gold: number;
    time: number;
  } | null;
  // 升级需求
  upgradeRequirements: {
    buildingId: number;
    buildingLevel: number;
    technicId: number;
    technicLevel: number;
    area: number;
  } | null;
  // C# 原始字段 (驼峰)
  ID?: number;
  Index?: number;
  Name?: string;
  Des?: string;
  Level?: number;
  CurrEff?: number;
  CurrentEff?: number;
  UpNeedBuildingID?: number;
  UpNeedBuildingLevel?: number;
  UpNeedFood?: number;
  UpNeedMoney?: number;
  UpNeedMen?: number;
  UpNeedGold?: number;
  UpNeedArea?: number;
  EffID?: number;
  // 计算属性
  category: TechCategory;
}

// 科技列表响应
export interface TechListResponse {
  city?: { id: number; name: string };
  techs: TechData[];
  total: number;
}

// 研究中的科技
export interface TechResearching {
  id: number;
  static_index: number;
  name: string;
  icon?: string;
  level: number;
  remain_seconds: number;
  end_time?: string;
}

// 研究中列表响应
export interface TechResearchingResponse {
  techs: TechResearching[];
  total: number;
}

// 研究请求
export interface TechResearchRequest {
  static_index: number;
  use_immediately?: boolean;
}

// 研究结果
export interface TechResearchResult {
  techId?: number;
  staticIndex: number;
  name: string;
  previousLevel?: number;
  newLevel: number;
  state: 'researching' | 'completed';
  remainingTime?: number;
  effect?: number;
  message: string;
}

// 科技配置
export interface TechConfig {
  id: number;
  name: string;
  icon?: string;
  description?: string;
  dependPos: number;
  dependBuildingId: number;
  dependTechnicId: number;
  dependArea: number;
  maxLevel: number;
  levels: TechLevelConfig[];
}

// 科技等级配置
export interface TechLevelConfig {
  level: number;
  effectType: number;
  effectValue: number;
  cost: {
    money: number;
    food: number;
    gold: number;
    time: number;
  };
  requirements: {
    buildingId: number;
    buildingLevel: number;
    technicId: number;
    technicLevel: number;
    area: number;
  };
}

// 科技配置响应
export interface TechConfigsResponse {
  techs: TechConfig[];
  total: number;
}

// 科技效果汇总
export interface TechEffectsSummary {
  effects: Record<string, number>;
  totalBonus: number;
  message: string;
}

// 科技效果类型名称映射
export const TECH_EFFECT_TYPE_NAMES: Record<number, string> = {
  [TechEffectType.Area]: '区域面积',
  [TechEffectType.BuildingLevel]: '建筑等级',
  [TechEffectType.TrainSpeed]: '训练速度',
  [TechEffectType.BuildSpeed]: '建造速度',
  [TechEffectType.WallUpgrade]: '城墙强度',
  [TechEffectType.ArrowTowerUpgrade]: '箭塔威力',
  [TechEffectType.TrapUpgrade]: '陷阱威力',
  [TechEffectType.RollingLogUpgrade]: '滚木威力',
  [TechEffectType.BoulderUpgrade]: '礌石威力',
  [TechEffectType.TrainingBonus]: '训练加成',
  [TechEffectType.MoraleBonus]: '士气加成',
  [TechEffectType.GarrisonBonus]: '驻守加成',
  [TechEffectType.WarehouseCapacity]: '仓库容量',
  [TechEffectType.SiegeWeaponBonus]: '器械威力',
  [TechEffectType.MarchSpeed]: '行军速度',
};

// 科技分类映射 (基于效果类型)
export const TECH_CATEGORY_MAP: Record<TechEffectType, TechCategory> = {
  [TechEffectType.Area]: 'development',
  [TechEffectType.BuildingLevel]: 'development',
  [TechEffectType.TrainSpeed]: 'development',
  [TechEffectType.BuildSpeed]: 'development',
  [TechEffectType.WallUpgrade]: 'defense',
  [TechEffectType.ArrowTowerUpgrade]: 'defense',
  [TechEffectType.TrapUpgrade]: 'defense',
  [TechEffectType.RollingLogUpgrade]: 'defense',
  [TechEffectType.BoulderUpgrade]: 'defense',
  [TechEffectType.TrainingBonus]: 'military',
  [TechEffectType.MoraleBonus]: 'military',
  [TechEffectType.GarrisonBonus]: 'military',
  [TechEffectType.WarehouseCapacity]: 'economy',
  [TechEffectType.SiegeWeaponBonus]: 'military',
  [TechEffectType.MarchSpeed]: 'military',
};

// ==================== 地图系统类型 ====================

/** 地图配置 */
export interface MapConfig {
  width: number;
  height: number;
  worldSize: number;
  terrainTypes: Record<string, number>;
}

/** 地形类型 */
export type TerrainType = 'city' | 'npc_city' | 'wild' | 'mountain' | 'forest' | 'water' | 'empty';

/** 地块数据 */
export interface MapTile {
  x: number;
  y: number;
  pos: number;
  type: TerrainType;
  name: string;
  level: number;
  owner: string | null;
  /** 玩家城市特有 */
  prosperity?: number;
  /** NPC 城市特有 */
  portraitIndex?: number;
  /** 是否已探索 */
  explored?: boolean;
  /** 是否可攻击 */
  canAttack?: boolean;
  /** 是否受保护 */
  isProtected?: boolean;
}

/** 地图概览响应 */
export interface MapOverviewResponse {
  config: MapConfig;
  npcs: Array<{
    pos: number;
    level: number;
    name: string;
    picIndex: number;
  }>;
  terrains: Array<{
    pos: number;
    type: number;
    picIndex: number;
  }>;
  message?: string;
}

/** 位置详情响应 */
export interface PositionDetailResponse {
  position: number;
  type: 'city' | 'npc' | 'terrain' | 'empty';
  name?: string;
  owner?: string;
  ownerLevel?: number;
  level?: number;
  prosperity?: number;
  isProtected?: boolean;
  canAttack?: boolean;
  terrainType?: number;
  picIndex?: number;
  portraitIndex?: number;
  message?: string;
}

/** 玩家位置响应 */
export interface PlayerPositionResponse {
  position: number;
  name: string;
}

/** 探索结果 */
export interface ExploreResult {
  position: number;
  distance: number;
  explored: boolean;
  terrain: { type: number };
  message: string;
}

/** 移动状态 */
export interface MovementStatus {
  moving: boolean;
  from?: number;
  to?: number;
  startTime?: string;
  arriveTime?: string;
  remainingSeconds?: number;
  message?: string;
}

/** 地图地块信息（对应后端 MapUnitInfo） */
export interface MapUnitInfo {
  ID: number;
  Type: number;       // 1=建筑, 2=武将, 3=城市
  EventID: number;
  Name: string;
  Level: number;
  Pos: number;
  Image: string;
  Icon: string;
  Index: number;
  State: number;
  AttackCount: number;
  UniteCount: number;
  SubLevel: number;
  UserName: string;
  Quality: number;
  CityName: string;
  ArriveTime: string;
  DefeceFlag: number;
  EspecialType: number;
  IsAppendantNPC: number;
  IsLord: number;
  isMyTerritory?: boolean;
}

/** 地块操作菜单 */
export interface TileAction {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'info';
}

// ==================== 战斗系统类型 ====================

// 战斗统计 (来自 GET /battle/chess/num)
export interface BattleStats {
  total: number;      // 今日总战斗次数
  wins: number;      // 胜利次数
  losses: number;    // 失败次数
  remaining: number; // 剩余次数
  max: number;       // 最大次数
}

// 战斗记录 (历史战斗)
export interface BattleRecord {
  id: number;
  result: 'win' | 'lose' | 'draw';
  myRole: 'attacker' | 'defender';
  timestamp: number;
}

// 战斗日志条目
export interface BattleLog {
  id: string | number;
  type: 'battle_start' | 'battle_end' | 'hero_damaged' | 'enemy_damaged' | 'round_update' | 'battle_record';
  timestamp: number;
  round?: number;
  message?: string;
  result?: string;
  resultText?: string;
  opponent?: string;
  opponentAddress?: string;
  myRole?: 'attacker' | 'defender';
  heroId?: number;
  heroName?: string;
  hp?: number;
  maxHp?: number;
}

// 棋盘单位 (ChessmanList 中的单位)
export interface ChessmanUnit {
  ID: number;        // 单位索引 (1-10 攻击方, 11-20 防守方)
  Name: string;      // 单位名称
  Type: number;      // 兵种类型 (1=步, 2=骑, 3=弓, 4=枪)
  X: number;         // X坐标
  Y: number;         // Y坐标
  HP?: number;       // 当前生命
  MaxHP?: number;    // 最大生命
  Attack?: number;   // 攻击力
  Flag?: number;     // 阵营标志 (1=攻方, 3=守方)
}

// 棋盘玩家信息
export interface Chessplayer {
  Flag: number;              // 阵营标志 (1=攻方, 3=守方)
  Name: string;             // 玩家名称
  WalletAddress: string;    // 钱包地址
  Level: number;            // 等级
  Icon?: string;            // 头像
}

// 棋盘数据 (来自 GET /battle/chess/board)
export interface ChessboardData {
  Pos: number;              // 战场位置 (-1=无战场)
  Height: number;           // 棋盘高度
  Width: number;            // 棋盘宽度
  Time: number;             // 战斗开始时间戳
  State: number;            // 战斗状态
  TotalSecondsNow: number;   // 当前服务器时间(秒)
  BattleSeconds: number;    // 战斗持续秒数
  WaitSeconds: number;      // 等待秒数
  ChessunitMap: any;         // 棋盘格子状态 (8x8)
  ChessplayerList: Chessplayer[] | null;  // 玩家列表
  ChessmanList: ChessmanUnit[] | null;    // 单位列表
}

// 战报数据 (来自 GET /battle/report)
export interface BattleReport {
  battleId: number;
  result: 'win' | 'lose' | 'draw';
  createdAt: string;
  report: {
    CityList?: any[];
    Res?: any[];
    SkillEffectList?: any[];
    HeroList?: any[];
    StatDefenceBuildList?: any[];
    CityBuilds?: any[];
    OrgResList?: any[];
    FightWinName?: string;
    FightWinFlag?: number;
    FightTime?: string;
    AttackPoint?: number;
    DefencePoint?: number;
    NoLossAttack?: number;
    NoLossDefence?: number;
    UserType?: number;
    AttackInsignia?: number;
    DefInsignia?: number;
    AttackPointBattleOver?: number;
    BuildDefencePower?: number;
    BuildDefencePowerBattleOver?: number;
    IsSkillExp?: number;
    AttackPowerPer?: number;
    DefencePowerPer?: number;
    AttackPowerBattleBegin?: number;
    DefencePowerBattleBegin?: number;
    AttackPowerBattleEnd?: number;
    DefencePowerBattleEnd?: number;
    AttackPlundInsignia?: number;
    WeiWang?: number;
  };
}

// 战斗排行条目
export interface ChessRankItem {
  rank: number;
  walletAddress: string;
  name: string;
  level: number;
  power?: number;       // 战斗力
  value?: number;       // 兼容其他排行值
  heroCount?: number;
  title?: string;
  isMe?: boolean;
  winCount?: number;
}

// ============ 城防系统类型 ============

export interface DefenseBuilding {
  id: number;
  position: number;
  state: number;
  defence_level: number;
  static_index: number;
  durability: number;
  name: string;
  icon: string;
  attack: number;
  hitpoint: number;
}

export interface DefenseInfo {
  wallLevel: number;
  trapCount: number;
  defenses: DefenseBuilding[];
  totalDefense: number;
  cityId: number;
}

export interface DefensePosHero {
  id: number;
  name: string;
  level: number;
  atk: number;
  def: number;
  hp: number;
  position: number;
  state: number;
}

// ============ 帮派系统类型 ============

export interface GuildOrganize {
  UID: number;
  OrgName: string;
  OrgLevel: number;
  Membership: number;
  MaxMembership: number;
  OfficialNumber: number;
  Affiche: string;
  Intro: string;
}

export interface GuildMemberInfo {
  UID: number;
  UserName: string;
  Privilege: number;
  Contribution: number;
  JoinTime: string;
}

export interface GuildOrgEffect {
  MoneyPer: number;
  FoodPer: number;
  MenPer: number;
  AttackPer: number;
  DefencePer: number;
}

export interface GuildInfo {
  MyOrganize: GuildOrganize | null;
  MyMember: GuildMemberInfo | null;
  MyOrgEffectInfo: GuildOrgEffect;
  BossName: string | null;
}

export interface GuildListItem {
  id: number;
  name: string;
  level: number;
  memberCount: number;
  notice: string;
  insignia: string;
  isFull: boolean;
}

export interface GuildMemberData {
  uid: number;
  walletAddress: string;
  name: string;
  role: 'leader' | 'officer' | 'member';
  contribution: number;
  level: number;
  vipLevel: number;
  joinedAt: string;
}

export interface GuildResourceInfo {
  guildId: number;
  guildName: string;
  resources: {
    money: number;
    food: number;
    men: number;
  };
}

// ============ 商城系统类型 ============

export interface MallCategory {
  id: number;
  name: string;
  items: number;
}

export interface CommodityItem {
  Id: number;
  Type: number;
  TypeName: string;
  Tips: string;
  Image: string;
  Usetype: number;
  Gold: number;
  BuyDes: string;
  MainEffectType: number;
  EffectType: number;
  Index: number;
  IsUsed: number;
  BuyType: number;
}

export interface ExchangeRate {
  moneyToGold: number;
  foodToGold: number;
  menToGold: number;
  goldToMoney: number;
  goldToFood: number;
  goldToMen: number;
  maxExchange: {
    money: number;
    food: number;
    men: number;
  };
}

export type MallTab = 'commodity' | 'vip' | 'peace' | 'exchange';
export type GuildTab = 'info' | 'members' | 'donate' | 'manage';
export type GuildView = 'my' | 'list' | 'create';
