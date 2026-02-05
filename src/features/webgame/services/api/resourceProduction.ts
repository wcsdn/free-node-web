/**
 * 资源生产服务
 * 处理资源产出计算、定时更新
 */

import { getApiBase, getAuthHeaders } from '../../utils/api';

// 资源类型
export type ResourceType = 'money' | 'food' | 'men' | 'gold' | 'area' | 'bloom';

// 资源产出率 (每小时)
export interface ResourceRate {
  money: number;  // 银两/小时
  food: number;   // 粮食/小时
  men: number;    // 人口/小时
}

// 资源数据
export interface Resources {
  money: number;
  food: number;
  men: number;
  gold: number;
  area: number;
  bloom: number;
  areaLimit: number;
  moneyLimit: number;
  foodLimit: number;
  menLimit: number;
}

// 产出计算结果
export interface ProductionResult {
  money: number;
  food: number;
  men: number;
  lastCollect: string;
}

// 资源生产服务类
class ResourceProductionService {
  private lastUpdateTime: Date = new Date();
  private productionRates: ResourceRate = { money: 0, food: 0, men: 0 };
  private cachedResources: Resources | null = null;

  constructor() {
    // 页面加载时初始化
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      this.startAutoUpdate();
    }
  }

  // 从本地存储恢复状态
  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('resource_state');
      if (saved) {
        const state = JSON.parse(saved);
        this.lastUpdateTime = new Date(state.lastUpdate);
        this.productionRates = state.rates || { money: 0, food: 0, men: 0 };
      }
    } catch (e) {
      console.error('Failed to load resource state:', e);
    }
  }

  // 保存状态到本地存储
  private saveToStorage() {
    try {
      localStorage.setItem('resource_state', JSON.stringify({
        lastUpdate: this.lastUpdateTime.toISOString(),
        rates: this.productionRates
      }));
    } catch (e) {
      console.error('Failed to save resource state:', e);
    }
  }

  // 启动自动更新 (每60秒同步一次)
  private startAutoUpdate() {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      this.syncWithServer();
    }, 60000); // 60秒
  }

  // 计算时间差 (毫秒)
  private getTimeDiff(): number {
    const now = new Date();
    return now.getTime() - this.lastUpdateTime.getTime();
  }

  // 计算产出量
  calculateProduction(rates: ResourceRate = this.productionRates): ProductionResult {
    const timeDiff = this.getTimeDiff(); // 毫秒
    const hours = timeDiff / (1000 * 60 * 60);

    return {
      money: Math.floor(rates.money * hours),
      food: Math.floor(rates.food * hours),
      men: Math.floor(rates.men * hours),
      lastCollect: this.lastUpdateTime.toISOString()
    };
  }

  // 获取资源产出率
  async fetchProductionRates(cityId: number): Promise<ResourceRate> {
    try {
      const res = await fetch(`${getApiBase()}/api/game/city/${cityId}/rates`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (data.success && data.data) {
        this.productionRates = {
          money: data.data.moneyRate || 0,
          food: data.data.foodRate || 0,
          men: data.data.menRate || 0
        };
      }
    } catch (err) {
      console.error('Failed to fetch production rates:', err);
      // 使用默认值
      this.productionRates = { money: 100, food: 80, men: 50 };
    }

    return this.productionRates;
  }

  // 获取资源产出提示信息
  getProductionTip(rates: ResourceRate = this.productionRates): string {
    const production = this.calculateProduction(rates);
    const tips: string[] = [];

    if (production.money > 0) tips.push(`银两 +${production.money}`);
    if (production.food > 0) tips.push(`粮食 +${production.food}`);
    if (production.men > 0) tips.push(`人口 +${production.men}`);

    if (tips.length === 0) return '资源产出暂停中';
    return tips.join(' | ');
  }

  // 收集资源 (调用API)
  async collectResources(cityId: number): Promise<boolean> {
    try {
      const res = await fetch(`${getApiBase()}/api/game/city/${cityId}/collect`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (data.success) {
        // 更新本地时间戳
        this.lastUpdateTime = new Date();
        this.saveToStorage();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to collect resources:', err);
      return false;
    }
  }

  // 与服务器同步
  async syncWithServer() {
    try {
      const res = await fetch(`${getApiBase()}/api/game/city/interior/1`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (data.success && data.data) {
        this.cachedResources = {
          money: data.data.Money || 0,
          food: data.data.Food || 0,
          men: data.data.Men || 0,
          gold: data.data.Gold || 0,
          area: data.data.Area || 0,
          bloom: data.data.Bloom || 0,
          areaLimit: data.data.AreaRoom || 0,
          moneyLimit: data.data.MoneyRoom || 0,
          foodLimit: data.data.FoodRoom || 0,
          menLimit: data.data.MenRoom || 0
        };

        // 更新产出率
        if (data.data.MoneySpeed) {
          this.productionRates.money = data.data.MoneySpeed;
        }
        if (data.data.FoodSpeed) {
          this.productionRates.food = data.data.FoodSpeed;
        }
        if (data.data.MenSpeed) {
          this.productionRates.men = data.data.MenSpeed;
        }

        this.lastUpdateTime = new Date();
        this.saveToStorage();
      }
    } catch (err) {
      console.error('Sync failed:', err);
    }
  }

  // 获取缓存的资源
  getCachedResources(): Resources | null {
    return this.cachedResources;
  }

  // 设置资源缓存
  setCachedResources(resources: Resources) {
    this.cachedResources = resources;
  }
}

// 导出单例
export const resourceService = new ResourceProductionService();

// 格式化数字 (如 1000 -> 1,000)
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// 格式化时间差 (如 "2小时30分前")
export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;
  const diff = now.getTime() - target.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}
