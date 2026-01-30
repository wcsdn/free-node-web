/**
 * IoT 历史数据 Hook
 * 从 ghost-iot API 获取历史数据
 */

import { useState, useEffect, useCallback } from 'react';
import type { IotDataPoint } from './useIotWebSocket';

const IOT_API_URL = 'https://iot.free-node.xyz';

interface IotStats {
  total: number;
  avg_temp: number;
  avg_humidity: number;
  max_temp: number;
  min_temp: number;
  max_humidity: number;
  min_humidity: number;
}

interface UseIotHistoryReturn {
  history: IotDataPoint[];
  stats: IotStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useIotHistory(): UseIotHistoryReturn {
  const [history, setHistory] = useState<IotDataPoint[]>([]);
  const [stats, setStats] = useState<IotStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);

    try {
      const [recentRes, statsRes] = await Promise.all([
        fetch(`${IOT_API_URL}/recent?device_id=security-sensor&limit=30`),
        fetch(`${IOT_API_URL}/stats?device_id=security-sensor`),
      ]);

      if (!recentRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch IoT data');
      }

      const recentData = await recentRes.json();
      const statsData = await statsRes.json();

      // 转换数据格式
      const historyData = (recentData.data || []).map((item: any) => ({
        ...item,
        device_id: item.device_id || 'security-sensor',
        timestamp: new Date(item.created_at * 1000).toISOString(),
      }));

      setHistory(historyData);
      setStats(statsData.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData();
    
    // 每 30 秒自动刷新
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  return { history, stats, loading, error, refresh: fetchData };
}
