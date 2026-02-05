/**
 * 游戏逻辑 Hook
 */

import { useCallback } from 'react';
import { gameApi } from '../services/gameApi';
import { useToast } from '@/shared/components/Toast/ToastContext';

export const useGameLogic = () => {
  const { showSuccess, showError } = useToast();

  /**
   * 加载游戏进度
   */
  const loadGame = useCallback(async () => {
    try {
      const response = await gameApi.getCharacterInfo();
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Load game error:', error);
      return null;
    }
  }, []);

  /**
   * 创建角色
   */
  const createCharacter = useCallback(async (name: string) => {
    try {
      const response = await gameApi.createCharacter(name);
      
      if (response.success) {
        showSuccess('角色创建成功！');
        return response.data;
      } else {
        showError(response.error || '创建角色失败');
        return null;
      }
    } catch (error) {
      console.error('Create character error:', error);
      showError('创建角色失败');
      return null;
    }
  }, [showSuccess, showError]);

  /**
   * 收集资源
   */
  const collectResources = useCallback(async (cityId: number) => {
    try {
      const response = await gameApi.collectResources(cityId);
      
      if (response.success && response.data) {
        showSuccess(`收集成功！金钱+${response.data.money} 粮食+${response.data.food}`);
        return response.data;
      } else {
        showError(response.error || '收集资源失败');
        return null;
      }
    } catch (error) {
      console.error('Collect resources error:', error);
      showError('收集资源失败');
      return null;
    }
  }, [showSuccess, showError]);

  return {
    loadGame,
    createCharacter,
    collectResources,
  };
};
