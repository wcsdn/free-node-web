/**
 * 城市 API
 * 城市相关的数据交互
 */
import { getApiBase, getAuthHeaders } from '../../utils/api';

// 城市基础信息
export interface CityInfo {
  ID?: number;
  Name: string;
  Level: number;
  Area: number;
  AreaRoom: number;
  Child: number;
  Bloom: number;
  ChildRate: number;
  Gold: number;
  Money: number;
  MoneyRoom: number;
  Food: number;
  FoodRoom: number;
  Men: number;
  MenRoom: number;
  MoneySpeed: number;
  FoodSpeed: number;
  MenSpeed: number;
  LastCollect?: string;
  CreatedAt?: string;
}

// 城市列表响应
export interface CityListResponse {
  success: boolean;
  data: CityInfo[];
  message?: string;
}

// 城市详情响应
export interface CityDetailResponse {
  success: boolean;
  data: CityInfo & { buildings: BuildingInfo[] };
  message?: string;
}

// 建筑信息
export interface BuildingInfo {
  ID: number;
  ConfigID: number;
  Name: string;
  Level: number;
  Position: number;
  State: number;
  EffectValue: number;
  MaxLevel?: number;
  Image?: string;
}

// 收集资源响应
export interface CollectResponse {
  success: boolean;
  data?: {
    money: number;
    food: number;
    men: number;
  };
  message?: string;
}

// 城市 API
export const cityApi = {
  /**
   * 获取城市列表
   */
  async getCityList(): Promise<CityListResponse> {
    const res = await fetch(`${getApiBase()}/api/game/city/list`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<CityListResponse>;
  },

  /**
   * 获取城市内政信息
   */
  async getCityInterior(cityId: number): Promise<CityDetailResponse> {
    const res = await fetch(`${getApiBase()}/api/game/city/interior/${cityId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<CityDetailResponse>;
  },

  /**
   * 获取城市建筑列表
   */
  async getBuildingList(cityId: number): Promise<{ success: boolean; data: BuildingInfo[] }> {
    const res = await fetch(`${getApiBase()}/api/game/city/building-list/${cityId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<{ success: boolean; data: BuildingInfo[] }>;
  },

  /**
   * 收集资源
   */
  async collectResources(cityId: number): Promise<CollectResponse> {
    const res = await fetch(`${getApiBase()}/api/game/city/${cityId}/collect`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });
    return res.json() as Promise<CollectResponse>;
  },

  /**
   * 获取产出率
   */
  async getProductionRates(cityId: number): Promise<{
    success: boolean;
    data: { moneyRate: number; foodRate: number; menRate: number }
  }> {
    const res = await fetch(`${getApiBase()}/api/game/city/${cityId}/rates`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<{
      success: boolean;
      data: { moneyRate: number; foodRate: number; menRate: number }
    }>;
  },

  /**
   * 获取指定位置可建造的建筑列表
   */
  async getAvailableBuildings(cityId: number, position: number): Promise<{
    success: boolean;
    data: { buildings: any[] };
    error?: string;
  }> {
    const res = await fetch(`${getApiBase()}/api/game/city/${cityId}/available-buildings/${position}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  /**
   * 建造新建筑
   */
  async buildBuilding(cityId: number, configId: number, position: number): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    const res = await fetch(`${getApiBase()}/api/game/city/${cityId}/build-building`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ configId, position }),
    });
    return res.json();
  }
};
