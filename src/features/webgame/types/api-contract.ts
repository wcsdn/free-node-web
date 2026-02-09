/**
 * API Contract Types - 前端与后端接口契约类型定义
 * 确保前后端数据格式一致
 */

// ==================== 通用类型 ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== 用户角色相关 ====================

export interface Character {
  walletAddress: string;
  name: string;
  level: number;
  exp: number;
  gold: number;
  vipLevel: number;
  createdAt?: string;
  lastLogin?: string;
}

export interface UserInfoResponse {
  user: Character;
  cities: City[];
  cityCount: number;
}

// ==================== 城市相关 ====================

export interface City {
  id: number;
  walletAddress: string;
  name: string;
  position: number;
  prosperity: number;
  money: number;
  food: number;
  population: number;
  moneyRate: number;
  foodRate: number;
  populationRate: number;
  mapImage: string;
  lastCollect: string;
  createdAt: string;
  interior?: CityInterior;
}

export interface CityListResponse {
  cities: City[];
  total: number;
}

export interface ResourceCollectResponse {
  money: number;
  food: number;
  men: number;
  newMoney: number;
  newFood: number;
  lastCollect: string;
}

// ==================== 建筑相关 ====================

export interface Building {
  id: number;
  cityId: number;
  configId: number;
  type: string;
  name: string;
  level: number;
  position: number;
  state: number;
  effectValue: number;
  maxLevel: number;
  image: string;
  description: string;
}

export interface BuildingListResponse {
  city: City;
  buildings: Building[];
}

export interface BuildResponse {
  building: Building;
  cost: {
    money: number;
    food: number;
    population: number;
  };
  message: string;
}

// ==================== 武将相关 ====================

export interface Hero {
  id: number;
  name: string;
  level: number;
  exp: number;
  attack: number;
  defense: number;
  hp: number;
  maxHp: number;
  quality: number;
  state: number;
  skillIds: number[];
  equippedSkillIds: number[];
  skillPoints: number;
  portrait: string;
  country: string;
  legionId: number;
  inLegionPosition: number;
}

export interface HeroListResponse {
  heroes: Hero[];
  total: number;
}

export interface HeroDetailResponse {
  hero: Hero;
  skills: Skill[];
  equipment: Equipment[];
}

export interface RecruitResponse {
  hero: Hero;
  cost: {
    money: number;
    gold: number;
  };
  message: string;
}

// ==================== 技能相关 ====================

export interface Skill {
  id: number;
  name: string;
  description: string;
  type: number;
  cost: number;
  effect: number;
  cooldown: number;
  icon: string;
}

export interface SkillListResponse {
  skills: Skill[];
  availableSkills: Skill[];
}

export interface HeroSkillsResponse {
  equippedSkills: Skill[];
  availableSkills: Skill[];
}

// ==================== 物品相关 ====================

export interface Item {
  id: number;
  itemId: number;
  name: string;
  type: number;
  quality: number;
  count: number;
  equipped: number;
  position: number;
  maxCount: number;
  attack: number;
  defense: number;
  description: string;
  image: string;
}

export interface ItemListResponse {
  items: Item[];
  total: number;
  equippedCount: number;
}

export interface ItemUseResponse {
  item: Item;
  effect: any;
  message: string;
}

// ==================== 军团相关 ====================

export interface Corps {
  id: number;
  name: string;
  leaderId: string;
  cityId: number;
  level: number;
  exp: number;
  state: number;
  notice: string;
  memberCount: number;
  createdAt: string;
}

export interface CorpsMember {
  id: number;
  walletAddress: string;
  role: string;
  contribution: number;
  joinedAt: string;
}

export interface CorpsDetailResponse {
  corps: Corps;
  members: CorpsMember[];
}

export interface CorpsListResponse {
  corps: Corps[];
  total: number;
}

export interface CreateCorpsResponse {
  id: number;
  name: string;
  leaderId: string;
  notice: string;
}

// ==================== 战斗相关 ====================

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
  skills: number[];
}

export interface BattleRound {
  round: number;
  attacker: {
    id: number;
    name: string;
    action: string;
    damage?: number;
    target?: number;
    crit?: boolean;
    hpAfter?: number;
  };
  defender: {
    id: number;
    name: string;
    action: string;
    damage?: number;
    target?: number;
    crit?: boolean;
    hpAfter?: number;
  };
}

export interface BattleRewards {
  exp: number;
  gold: number;
  items?: Item[];
  fame?: number;
  prestige?: number;
}

export interface BattleResponse {
  result: 'win' | 'loss';
  defenderAddress?: string;
  winRate: number;
  winType?: string;
  rounds: BattleRound[];
  rewards: BattleRewards;
}

export interface BattleHistoryResponse {
  battles: Battle[];
  total: number;
}

export interface Battle {
  id: number;
  attackerAddress: string;
  defenderAddress: string;
  battleType: string;
  result: string;
  createdAt: string;
  report?: any;
}

// ==================== 任务相关 ====================

export interface Task {
  id: number;
  mainId: number;
  mainIndex: number;
  subIndex: number;
  name: string;
  description: string;
  type: number;
  target: number;
  targetType: number;
  needObjType: number;
  needObjId: number;
  needObjValue: number;
  cost: {
    money: number;
    food: number;
    men: number;
    gold: number;
  };
  reward: {
    money: number;
    food: number;
    men: number;
    gold: number;
    exp: number;
  };
  progress: number;
  status: TaskStatus;
  isCompleted: boolean;
  canClaim: boolean;
}

export type TaskStatus = 0 | 1 | 2 | 3; // 0:未开始 1:进行中 2:已完成 3:已领取

export interface TaskListResponse {
  mainId: number;
  mainIndex: number;
  tasks: Task[];
  total: number;
  completedCount: number;
}

export interface TaskClaimResponse {
  taskId: number;
  rewards: Task['reward'];
  message: string;
}

// ==================== 日常任务相关 ====================

export interface DailyTask {
  id: number;
  name: string;
  description: string;
  type: number;
  target: number;
  progress: number;
  status: number;
  rewardGold: number;
  rewardExp: number;
  claimed: boolean;
}

export interface DailyTaskListResponse {
  tasks: DailyTask[];
  totalPoints: number;
  completedCount: number;
}

// ==================== 邮件相关 ====================

export interface Mail {
  id: number;
  mailType: number;
  fromName: string;
  title: string;
  content: string;
  readTag: number;
  hasAttachment: number;
  createdAt: string;
  attachments?: MailAttachment[];
}

export interface MailAttachment {
  type: string;
  itemId?: number;
  count: number;
}

export interface MailListResponse {
  mails: Mail[];
  total: number;
  unreadCount: number;
}

export interface MailDetailResponse {
  mail: Mail;
  canClaim: boolean;
}

export interface MailSendResponse {
  id: number;
  message: string;
}

// ==================== 商店相关 ====================

export interface ShopItem {
  id: number;
  name: string;
  type: number;
  price: number;
  currency: number;
  quality: number;
  image: string;
  description: string;
  stock?: number;
  limit?: number;
}

export interface ShopListResponse {
  items: ShopItem[];
  type: number;
}

export interface ShopBuyResponse {
  item: ShopItem;
  cost: {
    money: number;
    gold: number;
  };
  message: string;
}

// ==================== 市场相关 ====================

export interface MarketListing {
  id: number;
  sellerAddress: string;
  itemId: number;
  itemName: string;
  price: number;
  count: number;
  listedAt: string;
}

export interface MarketListResponse {
  listings: MarketListing[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MarketBuyResponse {
  listing: MarketListing;
  cost: number;
  message: string;
}

export interface MarketSellResponse {
  id: number;
  itemName: string;
  price: number;
  message: string;
}

// ==================== 排行榜相关 ====================

export interface RankItem {
  id: number;
  name: string;
  value: number;
  rank: number;
  title: string;
  level: number;
}

export interface RankListResponse {
  type: string;
  items: RankItem[];
  myRank?: RankItem;
}

// ==================== 竞技场相关 ====================

export interface ArenaOpponent {
  id: string;
  name: string;
  power: number;
  rank: number;
  winRate: number;
  heroCount: number;
}

export interface ArenaInfoResponse {
  myRank: number;
  myScore: number;
  challengeCount: number;
  maxChallengeCount: number;
  opponents: ArenaOpponent[];
}

export interface ArenaChallengeResponse {
  result: 'win' | 'loss';
  myRank: number;
  myScore: number;
  rewards?: {
    gold: number;
    exp: number;
  };
  message: string;
}

export interface ArenaRankListResponse {
  items: RankItem[];
  myRank?: number;
}

// ==================== 繁荣度相关 ====================

export interface InteriorInfo {
  cityId: number;
  cityName: string;
  prosperity: number;
  level: number;
  levelName: string;
  nextLevelThreshold: number;
  thresholds: number[];
  names: string[];
}

export interface InteriorBonuses {
  prosperity: number;
  level: number;
  levelName: string;
  bonuses: {
    resourceLimits: {
      money: number;
      food: number;
      population: number;
    };
    growthRates: {
      moneyRate: number;
      foodRate: number;
      populationRate: number;
    };
    taxBonus: number;
    defenseBonus: number;
    recruitmentBonus: number;
  };
}

export interface InteriorNextLevel {
  currentLevel: number;
  currentProsperity: number;
  nextLevel: number;
  nextProsperity: number;
  prosperityNeeded: number;
  progress: number;
}

// ==================== 锻造相关 ====================

export interface CraftRecipe {
  id: number;
  category: string;
  name: string;
  type?: string;
  level?: number;
  baseStats?: Record<string, number>;
  inputs: Record<number, number>;
  output: {
    itemId: number;
    count: number;
  };
  outputGold: number;
  canCraft?: boolean;
  playerMaterials?: Record<number, number>;
}

export interface CraftListResponse {
  recipes: CraftRecipe[];
  category: string;
}

export interface CraftResponse {
  message: string;
  category: string;
  recipeId: number;
  output: {
    itemId: number;
    name: string;
    count: number;
  };
}

// ==================== 聊天相关 ====================

export interface ChatMessage {
  id: number;
  channel: string;
  sender: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface ChatListResponse {
  messages: ChatMessage[];
  channel: string;
}

export interface ChatConversation {
  partner: string;
  lastMessage: string;
  lastTime: string;
  unreadCount?: number;
}

export interface ChatConversationsResponse {
  conversations: ChatConversation[];
  total: number;
}

// ==================== 服务器状态 ====================

export interface ServerStatus {
  online: boolean;
  playerCount: number;
  cityCount: number;
  corpsCount: number;
  uptime: number;
}

// ==================== 签到相关 ====================

export interface SigninDay {
  day: number;
  reward: {
    type: string;
    count: number;
  };
  claimed: boolean;
}

export interface SigninResponse {
  today: number;
  consecutiveDays: number;
  rewards: SigninDay[];
  canClaim: boolean;
  claimedReward?: SigninDay;
}

// ==================== 通知相关 ====================

export interface Notification {
  id: number;
  type: number;
  title: string;
  content: string;
  read: number;
  createdAt: string;
  data?: Record<string, any>;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

// ==================== 副本相关 ====================

export interface Dungeon {
  id: number;
  name: string;
  description: string;
  type: number;
  difficulty: number;
  recommendedPower: number;
  rewards: {
    exp: number;
    gold: number;
    dropItems?: { itemId: number; chance: number }[];
  };
  stages: DungeonStage[];
}

export interface DungeonStage {
  id: number;
  stage: number;
  name: string;
  enemies: DungeonEnemy[];
  rewards: {
    exp: number;
    gold: number;
    dropRate: number;
  };
  cleared: boolean;
  stars: number;
}

export interface DungeonEnemy {
  id: number;
  name: string;
  level: number;
  power: number;
  hp: number;
  attack: number;
  defense: number;
}

export interface DungeonListResponse {
  dungeons: Dungeon[];
  availableDungeons: number[];
}

export interface DungeonChallengeResponse {
  result: 'win' | 'loss' | 'escape';
  dungeonId: number;
  stageId: number;
  stars: number;
  rewards?: {
    exp: number;
    gold: number;
    droppedItem?: Item;
  };
  message: string;
}

// ==================== 活动相关 ====================

export interface Activity {
  id: number;
  name: string;
  description: string;
  type: number;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'active' | 'ended';
  rewards: {
    type: string;
    amount: number;
  }[];
  conditions?: {
    type: string;
    value: number;
  }[];
  progress?: number;
  canClaim?: boolean;
}

export interface ActivityListResponse {
  activities: Activity[];
  total: number;
  activeCount: number;
}

export interface ActivityClaimResponse {
  activityId: number;
  rewards: Activity['rewards'];
  message: string;
}

// ==================== 节日活动相关 ====================

export interface FestivalActivity {
  id: number;
  name: string;
  description: string;
  type: number;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'active' | 'ended';
  tasks: FestivalTask[];
}

export interface FestivalTask {
  id: number;
  name: string;
  description: string;
  progress: number;
  target: number;
  rewardGold: number;
  rewardExp: number;
  claimed: boolean;
}

export interface FestivalListResponse {
  activities: FestivalActivity[];
}

export interface FestivalTaskClaimResponse {
  taskId: number;
  rewards: {
    gold: number;
    exp: number;
  };
  message: string;
}

// ==================== 事件相关 ====================

export interface GameEvent {
  id: number;
  name: string;
  description: string;
  type: number;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'active' | 'ended';
  config: Record<string, any>;
}

export interface EventListResponse {
  events: GameEvent[];
  total: number;
}

// ==================== 地图相关 ====================

export interface MapUnit {
  id: number;
  name: string;
  type: number;
  subType: number;
  position: {
    x: number;
    y: number;
  };
  level: number;
  power: number;
  owner?: string;
  status?: string;
}

export interface MapInfoResponse {
  width: number;
  height: number;
  units: MapUnit[];
  myUnits: MapUnit[];
}

export interface MapUnitDetailResponse {
  unit: MapUnit;
  resources?: {
    money: number;
    food: number;
  };
  defenders?: {
    power: number;
    heroes: number[];
  };
}

// ==================== 军械/装备相关 ====================

export interface Equipment {
  id: number;
  itemId: number;
  name: string;
  type: number;
  quality: number;
  attack: number;
  defense: number;
  hp: number;
  skill?: number;
  equipped: boolean;
}

export interface EquipmentListResponse {
  equipments: Equipment[];
  equipped: Equipment[];
  total: number;
}

// ==================== 防御相关 ====================

export interface DefenseBuilding {
  id: number;
  type: number;
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  defense: number;
  attack?: number;
  range?: number;
}

export interface DefenseInfoResponse {
  cityId: number;
  buildings: DefenseBuilding[];
  totalDefense: number;
  wallHealth: number;
  wallMaxHealth: number;
}

export interface DefenseUpgradeResponse {
  building: DefenseBuilding;
  cost: {
    money: number;
    materials: Record<number, number>;
  };
  message: string;
}

export interface DefenseChallengeResponse {
  result: 'win' | 'loss';
  attackerPower: number;
  defenderPower: number;
  damage: {
    attacker: number;
    defender: number;
  };
  rewards?: {
    gold: number;
    exp: number;
  };
  message: string;
}

// ==================== 科技相关 ====================

export interface Technic {
  id: number;
  name: string;
  description: string;
  type: number;
  level: number;
  maxLevel: number;
  cost: {
    money: number;
    food: number;
    researchPoints: number;
  };
  effect: Record<string, number>;
  requirements?: {
    type: string;
    value: number;
  }[];
  unlocked: boolean;
  canUpgrade: boolean;
}

export interface TechnicListResponse {
  technics: Technic[];
  researchPoints: number;
  totalTechnics: number;
  unlockedTechnics: number;
}

export interface TechnicUpgradeResponse {
  technic: Technic;
  cost: Technic['cost'];
  message: string;
}

// ==================== 军团成员相关 ====================

export interface CorpsMemberDetail {
  id: number;
  walletAddress: string;
  name: string;
  role: 'leader' | 'officer' | 'member';
  contribution: number;
  heroCount: number;
  power: number;
  joinedAt: string;
  lastActive?: string;
}

export interface CorpsMemberListResponse {
  members: CorpsMemberDetail[];
  total: number;
}

export interface CorpsMemberManageResponse {
  memberId: number;
  action: 'promote' | 'demote' | 'kick';
  message: string;
}

// ==================== 公会相关 ====================

export interface Guild {
  id: number;
  name: string;
  leaderId: string;
  level: number;
  exp: number;
  memberCount: number;
  maxMembers: number;
  notice: string;
  createdAt: string;
}

export interface GuildDetailResponse {
  guild: Guild;
  members: CorpsMemberDetail[];
  technics: Technic[];
  resources: {
    gold: number;
    food: number;
  };
}

export interface GuildListResponse {
  guilds: (Guild & { rank: number })[];
  total: number;
  myGuild?: Guild;
}

export interface GuildCreateResponse {
  id: number;
  name: string;
  leaderId: string;
  notice: string;
  message: string;
}

// ==================== 帮助相关 ====================

export interface HelpArticle {
  id: number;
  category: string;
  title: string;
  content: string;
  keywords: string[];
}

export interface HelpCategory {
  id: string;
  name: string;
  articles: HelpArticle[];
}

export interface HelpListResponse {
  categories: HelpCategory[];
}

// ==================== 飞书相关 ====================

export interface FeishuUserInfo {
  id: string;
  name: string;
  avatar: string;
  email?: string;
}

export interface FeishuBindResponse {
  success: boolean;
  message: string;
  walletAddress?: string;
}

export interface FeishuNotifyResponse {
  success: boolean;
  messageId?: string;
}

// ==================== 附属 NPC 相关 ====================

export interface AppendantNPC {
  id: number;
  walletAddress: string;
  npcPos: number;
  npcName: string;
  beginTime: string;
  endTime: string;
  needGold: number;
  needInsignia: number;
}

export interface AppendantNPCInfo {
  npcPos: number;
  npcName: string;
  needGold: number;
  needInsignia: number;
  occupied: boolean;
  occupier?: string;
  endTime?: string;
}

export interface AppendantListResponse {
  npcs: AppendantNPCInfo[];
  total: number;
  myNPC?: AppendantNPC;
}

export interface OccupyNPCResponse {
  result: 'success' | 'failed';
  npc: AppendantNPC;
  cost: {
    gold: number;
    insignia: number;
  };
  message: string;
}

// ==================== 帮会/军团扩展相关 ====================

export interface Organize {
  id: number;
  name: string;
  intro: string;
  leader: string;
  level: number;
  exp: number;
  memberCount: number;
  maxMembers: number;
  notice: string;
  createTime: string;
}

export interface OrganizeMember {
  id: number;
  walletAddress: string;
  name: string;
  role: 'leader' | 'deputy' | 'officer' | 'member';
  contribution: number;
  joinedAt: string;
  state: 'active' | 'pending' | 'offline';
}

export interface OrganizeEvent {
  id: number;
  orgName: string;
  content: string;
  time: string;
  type: 1 | 2 | 3 | 4 | 5 | 6; // 1:创建 2:加入 3:任命 4:罢免 5:踢出 6:退出
}

export interface OrganizeResource {
  pearl: number;      // 珍珠
  crystal: number;   // 水晶
  agate: number;     // 玛瑙
  wbBowlder: number;  // 白玉石
  bbBowlder: number; // 黑玉石
  jadeBook: number;  // 玉诀
  crusade: number;   // 十字军
}

export interface OrganizeDetailResponse {
  organize: Organize;
  members: OrganizeMember[];
  resources: OrganizeResource;
  events: OrganizeEvent[];
}

export interface OrganizeListResponse {
  organizes: Organize[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OrganizeApplication {
  id: number;
  applicant: string;
  orgName: string;
  applyTime: string;
  state: 'pending' | 'approved' | 'rejected';
}

export interface OrganizeApplicationListResponse {
  applications: OrganizeApplication[];
  total: number;
}

// ==================== 战报相关 ====================

export interface FightSummary {
  id: number;
  battleId: string;
  attacker: string;
  defender: string;
  result: 'win' | 'loss' | 'draw';
  fightTime: string;
  attackPower: number;
  defensePower: number;
  summary: string; // 编码后的战报字符串
}

export interface FightSummaryDetail {
  attackCity: {
    name: string;
    position: number;
    power: number;
    powerAfter: number;
  };
  defenseCity: {
    name: string;
    position: number;
    power: number;
    powerAfter: number;
  };
  attackArmy: FightSummaryArmy[];
  defenseArmy: FightSummaryArmy[];
  defenseBuilds: FightSummaryDefense[];
  resources: {
    money: number;
    food: number;
    men: number;
  };
  insignia: {
    attack: number;
    defense: number;
    plunder: number;
  };
}

export interface FightSummaryArmy {
  heroId: number;
  heroName: string;
  quality: number;
  state: number;
  childrenCount: number;
  childrenLoss: number;
  trainingCount: number;
  trainingLoss: number;
  gainExp: number;
}

export interface FightSummaryDefense {
  index: number;
  count: number;
  loss: number;
}

export interface FightSummaryListResponse {
  summaries: FightSummary[];
  total: number;
}

// ==================== 用户数据相关 ====================

export interface UserData {
  walletAddress: string;
  lastLogin: string;
  totalOnlineTime: number;
  totalRecharge: number;
  vipExpire?: string;
  settings: UserSettings;
}

export interface UserSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  autoAcceptFriend: boolean;
  language: string;
}

export interface UserDataResponse {
  data: UserData;
  message: string;
}

// ==================== 错误码相关 ====================

export interface ErrorCode {
  code: number;
  message: string;
  category: 'auth' | 'game' | 'resource' | 'corps' | 'system';
}

export interface ErrorCodeListResponse {
  codes: ErrorCode[];
}
