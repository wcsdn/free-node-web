/**
 * 游戏 API 服务
 */
import { getApiBase, getAuthHeaders } from '../utils/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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
  map_image: string;
  last_collect: string;
  created_at: string;
  interior?: CityInterior;
}

export interface CityInterior {
  Money: number;
  Food: number;
  Men: number;
  Gold: number;
  Area: number;
  Bloom: number;
  AreaRoom: number;
  MoneyRoom: number;
  FoodRoom: number;
  MenRoom: number;
  MoneySpeed: number;
  FoodSpeed: number;
  MenSpeed: number;
  buildings: Building[];
}

export interface Building {
  ID: number;
  ConfigID: number;
  Name: string;
  Level: number;
  Position: number;
  State: number;
  EffectValue: number;
  MaxLevel: number;
  Image: string;
  description: string;
}

export interface Hero {
  id: number;
  name: string;
  level: number;
  exp: number;
  attack: number;
  defense: number;
  hp: number;
  max_hp: number;
  quality: number;
  state: number;
  skill_ids: number[];
  equipped_skill_ids: number[];
  skill_points: number;
  portrait: string;
  country: string;
  legion_id: number;
  in_legion_position: number;
}

export interface Item {
  id: number;
  item_id: number;
  name: string;
  type: number;
  quality: number;
  count: number;
  equipped: number;
  position: number;
  max_count: number;
  attack: number;
  defense: number;
  description: string;
  image: string;
}

export interface Mail {
  id: number;
  mail_type: number;
  from_name: string;
  title: string;
  content: string;
  read_tag: number;
  has_attachment: number;
  created_at: string;
}

export interface Task {
  id: number;
  task_type: number;
  name: string;
  description: string;
  status: number;
  progress: number;
  target: number;
  rewards: string;
  claimed: number;
}

export interface RankItem {
  id: number;
  name: string;
  value: number;
  rank: number;
  title: string;
  level: number;
}

export interface ChatMessage {
  id: number;
  channel: string;
  sender: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export interface ChatConversation {
  partner: string;
  last_message: string;
  last_time: string;
}

export interface User {
  wallet_address: string;
  name: string;
  level: number;
  gold: number;
  vip_level: number;
  last_login: string;
}

export const gameApi = {
  // 角色相关
  async getCharacterInfo(wallet_address?: string): Promise<ApiResponse<Character>> {
    const url = wallet_address ? `/api/character/info?wallet_address=${wallet_address}` : '/api/character/info';
    const res = await fetch(`${getApiBase()}${url}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async createCharacter(name: string, country: string): Promise<ApiResponse<Character>> {
    const res = await fetch(`${getApiBase()}/api/character/create`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, country }),
    });
    return res.json();
  },

  async loginCharacter(wallet_address: string): Promise<ApiResponse<Character>> {
    const res = await fetch(`${getApiBase()}/api/character/login`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address }),
    });
    return res.json();
  },

  // 城市相关
  async getCityList(): Promise<ApiResponse<City[]>> {
    const res = await fetch(`${getApiBase()}/api/city/list`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async createCity(name: string, position: number): Promise<ApiResponse<City>> {
    const res = await fetch(`${getApiBase()}/api/city/create`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, position }),
    });
    return res.json();
  },

  async getCity(cityId: number): Promise<ApiResponse<City>> {
    const res = await fetch(`${getApiBase()}/api/city/${cityId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async collectResources(cityId: number): Promise<ApiResponse<{ money: number; food: number; men: number }>> {
    const res = await fetch(`${getApiBase()}/api/city/${cityId}/collect`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // 英雄相关
  async getHeroList(): Promise<ApiResponse<Hero[]>> {
    const res = await fetch(`${getApiBase()}/api/hero/list`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async recruitHero(cityId: number, count: number = 1): Promise<ApiResponse<Hero>> {
    const res = await fetch(`${getApiBase()}/api/hero/recruit`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ city_id: cityId, count }),
    });
    return res.json();
  },

  async trainHero(heroId: number): Promise<ApiResponse<Hero>> {
    const res = await fetch(`${getApiBase()}/api/hero/${heroId}/train`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async upgradeHero(heroId: number): Promise<ApiResponse<Hero>> {
    const res = await fetch(`${getApiBase()}/api/hero/${heroId}/upgrade`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // 战斗相关
  async startPveBattle(stageId: number, heroIds: number[]): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/battle/pve`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId, hero_ids: heroIds }),
    });
    return res.json();
  },

  async getBattleHistory(): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${getApiBase()}/api/battle/history`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // 建筑相关
  async getBuildingList(cityId: number): Promise<ApiResponse<Building[]>> {
    const res = await fetch(`${getApiBase()}/api/building/list/${cityId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async buildBuilding(cityId: number, configId: number, position: number): Promise<ApiResponse<Building>> {
    const res = await fetch(`${getApiBase()}/api/building/build`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ city_id: cityId, config_id: configId, position }),
    });
    return res.json();
  },

  async upgradeBuilding(buildingId: number): Promise<ApiResponse<Building>> {
    const res = await fetch(`${getApiBase()}/api/building/${buildingId}/upgrade`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // 任务相关
  async getTaskList(): Promise<ApiResponse<Task[]>> {
    const res = await fetch(`${getApiBase()}/api/task/list`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async acceptTask(taskId: number): Promise<ApiResponse<Task>> {
    const res = await fetch(`${getApiBase()}/api/task/accept`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId }),
    });
    return res.json();
  },

  async submitTask(taskId: number, heroIds: number[]): Promise<ApiResponse<Task>> {
    const res = await fetch(`${getApiBase()}/api/task/submit`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, hero_ids: heroIds }),
    });
    return res.json();
  },

  // 商城相关
  async getShopList(type: number = 1): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${getApiBase()}/api/shop/list?type=${type}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async buyItem(shopId: number, count: number = 1): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/shop/buy`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop_id: shopId, count }),
    });
    return res.json();
  },

  // 市场相关
  async getMarketList(page: number = 1, pageSize: number = 10): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${getApiBase()}/api/market/list?page=${page}&page_size=${pageSize}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async buyFromMarket(marketId: number, count: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/market/buy`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ market_id: marketId, count }),
    });
    return res.json();
  },

  async sellToMarket(itemId: number, count: number, price: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/market/sell`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, count, price }),
    });
    return res.json();
  },

  async getMarketHistory(): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${getApiBase()}/api/market/history`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // 邮件相关
  async getMailList(type?: number): Promise<ApiResponse<Mail[]>> {
    const url = type !== undefined ? `${getApiBase()}/api/mail/list?type=${type}` : `${getApiBase()}/api/mail/list`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getMail(mailId: number): Promise<ApiResponse<Mail>> {
    const res = await fetch(`${getApiBase()}/api/mail/${mailId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async sendMail(toUser: string, title: string, content: string, attachment?: any): Promise<ApiResponse<Mail>> {
    const res = await fetch(`${getApiBase()}/api/mail/send`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_user: toUser, title, content, attachment }),
    });
    return res.json();
  },

  async claimMailAttachment(mailId: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/mail/${mailId}/claim`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async deleteMail(mailId: number): Promise<ApiResponse<void>> {
    const res = await fetch(`${getApiBase()}/api/mail/${mailId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // 物品相关
  async getItemList(): Promise<ApiResponse<Item[]>> {
    const res = await fetch(`${getApiBase()}/api/item/list`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async useItem(itemId: number, targetId?: number): Promise<ApiResponse<void>> {
    const res = await fetch(`${getApiBase()}/api/item/use`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, target_id: targetId }),
    });
    return res.json();
  },

  async sellItem(itemId: number, count: number = 1): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/item/sell`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, count }),
    });
    return res.json();
  },

  async organizeItems(): Promise<ApiResponse<void>> {
    const res = await fetch(`${getApiBase()}/api/item/organize`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // 排行榜相关
  async getRankList(rankType: string): Promise<ApiResponse<RankItem[]>> {
    const res = await fetch(`${getApiBase()}/api/rank/${rankType}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getMyRank(rankType: string): Promise<ApiResponse<RankItem>> {
    const res = await fetch(`${getApiBase()}/api/rank/?type=${rankType}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // 竞技场相关
  async getArenaInfo(): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/arena/info`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async challengeArena(opponentId: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/arena/challenge`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ opponent_id: opponentId }),
    });
    return res.json();
  },

  async getArenaRankList(): Promise<ApiResponse<RankItem[]>> {
    const res = await fetch(`${getApiBase()}/api/arena/rank`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async buyArenaChallengeCount(): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/arena/buy-challenge`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // 军事相关
  async getMilitaryList(): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${getApiBase()}/api/military/list`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getMilitaryConfig(): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/military/config`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getMilitaryAssignments(): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${getApiBase()}/api/military/assignments`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async trainTroops(cityId: number, troopType: string, count: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/military/train`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ city_id: cityId, troop_type: troopType, count }),
    });
    return res.json();
  },

  async disbandTroops(troopId: number, count: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/military/disband`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ troop_id: troopId, count }),
    });
    return res.json();
  },

  async assignHeroToTroop(heroId: number, troopId: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/military/assign-hero`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero_id: heroId, troop_id: troopId }),
    });
    return res.json();
  },

  async unassignHeroFromTroop(heroId: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/military/unassign-hero`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero_id: heroId }),
    });
    return res.json();
  },

  async transferTroops(fromTroopId: number, toTroopId: number, count: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/military/transfer`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_troop_id: fromTroopId, to_troop_id: toTroopId, count }),
    });
    return res.json();
  },

  // 帮派相关
  async getMyGuild(): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/guild/my`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getGuildList(search?: string): Promise<ApiResponse<any[]>> {
    const url = search ? `${getApiBase()}/api/guild/list?search=${encodeURIComponent(search)}` : `${getApiBase()}/api/guild/list`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async createGuild(name: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/guild/create`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return res.json();
  },

  async joinGuild(guildId: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/guild/${guildId}/join`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async leaveGuild(): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/guild/leave`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getGuildInfo(guildId: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/guild/${guildId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async donateToGuild(guildId: number, resourceType: string, amount: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/guild/${guildId}/donate`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource_type: resourceType, amount }),
    });
    return res.json();
  },

  // 聊天相关
  async sendChatMessage(channel: string, content: string, toUser?: string): Promise<ApiResponse<ChatMessage>> {
    const res = await fetch(`${getApiBase()}/api/chat/send`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, content, to_user: toUser }),
    });
    return res.json();
  },

  async getChatList(channel: string, limit: number = 20): Promise<ApiResponse<ChatMessage[]>> {
    const url = `${getApiBase()}/api/chat/list?channel=${channel}${limit ? `&limit=${limit}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getChatConversations(): Promise<ApiResponse<ChatConversation[]>> {
    const res = await fetch(`${getApiBase()}/api/chat/conversations`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getPrivateChatMessages(address: string, limit: number = 50): Promise<ApiResponse<ChatMessage[]>> {
    const url = `${getApiBase()}/api/chat/conversations/${address}${limit ? `?limit=${limit}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // 技能相关
  async getSkillList(): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${getApiBase()}/api/skill/list`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async learnSkill(skillId: number, heroId?: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/skill/learn`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill_id: skillId, hero_id: heroId }),
    });
    return res.json();
  },

  async getSkillConfig(): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${getApiBase()}/api/skill/config`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async equipSkill(skillId: number, heroId: number, slot: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/skill/equip`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill_id: skillId, hero_id: heroId, slot }),
    });
    return res.json();
  },

  async unequipSkill(heroId: number, slot: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/skill/equip`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero_id: heroId, slot }),
    });
    return res.json();
  },

  async getHeroSkills(heroId: number): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${getApiBase()}/api/skill/hero/${heroId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // 军团相关 (Corps)
  async getCorpsList(): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${getApiBase()}/api/corps`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getCorpsDetail(corpsId: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/corps/${corpsId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async createCorps(name: string, cityId: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/corps`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, city_id: cityId }),
    });
    return res.json();
  },

  async disbandCorps(corpsId: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/corps/${corpsId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async marchCorps(corpsId: number, targetCityId: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/corps/${corpsId}/march`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_city_id: targetCityId }),
    });
    return res.json();
  },

  async recallCorps(corpsId: number): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/corps/${corpsId}/recall`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async adjustCorpsFormation(corpsId: number, formation: any): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/corps/${corpsId}/adjust`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ formation }),
    });
    return res.json();
  },

  // 科技相关
  async getTechnicList(): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${getApiBase()}/api/technic/list`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async upgradeTechnic(): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/technic/upgrade`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getTechnicConfig(): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${getApiBase()}/api/technic/config`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getTechnicEffects(): Promise<ApiResponse<any>> {
    const res = await fetch(`${getApiBase()}/api/technic/effects`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  }
};

export default gameApi;
