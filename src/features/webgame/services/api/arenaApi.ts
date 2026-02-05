/**
 * 竞技场 API 服务
 */
import { getApiBase, getAuthHeaders } from '../../utils/api';

// 对手信息
export interface ArenaOpponent {
  id: string;
  name: string;
  level: number;
  power: number;
  title?: string;
  avatar?: string;
}

// 竞技场记录
export interface ArenaRecord {
  id: number;
  opponent: string;
  result: 'win' | 'lose';
  reward?: {
    exp: number;
    gold: number;
  };
  time: string;
}

// 对手列表响应
export interface OpponentListResponse {
  success: boolean;
  data: ArenaOpponent[];
  message?: string;
}

// 挑战响应
export interface ChallengeResponse {
  success: boolean;
  data?: {
    recordId: number;
    result: 'win' | 'lose';
    reward: {
      exp: number;
      gold: number;
      honor?: number;
    };
  };
  message?: string;
}

// 我的信息
export interface ArenaInfoResponse {
  success: boolean;
  data?: {
    rank: number;
    honor: number;
    winCount: number;
    loseCount: number;
    streak: number;
  };
  message?: string;
}

// 竞技场 API
export const arenaApi = {
  /**
   * 获取对手列表
   */
  async getOpponents(rankRange: number = 50): Promise<OpponentListResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/arena/opponents?range=${rankRange}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to fetch opponents:', err);
      return getMockOpponents();
    }
  },

  /**
   * 发起挑战
   */
  async challenge(opponentId: string): Promise<ChallengeResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/arena/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ opponentId }),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to challenge:', err);
      return { success: false, message: '挑战失败' };
    }
  },

  /**
   * 获取我的竞技信息
   */
  async getInfo(): Promise<ArenaInfoResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/arena/info`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to fetch arena info:', err);
      return {
        success: true,
        data: {
          rank: Math.floor(Math.random() * 500) + 1,
          honor: Math.floor(Math.random() * 10000),
          winCount: Math.floor(Math.random() * 50),
          loseCount: Math.floor(Math.random() * 20),
          streak: Math.floor(Math.random() * 5),
        },
      };
    }
  },

  /**
   * 获取战斗记录
   */
  async getRecords(page: number = 1, pageSize: number = 10): Promise<{ success: boolean; data: ArenaRecord[] }> {
    try {
      const res = await fetch(`${getApiBase()}/api/arena/records?page=${page}&size=${pageSize}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to fetch records:', err);
      return { success: true, data: getMockRecords() };
    }
  },

  /**
   * 购买挑战次数
   */
  async buyChallengeCount(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${getApiBase()}/api/arena/buy-count`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      return { success: false, message: '购买失败' };
    }
  },
};

// 模拟对手数据
function getMockOpponents(): OpponentListResponse {
  const opponents: ArenaOpponent[] = [];
  const titles = ['剑宗', '刀王', '枪神', '拳皇', '暗影', '侠客', '浪子', '霸主'];

  for (let i = 1; i <= 10; i++) {
    opponents.push({
      id: `opponent_${i}`,
      name: `${titles[i % titles.length]}·${['小明', '小红', '小强', '小芳', '小龙', '小虎', '小燕', '小鹰'][i % 8]}`,
      level: Math.floor(Math.random() * 30) + 10,
      power: Math.floor(Math.random() * 10000) + 3000,
      title: titles[i % titles.length],
    });
  }

  return { success: true, data: opponents };
}

// 模拟战斗记录
function getMockRecords(): ArenaRecord[] {
  const records: ArenaRecord[] = [];
  const names = ['剑宗·小明', '刀王·小红', '枪神·小强'];

  for (let i = 0; i < 5; i++) {
    const win = Math.random() > 0.4;
    records.push({
      id: i + 1,
      opponent: names[i % names.length],
      result: win ? 'win' : 'lose',
      reward: win ? { exp: Math.floor(Math.random() * 100) + 50, gold: Math.floor(Math.random() * 500) + 100 } : undefined,
      time: new Date(Date.now() - i * 3600000).toISOString(),
    });
  }

  return records;
}

export default arenaApi;
