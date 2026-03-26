/**
 * Game2 API 服务
 * 连接 ghost-game Worker 的 API
 */

import type {
  CityData,
  HeroData,
  BuildingData,
  BuildingType,
  ResourceData,
  MarketInfo,
  MarketItemsResponse,
  MyListingsResponse,
  MarketStats,
  PriceHistoryResponse,
  ListItemResponse,
  BuyItemResponse,
  CancelListingResponse,
  MarketListingItem,
  UserInventoryItem,
  UserInventoryResponse,
} from '../types';
import { toast } from '../components/common/Toast';

// API 基础配置
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8788';

// 开发模式配置
const DEV_MODE = import.meta.env.DEV === true;
const DEV_TEST_WALLET = '0x1234567890123456789012345678901234567890';

// 开发模式使用测试钱包
const getWalletAddress = () => DEV_MODE ? DEV_TEST_WALLET : '';

// 通用 API 请求
export async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
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
      // POST 请求失败时弹出 toast，GET 请求仅记录日志
      if (method === 'POST') {
        toast.error(errMsg);
      }
      throw new Error(errMsg);
    }

    const result = await response.json();
    // 如果后端返回 success:false 且是 POST 请求，弹出 toast
    if (method === 'POST' && result.success === false) {
      toast.error(result.error || '操作失败');
    }
    return result;
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error);
    return { success: false, error: error.message || 'Network error' };
  }
}

// ============ API 方法 ============

/**
 * 获取用户信息
 */
export async function getUserInfo() {
  return apiRequest<any>('/game/user-info', 'GET');
}

/**
 * 获取城市内政信息
 */
export async function getCityInteriorInfo(cityId?: number) {
  const id = cityId || 1;
  return apiRequest<any>(`/game/city/interior-info/${id}`, 'POST');
}

/**
 * 获取武将列表
 */
export async function getHeroList(cityId?: number) {
  const id = cityId || 1;
  return apiRequest<any>('/hero/list', 'POST', { city_id: id });
}

/**
 * 获取建筑列表
 */
export async function getBuildingList(cityId?: number) {
  const id = cityId || 1;
  return apiRequest<any>(`/building/list`, 'GET', { city_id: id, map_type: 0 });
}

// ============ 数据转换函数 ============

/**
 * 转换城市数据
 */
export function transformCityData(data: any): CityData {
  return {
    id: data.cityId || data.id || 1,
    name: data.name || '主城',
    level: data.Level || 1,
    population: data.Men || data.population || 0,
    gold: data.Gold || 0,
    food: data.Food || 0,
    wood: 0,
    stone: 0,
    iron: 0,
  };
}

/**
 * 转换武将数据
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
 * 转换建筑数据
 */
export function transformBuildingData(buildings: any[]): BuildingData[] {
  if (!Array.isArray(buildings)) return [];
  
  // 内政建筑配置
  const INTERIOR_BUILDINGS: Record<number, { name: string; type: string }> = {
    1: { name: '聚义厅', type: 'town_hall' },
    2: { name: '义舍', type: 'barracks' },
    3: { name: '农场', type: 'farm' },
    4: { name: '钱庄', type: 'market' },
    5: { name: '民居', type: 'warehouse' },
    6: { name: '粮仓', type: 'warehouse' },
    7: { name: '账房', type: 'market' },
    8: { name: '密库', type: 'warehouse' },
    9: { name: '工匠坊', type: 'lumber_mill' },
    10: { name: '营造司', type: 'lumber_mill' },
    11: { name: '演武场', type: 'academy' },
  };

  return buildings.map((b, index) => ({
    id: b.id || index + 1,
    type: (INTERIOR_BUILDINGS[b.configId]?.type || 'town_hall') as BuildingType,
    name: INTERIOR_BUILDINGS[b.configId]?.name || b.name || '建筑',
    level: b.level || 1,
    maxLevel: 20,
    status: b.state === 0 ? 'normal' : b.state === 2 ? 'upgrading' : 'normal',
    position: { x: b.position || 0, y: 0 },
  }));
}

/**
 * 转换资源数据
 */
export function transformResourceData(data: any): ResourceData {
  return {
    gold: data.Money || data.money || 0,
    food: data.Food || data.food || 0,
    wood: 0,
    stone: 0,
    iron: 0,
  };
}

// ============ 完整游戏数据加载 ============

export interface FullGameData {
  playerId: number;
  playerName: string;
  city: CityData;
  heroes: HeroData[];
  buildings: BuildingData[];
  resources: ResourceData;
}

/**
 * 加载完整游戏数据
 */
export async function loadFullGameData(): Promise<FullGameData | null> {
  try {
    // 1. 获取用户信息
    const userResult = await getUserInfo();
    if (!userResult.success || !userResult.data) {
      console.error('Failed to get user info:', userResult.error);
      return null;
    }

    const userData = userResult.data;
    const playerId = userData.ID || 1;
    const playerName = userData.Name || '玩家';
    
    // 获取第一个城市的 ID
    const cityList = userData.CityList || [];
    const firstCity = cityList[0] || { ID: 1, Name: '主城' };
    const cityId = firstCity.ID;

    // 2. 获取城市内政信息
    const cityResult = await getCityInteriorInfo(cityId);
    const cityData = cityResult.data || {};

    // 3. 获取武将列表
    const heroResult = await getHeroList(cityId);
    const heroesData = heroResult.data || [];

    // 4. 获取建筑列表
    const buildingResult = await getBuildingList(cityId);
    const buildingsData = buildingResult.data?.buildings || [];

    // 转换数据
    return {
      playerId,
      playerName,
      city: {
        id: cityId,
        name: firstCity.Name || '主城',
        level: cityData.Level || 1,
        population: cityData.Men || 0,
        gold: cityData.Gold || 0,
        food: cityData.Food || 0,
        wood: 0,
        stone: 0,
        iron: 0,
      },
      heroes: transformHeroData(heroesData),
      buildings: transformBuildingData(buildingsData),
      resources: transformResourceData(cityData),
    };
  } catch (error) {
    console.error('Failed to load game data:', error);
    return null;
  }
}

// ============ 排行榜 API ============

import type { RankItem, RankListResponse, MyRankResponse, RankType } from '../types';

/**
 * 获取排行榜列表
 * @param rankType 排行榜类型: 1=等级 2=战力 3=财富 4=武将
 * @param page 页码
 * @param pageSize 每页数量
 */
export async function getRankList(rankType: RankType = 1, page: number = 1, pageSize: number = 20) {
  return apiRequest<RankListResponse>(`/rank/list?rank_type=${rankType}&page=${page}&page_size=${pageSize}`, 'GET');
}

/**
 * 获取战力排行榜 (type=2)
 */
export async function getPowerRankList(page: number = 1, pageSize: number = 20) {
  return apiRequest<RankListResponse>(`/rank/power?page=${page}&page_size=${pageSize}`, 'GET');
}

/**
 * 获取等级排行榜 (type=1)
 */
export async function getLevelRankList(page: number = 1, pageSize: number = 20) {
  return apiRequest<RankListResponse>(`/rank/level?page=${page}&page_size=${pageSize}`, 'GET');
}

/**
 * 获取财富排行榜 (type=3)
 */
export async function getWealthRankList(page: number = 1, pageSize: number = 20) {
  return apiRequest<RankListResponse>(`/rank/wealth?page=${page}&page_size=${pageSize}`, 'GET');
}

/**
 * 获取城市排行榜 (type=1)
 */
export async function getCityRankList(page: number = 1, pageSize: number = 20) {
  return apiRequest<RankListResponse>(`/rank/city?page=${page}&page_size=${pageSize}`, 'GET');
}

/**
 * 获取个人排名
 * @param rankType 排行榜类型
 */
export async function getMyRank(rankType: RankType = 1) {
  return apiRequest<MyRankResponse>(`/rank/my-rank?rank_type=${rankType}`, 'GET');
}

/**
 * 获取武将排行榜 (type=4)
 */
export async function getHeroRankList(page: number = 1, pageSize: number = 20) {
  return apiRequest<RankListResponse>(`/rank/hero?page=${page}&page_size=${pageSize}`, 'GET');
}

/**
 * 获取荣誉排行榜
 */
export async function getFameRankList(page: number = 1, pageSize: number = 20) {
  return apiRequest<RankListResponse>(`/rank/fame?page=${page}&page_size=${pageSize}`, 'GET');
}

/**
 * 转换排行榜数据
 */
export function transformRankData(data: any, _rankType: RankType): RankItem[] {
  if (!data) return [];
  
  const rankings = data.rankings || (Array.isArray(data) ? data : []);
  
  return rankings.map((item: any, idx: number) => ({
    rank: item.rank || idx + 1,
    wallet_address: item.wallet_address || '',
    name: item.name || `玩家${(item.wallet_address || '').slice(0, 8)}`,
    level: item.level || 1,
    value: item.value || 0,
    isMe: item.isMe || false,
    hero_id: item.hero_id,
    attack: item.attack,
    winCount: item.winCount,
  }));
}

// ==================== 市场系统 API ====================

/**
 * 获取市场信息
 */
export async function getMarketInfo() {
  return apiRequest<MarketInfo>('/market/info', 'GET');
}

/**
 * 获取市场挂单列表
 * @param itemType 物品类型筛选（可选）
 * @param page 页码（默认1）
 */
export async function getMarketItems(itemType?: number, page: number = 1) {
  let endpoint = `/market/items?page=${page}`;
  if (itemType) {
    endpoint += `&item_type=${itemType}`;
  }
  return apiRequest<MarketItemsResponse>(endpoint, 'GET');
}

/**
 * 获取我的挂单列表
 * @param page 页码（默认1）
 */
export async function getMyListings(page: number = 1) {
  return apiRequest<MyListingsResponse>(`/market/my?page=${page}`, 'GET');
}

/**
 * 搜索市场物品
 * @param itemName 物品名称关键词
 * @param itemType 物品类型（可选）
 * @param page 页码
 */
export async function searchMarketItems(itemName: string, itemType?: number, page: number = 1) {
  let endpoint = `/market/search?item_name=${encodeURIComponent(itemName)}&page=${page}`;
  if (itemType) {
    endpoint += `&item_type=${itemType}`;
  }
  return apiRequest<MarketItemsResponse>(endpoint, 'GET');
}

/**
 * 挂牌出售物品
 * @param itemId 物品ID
 * @param price 挂牌价格
 */
export async function listItemForSale(itemId: number, price: number) {
  return apiRequest<ListItemResponse>('/market/list', 'POST', {
    item_id: itemId,
    price,
  });
}

/**
 * 购买物品
 * @param listingId 挂单ID
 * @param cityId 城市ID（可选，用于兼容旧接口）
 */
export async function buyMarketItem(listingId: number, cityId?: number) {
  return apiRequest<BuyItemResponse>('/market/buy', 'POST', {
    listing_id: listingId,
    city_id: cityId,
  });
}

/**
 * 取消挂单
 * @param listingId 挂单ID
 */
export async function cancelMarketListing(listingId: number) {
  return apiRequest<CancelListingResponse>('/market/cancel', 'POST', {
    listing_id: listingId,
  });
}

/**
 * 批量取消挂单
 * @param listingIds 挂单ID列表
 */
export async function batchCancelListings(listingIds: number[]) {
  return apiRequest<{ successCount: number; errorCount: number }>('/market/batch-cancel', 'POST', {
    listing_ids: listingIds,
  });
}

/**
 * 获取市场统计信息
 */
export async function getMarketStats() {
  return apiRequest<MarketStats>('/market/stats', 'GET');
}

/**
 * 获取物品价格走势
 * @param configId 物品配置ID
 */
export async function getPriceHistory(configId: number) {
  return apiRequest<PriceHistoryResponse>(`/market/price-history?config_id=${configId}`, 'GET');
}

/**
 * 获取市场挂单数量
 * @param itemType 物品类型（可选）
 */
export async function getMarketCount(itemType?: number) {
  let endpoint = '/market/count';
  if (itemType) {
    endpoint += `?item_type=${itemType}`;
  }
  return apiRequest<{ totalItems: number; myListings: number }>(endpoint, 'GET');
}

/**
 * 获取用户背包物品（用于出售）
 * @param itemType 物品类型筛选（可选）
 */
export async function getMyInventory(itemType?: number) {
  let endpoint = '/item/list';
  if (itemType) {
    endpoint += `?type=${itemType}`;
  }
  return apiRequest<UserInventoryResponse>(endpoint, 'GET');
}

/**
 * 转换用户背包物品数据
 */
export function transformInventoryItem(item: any): UserInventoryItem {
  return {
    itemId: item.ItemID || item.item_id || 0,
    configId: item.StaticIndex || item.config_id || 0,
    itemName: item.ItemName || item.item_name || item.name || '未知物品',
    itemType: item.ItemType || item.item_type || 1,
    itemIcon: item.ItemIcon || item.item_icon || '',
    itemDes: item.ItemDes || item.item_des || item.des || '',
    quality: item.Quality || item.quality || 1,
    durability: item.Durability || item.durability || 100,
    heroId: item.HeroID || item.hero_id || 0,
    equipped: item.State === 1 || item.equipped || false,
    price: item.Price || item.price || 0,
    sellDate: item.SellDate || item.sell_date || '',
  };
}

/**
 * 转换市场挂单数据（兼容前端格式）
 */
export function transformMarketItem(item: any): MarketListingItem {
  return {
    ListingID: item.ListingID || item.listing_id || item.id,
    SellerAddr: item.SellerAddr || item.seller_address || '',
    ItemID: item.ItemID || item.item_id || 0,
    ConfigID: item.ConfigID || item.config_id || 0,
    ItemType: item.ItemType || item.item_type || 1,
    ItemName: item.ItemName || item.item_name || item.name || '未知物品',
    ItemIcon: item.ItemIcon || item.item_icon || '',
    ItemDes: item.ItemDes || item.item_des || item.des || '',
    ItemQuality: item.ItemQuality || item.item_quality || item.quality || 1,
    Price: item.Price || item.price || 0,
    State: item.State || item.state || 1,
    CreatedAt: item.CreatedAt || item.created_at || '',
    IsMine: item.IsMine || item.is_mine || false,
  };
}

/**
 * 获取物品类型名称
 */
export function getItemTypeName(type: number): string {
  const typeMap: Record<number, string> = {
    1: '武器',
    2: '防具',
    3: '饰品',
    4: '消耗品',
    5: '材料',
    6: '时装',
    7: '坐骑',
    8: '称号',
    9: '礼包',
    10: '其他',
  };
  return typeMap[type] || '其他';
}

/**
 * 获取物品类型图标
 */
export function getItemTypeIcon(type: number): string {
  const iconMap: Record<number, string> = {
    1: '⚔️',
    2: '🛡️',
    3: '💍',
    4: '💊',
    5: '📦',
    6: '👔',
    7: '🐎',
    8: '🏅',
    9: '🎁',
    10: '❓',
  };
  return iconMap[type] || '❓';
}

// ==================== 科技系统 API ====================

import type { 
  TechData, 
  TechListResponse, 
  TechResearchingResponse, 
  TechResearchResult,
  TechConfigsResponse,
  TechEffectsSummary,
  TechCategory,
} from '../types';

/**
 * 获取玩家科技列表
 */
export async function getTechList() {
  return apiRequest<TechListResponse>('/tech/list', 'GET');
}

/**
 * 获取研究中科技列表
 */
export async function getTechResearching() {
  return apiRequest<TechResearchingResponse>('/tech/research', 'GET');
}

/**
 * 研究科技
 * @param staticIndex 科技静态索引
 * @param useImmediately 是否立即完成（消耗元宝）
 */
export async function researchTech(staticIndex: number, useImmediately: boolean = false) {
  return apiRequest<TechResearchResult>('/tech/research', 'POST', {
    static_index: staticIndex,
    use_immediately: useImmediately,
  });
}

/**
 * 获取科技配置
 */
export async function getTechConfigs() {
  return apiRequest<TechConfigsResponse>('/tech/configs', 'GET');
}

/**
 * 获取科技效果汇总
 */
export async function getTechEffects() {
  return apiRequest<TechEffectsSummary>('/tech/effects', 'GET');
}

/**
 * 根据建筑获取相关科技
 * @param cityId 城市ID
 * @param buildingType 建筑类型
 */
export async function getTechByBuilding(cityId: number, buildingType: number) {
  return apiRequest<any>(`/tech/by-building?city_id=${cityId}&building_type=${buildingType}`, 'GET');
}

/**
 * 转换科技数据 - 计算分类和标准化字段
 */
export function transformTechData(techs: any[]): TechData[] {
  if (!Array.isArray(techs)) return [];

  // 科技效果类型到分类的映射
  const EFFECT_TO_CATEGORY: Record<number, TechCategory> = {
    1: 'development',   // 区域/面积
    2: 'development',  // 建筑等级
    3: 'development',  // 训练速度
    4: 'development',  // 建造速度
    5: 'defense',      // 城墙
    6: 'defense',      // 箭塔
    7: 'defense',      // 陷阱
    8: 'defense',      // 滚木
    9: 'defense',      // 礌石
    10: 'military',    // 训练加成
    11: 'military',    // 士气
    12: 'military',    // 驻守
    13: 'economy',     // 仓库
    14: 'military',    // 器械
    15: 'military',    // 行军
  };

  return techs.map(tech => {
    const effectType = tech.effectType || tech.effType || 0;
    const currentLevel = tech.currentLevel ?? tech.Level ?? tech.level ?? 0;
    const maxLevel = tech.maxLevel || (tech.InteriorData?.length || 1);

    return {
      // 标准化字段
      id: tech.id || tech.ID || 0,
      staticIndex: tech.staticIndex || tech.Index || tech.id || 0,
      name: tech.name || tech.Name || '',
      icon: tech.icon,
      description: tech.description || tech.Des || '',
      effectType,
      currentLevel,
      maxLevel,
      currentEffect: tech.currentEffect || tech.CurrEff || tech.currentEff || 0,
      nextEffect: tech.nextEffect || 0,
      canUpgrade: tech.canUpgrade ?? (currentLevel < maxLevel),
      isUnlocked: tech.isUnlocked ?? (currentLevel > 0),
      state: tech.state || 0,
      
      // 升级消耗
      upgradeCost: tech.upgradeCost ? {
        money: tech.upgradeCost.money || 0,
        food: tech.upgradeCost.food || 0,
        gold: tech.upgradeCost.gold || 0,
        time: tech.upgradeCost.time || 0,
      } : null,
      
      // 升级需求
      upgradeRequirements: tech.upgradeRequirements ? {
        buildingId: tech.upgradeRequirements.buildingId || 0,
        buildingLevel: tech.upgradeRequirements.buildingLevel || 0,
        technicId: tech.upgradeRequirements.technicId || 0,
        technicLevel: tech.upgradeRequirements.technicLevel || 0,
        area: tech.upgradeRequirements.area || 0,
      } : null,
      
      // C# 原始字段
      ID: tech.ID,
      Index: tech.Index,
      Name: tech.Name,
      Des: tech.Des,
      Level: tech.Level,
      CurrEff: tech.CurrEff,
      CurrentEff: tech.CurrentEff,
      UpNeedBuildingID: tech.UpNeedBuildingID,
      UpNeedBuildingLevel: tech.UpNeedBuildingLevel,
      UpNeedFood: tech.UpNeedFood,
      UpNeedMoney: tech.UpNeedMoney,
      UpNeedMen: tech.UpNeedMen,
      UpNeedGold: tech.UpNeedGold,
      UpNeedArea: tech.UpNeedArea,
      EffID: tech.EffID,
      
      // 计算分类
      category: EFFECT_TO_CATEGORY[effectType] || 'development',
    };
  });
}

// ============ 城防相关 API ============

export async function getDefenseInfo(cityId?: number) {
  const id = cityId || 1;
  return apiRequest<any>(`/defense/info?city_id=${id}`, 'GET');
}

export async function getDefenseList(cityId?: number) {
  const id = cityId || 1;
  return apiRequest<any>(`/defense/list?city_id=${id}`, 'GET');
}

export async function getDefenseCount(cityId?: number) {
  const id = cityId || 1;
  return apiRequest<any>(`/defense/count?city_id=${id}`, 'GET');
}

export async function getDefenseLandform(cityId?: number) {
  const id = cityId || 1;
  return apiRequest<any>(`/defense/landform?city_id=${id}`, 'GET');
}

export async function getDefensePosHero(cityId?: number) {
  const id = cityId || 1;
  return apiRequest<any>(`/defense/pos-hero?city_id=${id}`, 'GET');
}

export async function setHeroDefence(heroId: number, position: number, cityId?: number) {
  const id = cityId || 1;
  return apiRequest<any>('/defense/hero', 'POST', { hero_id: heroId, position, city_id: id });
}

export async function buildDefense(type: number, position: number, cityId?: number) {
  const id = cityId || 1;
  return apiRequest<any>('/defense/build', 'POST', { type, position, city_id: id });
}

export async function upgradeDefense(defId: number) {
  return apiRequest<any>(`/defense/${defId}/upgrade`, 'POST');
}

// ============ 帮派相关 API ============

export async function getGuildMyInfo() {
  return apiRequest<any>('/guild/my-info', 'GET');
}

export async function getGuildMy() {
  return apiRequest<any>('/guild/my', 'GET');
}

export async function getGuildList(searchWord?: string, page: number = 1, pageSize: number = 20) {
  const params = new URLSearchParams();
  if (searchWord) params.set('search_word', searchWord);
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  return apiRequest<any>(`/guild/list?${params}`, 'GET');
}

export async function getGuildInfo(guildId: number) {
  return apiRequest<any>(`/guild/info?guild_id=${guildId}`, 'GET');
}

export async function createGuild(cityId: number, name: string, intro: string = '') {
  return apiRequest<any>('/guild/create', 'POST', { city_id: cityId, name, intro });
}

export async function applyJoinGuild(guildId: number, cityId: number) {
  return apiRequest<any>('/guild/apply', 'POST', { guild_id: guildId, city_id: cityId });
}

export async function joinGuildDirect(guildId: number) {
  return apiRequest<any>(`/guild/${guildId}/join`, 'POST');
}

export async function leaveGuild() {
  return apiRequest<any>('/guild/leave', 'POST');
}

export async function quitGuild(guildId: number) {
  return apiRequest<any>('/guild/quit', 'POST', { guild_id: guildId });
}

export async function disbandGuild(guildId: number) {
  return apiRequest<any>('/guild/disband', 'POST', { guild_id: guildId });
}

export async function getGuildMemberList(guildId?: number, memberType: string = 'all', page: number = 1, pageSize: number = 20) {
  const params = new URLSearchParams();
  if (guildId) params.set('guild_id', String(guildId));
  params.set('member_type', memberType);
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  return apiRequest<any>(`/guild/member-list?${params}`, 'GET');
}

export async function getGuildResource(guildId?: number) {
  const params = guildId ? `?guild_id=${guildId}` : '';
  return apiRequest<any>(`/guild/resource${params}`, 'GET');
}

export async function getGuildMyResource() {
  return apiRequest<any>('/guild/my-resource', 'GET');
}

export async function donateGuildResource(guildId: number, resourceType: string, amount: number) {
  return apiRequest<any>(`/guild/${guildId}/donate`, 'POST', { resource_type: resourceType, amount });
}

export async function contributeGuildResource(guildId: number, resourceType: string, amount: number) {
  return apiRequest<any>('/guild/contribute', 'POST', { guild_id: guildId, resource_type: resourceType, amount });
}

export async function upgradeGuild(guildId: number) {
  return apiRequest<any>('/guild/upgrade', 'POST', { guild_id: guildId });
}

export async function modifyGuildIntro(guildId: number, intro: string) {
  return apiRequest<any>('/guild/modify-intro', 'POST', { guild_id: guildId, intro });
}

export async function modifyGuildAffiche(guildId: number, affiche: string) {
  return apiRequest<any>('/guild/modify-affiche', 'POST', { guild_id: guildId, affiche });
}

export async function guildBossFunc(guildId: number, funcType: number, targetUsername: string) {
  return apiRequest<any>('/guild/boss-func', 'POST', { guild_id: guildId, func_type: funcType, target_username: targetUsername });
}

export async function promoteMember(guildId: number, deputyName: string) {
  return apiRequest<any>('/guild/promotion', 'POST', { guild_id: guildId, deputy_name: deputyName });
}

export async function demoteMember(guildId: number, deputyName: string) {
  return apiRequest<any>('/guild/demotion', 'POST', { guild_id: guildId, deputy_name: deputyName });
}

export async function abdicateGuild(guildId: number, heirName: string) {
  return apiRequest<any>('/guild/abdication', 'POST', { guild_id: guildId, heir_name: heirName });
}

export async function isGuildBoss(guildId?: number) {
  const params = guildId ? `?guild_id=${guildId}` : '';
  return apiRequest<any>(`/guild/is-boss${params}`, 'GET');
}

export async function getGuildEffectByLevel(level: number) {
  return apiRequest<any>(`/guild/effect-by-level?guild_level=${level}`, 'GET');
}

export async function getGuildChatMessages(startNum: number = 0) {
  return apiRequest<any>(`/guild/chat/messages?start_num=${startNum}`, 'GET');
}

// ============ 商城相关 API ============

export async function getMallInfo() {
  return apiRequest<any>('/shop/info', 'GET');
}

export async function getMallItemsByType(cityId: number, commodityType: number = 1) {
  return apiRequest<any>(`/shop/items-by-type?city_id=${cityId}&commodity_type=${commodityType}`, 'GET');
}

export async function buyFromMall(cityId: number, type: number, id: number, index: number = 0) {
  return apiRequest<any>('/shop/buy', 'POST', { cityID: cityId, type, id, index });
}

export async function goldBuyResource(cityId: number, resourceType: number, goldAmount: number) {
  return apiRequest<any>('/shop/gold-buy-resource', 'POST', { city_id: cityId, resource_type: resourceType, gold_amount: goldAmount });
}

export async function getResToGoldRate() {
  return apiRequest<any>('/shop/res-to-gold-rate', 'GET');
}

export async function getVipSevenDays() {
  return apiRequest<any>('/shop/vip-seven-days', 'GET');
}

export async function getVipThirtyDays() {
  return apiRequest<any>('/shop/vip-thirty-days', 'GET');
}

export async function getPeaceEightHours() {
  return apiRequest<any>('/shop/peace-eight-hours', 'GET');
}

export async function getPeaceTwoDays() {
  return apiRequest<any>('/shop/peace-two-days', 'GET');
}

export async function getPeaceSevenDays() {
  return apiRequest<any>('/shop/peace-seven-days', 'GET');
}

// ==================== 签到系统 API ====================

export interface SigninInfo {
  today: string;
  isToday: boolean;
  consecutiveDays: number;
  canSignin: boolean;
  todayReward: SigninReward;
  weekReward: SigninReward[];
}

export interface SigninReward {
  day: number;
  gold: number;
  items: { itemId: number; count: number }[];
}

export interface SigninResult {
  success: boolean;
  day?: number;
  reward?: SigninReward;
  message?: string;
  error?: string;
}

/**
 * 获取每日签到信息
 */
export async function getSigninInfo() {
  return apiRequest<SigninInfo>('/user-ext/signin', 'GET');
}

/**
 * 执行每日签到
 */
export async function doSignin() {
  return apiRequest<SigninResult>('/user-ext/signin', 'POST');
}

// ==================== 礼包码兑换 API ====================

export interface GiftCodeResult {
  success: boolean;
  reward?: {
    gold?: number;
    items?: { itemId: number; name: string; count: number }[];
  };
  message?: string;
  error?: string;
}

/**
 * 兑换礼包码
 * @param code 礼包码
 */
export async function redeemGiftCode(_code: string): Promise<GiftCodeResult> {
  // TODO: 后端尚未实现兑换码 API，预留接口位置
  // 实际后端实现后替换为: return apiRequest<GiftCodeResult>('/giftcode/redeem', 'POST', { code });
  return {
    success: false,
    error: '礼包码功能即将开放',
  };
}

// ==================== 任务系统 API (TaskPanel) ====================
// 来源: workers/ghost-game/src/routes/task.ts, task-ext.ts

export interface TaskListResponse {
  tasks: any[];
  total?: number;
}

export interface TaskDetailResponse {
  task: any;
}

export interface TaskActionResponse {
  success: boolean;
  message?: string;
}

/**
 * 获取当前进行中的任务列表
 * 来源: /api/task (GET)
 */
export async function getCurrentTasks(cityId?: number) {
  return apiRequest<TaskListResponse>(`/task?city_id=${cityId || 1}`, 'GET');
}

/**
 * 获取任务列表 (POST)
 * 来源: /api/task/list (POST)
 */
export async function getTaskList(cityId?: number) {
  return apiRequest<TaskListResponse>('/task/list', 'POST', { city_id: cityId || 1 });
}

/**
 * 获取日常任务列表
 * 来源: /api/task/daily (GET)
 */
export async function getDailyTasks(cityId?: number) {
  return apiRequest<TaskListResponse>(`/task/daily?city_id=${cityId || 1}`, 'GET');
}

/**
 * 获取其他类型任务简要信息
 * 来源: /api/task/other/simple (GET)
 */
export async function getTaskOtherSimple(cityId?: number, taskType: number = 1) {
  return apiRequest<TaskListResponse>(`/task/other/simple?city_id=${cityId || 1}&task_type=${taskType}`, 'GET');
}

/**
 * 获取指定类型的任务列表
 * 来源: /api/task/by-type (GET)
 */
export async function getTasksByType(cityId?: number, taskType: number = 1) {
  return apiRequest<TaskListResponse>(`/task/by-type?city_id=${cityId || 1}&task_type=${taskType}`, 'GET');
}

// ============ 任务扩展 API (task-ext.ts) ============

/**
 * 获取可接受的任务列表
 * 来源: /api/task-ext/available (GET)
 */
export async function getAvailableTasks() {
  return apiRequest<TaskListResponse>('/task-ext/available', 'GET');
}

/**
 * 获取任务详情
 * 来源: /api/task-ext/detail/:taskId (GET)
 */
export async function getTaskDetail(taskId: number) {
  return apiRequest<TaskDetailResponse>(`/task-ext/detail/${taskId}`, 'GET');
}

/**
 * 接受任务
 * 来源: /api/task-ext/accept (POST)
 */
export async function acceptTask(taskId: number, cityId?: number) {
  return apiRequest<TaskActionResponse>('/task-ext/accept', 'POST', {
    task_id: taskId,
    city_id: cityId || 1,
  });
}

/**
 * 放弃/取消任务
 * 来源: /api/task-ext/abandon (POST)
 */
export async function abandonTask(taskId: number, cityId?: number) {
  return apiRequest<TaskActionResponse>('/task-ext/abandon', 'POST', {
    task_id: taskId,
    city_id: cityId || 1,
  });
}

/**
 * 提交任务进度
 * 来源: /api/task-ext/progress (POST)
 */
export async function updateTaskProgress(taskId: number, cityId?: number) {
  return apiRequest<TaskActionResponse>('/task-ext/progress', 'POST', {
    task_id: taskId,
    city_id: cityId || 1,
  });
}

/**
 * 完成任务（领取奖励）
 * 来源: /api/task-ext/complete (POST)
 */
export async function completeTask(taskId: number, cityId?: number) {
  return apiRequest<TaskActionResponse>('/task-ext/complete', 'POST', {
    task_id: taskId,
    city_id: cityId || 1,
  });
}

/**
 * 一键完成所有可完成任务
 * 来源: /api/task-ext/complete-all (POST)
 */
export async function completeAllTasks(cityId?: number) {
  return apiRequest<{ completed: number; rewards: any[] }>('/task-ext/complete-all', 'POST', {
    city_id: cityId || 1,
  });
}

/**
 * 获取成就列表
 * 来源: /api/task-ext/achievements (GET)
 */
export async function getAchievements() {
  return apiRequest<{ achievements: any[] }>('/task-ext/achievements', 'GET');
}

/**
 * 获取成就进度
 * 来源: /api/task-ext/achievements/:achievementId/progress (GET)
 */
export async function getAchievementProgress(achievementId: number) {
  return apiRequest<{ progress: any }>(`/task-ext/achievements/${achievementId}/progress`, 'GET');
}

/**
 * 重置日常任务
 * 来源: /api/task-ext/daily/reset (POST)
 */
export async function resetDailyTasks(cityId?: number) {
  return apiRequest<TaskActionResponse>('/task-ext/daily/reset', 'POST', {
    city_id: cityId || 1,
  });
}

// ==================== 竞技场 API (ArenaPanel) ====================
// 来源: workers/ghost-game/src/routes/arena.ts

export interface ArenaInfoResponse {
  myRank: number;
  score: number;
  winCount: number;
  loseCount: number;
  challengeTimes: number;
  maxTimes: number;
  userName: string;
  userLevel: number;
  opponents: any[];
}

export interface ArenaChallengeResponse {
  success: boolean;
  result?: 'win' | 'lose';
  scoreChange?: number;
  newScore?: number;
  newRank?: number;
  reward?: { gold: number; exp: number };
  message?: string;
}

export interface ArenaRankingsResponse {
  rankings: any[];
  total: number;
}

/**
 * 获取竞技场信息
 * 来源: /api/arena (GET)
 */
export async function getArenaInfo() {
  return apiRequest<ArenaInfoResponse>('/arena', 'GET');
}

/**
 * 获取竞技场剩余挑战次数
 * 来源: /api/arena/times (GET)
 */
export async function getArenaTimes() {
  return apiRequest<{ times: number; maxTimes: number; resetTime: string }>('/arena/times', 'GET');
}

/**
 * 挑战竞技场对手
 * 来源: /api/arena/challenge (POST)
 */
export async function challengeArenaOpponent(opponentAddress: string) {
  return apiRequest<ArenaChallengeResponse>('/arena/challenge', 'POST', {
    opponentAddress,
  });
}

/**
 * 获取竞技场排行榜
 * 来源: /api/arena/rankings (GET)
 */
export async function getArenaRankings() {
  return apiRequest<ArenaRankingsResponse>('/arena/rankings', 'GET');
}

// ==================== 战役/名城战 API (WarfarePanel) ====================
// 来源: workers/ghost-game/src/routes/warfare.ts

/**
 * 获取战区列表
 * 来源: /api/warfare/area (GET)
 */
export async function getWarfareAreas(type: number = 1) {
  return apiRequest<{ areas: any[] }>(`/warfare/area?type=${type}`, 'GET');
}

/**
 * 获取名城战等待列表
 * 来源: /api/warfare/waiting (GET)
 */
export async function getWarfareWaitingList() {
  return apiRequest<{ waitingList: any[] }>('/warfare/waiting', 'GET');
}

/**
 * 获取用户当前名城战参战状态
 * 来源: /api/warfare/user-battle (GET)
 */
export async function getWarfareUserBattle() {
  return apiRequest<any>('/warfare/user-battle', 'GET');
}

/**
 * 获取名城战详情
 * 来源: /api/warfare/detail (GET)
 */
export async function getWarfareDetail(battleId: number) {
  return apiRequest<any>(`/warfare/detail?battle_id=${battleId}`, 'GET');
}

/**
 * 取消名城战报名
 * 来源: /api/warfare/cancel (POST)
 */
export async function cancelWarfare(battleId: number) {
  return apiRequest<{ success: boolean; message?: string }>('/warfare/cancel', 'POST', {
    battle_id: battleId,
  });
}

/**
 * 选择参加名城战
 * 来源: /api/warfare/select (POST)
 */
export async function selectWarfare(battleId: number, areaId: number) {
  return apiRequest<{ success: boolean; message?: string }>('/warfare/select', 'POST', {
    battle_id: battleId,
    area_id: areaId,
  });
}

/**
 * 获取名城战配置
 * 来源: /api/warfare/config (GET)
 */
export async function getWarfareConfig() {
  return apiRequest<any>('/warfare/config', 'GET');
}

/**
 * 检查名城战是否开放
 * 来源: /api/warfare/is-open (GET)
 */
export async function isWarfareOpen() {
  return apiRequest<{ isOpen: boolean; nextOpenTime?: string }>('/warfare/is-open', 'GET');
}

/**
 * 获取名城战战场信息
 * 来源: /api/warfare/battle (GET)
 */
export async function getWarfareBattle(battleId: number) {
  return apiRequest<any>(`/warfare/battle?battle_id=${battleId}`, 'GET');
}

/**
 * 获取名城战战斗结果
 * 来源: /api/warfare/result (GET)
 */
export async function getWarfareResult(battleId: number) {
  return apiRequest<any>(`/warfare/result?battle_id=${battleId}`, 'GET');
}

/**
 * 手动触发名城战匹配
 * 来源: /api/warfare/match (POST)
 */
export async function matchWarfare() {
  return apiRequest<{ matched: boolean; battleId?: number }>('/warfare/match', 'POST');
}

// ==================== 邮件系统 API (MailPanel) ====================
// 来源: workers/ghost-game/src/routes/mail.ts, mail-ext.ts

export interface MailListResponse {
  mails: any[];
  total: number;
  page: number;
  unread: number;
}

export interface MailDetailResponse {
  mail: any;
}

export interface SendMailRequest {
  to_user: string;
  title: string;
  content: string;
  attachment?: { itemId: number; count: number }[];
}

export interface MailSendResponse {
  success: boolean;
  mailId?: number;
  message?: string;
}

/**
 * 获取邮件列表
 * 来源: /api/mail/list (GET)
 */
export async function getMailList(page: number = 1, pageSize: number = 20) {
  return apiRequest<MailListResponse>(`/mail/list?page=${page}&page_size=${pageSize}`, 'GET');
}

/**
 * 获取邮件列表 (POST)
 * 来源: /api/mail (POST)
 */
export async function getMailListPost(page: number = 1, pageSize: number = 20) {
  return apiRequest<MailListResponse>('/mail', 'POST', { page, page_size: pageSize });
}

/**
 * 获取未读邮件数量
 * 来源: /api/mail/unread-count (GET)
 */
export async function getMailUnreadCount() {
  return apiRequest<{ unreadCount: number }>('/mail/unread-count', 'GET');
}

/**
 * 获取新邮件数量
 * 来源: /api/mail/new-count (GET)
 */
export async function getMailNewCount() {
  return apiRequest<{ newCount: number }>('/mail/new-count', 'GET');
}

/**
 * 获取邮件总数
 * 来源: /api/mail/count (GET)
 */
export async function getMailCount() {
  return apiRequest<{ total: number; unread: number }>('/mail/count', 'GET');
}

/**
 * 获取最新邮件
 * 来源: /api/mail/new (GET)
 */
export async function getMailNew(page: number = 1, pageSize: number = 20) {
  return apiRequest<MailListResponse>(`/mail/new?page=${page}&page_size=${pageSize}`, 'GET');
}

/**
 * 按类型获取邮件
 * 来源: /api/mail/by-type (GET)
 */
export async function getMailByType(mailType: number = 0, page: number = 1, pageSize: number = 20) {
  return apiRequest<MailListResponse>(
    `/mail/by-type?mail_type=${mailType}&page=${page}&page_size=${pageSize}`, 'GET'
  );
}

/**
 * 获取邮件详情
 * 来源: /api/mail/detail (GET)
 */
export async function getMailDetail(mailId: number) {
  return apiRequest<MailDetailResponse>(`/mail/detail?mail_id=${mailId}`, 'GET');
}

/**
 * 获取战报邮件详情
 * 来源: /api/mail/fight (GET)
 */
export async function getMailFight(mailId: number) {
  return apiRequest<MailDetailResponse>(`/mail/fight?mail_id=${mailId}`, 'GET');
}

/**
 * 删除邮件
 * 来源: /api/mail/delete (POST)
 */
export async function deleteMail(mailIds: number[]) {
  return apiRequest<{ deletedCount: number }>('/mail/delete', 'POST', { mail_ids: mailIds });
}

/**
 * 发送邮件
 * 来源: /api/mail/send (POST)
 */
export async function sendMail(toUser: string, title: string, content: string) {
  return apiRequest<MailSendResponse>('/mail/send', 'POST', {
    to_user: toUser,
    title,
    content,
  });
}

/**
 * 领取邮件附件
 * 来源: /api/mail/claim (POST)
 */
export async function claimMailAttachment(mailId: number) {
  return apiRequest<{ success: boolean; items?: any[] }>('/mail/claim', 'POST', { mail_id: mailId });
}

/**
 * 领取所有邮件附件
 * 来源: /api/mail-ext/claim-all (POST)
 */
export async function claimAllMailAttachments() {
  return apiRequest<{ claimed: number }>('/mail-ext/claim-all', 'POST');
}

// ==================== 地图系统 API (MapPanel) ====================
// 来源: workers/ghost-game/src/routes/map.ts

export interface MapConfigResponse {
  width: number;
  height: number;
  worldSize: number;
  terrainTypes: Record<string, number>;
}

export interface PlayerPositionResponse {
  position: number;
  name: string;
}

export interface ExploreResult {
  position: number;
  distance: number;
  explored: boolean;
  terrain: { type: number };
  message: string;
}

export interface MovementStatus {
  moving: boolean;
  from?: number;
  to?: number;
  arriveTime?: string;
  remainingSeconds?: number;
  message?: string;
}

/**
 * 获取地图配置
 * 来源: /api/map/config (GET)
 */
export async function getMapConfig() {
  return apiRequest<MapConfigResponse>('/map/config', 'GET');
}

/**
 * 获取地图概览
 * 来源: /api/map (GET)
 */
export async function getMapOverview() {
  return apiRequest<any>('/map/', 'GET');
}

/**
 * 获取玩家位置
 * 来源: /api/map/position (GET)
 */
export async function getPlayerPosition() {
  return apiRequest<PlayerPositionResponse>('/map/position', 'GET');
}

/**
 * 获取指定区域地块信息
 * 来源: /api/map/area/:x/:y (GET)
 */
export async function getMapArea(x: number, y: number) {
  return apiRequest<any>(`/map/area/${x}/${y}`, 'GET');
}

/**
 * 获取指定位置详细信息
 * 来源: /api/map/position/:pos (GET)
 */
export async function getMapPositionDetail(pos: number) {
  return apiRequest<any>(`/map/position/${pos}`, 'GET');
}

/**
 * 探索地块
 * 来源: /api/map/explore (POST)
 */
export async function exploreMapPosition(pos: number, cityId?: number) {
  return apiRequest<ExploreResult>('/map/explore', 'POST', {
    position: pos,
    city_id: cityId || 1,
  });
}

/**
 * 获取已探索地块列表
 * 来源: /api/map/explored (GET)
 */
export async function getExploredPositions() {
  return apiRequest<{ positions: number[] }>('/map/explored', 'GET');
}

/**
 * 移动到地块
 * 来源: /api/map/move (POST)
 */
export async function moveToPosition(toPos: number, fromPos: number, cityId?: number) {
  return apiRequest<{ success: boolean; arriveTime?: string }>('/map/move', 'POST', {
    to_pos: toPos,
    from_pos: fromPos,
    city_id: cityId || 1,
  });
}

/**
 * 获取移动状态
 * 来源: /api/map/movement/status (GET)
 */
export async function getMovementStatus() {
  return apiRequest<MovementStatus>('/map/movement/status', 'GET');
}

/**
 * 取消移动
 * 来源: /api/map/movement/cancel (POST)
 */
export async function cancelMovement() {
  return apiRequest<{ success: boolean }>('/map/movement/cancel', 'POST');
}

/**
 * 获取NPC列表
 * 来源: /api/map/npcs (GET)
 */
export async function getMapNpcs() {
  return apiRequest<{ npcs: any[] }>('/map/npcs', 'GET');
}

/**
 * 获取地图单元信息
 * 来源: /api/map/unit (GET)
 */
export async function getMapUnit(unitType: number, pos: number) {
  return apiRequest<any>(`/map/unit?unit_type=${unitType}&pos=${pos}`, 'GET');
}

/**
 * 获取世界地形信息
 * 来源: /api/map/world/landform (GET)
 */
export async function getWorldLandform() {
  return apiRequest<any>('/map/world/landform', 'GET');
}

/**
 * 获取地块状态
 * 来源: /api/map/world/pos-state (GET)
 */
export async function getWorldPosState(pos: number) {
  return apiRequest<any>(`/map/world/pos-state?pos=${pos}`, 'GET');
}

/**
 * 获取城市名称
 * 来源: /api/map/city-name (GET)
 */
export async function getCityName(pos: number) {
  return apiRequest<{ name: string }>(`/map/city-name?pos=${pos}`, 'GET');
}

/**
 * 根据位置获取信息
 * 来源: /api/map/info-by-pos (GET)
 */
export async function getMapInfoByPos(pos: number) {
  return apiRequest<any>(`/map/info-by-pos?pos=${pos}`, 'GET');
}

// ==================== 武将详细 API (HeroPanel) ====================
// 来源: workers/ghost-game/src/routes/hero.ts, hero-ext.ts

/**
 * 获取武将详情
 * 来源: /api/hero/detail (GET)
 */
export async function getHeroDetail(heroId: number) {
  return apiRequest<any>(`/hero/detail?hero_id=${heroId}`, 'GET');
}

/**
 * 获取武将详情 (POST)
 * 来源: /api/hero/detail (POST)
 */
export async function getHeroDetailPost(cityId: number, heroId: number) {
  return apiRequest<any>('/hero/detail', 'POST', { city_id: cityId, hero_id: heroId });
}

/**
 * 招募武将
 * 来源: /api/hero/recruit (POST)
 */
export async function recruitHero(cityId: number) {
  return apiRequest<any>('/hero/recruit', 'POST', { city_id: cityId });
}

/**
 * 武将升级
 * 来源: /api/hero/levelup (POST)
 */
export async function heroLevelUp(cityId: number, heroId: number) {
  return apiRequest<any>('/hero/levelup', 'POST', { city_id: cityId, hero_id: heroId });
}

/**
 * 训练武将
 * 来源: /api/hero/:heroId/train (POST)
 */
export async function trainHero(heroId: number, cityId?: number) {
  return apiRequest<any>(`/hero/${heroId}/train`, 'POST', { city_id: cityId || 1 });
}

/**
 * 武将突破/升级
 * 来源: /api/hero/:heroId/upgrade (POST)
 */
export async function upgradeHero(heroId: number, cityId?: number) {
  return apiRequest<any>(`/hero/${heroId}/upgrade`, 'POST', { city_id: cityId || 1 });
}

/**
 * 获取用户所有武将
 * 来源: /api/hero/user-heroes (GET)
 */
export async function getUserHeroes() {
  return apiRequest<any>('/hero/user-heroes', 'GET');
}

/**
 * 获取武将数量
 * 来源: /api/hero/count (GET)
 */
export async function getHeroCount() {
  return apiRequest<{ count: number }>('/hero/count', 'GET');
}

/**
 * 检查武将是否可以参战
 * 来源: /api/hero/can-engage (POST)
 */
export async function canEngageHero(cityId: number, heroId: number, union: number = 0) {
  return apiRequest<{ canEngage: boolean }>('/hero/can-engage', 'POST', {
    city_id: cityId,
    hero_id: heroId,
    union,
  });
}

/**
 * 参战
 * 来源: /api/hero/engage (POST)
 */
export async function engageHero(cityId: number, heroId: number, union: number = 0) {
  return apiRequest<any>('/hero/engage', 'POST', { city_id: cityId, hero_id: heroId, union });
}

/**
 * 解雇武将
 * 来源: /api/hero/fire (POST)
 */
export async function fireHero(cityId: number, heroId: number) {
  return apiRequest<any>('/hero/fire', 'POST', { city_id: cityId, hero_id: heroId });
}

/**
 * 快速恢复武将体力
 * 来源: /api/hero/fast-health (POST)
 */
export async function fastHealthHero(cityId: number, heroId: number) {
  return apiRequest<any>('/hero/fast-health', 'POST', { city_id: cityId, hero_id: heroId });
}

/**
 * 设置城防武将
 * 来源: /api/hero/set-defence (POST)
 */
export async function setHeroDefencePos(cityId: number, heroId: number) {
  return apiRequest<any>('/hero/set-defence', 'POST', { city_id: cityId, hero_id: heroId });
}

/**
 * 卸下装备
 * 来源: /api/hero/unequip (POST)
 */
export async function unequipHeroItem(cityId: number, heroId: number) {
  return apiRequest<any>('/hero/unequip', 'POST', { city_id: cityId, hero_id: heroId });
}

/**
 * 经验转化为物品
 * 来源: /api/hero/exp-to-item (POST)
 */
export async function heroExpToItem(cityId: number, heroId: number, itemId: number) {
  return apiRequest<any>('/hero/exp-to-item', 'POST', { city_id: cityId, hero_id: heroId, item_id: itemId });
}

/**
 * 获取自动经验突破设置
 * 来源: /api/hero/auto-exp-break (GET)
 */
export async function getAutoExpBreak() {
  return apiRequest<any>('/hero/auto-exp-break', 'GET');
}

/**
 * 获取自动经验百分比
 * 来源: /api/hero/auto-exp-percent (GET)
 */
export async function getAutoExpPercent() {
  return apiRequest<any>('/hero/auto-exp-percent', 'GET');
}

/**
 * 获取武将经验百分比
 * 来源: /api/hero/exp-percent (GET)
 */
export async function getHeroExpPercent(heroId: number) {
  return apiRequest<{ percent: number }>(`/hero/exp-percent?hero_id=${heroId}`, 'GET');
}

/**
 * 获取按技能等级筛选的武将
 * 来源: /api/hero/by-skill-level (GET)
 */
export async function getHeroBySkillLevel(cityId: number, level: number) {
  return apiRequest<any>(`/hero/by-skill-level?city_id=${cityId}&level=${level}`, 'GET');
}

/**
 * 获取武将驻守效果标记
 * 来源: /api/hero/persist-effect-flags (GET)
 */
export async function getPersistEffectFlags(heroId: number) {
  return apiRequest<any>(`/hero/persist-effect-flags?hero_id=${heroId}`, 'GET');
}

// ============ 武将扩展 API (hero-ext.ts) ============

/**
 * 获取武将缘分配置
 * 来源: /api/hero-ext/fate/config (GET)
 */
export async function getHeroFateConfig() {
  return apiRequest<any>('/hero-ext/fate/config', 'GET');
}

/**
 * 检查武将缘分
 * 来源: /api/hero-ext/fate/check (POST)
 */
export async function checkHeroFate(heroIds: number[]) {
  return apiRequest<{ bonus: any }>('/hero-ext/fate/check', 'POST', { hero_ids: heroIds });
}

/**
 * 获取缘分加成
 * 来源: /api/hero-ext/fate/bonus (GET)
 */
export async function getHeroFateBonus() {
  return apiRequest<any>('/hero-ext/fate/bonus', 'GET');
}

/**
 * 获取武将觉醒配置
 * 来源: /api/hero-ext/awake/config (GET)
 */
export async function getAwakeConfig() {
  return apiRequest<any>('/hero-ext/awake/config', 'GET');
}

/**
 * 检查武将觉醒条件
 * 来源: /api/hero-ext/awake/check (POST)
 */
export async function checkHeroAwake(heroId: number) {
  return apiRequest<{ canAwake: boolean }>('/hero-ext/awake/check', 'POST', { hero_id: heroId });
}

/**
 * 武将觉醒
 * 来源: /api/hero-ext/awake (POST)
 */
export async function awakeHero(heroId: number) {
  return apiRequest<any>('/hero-ext/awake', 'POST', { hero_id: heroId });
}

/**
 * 获取武将突破配置
 * 来源: /api/hero-ext/breakthrough/config (GET)
 */
export async function getBreakthroughConfig() {
  return apiRequest<any>('/hero-ext/breakthrough/config', 'GET');
}

/**
 * 检查武将突破条件
 * 来源: /api/hero-ext/breakthrough/check (POST)
 */
export async function checkHeroBreakthrough(heroId: number) {
  return apiRequest<{ canBreakthrough: boolean }>('/hero-ext/breakthrough/check', 'POST', { hero_id: heroId });
}

/**
 * 武将突破
 * 来源: /api/hero-ext/breakthrough (POST)
 */
export async function breakthroughHero(heroId: number) {
  return apiRequest<any>('/hero-ext/breakthrough', 'POST', { hero_id: heroId });
}

/**
 * 获取兵种适性配置
 * 来源: /api/hero-ext/unit-adapt/config (GET)
 */
export async function getUnitAdaptConfig() {
  return apiRequest<any>('/hero-ext/unit-adapt/config', 'GET');
}

/**
 * 获取武将兵种适性
 * 来源: /api/hero-ext/unit-adapt/:heroId (GET)
 */
export async function getHeroUnitAdapt(heroId: number) {
  return apiRequest<any>(`/hero-ext/unit-adapt/${heroId}`, 'GET');
}

/**
 * 检查兵种适性升级条件
 * 来源: /api/hero-ext/unit-adapt/check (POST)
 */
export async function checkUnitAdaptUpgrade(heroId: number, unitType: number) {
  return apiRequest<{ canUpgrade: boolean }>('/hero-ext/unit-adapt/check', 'POST', {
    hero_id: heroId,
    unit_type: unitType,
  });
}

/**
 * 升级兵种适性
 * 来源: /api/hero-ext/unit-adapt/upgrade (POST)
 */
export async function upgradeUnitAdapt(heroId: number, unitType: number) {
  return apiRequest<any>('/hero-ext/unit-adapt/upgrade', 'POST', { hero_id: heroId, unit_type: unitType });
}

/**
 * 获取武将受伤状态
 * 来源: /api/hero-ext/injury/:heroId (GET)
 */
export async function getHeroInjuryStatus(heroId: number) {
  return apiRequest<any>(`/hero-ext/injury/${heroId}`, 'GET');
}

/**
 * 恢复武将伤势
 * 来源: /api/hero-ext/injury/recover (POST)
 */
export async function recoverHeroInjury(heroId: number) {
  return apiRequest<any>('/hero-ext/injury/recover', 'POST', { hero_id: heroId });
}

/**
 * 获取武将技能列表
 * 来源: /api/hero-ext/skills/:heroId (GET)
 */
export async function getHeroSkills(heroId: number) {
  return apiRequest<any>(`/hero-ext/skills/${heroId}`, 'GET');
}

/**
 * 检查技能升级条件
 * 来源: /api/hero-ext/skills/upgrade/check (POST)
 */
export async function checkSkillUpgrade(heroId: number, skillId: number) {
  return apiRequest<{ canUpgrade: boolean; cost?: any }>('/hero-ext/skills/upgrade/check', 'POST', {
    hero_id: heroId,
    skill_id: skillId,
  });
}

/**
 * 升级武将技能
 * 来源: /api/hero-ext/skills/upgrade (POST)
 */
export async function upgradeHeroSkill(heroId: number, skillId: number) {
  return apiRequest<any>('/hero-ext/skills/upgrade', 'POST', { hero_id: heroId, skill_id: skillId });
}

// ==================== 物品详细 API (ItemPanel) ====================
// 来源: workers/ghost-game/src/routes/item.ts, item-ext.ts

/**
 * 获取物品配置列表
 * 来源: /api/item/configs (GET)
 */
export async function getItemConfigs() {
  return apiRequest<any>('/item/configs', 'GET');
}

/**
 * 获取物品数量
 * 来源: /api/item/count (GET)
 */
export async function getItemCount() {
  return apiRequest<{ count: number; items: any[] }>('/item/count', 'GET');
}

/**
 * 使用物品
 * 来源: /api/item/use (POST)
 */
export async function useItem(itemId: number, heroId?: number) {
  return apiRequest<any>('/item/use', 'POST', { item_id: itemId, hero_id: heroId });
}

/**
 * 添加物品
 * 来源: /api/item/add (POST)
 */
export async function addItem(itemId: number, count: number = 1) {
  return apiRequest<any>('/item/add', 'POST', { item_id: itemId, count });
}

/**
 * 分解物品
 * 来源: /api/item/disassemble (POST)
 */
export async function disassembleItem(itemId: number) {
  return apiRequest<any>('/item/disassemble', 'POST', { item_id: itemId });
}

/**
 * 物品兑换
 * 来源: /api/item/exchange (POST)
 */
export async function exchangeItem(itemId: number, count: number = 1) {
  return apiRequest<any>('/item/exchange', 'POST', { item_id: itemId, count });
}

/**
 * 出售物品
 * 来源: /api/item/sell (POST)
 */
export async function sellItem(itemId: number, count: number = 1) {
  return apiRequest<any>('/item/sell', 'POST', { item_id: itemId, count });
}

/**
 * 装备物品到武将
 * 来源: /api/item/equip (POST)
 */
export async function equipItem(itemId: number, heroId: number) {
  return apiRequest<any>('/item/equip', 'POST', { item_id: itemId, hero_id: heroId });
}

/**
 * 卸下装备
 * 来源: /api/item/unequip (POST)
 */
export async function unequipItem(itemId: number) {
  return apiRequest<any>('/item/unequip', 'POST', { item_id: itemId });
}

/**
 * 修复装备
 * 来源: /api/item/repair (POST)
 */
export async function repairItem(itemId: number) {
  return apiRequest<any>('/item/repair', 'POST', { item_id: itemId });
}

/**
 * 修复所有装备
 * 来源: /api/item/repair-general (POST)
 */
export async function repairAllItems() {
  return apiRequest<any>('/item/repair-general', 'POST');
}

/**
 * 捐赠物品
 * 来源: /api/item/donate (POST)
 */
export async function donateItem(itemId: number, count: number = 1) {
  return apiRequest<any>('/item/donate', 'POST', { item_id: itemId, count });
}

/**
 * 使用武将经验物品
 * 来源: /api/item/use-hero-exp (POST)
 */
export async function useHeroExpItem(itemId: number, heroId: number) {
  return apiRequest<any>('/item/use-hero-exp', 'POST', { item_id: itemId, hero_id: heroId });
}

/**
 * 使用勋章物品
 * 来源: /api/item/use-insignia (POST)
 */
export async function useInsigniaItem(itemId: number, heroId: number) {
  return apiRequest<any>('/item/use-insignia', 'POST', { item_id: itemId, hero_id: heroId });
}

/**
 * 更换武将技能
 * 来源: /api/item/change-skill (POST)
 */
export async function changeHeroSkill(heroId: number, skillId: number) {
  return apiRequest<any>('/item/change-skill', 'POST', { hero_id: heroId, skill_id: skillId });
}

/**
 * 升级武将技能
 * 来源: /api/item/upgrade-skill (POST)
 */
export async function upgradeSkill(itemId: number, heroId: number) {
  return apiRequest<any>('/item/upgrade-skill', 'POST', { item_id: itemId, hero_id: heroId });
}

/**
 * 使用技能经验物品
 * 来源: /api/item/skill-exp (POST)
 */
export async function useSkillExpItem(itemId: number, heroId: number) {
  return apiRequest<any>('/item/skill-exp', 'POST', { item_id: itemId, hero_id: heroId });
}

/**
 * 使用宴会物品
 * 来源: /api/item/use-feast (POST)
 */
export async function useFeastItem(itemId: number) {
  return apiRequest<any>('/item/use-feast', 'POST', { item_id: itemId });
}

/**
 * 获取物品名称
 * 来源: /api/item/name (GET)
 */
export async function getItemName(itemId: number) {
  return apiRequest<{ name: string }>(`/item/name?item_id=${itemId}`, 'GET');
}

/**
 * 获取可使用的物品列表
 * 来源: /api/item/can-use (GET)
 */
export async function getCanUseItems(cityId: number, type: number = 4, heroLevel: number = 1) {
  return apiRequest<any>(`/item/can-use?city_id=${cityId}&type=${type}&hero_level=${heroLevel}`, 'GET');
}

/**
 * 获取物品耐久度
 * 来源: /api/item-ext/durability/:itemId (GET)
 */
export async function getItemDurability(itemId: number) {
  return apiRequest<any>(`/item-ext/durability/${itemId}`, 'GET');
}

/**
 * 使用耐久度恢复物品
 * 来源: /api/item-ext/durability/use (POST)
 */
export async function useDurabilityItem(itemId: number) {
  return apiRequest<any>('/item-ext/durability/use', 'POST', { item_id: itemId });
}

// ============ 物品扩展 API (item-ext.ts) ============

/**
 * 获取合成配方列表
 * 来源: /api/item-ext/compose/recipes (GET)
 */
export async function getComposeRecipes(category?: number) {
  const params = category !== undefined ? `?category=${category}` : '';
  return apiRequest<any>(`/item-ext/compose/recipes${params}`, 'GET');
}

/**
 * 检查合成条件
 * 来源: /api/item-ext/compose/check (POST)
 */
export async function checkCompose(recipeId: number) {
  return apiRequest<{ canCompose: boolean; cost?: any }>('/item-ext/compose/check', 'POST', {
    recipe_id: recipeId,
  });
}

/**
 * 执行合成
 * 来源: /api/item-ext/compose (POST)
 */
export async function composeItem(recipeId: number) {
  return apiRequest<any>('/item-ext/compose', 'POST', { recipe_id: recipeId });
}

/**
 * 获取强化配置
 * 来源: /api/item-ext/enhance/config (GET)
 */
export async function getEnhanceConfig() {
  return apiRequest<any>('/item-ext/enhance/config', 'GET');
}

/**
 * 检查强化条件
 * 来源: /api/item-ext/enhance/check (POST)
 */
export async function checkEnhance(itemId: number) {
  return apiRequest<{ canEnhance: boolean; cost?: any }>('/item-ext/enhance/check', 'POST', {
    item_id: itemId,
  });
}

/**
 * 执行物品强化
 * 来源: /api/item-ext/enhance (POST)
 */
export async function enhanceItem(itemId: number) {
  return apiRequest<any>('/item-ext/enhance', 'POST', { item_id: itemId });
}

/**
 * 获取宝石孔位信息
 * 来源: /api/item-ext/gem/slots/:itemId (GET)
 */
export async function getGemSlots(itemId: number) {
  return apiRequest<any>(`/item-ext/gem/slots/${itemId}`, 'GET');
}

/**
 * 镶嵌宝石
 * 来源: /api/item-ext/gem/equip (POST)
 */
export async function equipGem(itemId: number, gemId: number, slotIndex: number) {
  return apiRequest<any>('/item-ext/gem/equip', 'POST', {
    item_id: itemId,
    gem_id: gemId,
    slot_index: slotIndex,
  });
}

/**
 * 卸下宝石
 * 来源: /api/item-ext/gem/unequip (POST)
 */
export async function unequipGem(itemId: number, slotIndex: number) {
  return apiRequest<any>('/item-ext/gem/unequip', 'POST', { item_id: itemId, slot_index: slotIndex });
}

/**
 * 检查物品拆解条件
 * 来源: /api/item-ext/dismantle/check (POST)
 */
export async function checkDismantle(itemId: number) {
  return apiRequest<{ materials: any[] }>('/item-ext/dismantle/check', 'POST', { item_id: itemId });
}

/**
 * 拆解物品
 * 来源: /api/item-ext/dismantle (POST)
 */
export async function dismantleItem(itemId: number) {
  return apiRequest<any>('/item-ext/dismantle', 'POST', { item_id: itemId });
}

// ==================== 事件系统 API ====================
// 来源: workers/ghost-game/src/routes/event.ts

/**
 * 获取当前有效事件列表
 * 来源: /api/event/valid (GET)
 */
export async function getValidEvents(cityId?: number) {
  return apiRequest<any>(`/event/valid?city_id=${cityId || 1}`, 'GET');
}

/**
 * 获取事件详情
 * 来源: /api/event/search (GET)
 */
export async function searchEvent(eventId: number) {
  return apiRequest<any>(`/event/search?event_id=${eventId}`, 'GET');
}

/**
 * 访问/触发事件
 * 来源: /api/event/visit (POST)
 */
export async function visitEvent(eventId: number, cityId?: number) {
  return apiRequest<any>('/event/visit', 'POST', { event_id: eventId, city_id: cityId || 1 });
}

/**
 * 删除事件
 * 来源: /api/event/delete (POST)
 */
export async function deleteEvent(eventId: number) {
  return apiRequest<any>('/event/delete', 'POST', { event_id: eventId });
}

// ==================== 游戏状态 API ====================
// 来源: workers/ghost-game/src/routes/game.ts

/**
 * 获取服务器状态
 * 来源: /api/game/status (GET)
 */
export async function getGameStatus() {
  return apiRequest<any>('/game/status', 'GET');
}

/**
 * 获取页面信息
 * 来源: /api/game/page-info (GET/POST)
 */
export async function getPageInfo() {
  return apiRequest<any>('/game/page-info', 'GET');
}

/**
 * 获取玩家服务器统计
 * 来源: /api/game/player-count (GET)
 */
export async function getPlayerCount() {
  return apiRequest<{ count: number }>('/game/player-count', 'GET');
}

/**
 * 获取插桩玩家数
 * 来源: /api/game/ins-player-count (GET)
 */
export async function getInsPlayerCount() {
  return apiRequest<{ count: number }>('/game/ins-player-count', 'GET');
}

/**
 * 获取领地玩家数
 * 来源: /api/game/territory-player-count (GET)
 */
export async function getTerritoryPlayerCount() {
  return apiRequest<{ count: number }>('/game/territory-player-count', 'GET');
}

/**
 * 获取城市简要信息
 * 来源: /api/game/city/brief (POST)
 */
export async function getCityBrief(cityId: number) {
  return apiRequest<any>('/game/city/brief', 'POST', { city_id: cityId });
}

/**
 * 获取城市背景
 * 来源: /api/game/city/background (POST)
 */
export async function getCityBackground(cityId: number) {
  return apiRequest<any>('/game/city/background', 'POST', { city_id: cityId });
}

/**
 * 快速移动
 * 来源: /api/game/fast-move (GET)
 */
export async function fastMove(fromPos: number, toPos: number) {
  return apiRequest<any>(`/game/fast-move?from_pos=${fromPos}&to_pos=${toPos}`, 'GET');
}

/**
 * 检查依赖关系
 * 来源: /api/game/is-dependency (GET)
 */
export async function isDependency(cityId: number) {
  return apiRequest<any>(`/game/is-dependency?city_id=${cityId}`, 'GET');
}

/**
 * 获取游戏版本
 * 来源: /api/game/version (GET)
 */
export async function getGameVersion() {
  return apiRequest<{ version: string }>('/game/version', 'GET');
}

/**
 * 获取服务器开服时间
 * 来源: /api/game/is-start-time (GET)
 */
export async function isStartTime() {
  return apiRequest<{ isStart: boolean; startTime?: string }>('/game/is-start-time', 'GET');
}

/**
 * 强制效果过期
 * 来源: /api/game/force-effect-overdue (POST)
 */
export async function forceEffectOverdue(cityId: number) {
  return apiRequest<any>('/game/force-effect-overdue', 'POST', { city_id: cityId });
}

/**
 * 强制新手过期
 * 来源: /api/game/force-newuser-overdue (POST)
 */
export async function forceNewUserOverdue(cityId: number) {
  return apiRequest<any>('/game/force-newuser-overdue', 'POST', { city_id: cityId });
}

/**
 * 获取用户在线状态
 * 来源: /api/game/user/online (POST)
 */
export async function getUserOnlineStatus(userName: string) {
  return apiRequest<{ online: boolean }>('/game/user/online', 'POST', { user_name: userName });
}

/**
 * 获取用户名和状态
 * 来源: /api/game/user/name-state (GET)
 */
export async function getUserNameState(userName: string) {
  return apiRequest<any>(`/game/user/name-state?user_name=${encodeURIComponent(userName)}`, 'GET');
}

/**
 * 登出
 * 来源: /api/game/logout (POST)
 */
export async function logout() {
  return apiRequest<any>('/game/logout', 'POST');
}

/**
 * 获取会计信息（资源统计）
 * 来源: /api/game/accountant (GET)
 */
export async function getAccountant() {
  return apiRequest<any>('/game/accountant', 'GET');
}

// ==================== 建筑 API ====================
// 来源: workers/ghost-game/src/routes/building.ts

/**
 * 获取建筑详情
 * 来源: /api/building/by-id (GET)
 */
export async function getBuildingById(cityId: number, buildingId: number) {
  return apiRequest<any>(`/building/by-id?city_id=${cityId}&building_id=${buildingId}`, 'GET');
}

/**
 * 获取建筑事件
 * 来源: /api/building/event (GET)
 */
export async function getBuildingEvent(cityId: number) {
  return apiRequest<any>(`/building/event?city_id=${cityId}`, 'GET');
}

// ==================== 战斗系统 API ====================
// 来源: workers/ghost-game/src/routes/battle.ts

/**
 * 获取棋盘数据
 * 来源: /api/battle/chess/board (GET)
 */
export async function getChessBoard() {
  return apiRequest<any>('/battle/chess/board', 'GET');
}

/**
 * 获取棋盘状态
 * 来源: /api/battle/chess/status (GET)
 */
export async function getChessStatus() {
  return apiRequest<any>('/battle/chess/status', 'GET');
}

/**
 * 获取棋盘事件
 * 来源: /api/battle/chess/event (GET)
 */
export async function getChessEvent() {
  return apiRequest<any>('/battle/chess/event', 'GET');
}

/**
 * 移动棋子
 * 来源: /api/battle/chess/move (POST)
 */
export async function moveChess(fromX: number, fromY: number, toX: number, toY: number) {
  return apiRequest<any>('/battle/chess/move', 'POST', {
    from_x: fromX,
    from_y: fromY,
    to_x: toX,
    to_y: toY,
  });
}

/**
 * 攻击棋子
 * 来源: /api/battle/chess/attack (POST)
 */
export async function attackChess(x: number, y: number) {
  return apiRequest<any>('/battle/chess/attack', 'POST', { x, y });
}

/**
 * 获取战斗状态
 * 来源: /api/battle/state (GET)
 */
export async function getBattleState() {
  return apiRequest<any>('/battle/state', 'GET');
}

/**
 * 改变战斗状态
 * 来源: /api/battle/change-state (POST)
 */
export async function changeBattleState(state: number) {
  return apiRequest<any>('/battle/change-state', 'POST', { state });
}

/**
 * 改变武将列表类型
 * 来源: /api/battle/change-hero-list-type (POST)
 */
export async function changeHeroListType(listType: number) {
  return apiRequest<any>('/battle/change-hero-list-type', 'POST', { list_type: listType });
}

// ==================== 聊天 API ====================
// 来源: workers/ghost-game/src/routes/chat.ts

/**
 * 获取聊天消息列表
 * 来源: /api/chat/list (GET)
 */
export async function getChatMessages(channel: string = 'world', page: number = 1) {
  return apiRequest<any>(`/chat/list?channel=${channel}&page=${page}`, 'GET');
}

// ==================== NPC 系统 API ====================
// 来源: workers/ghost-game/src/routes/appendant-npc.ts

export interface AppendantNPCInfo {
  id: number;
  name: string;
  level: number;
  type: number;
  reward?: any;
}

/**
 * 获取随从NPC列表
 * 来源: /api/appendant-npc/list (GET)
 */
export async function getAppendantNPCList() {
  return apiRequest<AppendantNPCInfo[]>('/appendant-npc/list', 'GET');
}

/**
 * 添加随从NPC
 * 来源: /api/appendant-npc/add (POST)
 */
export async function addAppendantNPC(npcId: number) {
  return apiRequest<any>('/appendant-npc/add', 'POST', { npc_id: npcId });
}

/**
 * 删除随从NPC
 * 来源: /api/appendant-npc/delete (POST)
 */
export async function deleteAppendantNPC(npcId: number) {
  return apiRequest<any>('/appendant-npc/delete', 'POST', { npc_id: npcId });
}

// ==================== 驻守效果 API ====================
// 来源: workers/ghost-game/src/routes/effect.ts

/**
 * 获取过期效果列表
 * 来源: /api/effect/over-array (GET)
 */
export async function getEffectOverArray() {
  return apiRequest<any>('/effect/over-array', 'GET');
}

/**
 * 处理过期效果
 * 来源: /api/effect/process-overdue (POST)
 */
export async function processEffectOverdue() {
  return apiRequest<any>('/effect/process-overdue', 'POST');
}

/**
 * 获取驻守效果组
 * 来源: /api/effect/persist-group (GET)
 */
export async function getPersistEffectGroup() {
  return apiRequest<any>('/effect/persist-group', 'GET');
}

// ==================== 军团/部队 API ====================
// 来源: workers/ghost-game/src/routes/corps.ts

/**
 * 获取城市军团信息
 * 来源: /api/corps/state (GET)
 */
export async function getCorpsState(cityId: number) {
  return apiRequest<any>(`/corps/state?city_id=${cityId}`, 'GET');
}

/**
 * 获取城市军团列表
 * 来源: /api/corps/event (GET)
 */
export async function getCorpsEvent(cityId: number) {
  return apiRequest<any>(`/corps/event?city_id=${cityId}`, 'GET');
}

/**
 * 获取城市其他军团
 * 来源: /api/corps/other (GET)
 */
export async function getCorpsOther(cityId: number) {
  return apiRequest<any>(`/corps/other?city_id=${cityId}`, 'GET');
}

/**
 * 获取部队需求时间
 * 来源: /api/corps/need-time (GET)
 */
export async function getCorpsNeedTime(cityId: number) {
  return apiRequest<any>(`/corps/need-time?city_id=${cityId}`, 'GET');
}

/**
 * 召回部队
 * 来源: /api/corps/recall (POST)
 */
export async function recallCorps(corpsId: number) {
  return apiRequest<any>('/corps/recall', 'POST', { corps_id: corpsId });
}

/**
 * 返回城市
 * 来源: /api/corps/return (POST)
 */
export async function returnCorps(corpsId: number) {
  return apiRequest<any>('/corps/return', 'POST', { corps_id: corpsId });
}

/**
 * 获取军团武将
 * 来源: /api/corps/simple-heroes (GET)
 */
export async function getCorpsSimpleHeroes(corpsId: number) {
  return apiRequest<any>(`/corps/simple-heroes?corps_id=${corpsId}`, 'GET');
}

/**
 * 延长军团时间
 * 来源: /api/corps/event-extend (POST)
 */
export async function extendCorpsEvent(corpsId: number) {
  return apiRequest<any>('/corps/event-extend', 'POST', { corps_id: corpsId });
}
