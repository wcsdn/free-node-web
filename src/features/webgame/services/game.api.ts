/**
 * Game API Services - 前端 API 调用层
 * 原则：只负责 HTTP 请求，不包含 UI 逻辑
 */
import type {
  City, CityListItem, Building, Hero, ShopItem,
  ChatMessage, Mail, ApiResponse
} from '../types/game.types';

// ============ API Config ============
const API_BASE = import.meta.env.PROD 
  ? 'https://game.free-node.xyz' 
  : 'http://localhost:8788';

function getAuthHeaders(): HeadersInit {
  const auth = localStorage.getItem('wallet-auth');
  return auth ? { 'X-Wallet-Auth': auth } : {
    'X-Wallet-Auth': '0x1234567890abcdef1234567890abcdef12345678:test_signature'
  };
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });
  return res.json() as Promise<T>;
}

// ============ City API ============
export const cityApi = {
  /** 获取城市信息 (自动创建) */
  async getCity(): Promise<ApiResponse<City>> {
    return fetchApi('/api/game/city');
  },

  /** 获取城市列表 */
  async getCityList(): Promise<ApiResponse<CityListItem[]>> {
    return fetchApi('/api/game/city/list');
  },

  /** 创建城市 */
  async createCity(name: string): Promise<ApiResponse<{ id: number; name: string; position: number }>> {
    return fetchApi('/api/game/city', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  /** 收集资源 */
  async collectResources(cityId: number): Promise<ApiResponse<{
    collected: { money: number; food: number };
    total: { money: number; food: number };
  }>> {
    return fetchApi(`/api/game/city/${cityId}/collect`, {
      method: 'POST',
    });
  },

  /** 获取城市内政信息 (含建筑) */
  async getCityInterior(cityId: number): Promise<ApiResponse<{
    city: City;
    buildings: Building[];
  }>> {
    return fetchApi(`/api/game/city/interior/${cityId}`, {
      method: 'POST',
    });
  },

  /** 获取建筑列表 */
  async getBuildings(cityId: number): Promise<ApiResponse<{ buildings: Building[] }>> {
    return fetchApi(`/api/game/city/building-list/${cityId}`, {
      method: 'POST',
    });
  },
};

// ============ Hero API ============
export const heroApi = {
  /** 获取武将列表 */
  async getHeroes(): Promise<ApiResponse<Hero[]>> {
    return fetchApi('/api/hero/list');
  },
};

// ============ Chat API ============
export const chatApi = {
  /** 获取聊天列表 */
  async getMessages(channel = 'global'): Promise<ApiResponse<ChatMessage[]>> {
    return fetchApi(`/api/chat/list?channel=${channel}`);
  },

  /** 发送消息 */
  async sendMessage(content: string, channel = 'global'): Promise<ApiResponse<{ id: number }>> {
    return fetchApi('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({ content, channel }),
    });
  },
};

// ============ Mail API ============
export const mailApi = {
  /** 获取邮件列表 */
  async getMails(): Promise<ApiResponse<Mail[]>> {
    return fetchApi('/api/mail/list');
  },

  /** 阅读邮件 */
  async readMail(mailId: number): Promise<ApiResponse<{ attachmentGold?: number; attachmentItems?: any }>> {
    return fetchApi(`/api/mail/${mailId}/read`, { method: 'POST' });
  },

  /** 删除邮件 */
  async deleteMail(mailId: number): Promise<ApiResponse<null>> {
    return fetchApi(`/api/mail/${mailId}`, { method: 'DELETE' });
  },

  /** 批量标记已读 */
  async markAllAsRead(): Promise<ApiResponse<{ count: number }>> {
    return fetchApi('/api/mail/read-all', { method: 'POST' });
  },
};

// ============ Shop API ============
export const shopApi = {
  /** 获取商店列表 */
  async getShopList(type = 1): Promise<ApiResponse<ShopItem[]>> {
    return fetchApi(`/api/shop/list?type=${type}`);
  },

  /** 购买物品 */
  async buyItem(itemId: number, count = 1): Promise<ApiResponse<{ itemId: number; count: number; totalPrice: number }>> {
    return fetchApi('/api/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, count }),
    });
  },

  /** 刷新商店 */
  async refreshShop(type: number): Promise<ApiResponse<{ refreshed: boolean }>> {
    return fetchApi(`/api/shop/refresh?type=${type}`, { method: 'POST' });
  },

  /** 获取购买历史 */
  async getPurchaseHistory(limit = 50): Promise<ApiResponse<any[]>> {
    return fetchApi(`/api/shop/history?limit=${limit}`);
  },
};

// ============ Building API ============
export const buildingApi = {
  /** 获取建筑列表 */
  async getBuildings(cityId: number): Promise<ApiResponse<{ buildings: Building[] }>> {
    return fetchApi(`/api/game/city/building-list/${cityId}`, { method: 'POST' });
  },

  /** 升级建筑 */
  async upgradeBuilding(buildingId: number): Promise<ApiResponse<{ level: number }>> {
    return fetchApi(`/api/game/building/${buildingId}/upgrade`, { method: 'POST' });
  },

  /** 建造建筑 */
  async buildBuilding(cityId: number, configId: number, position: number): Promise<ApiResponse<{ id: number }>> {
    return fetchApi('/api/game/building', {
      method: 'POST',
      body: JSON.stringify({ city_id: cityId, config_id: configId, position }),
    });
  },

  /** 拆除建筑 */
  async demolishBuilding(buildingId: number): Promise<ApiResponse<null>> {
    return fetchApi(`/api/game/building/${buildingId}`, { method: 'DELETE' });
  },
};

// ============ Item API ============
export const itemApi = {
  /** 获取物品列表 */
  async getItems(): Promise<ApiResponse<any[]>> {
    return fetchApi('/api/item/list');
  },

  /** 使用物品 */
  async useItem(itemId: number, count = 1): Promise<ApiResponse<{ effect: string }>> {
    return fetchApi('/api/item/use', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, count }),
    });
  },

  /** 装备物品 */
  async equipItem(itemId: number, heroId: number): Promise<ApiResponse<null>> {
    return fetchApi('/api/item/equip', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, hero_id: heroId }),
    });
  },

  /** 卸下物品 */
  async unequipItem(itemId: number): Promise<ApiResponse<null>> {
    return fetchApi('/api/item/unequip', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId }),
    });
  },
};

// ============ Battle API ============
export const battleApi = {
  /** 发起战斗 */
  async startBattle(enemyType: string, enemyId?: number): Promise<ApiResponse<{
    win: boolean;
    damageDealt: number;
    damageTaken: number;
    expGained: number;
    itemsGained?: Array<{ id: number; count: number }>;
  }>> {
    return fetchApi('/api/battle/start', {
      method: 'POST',
      body: JSON.stringify({ enemy_type: enemyType, enemy_id: enemyId }),
    });
  },

  /** 获取战斗记录 */
  async getBattleHistory(limit = 20): Promise<ApiResponse<any[]>> {
    return fetchApi(`/api/battle/history?limit=${limit}`);
  },
};
