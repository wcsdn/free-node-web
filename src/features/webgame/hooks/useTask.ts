/**
 * 任务 Hook
 * React Hook for task functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { taskApi, Task, TaskType, AcceptTaskResponse, ClaimRewardResponse } from '../services/api/taskApi';

// 任务 Hook
export function useTask() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentType, setCurrentType] = useState<TaskType | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [canReceiveCount, setCanReceiveCount] = useState(0);
  const [operating, setOperating] = useState<number | null>(null);

  // 加载任务列表
  const loadTasks = useCallback(async (type?: TaskType) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await taskApi.getList(type);
      if (res.success) {
        setTasks(res.data);
        setCanReceiveCount(res.canReceiveCount || 0);
      } else {
        setError(res.message || '加载任务失败');
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('加载任务失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 切换类型
  const changeType = useCallback((type?: TaskType) => {
    setCurrentType(type);
    setSelectedTask(null);
    loadTasks(type);
  }, [loadTasks]);

  // 选择任务
  const selectTask = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  // 接受任务
  const acceptTask = useCallback(async (taskId: number): Promise<AcceptTaskResponse> => {
    setOperating(taskId);
    
    try {
      const res = await taskApi.accept(taskId);
      if (res.success) {
        // 更新任务状态
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, Status: 1, Progress: { current: 0, target: t.Progress?.target || 1 } } : t
        ));
        return { success: true };
      } else {
        return { success: false, message: res.message };
      }
    } catch (err) {
      console.error('Failed to accept task:', err);
      return { success: false, message: '接受任务失败' };
    } finally {
      setOperating(null);
    }
  }, []);

  // 完成任务
  const completeTask = useCallback(async (taskId: number): Promise<AcceptTaskResponse> => {
    setOperating(taskId);
    
    try {
      const res = await taskApi.complete(taskId);
      if (res.success) {
        // 更新任务状态
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, Status: 2, CanClaim: true } : t
        ));
        // 更新可领取数
        setCanReceiveCount(prev => prev + 1);
        return { success: true };
      } else {
        return { success: false, message: res.message };
      }
    } catch (err) {
      console.error('Failed to complete task:', err);
      return { success: false, message: '完成任务失败' };
    } finally {
      setOperating(null);
    }
  }, []);

  // 领取奖励
  const claimReward = useCallback(async (taskId: number): Promise<ClaimRewardResponse> => {
    setOperating(taskId);
    
    try {
      const res = await taskApi.claimReward(taskId);
      if (res.success) {
        // 移除已领取的任务或标记为已领取
        setTasks(prev => prev.filter(t => t.id !== taskId));
        setCanReceiveCount(prev => Math.max(0, prev - 1));
        return res;
      } else {
        return { success: false, message: res.message };
      }
    } catch (err) {
      console.error('Failed to claim reward:', err);
      return { success: false, message: '领取奖励失败' };
    } finally {
      setOperating(null);
    }
  }, []);

  // 放弃任务
  const giveUpTask = useCallback(async (taskId: number): Promise<AcceptTaskResponse> => {
    setOperating(taskId);
    
    try {
      const res = await taskApi.giveUp(taskId);
      if (res.success) {
        // 移除任务
        setTasks(prev => prev.filter(t => t.id !== taskId));
        return { success: true };
      } else {
        return { success: false, message: res.message };
      }
    } catch (err) {
      console.error('Failed to give up task:', err);
      return { success: false, message: '放弃任务失败' };
    } finally {
      setOperating(null);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadTasks();
  }, []);

  return {
    tasks,
    loading,
    error,
    currentType,
    selectedTask,
    canReceiveCount,
    operating,
    loadTasks,
    changeType,
    selectTask,
    acceptTask,
    completeTask,
    claimReward,
    giveUpTask,
    refresh: () => loadTasks(currentType),
  };
}

// 获取状态文本
export function getTaskStatusText(status: number): string {
  const texts: Record<number, string> = {
    0: '未接',
    1: '进行中',
    2: '已完成',
    3: '已领奖',
  };
  return texts[status] || '未知';
}

// 获取状态样式
export function getTaskStatusClass(status: number): string {
  const classes: Record<number, string> = {
    0: 'statusPending',
    1: 'statusInProgress',
    2: 'statusCompleted',
    3: 'statusReceived',
  };
  return classes[status] || '';
}
