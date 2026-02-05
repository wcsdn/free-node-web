/**
 * 排行榜 API 服务
 */
import { getApiBase, getAuthHeaders } from '../../utils/api';

// 排行榜类型
export type RankType = 'prosperity' | 'power' | 'wealth' | 'level' | 'arena';

// 排行榜条目
export interface RankItem {
  rank: number;
  playerId: string;
  playerName: string;
  value: number;
  level?: number;
  title?: string;
}

// 排行榜响应
export interface RankListResponse {
  success: boolean;
  data: RankItem[];
  myRank?: number;
  message?: string;
}

// 排行榜 API
export const rankApi = {
  /**
   * 获取排行榜列表
   */
  async getList(type: RankType, page: number = 1, pageSize: number = 20): Promise<RankListResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/rank/list?type=${type}&page=${page}&size=${pageSize}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to fetch rank list:', err);
      return getMockRankList(type);
    }
  },

  /**
   * 获取我的排名
   */
  async getMyRank(type: RankType): Promise<{ success: boolean; rank: number; value: number }> {
    try {
      const res = await fetch(`${getApiBase()}/api/rank/my?type=${type}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      return { success: false, rank: 0, value: 0 };
    }
  },
};

// 排行榜类型配置
export const RANK_TYPES = [
  { id: 'prosperity', name: '繁荣榜', icon: '🌟', desc: '城市繁荣度排名' },
  { id: 'power', name: '战力榜', icon: '⚔️', desc: '综合战力排名' },
  { id: 'wealth', name: '财富榜', icon: '💰', desc: '持有元宝排名' },
  { id: 'level', name: '等级榜', icon: '📊', desc: '玩家等级排名' },
  { id: 'arena', name: '竞技榜', icon: '🏆', desc: '竞技场排名' },
];

// 模拟排行榜数据
function getMockRankList(_type: RankType): RankListResponse {
  const mockData: RankItem[] = [];

  for (let i = 1; i <= 20; i++) {
    mockData.push({
      rank: i,
      playerId: `player_${i}`,
      playerName: `玩家${i === 1 ? '·天下第一·' : i === 2 ? '·武林至尊·' : i === 3 ? '·江湖豪杰·' : i}`,
      value: Math.floor(10000 / i),
      level: Math.floor(50 / i) + 1,
      title: i === 1 ? '武林盟主' : i === 2 ? '副盟主' : i === 3 ? '长老' : undefined,
    });
  }

  return { success: true, data: mockData, myRank: Math.floor(Math.random() * 100) + 1 };
}

export default rankApi;
