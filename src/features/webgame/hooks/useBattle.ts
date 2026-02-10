/**
 * 战斗数据 Hook
 * 封装战斗相关的 API 调用和状态管理
 */
import { useState, useCallback, useEffect } from 'react';
import { gameApi } from '../services/gameApi';

// 关卡信息接口
export interface StageInfo {
  id: number;
  name: string;
  enemy: string;
  enemyLevel: number;
  requiredLevel: number;
  cleared: boolean;
  stars?: number;
}

// 对手信息接口
export interface ArenaOpponent {
  wallet_address: string;
  name: string;
  level: number;
  rank?: number;
  power?: number;
  win_count?: number;
  isAi?: boolean;
}

// 战斗状态 Hook 返回值
export interface UseBattleReturn {
  stages: StageInfo[];
  opponents: ArenaOpponent[];
  loading: boolean;
  error: string | null;
  refreshStages: () => Promise<void>;
  refreshOpponents: () => Promise<void>;
  challengeStage: (stageId: number) => Promise<boolean>;
  challengeArena: (opponent: ArenaOpponent) => Promise<boolean>;
}

/**
 * useBattle - 战斗系统 Hook
 */
export function useBattle(): UseBattleReturn {
  const [stages, setStages] = useState<StageInfo[]>([]);
  const [opponents, setOpponents] = useState<ArenaOpponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 默认关卡数据
  const defaultStages: StageInfo[] = [
    { id: 1, name: '山贼营地', enemy: '山贼', enemyLevel: 5, requiredLevel: 1, cleared: false },
    { id: 2, name: '土匪山寨', enemy: '土匪头目', enemyLevel: 10, requiredLevel: 5, cleared: false },
    { id: 3, name: '狼烟平原', enemy: '流寇', enemyLevel: 15, requiredLevel: 10, cleared: false },
    { id: 4, name: '黑风寨', enemy: '寨主', enemyLevel: 20, requiredLevel: 15, cleared: false },
    { id: 5, name: '虎牢关', enemy: '守将', enemyLevel: 30, requiredLevel: 20, cleared: false },
  ];

  // 刷新关卡列表
  const refreshStages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: 调用实际 API
      // const res = await gameApi.getStageList();
      // if (res.success && res.data) {
      //   setStages(res.data);
      //   return;
      // }
      
      // 临时使用默认数据
      setStages(defaultStages);
    } catch (err) {
      setError('网络错误');
      setStages(defaultStages);
    } finally {
      setLoading(false);
    }
  }, []);

  // 刷新竞技场对手
  const refreshOpponents = useCallback(async () => {
    setLoading(true);
    
    try {
      const res = await gameApi.getArenaInfo();
      
      if (res.success && res.data) {
        const players = res.data?.players || [];
        const aiOpponents = res.data?.aiOpponents || [];
        setOpponents([...players, ...aiOpponents]);
      } else {
        // 使用默认 AI 对手
        setOpponents([
          { wallet_address: 'ai_1', name: 'NPC-关羽', level: 30, win_count: 999, isAi: true },
          { wallet_address: 'ai_2', name: 'NPC-张飞', level: 28, win_count: 888, isAi: true },
          { wallet_address: 'ai_3', name: 'NPC-赵云', level: 25, win_count: 777, isAi: true },
        ]);
      }
    } catch (err) {
      // 使用默认 AI 对手
      setOpponents([
        { wallet_address: 'ai_1', name: 'NPC-关羽', level: 30, win_count: 999, isAi: true },
        { wallet_address: 'ai_2', name: 'NPC-张飞', level: 28, win_count: 888, isAi: true },
        { wallet_address: 'ai_3', name: 'NPC-赵云', level: 25, win_count: 777, isAi: true },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 挑战关卡
  const challengeStage = useCallback(async (stageId: number): Promise<boolean> => {
    try {
      const res = await gameApi.challengeDungeon(stageId);
      
      if (res.success) {
        await refreshStages();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to challenge stage:', err);
      return false;
    }
  }, [refreshStages]);

  // 挑战竞技场对手
  const challengeArena = useCallback(async (opponent: ArenaOpponent): Promise<boolean> => {
    try {
      const res = await gameApi.challengeArena(0); // TODO: 传入城市 ID
      
      if (res.success) {
        await refreshOpponents();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to challenge arena:', err);
      return false;
    }
  }, [refreshOpponents]);

  return {
    stages,
    opponents,
    loading,
    error,
    refreshStages,
    refreshOpponents,
    challengeStage,
    challengeArena,
  };
}

/**
 * useStageDetail - 关卡详情 Hook
 */
export function useStageDetail(stageId: number | null) {
  const [stage, setStage] = useState<StageInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!stageId) return;
    
    setLoading(true);
    
    try {
      // TODO: 调用实际 API
      setStage({
        id: stageId,
        name: `关卡 ${stageId}`,
        enemy: '敌人',
        enemyLevel: stageId * 5,
        requiredLevel: stageId * 5 - 5,
        cleared: false,
      });
    } catch (err) {
      console.error('Failed to get stage detail:', err);
    } finally {
      setLoading(false);
    }
  }, [stageId]);

  useEffect(() => {
    if (stageId) {
      refresh();
    }
  }, [stageId]);

  return {
    stage,
    loading,
    refresh,
  };
}
