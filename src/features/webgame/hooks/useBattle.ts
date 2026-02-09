/**
 * useBattle - 战斗系统 Hook
 */
import { useState, useCallback } from 'react';
import { battleApi } from '../services/game.api';

export interface BattleHistory {
  id: number;
  enemyName: string;
  enemyLevel: number;
  result: 'win' | 'lose';
  damageDealt: number;
  damageTaken: number;
  expGained: number;
  createdAt: string;
}

export interface BattleResult {
  win: boolean;
  damageDealt: number;
  damageTaken: number;
  expGained: number;
  itemsGained?: Array<{ id: number; count: number }>;
}

interface BattleState {
  history: BattleHistory[];
  loading: boolean;
  error: string | null;
}

export function useBattle() {
  const [state, setState] = useState<BattleState>({
    history: [],
    loading: false,
    error: null,
  });

  const [lastResult, setLastResult] = useState<BattleResult | null>(null);
  const [battleLoading, setBattleLoading] = useState(false);

  const getBattleHistory = useCallback(async (limit = 20) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await battleApi.getBattleHistory(limit);
      if (result.success && result.data) {
        setState({
          history: result.data,
          loading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to load battle history',
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  }, []);

  const startBattle = useCallback(async (
    enemyType: string,
    enemyId?: number
  ): Promise<{ success: boolean; error?: string }> => {
    setBattleLoading(true);
    setLastResult(null);

    try {
      const result = await battleApi.startBattle(enemyType, enemyId);
      if (result.success && result.data) {
        setLastResult({
          win: result.data.win,
          damageDealt: result.data.damageDealt,
          damageTaken: result.data.damageTaken,
          expGained: result.data.expGained,
          itemsGained: result.data.itemsGained,
        });
        setBattleLoading(false);
        return { success: true };
      }
      setBattleLoading(false);
      return { success: false, error: result.error };
    } catch (err) {
      setBattleLoading(false);
      return { success: false, error: (err as Error).message };
    }
  }, []);

  return {
    ...state,
    lastResult,
    battleLoading,
    getBattleHistory,
    startBattle,
  };
}
