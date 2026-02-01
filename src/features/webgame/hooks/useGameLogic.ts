/**
 * 游戏逻辑 Hook
 */

import { useEffect, useCallback } from 'react';
import { useWebGameStore } from '../stores/useWebGameStore';
import { useWalletAuth } from '@/shared/hooks/useWalletAuth';
import { API_ENDPOINTS } from '../config';

export function useGameLogic() {
  const { authHeader } = useWalletAuth();
  const { 
    gameStatus, 
    turn, 
    units,
    endTurn,
    setError,
  } = useWebGameStore();

  // 自动保存游戏进度
  const saveGame = useCallback(async () => {
    if (!authHeader || gameStatus === 'idle') return;

    try {
      const gameData = {
        turn,
        units,
        timestamp: Date.now(),
      };

      await fetch(API_ENDPOINTS.SAVE_GAME, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': authHeader,
        },
        body: JSON.stringify(gameData),
      });
    } catch (err) {
      console.error('Failed to save game:', err);
    }
  }, [authHeader, gameStatus, turn, units]);

  // 加载游戏进度
  const loadGame = useCallback(async () => {
    if (!authHeader) return null;

    try {
      const response = await fetch(API_ENDPOINTS.LOAD_GAME, {
        headers: {
          'X-Wallet-Auth': authHeader,
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Failed to load game:', err);
    }

    return null;
  }, [authHeader]);

  // 每回合结束后自动保存
  useEffect(() => {
    if (gameStatus === 'playing') {
      saveGame();
    }
  }, [turn, gameStatus, saveGame]);

  // AI 回合逻辑（简单 AI）
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const enemyUnits = units.filter(u => u.owner === 'enemy');
    const playerUnits = units.filter(u => u.owner === 'player');

    // 简单 AI：敌方单位随机移动和攻击
    if (enemyUnits.length > 0 && playerUnits.length > 0) {
      // TODO: 实现 AI 逻辑
    }
  }, [turn, gameStatus, units]);

  return {
    saveGame,
    loadGame,
  };
}
