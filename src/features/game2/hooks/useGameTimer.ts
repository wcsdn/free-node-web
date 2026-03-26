/**
 * 全局游戏定时器 Hook
 * 统一管理游戏内的所有计时器：
 * - 服务器时间（同步 /api/game/status 的 Time）
 * - 事件队列倒计时（/api/event/valid）
 * - 建筑升级队列
 * - 研究队列
 * - 战斗冷却
 * - 全局刷新（每 30 秒）
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { apiRequest } from '../services/gameApi';

// API 基础配置
const _API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8788';
const DEV_MODE = import.meta.env.DEV === true;

// ============ 类型定义 ============

/** 事件项 */
export interface EventItem {
  EventID: number;
  EventName: string;
  RemainTime: number; // 剩余秒数
}

/** 建筑升级项 */
export interface BuildingUpgradeItem {
  buildingId: number;
  buildingName: string;
  finishTime: number; // 预计完成时间戳 (ms)
}

/** 研究项 */
export interface ResearchItem {
  techId: number;
  techName: string;
  finishTime: number; // 预计完成时间戳 (ms)
}

/** 战斗冷却项 */
export interface BattleCooldownItem {
  type: 'attack' | 'reinforce' | 'march';
  finishTime: number; // 预计完成时间戳 (ms)
}

/** 定时器状态 */
export interface GameTimerState {
  // 服务器时间
  serverTime: string; // "HH:MM:SS"
  serverTimeRaw: number; // 原始秒数 (0-86399)
  // 事件队列
  activeEvents: EventItem[];
  eventQueueCount: number;
  // 建筑升级队列
  buildingUpgrades: BuildingUpgradeItem[];
  // 研究队列
  researchQueue: ResearchItem[];
  // 战斗冷却
  battleCooldowns: BattleCooldownItem[];
  // 全局状态
  lastRefresh: number; // 上次刷新时间戳
  isRefreshing: boolean;
}

// ============ 默认状态 ============

const getDefaultState = (): GameTimerState => ({
  serverTime: '00:00:00',
  serverTimeRaw: 0,
  activeEvents: [],
  eventQueueCount: 0,
  buildingUpgrades: [],
  researchQueue: [],
  battleCooldowns: [],
  lastRefresh: 0,
  isRefreshing: false,
});

// ============ 工具函数 ============

/** 格式化秒数为 HH:MM:SS */
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** 解析服务器时间字符串为秒数 */
function parseServerTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length !== 3) return 0;
  const [h, m, s] = parts.map(Number);
  if (isNaN(h) || isNaN(m) || isNaN(s)) return 0;
  return h * 3600 + m * 60 + s;
}

// ============ Hook ============

export interface UseGameTimerReturn {
  // 状态
  timerState: GameTimerState;
  // 格式化的时间字符串
  formattedServerTime: string;
  activeEventCount: number;
  eventQueueCount: number;
  buildingUpgradeCount: number;
  researchCount: number;
  battleCooldownCount: number;
  // 操作方法
  addBuildingUpgrade: (item: BuildingUpgradeItem) => void;
  removeBuildingUpgrade: (buildingId: number) => void;
  addResearch: (item: ResearchItem) => void;
  removeResearch: (techId: number) => void;
  addBattleCooldown: (item: BattleCooldownItem) => void;
  removeBattleCooldown: (type: BattleCooldownItem['type']) => void;
  // 手动刷新
  refreshTimerState: () => Promise<void>;
  // 获取正在进行的升级倒计时（秒）
  getBuildingUpgradeRemaining: (buildingId: number) => number;
  // 获取正在进行的建筑升级列表
  getActiveBuildingUpgrades: () => BuildingUpgradeItem[];
}

export function useGameTimer(cityId: number = 1): UseGameTimerReturn {
  const [timerState, setTimerState] = useState<GameTimerState>(getDefaultState);
  const [_clientStartTime] = useState(() => Date.now());
  const [serverStartTime, setServerStartTime] = useState<number | null>(null);
  const refreshIntervalRef = useRef<number | null>(null);
  const secondIntervalRef = useRef<number | null>(null);

  // ============ API 调用 ============

  /** 从服务器获取状态 */
  const fetchServerStatus = useCallback(async () => {
    if (DEV_MODE) {
      // 开发模式：使用本地时间模拟
      return;
    }

    try {
      // 获取服务器时间
      const statusRes = await apiRequest<{ Time: string }>('/game/status', 'GET');
      if (statusRes.success && statusRes.data?.Time) {
        const timeStr = statusRes.data.Time;
        const timeSeconds = parseServerTimeToSeconds(timeStr);
        setServerStartTime(Date.now());
        setTimerState(prev => ({
          ...prev,
          serverTime: timeStr,
          serverTimeRaw: timeSeconds,
        }));
      }

      // 获取进行中的事件
      const eventRes = await apiRequest<{ events: EventItem[] }>('/event/valid', 'GET');
      if (eventRes.success && eventRes.data?.events) {
        setTimerState(prev => ({
          ...prev,
          activeEvents: eventRes.data!.events,
        }));
      }

      // 获取事件队列数量
      const queueRes = await apiRequest<{ queueCount: number }>(`/event/queue/${cityId}`, 'GET');
      if (queueRes.success && queueRes.data?.queueCount !== undefined) {
        setTimerState(prev => ({
          ...prev,
          eventQueueCount: queueRes.data!.queueCount,
        }));
      }
    } catch (err) {
      console.error('[useGameTimer] fetchServerStatus error:', err);
    }
  }, [cityId]);

  /** 手动刷新全部状态 */
  const refreshTimerState = useCallback(async () => {
    setTimerState(prev => ({ ...prev, isRefreshing: true }));
    await fetchServerStatus();
    setTimerState(prev => ({
      ...prev,
      isRefreshing: false,
      lastRefresh: Date.now(),
    }));
  }, [fetchServerStatus]);

  // ============ 服务器时间更新（每秒） ============

  useEffect(() => {
    // 如果有服务器时间基准，用服务器时间驱动
    if (serverStartTime !== null) {
      secondIntervalRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - serverStartTime) / 1000);
        const totalSeconds = (timerState.serverTimeRaw + elapsed) % 86400;
        setTimerState(prev => ({
          ...prev,
          serverTime: formatTime(totalSeconds),
          serverTimeRaw: totalSeconds,
        }));
      }, 1000);
    } else {
      // 没有服务器时间时，用本地时间模拟（开发模式）
      secondIntervalRef.current = window.setInterval(() => {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        const s = now.getSeconds();
        const totalSeconds = h * 3600 + m * 60 + s;
        setTimerState(prev => ({
          ...prev,
          serverTime: formatTime(totalSeconds),
          serverTimeRaw: totalSeconds,
        }));
      }, 1000);
    }

    return () => {
      if (secondIntervalRef.current !== null) {
        clearInterval(secondIntervalRef.current);
      }
    };
  }, [serverStartTime]);

  // ============ 事件 RemainTime 倒计时（每秒递减） ============

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimerState(prev => {
        const updatedEvents = prev.activeEvents
          .map(event => ({
            ...event,
            RemainTime: Math.max(0, event.RemainTime - 1),
          }))
          .filter(event => event.RemainTime > 0);

        return {
          ...prev,
          activeEvents: updatedEvents,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ============ 全局刷新（每 30 秒） ============

  useEffect(() => {
    // 初始加载
    fetchServerStatus();

    // 每 30 秒刷新
    refreshIntervalRef.current = window.setInterval(() => {
      fetchServerStatus();
    }, 30000);

    return () => {
      if (refreshIntervalRef.current !== null) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchServerStatus]);

  // ============ 建筑升级队列 ============

  /** 添加建筑升级 */
  const addBuildingUpgrade = useCallback((item: BuildingUpgradeItem) => {
    setTimerState(prev => {
      // 如果已存在则更新，否则添加
      const existing = prev.buildingUpgrades.findIndex(b => b.buildingId === item.buildingId);
      if (existing >= 0) {
        const updated = [...prev.buildingUpgrades];
        updated[existing] = item;
        return { ...prev, buildingUpgrades: updated };
      }
      return { ...prev, buildingUpgrades: [...prev.buildingUpgrades, item] };
    });
  }, []);

  /** 移除建筑升级（完成时调用） */
  const removeBuildingUpgrade = useCallback((buildingId: number) => {
    setTimerState(prev => ({
      ...prev,
      buildingUpgrades: prev.buildingUpgrades.filter(b => b.buildingId !== buildingId),
    }));
  }, []);

  /** 获取建筑升级剩余秒数 */
  const getBuildingUpgradeRemaining = useCallback((buildingId: number): number => {
    const item = timerState.buildingUpgrades.find(b => b.buildingId === buildingId);
    if (!item) return 0;
    return Math.max(0, Math.floor((item.finishTime - Date.now()) / 1000));
  }, [timerState.buildingUpgrades]);

  /** 获取正在进行的建筑升级列表 */
  const getActiveBuildingUpgrades = useCallback((): BuildingUpgradeItem[] => {
    const now = Date.now();
    return timerState.buildingUpgrades.filter(b => b.finishTime > now);
  }, [timerState.buildingUpgrades]);

  // ============ 研究队列 ============

  /** 添加研究 */
  const addResearch = useCallback((item: ResearchItem) => {
    setTimerState(prev => {
      const existing = prev.researchQueue.findIndex(r => r.techId === item.techId);
      if (existing >= 0) {
        const updated = [...prev.researchQueue];
        updated[existing] = item;
        return { ...prev, researchQueue: updated };
      }
      return { ...prev, researchQueue: [...prev.researchQueue, item] };
    });
  }, []);

  /** 移除研究（完成时调用） */
  const removeResearch = useCallback((techId: number) => {
    setTimerState(prev => ({
      ...prev,
      researchQueue: prev.researchQueue.filter(r => r.techId !== techId),
    }));
  }, []);

  // ============ 战斗冷却 ============

  /** 添加战斗冷却 */
  const addBattleCooldown = useCallback((item: BattleCooldownItem) => {
    setTimerState(prev => {
      const existing = prev.battleCooldowns.findIndex(c => c.type === item.type);
      if (existing >= 0) {
        const updated = [...prev.battleCooldowns];
        updated[existing] = item;
        return { ...prev, battleCooldowns: updated };
      }
      return { ...prev, battleCooldowns: [...prev.battleCooldowns, item] };
    });
  }, []);

  /** 移除战斗冷却 */
  const removeBattleCooldown = useCallback((type: BattleCooldownItem['type']) => {
    setTimerState(prev => ({
      ...prev,
      battleCooldowns: prev.battleCooldowns.filter(c => c.type !== type),
    }));
  }, []);

  // ============ 导出值 ============

  return {
    timerState,
    formattedServerTime: timerState.serverTime,
    activeEventCount: timerState.activeEvents.length,
    eventQueueCount: timerState.eventQueueCount,
    buildingUpgradeCount: timerState.buildingUpgrades.filter(b => b.finishTime > Date.now()).length,
    researchCount: timerState.researchQueue.filter(r => r.finishTime > Date.now()).length,
    battleCooldownCount: timerState.battleCooldowns.filter(c => c.finishTime > Date.now()).length,
    addBuildingUpgrade,
    removeBuildingUpgrade,
    addResearch,
    removeResearch,
    addBattleCooldown,
    removeBattleCooldown,
    refreshTimerState,
    getBuildingUpgradeRemaining,
    getActiveBuildingUpgrades,
  };
}
