/**
 * useHero - 武将状态 Hook
 */
import { useState, useCallback, useEffect } from 'react';
import type { Hero, ApiResponse } from '../types/game.types';
import { heroApi } from '../services/game.api';

interface HeroState {
  heroes: Hero[];
  loading: boolean;
  error: string | null;
}

export function useHero(walletAddress: string) {
  const [state, setState] = useState<HeroState>({
    heroes: [],
    loading: false,
    error: null,
  });

  const loadHeroes = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await heroApi.getHeroes();
      if (result.success && result.data) {
        setState({ heroes: result.data, loading: false, error: null });
      } else {
        setState(prev => ({ ...prev, loading: false, error: result.error || 'Failed to load' }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: (err as Error).message }));
    }
  }, []);

  useEffect(() => {
    loadHeroes();
  }, [loadHeroes]);

  return { ...state, loadHeroes };
}
