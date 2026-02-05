/**
 * 市场交易 API 服务
 * 基于原项目 Market.js 逻辑
 */
import { getApiBase, getAuthHeaders } from '../../utils/api';

// 资源类型
export type ResourceType = 'food' | 'money' | 'population';

// 交易类型
export type TradeAction = 'buy' | 'sell';

// 市场商品数据结构
export interface MarketItem {
  id: number;
  seller: string;          // 卖家名称
  itemId: number;         // 物品ID
  itemName: string;       // 物品名称
  price: number;          // 单价
  quantity: number;       // 数量
  totalPrice: number;     // 总价
  postedAt: string;       // 上架时间
}

// 市场列表响应
export interface MarketListResponse {
  success: boolean;
  data: {
    items: MarketItem[];
    totalCount: number;
    page: number;
    pageSize: number;
  };
  message?: string;
}

// 交易请求
export interface TradeRequest {
  itemId: number;
  action: TradeAction;
  quantity: number;
  unitPrice?: number; // 卖出时指定单价
}

// 交易响应
export interface TradeResponse {
  success: boolean;
  data?: {
    itemId: number;
    quantity: number;
    totalPrice: number;
    remainingGold?: number;
    remainingResource?: number;
  };
  message?: string;
}

// 资源价格 (从原项目获取)
export interface ResourcePrice {
  buyPrice: number;  // 买入价格 (银两/个)
  sellPrice: number; // 卖出价格 (银两/个)
}

// 市场 API
export const marketApi = {
  /**
   * 获取市场物品列表
   */
  async getItems(
    page: number = 1,
    pageSize: number = 20,
    keyword?: string,
    itemType?: number
  ): Promise<MarketListResponse> {
    try {
      let url = `${getApiBase()}/api/market/items?page=${page}&pageSize=${pageSize}`;
      if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
      if (itemType) url += `&type=${itemType}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to fetch market items:', err);
      // 返回模拟数据
      return getMockMarketItems(page, pageSize);
    }
  },

  /**
   * 购买物品
   */
  async buy(request: TradeRequest): Promise<TradeResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/market/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(request),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to buy item:', err);
      return { success: false, message: '购买失败' };
    }
  },

  /**
   * 卖出物品
   */
  async sell(request: TradeRequest): Promise<TradeResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/market/sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(request),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to sell item:', err);
      return { success: false, message: '卖出失败' };
    }
  },

  /**
   * 获取资源价格
   */
  async getResourcePrices(): Promise<{ success: boolean; data: ResourcePrice[] }> {
    try {
      const res = await fetch(`${getApiBase()}/api/market/resource-prices`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to fetch resource prices:', err);
      // 返回默认价格 (参考原项目)
      return {
        success: true,
        data: [
          { buyPrice: 10, sellPrice: 8 },   // 粮食
          { buyPrice: 10, sellPrice: 8 },   // 银两
          { buyPrice: 100, sellPrice: 80 },  // 人口
        ]
      };
    }
  },

  /**
   * 快速买入资源
   */
  async buyResource(resourceType: ResourceType, amount: number): Promise<TradeResponse> {
    return this.buy({
      itemId: getResourceItemId(resourceType),
      action: 'buy',
      quantity: amount,
    });
  },

  /**
   * 快速卖出资源
   */
  async sellResource(resourceType: ResourceType, amount: number): Promise<TradeResponse> {
    return this.sell({
      itemId: getResourceItemId(resourceType),
      action: 'sell',
      quantity: amount,
    });
  },
};

// 资源类型转物品ID
function getResourceItemId(resourceType: ResourceType): number {
  const map: Record<ResourceType, number> = {
    food: 1001,      // 粮食
    money: 1002,    // 银两
    population: 1003 // 人口
  };
  return map[resourceType];
}

// 模拟市场数据
function getMockMarketItems(page: number, pageSize: number): MarketListResponse {
  const mockItems: MarketItem[] = [
    { id: 1, seller: '玩家A', itemId: 1001, itemName: '粮食', price: 9, quantity: 1000, totalPrice: 9000, postedAt: new Date().toISOString() },
    { id: 2, seller: '玩家B', itemId: 1001, itemName: '粮食', price: 8, quantity: 500, totalPrice: 4000, postedAt: new Date().toISOString() },
    { id: 3, seller: '玩家C', itemId: 1002, itemName: '银两', price: 10, quantity: 10000, totalPrice: 100000, postedAt: new Date().toISOString() },
    { id: 4, seller: '玩家D', itemId: 1003, itemName: '人口', price: 95, quantity: 50, totalPrice: 4750, postedAt: new Date().toISOString() },
    { id: 5, seller: '玩家E', itemId: 2001, itemName: '普通装备', price: 500, quantity: 1, totalPrice: 500, postedAt: new Date().toISOString() },
    { id: 6, seller: '玩家F', itemId: 2002, itemName: '优良装备', price: 1500, quantity: 1, totalPrice: 1500, postedAt: new Date().toISOString() },
  ];

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = mockItems.slice(start, end);

  return {
    success: true,
    data: {
      items,
      totalCount: mockItems.length,
      page,
      pageSize,
    },
  };
}

export default marketApi;
