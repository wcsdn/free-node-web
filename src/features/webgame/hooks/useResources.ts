/**
 * 资源 Hook
 * React Hook for real-time resource updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { resourceService, ResourceRate, Resources, ProductionResult } from '../services/api/resourceProduction';
import { cityApi, CityInfo } from '../services/api/cityApi';

// 资源状态 Hook
export function useResources(cityId: number = 1) {
  const [resources, setResources] = useState<Resources | null>(null);
  const [rates, setRates] = useState<ResourceRate>({ money: 0, food: 0, men: 0 });
  const [production, setProduction] = useState<ProductionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const intervalRef = useRef<number | null>(null);

  // 加载城市资源
  const loadResources = useCallback(async () => {
    try {
      const res = await cityApi.getCityInterior(cityId);
      if (res.success && res.data) {
        const city = res.data;
        const newResources: Resources = {
          money: city.Money || 0,
          food: city.Food || 0,
          men: city.Men || 0,
          gold: city.Gold || 0,
          area: city.Area || 0,
          bloom: city.Bloom || 0,
          areaLimit: city.AreaRoom || 0,
          moneyLimit: city.MoneyRoom || 0,
          foodLimit: city.FoodRoom || 0,
          menLimit: city.MenRoom || 0
        };
        
        setResources(newResources);
        setRates({
          money: city.MoneySpeed || 0,
          food: city.FoodSpeed || 0,
          men: city.MenSpeed || 0
        });
        
        setLastUpdate(new Date());
        setError(null);
      }
    } catch (err) {
      setError('加载资源失败');
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  // 计算实时产出
  useEffect(() => {
    if (!rates) return;
    
    const prod = resourceService.calculateProduction(rates);
    setProduction(prod);
  }, [rates, lastUpdate]);

  // 启动自动刷新 (每30秒)
  useEffect(() => {
    loadResources();
    
    intervalRef.current = window.setInterval(() => {
      loadResources();
    }, 30000); // 30秒刷新一次
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadResources]);

  // 收集资源
  const collect = useCallback(async () => {
    const res = await cityApi.collectResources(cityId);
    if (res.success) {
      // 刷新资源
      await loadResources();
      return true;
    }
    return false;
  }, [cityId, loadResources]);

  return {
    resources,
    rates,
    production,
    loading,
    error,
    lastUpdate,
    refresh: loadResources,
    collect
  };
}

// 格式化资源显示
export function formatResource(value: number, limit: number, suffix: string = ''): string {
  const percent = limit > 0 ? Math.round((value / limit) * 100) : 0;
  return `${value.toLocaleString()}${suffix} / ${limit.toLocaleString()} (${percent}%)`;
}

// 资源是否溢出
export function isOverflow(value: number, limit: number): boolean {
  return value >= limit;
}

// 获取资源颜色提示
export function getResourceColor(value: number, limit: number): string {
  const percent = limit > 0 ? (value / limit) * 100 : 0;
  if (percent >= 100) return '#dc3545'; // 红色 - 已满
  if (percent >= 80) return '#ffc107'; // 黄色 - 接近满
  return '#28a745'; // 绿色 - 正常
}
