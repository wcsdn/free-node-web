/**
 * 商城 Hook
 * React Hook for mall functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { mallApi, MallItem, MallItemType } from '../services/api/mallApi';

// 商城 Hook
export function useMall(initialType: MallItemType = 1) {
  const [items, setItems] = useState<MallItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentType, setCurrentType] = useState<MallItemType>(initialType);
  const [buying, setBuying] = useState<number | null>(null);

  // 加载商品列表
  const loadItems = useCallback(async (type: MallItemType) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await mallApi.getItems(type);
      if (res.success) {
        setItems(res.data);
      } else {
        setError(res.message || '加载商品失败');
      }
    } catch (err) {
      setError('加载商品失败');
      console.error('Failed to load mall items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 切换分类
  const changeType = useCallback((type: MallItemType) => {
    setCurrentType(type);
    loadItems(type);
  }, [loadItems]);

  // 购买商品
  const buyItem = useCallback(async (item: MallItem, count: number = 1) => {
    setBuying(item.Id);
    
    try {
      const res = await mallApi.buy({
        itemId: item.Id,
        buyType: item.BuyType,
        count,
      });
      
      if (res.success) {
        return { success: true, message: `成功购买 ${item.Name} x${count}` };
      } else {
        return { success: false, message: res.message || '购买失败' };
      }
    } catch (err) {
      console.error('Failed to buy item:', err);
      return { success: false, message: '购买失败' };
    } finally {
      setBuying(null);
    }
  }, []);

  // 购买资源
  const buyResource = useCallback(async (
    resourceType: 'food' | 'money' | 'men',
    amount: number
  ) => {
    setBuying(0); // 资源购买使用特殊ID
    
    try {
      const res = await mallApi.buyResource(resourceType, amount);
      
      if (res.success) {
        return { success: true, message: `成功购买 ${amount} ${resourceType}` };
      } else {
        return { success: false, message: res.message || '购买失败' };
      }
    } catch (err) {
      console.error('Failed to buy resource:', err);
      return { success: false, message: '购买失败' };
    } finally {
      setBuying(null);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadItems(currentType);
  }, [currentType, loadItems]);

  return {
    items,
    loading,
    error,
    currentType,
    buying,
    changeType,
    buyItem,
    buyResource,
    refresh: () => loadItems(currentType),
  };
}

// 商城分类配置
export const MALL_CATEGORIES = [
  { id: 1 as MallItemType, name: '热销', icon: '🔥' },
  { id: 4 as MallItemType, name: '侠客', icon: '⚔️' },
  { id: 5 as MallItemType, name: '军事', icon: '🛡️' },
  { id: 6 as MallItemType, name: '道具', icon: '🎒' },
  { id: 7 as MallItemType, name: '资源', icon: '📦' },
  { id: 8 as MallItemType, name: '其它', icon: '📋' },
];
