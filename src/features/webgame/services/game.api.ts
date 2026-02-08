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
  async getBuildings(cityId: number): Promise<ApiResponse<Building[]>> {
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

// ============ Item API ============
export const itemApi = {
  /** 获取物品列表 */
  async getItems(): Promise<ApiResponse<any[]>> {
    return fetchApi('/api/item/list');
  },
};

// ============ Shop API ============
export const shopApi = {
  /** 获取商店列表 */
  async getShopList(type = 1): Promise<ApiResponse<ShopItem[]>> {
    return fetchApi(`/api/shop/list?type=${type}`);
  },

  /** 购买物品 */
  async buyItem(itemId: number, count = 1): Promise<ApiResponse<{ itemId: number; count: number }>> {
    return fetchApi('/api/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, count }),
    });
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
};
