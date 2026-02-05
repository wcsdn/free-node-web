/**
 * 任务 API 服务
 * 基于原项目 Task.js 逻辑
 */
import { getApiBase, getAuthHeaders } from '../../utils/api';

// 任务类型
export type TaskType = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// 0=剧情, 1=日常, 2=推广, 3=合成, 4=名匠, 5=节日, 6=交换

// 任务状态
export type TaskStatus = 0 | 1 | 2 | 3;
// 0=未接, 1=进行中, 2=已完成, 3=已领奖

// 任务数据结构
export interface Task {
  id: number;
  TaskID?: number;
  Type: TaskType;
  Name: string;        // 任务名称
  Desc: string;        // 任务描述
  Status: TaskStatus;
  Progress?: {
    current: number;
    target: number;
  };
  Requires?: string;    // 任务要求
  Reward?: TaskReward;
  CanClaim?: boolean;   // 是否可领取
}

// 任务奖励
export interface TaskReward {
  exp: number;          // 经验奖励
  gold: number;        // 金币奖励
  items?: Array<{      // 物品奖励
    id: number;
    name: string;
    count: number;
  }>;
}

// 任务列表响应
export interface TaskListResponse {
  success: boolean;
  data: Task[];
  canReceiveCount?: number;  // 可领取奖励的任务数
  message?: string;
}

// 接受任务响应
export interface AcceptTaskResponse {
  success: boolean;
  message?: string;
}

// 完成任务响应
export interface CompleteTaskResponse {
  success: boolean;
  message?: string;
}

// 领取奖励响应
export interface ClaimRewardResponse {
  success: boolean;
  data?: {
    exp: number;
    gold: number;
    items?: Array<{ name: string; count: number }>;
  };
  message?: string;
}

// 任务 API
export const taskApi = {
  /**
   * 获取任务列表
   */
  async getList(type?: TaskType): Promise<TaskListResponse> {
    try {
      let url = `${getApiBase()}/api/task/list`;
      if (type !== undefined) url += `?type=${type}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to fetch task list:', err);
      return getMockTaskList(type);
    }
  },

  /**
   * 接受任务
   */
  async accept(taskId: number): Promise<AcceptTaskResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/task/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ taskId }),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to accept task:', err);
      return { success: false, message: '接受任务失败' };
    }
  },

  /**
   * 完成任务
   */
  async complete(taskId: number): Promise<CompleteTaskResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/task/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ taskId }),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to complete task:', err);
      return { success: false, message: '完成任务失败' };
    }
  },

  /**
   * 领取奖励
   */
  async claimReward(taskId: number): Promise<ClaimRewardResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/task/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ taskId }),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to claim reward:', err);
      return { success: false, message: '领取奖励失败' };
    }
  },

  /**
   * 获取可领取奖励的任务数
   */
  async getClaimableCount(): Promise<{ success: boolean; count: number }> {
    try {
      const res = await fetch(`${getApiBase()}/api/task/claimable-count`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      return { success: true, count: 0 };
    }
  },

  /**
   * 放弃任务
   */
  async giveUp(taskId: number): Promise<AcceptTaskResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/task/${taskId}/giveup`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to give up task:', err);
      return { success: false, message: '放弃任务失败' };
    }
  },
};

// 任务类型名称
export const TASK_TYPE_NAMES: Record<TaskType, string> = {
  0: '剧情',
  1: '日常',
  2: '推广',
  3: '合成',
  4: '名匠',
  5: '节日',
  6: '交换',
};

// 任务类型配置
export const TASK_TYPES: { id: TaskType | undefined; name: string; color: string }[] = [
  { id: undefined, name: '全部', color: '#666' },
  { id: 0, name: '剧情', color: '#ffcc00' },
  { id: 1, name: '日常', color: '#44ff44' },
  { id: 2, name: '推广', color: '#ff44ff' },
  { id: 3, name: '合成', color: '#44ffff' },
  { id: 4, name: '名匠', color: '#ff8844' },
  { id: 5, name: '节日', color: '#ff4444' },
  { id: 6, name: '交换', color: '#8844ff' },
];

// 模拟任务数据
function getMockTaskList(type?: TaskType): TaskListResponse {
  const mockTasks: Task[] = [
    {
      id: 1,
      Type: 0,
      Name: '初入江湖',
      Desc: '前往新手村与NPC对话，了解游戏基本操作',
      Status: 2,
      Progress: { current: 1, target: 1 },
      CanClaim: true,
      Reward: { exp: 100, gold: 50 },
    },
    {
      id: 2,
      Type: 0,
      Name: '拜师学艺',
      Desc: '找到门派导师，学习基础武功',
      Status: 1,
      Progress: { current: 0, target: 1 },
      Requires: '找到门派导师',
      Reward: { exp: 200, gold: 100 },
    },
    {
      id: 3,
      Type: 0,
      Name: '首次战斗',
      Desc: '击败指定数量的山贼',
      Status: 1,
      Progress: { current: 5, target: 10 },
      Reward: { exp: 300, gold: 150 },
    },
    {
      id: 4,
      Type: 1,
      Name: '日常修炼',
      Desc: '完成10次战斗',
      Status: 1,
      Progress: { current: 3, target: 10 },
      Reward: { exp: 50, gold: 20 },
    },
    {
      id: 5,
      Type: 1,
      Name: '采集资源',
      Desc: '收集1000木材',
      Status: 1,
      Progress: { current: 450, target: 1000 },
      Reward: { exp: 30, gold: 10 },
    },
    {
      id: 6,
      Type: 1,
      Name: '商城消费',
      Desc: '在商城购买任意物品',
      Status: 0,
      Reward: { exp: 100, gold: 50 },
    },
  ];

  const filtered = type !== undefined
    ? mockTasks.filter(t => t.Type === type)
    : mockTasks;

  return {
    success: true,
    data: filtered,
    canReceiveCount: filtered.filter(t => t.CanClaim).length,
  };
}

export default taskApi;
