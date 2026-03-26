/**
 * 排行榜面板组件
 * 显示战力、等级、财富、城市等多种排行榜
 */
import React, { useState, useEffect, useCallback } from 'react';
import type { RankItem, RankType, RankTabConfig } from '../../types';
import {
  getRankList,
  getPowerRankList,
  getLevelRankList,
  getWealthRankList,
  getCityRankList,
  getMyRank,
  transformRankData,
} from '../../services/gameApi';

// 排行榜标签页配置
const RANK_TABS: RankTabConfig[] = [
  { type: 1, label: '城等级', icon: '🏰', valueLabel: '等级' },
  { type: 2, label: '战力榜', icon: '⚔️', valueLabel: '战力' },
  { type: 3, label: '财富榜', icon: '💰', valueLabel: '金币' },
  { type: 4, label: '武将榜', icon: '🗡️', valueLabel: '攻击' },
];

// 每页显示数量
const PAGE_SIZE = 20;

interface RankPanelProps {
  walletAddress?: string;
}

export const RankPanel: React.FC<RankPanelProps> = ({ walletAddress }) => {
  const [activeTab, setActiveTab] = useState<RankType>(2); // 默认战力榜
  const [rankings, setRankings] = useState<RankItem[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myValue, setMyValue] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取排行榜数据
  const fetchRankings = useCallback(async (type: RankType, pageNum: number) => {
    setIsLoading(true);
    setError(null);

    try {
      let result;
      switch (type) {
        case 1:
          result = await getLevelRankList(pageNum, PAGE_SIZE);
          break;
        case 2:
          result = await getPowerRankList(pageNum, PAGE_SIZE);
          break;
        case 3:
          result = await getWealthRankList(pageNum, PAGE_SIZE);
          break;
        case 4:
          result = await getCityRankList(pageNum, PAGE_SIZE);
          break;
        default:
          result = await getRankList(type, pageNum, PAGE_SIZE);
      }

      if (result.success && result.data) {
        const data = result.data;
        setRankings(transformRankData(data, type));
        setMyRank(data.myRank || null);
        setMyValue(data.myValue || null);
        // 估算总页数
        const total = data.total || data.rankings?.length || 0;
        setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
      } else {
        // 如果 API 失败，使用模拟数据
        setRankings(generateMockRankings(type, pageNum));
        setMyRank(Math.floor(Math.random() * 100) + 1);
        setMyValue(Math.floor(Math.random() * 10000));
        setTotalPages(5);
      }
    } catch (err) {
      console.error('Failed to fetch rankings:', err);
      setError('加载排行榜失败');
      // 使用模拟数据
      setRankings(generateMockRankings(type, pageNum));
      setMyRank(Math.floor(Math.random() * 100) + 1);
      setMyValue(Math.floor(Math.random() * 10000));
      setTotalPages(5);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 切换标签页
  const handleTabChange = (type: RankType) => {
    setActiveTab(type);
    setPage(1);
    fetchRankings(type, 1);
  };

  // 翻页
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      fetchRankings(activeTab, newPage);
    }
  };

  // 初始加载和标签页切换时获取数据
  useEffect(() => {
    fetchRankings(activeTab, page);
  }, []);

  // 获取当前标签页配置
  const currentTabConfig = RANK_TABS.find(tab => tab.type === activeTab) || RANK_TABS[0];

  // 获取排名样式
  const getRankStyle = (rank: number): React.CSSProperties => {
    if (rank === 1) return { color: '#ffd700', fontWeight: 'bold' };
    if (rank === 2) return { color: '#c0c0c0', fontWeight: 'bold' };
    if (rank === 3) return { color: '#cd7f32', fontWeight: 'bold' };
    return { color: '#aaa' };
  };

  // 获取排名图标
  const getRankIcon = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  // 格式化数值
  const formatValue = (value: number): string => {
    if (value >= 100000000) return (value / 100000000).toFixed(1) + '亿';
    if (value >= 10000) return (value / 10000).toFixed(1) + '万';
    return value.toLocaleString();
  };

  // 获取玩家头像颜色
  const getAvatarColor = (wallet: string): string => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    ];
    const index = wallet.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // 获取玩家头像首字母
  const getAvatarInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="rank-panel">
      {/* 标题区域 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#ffd700', margin: 0 }}>
          📊 排行榜
        </h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px' }}>
          <span style={{ color: '#aaa' }}>🏆 我的排名</span>
          <span style={{ color: '#ffd700', fontWeight: 'bold' }}>
            {myRank ? `#${myRank}` : '--'}
          </span>
          <span style={{ color: '#aaa' }}>|</span>
          <span style={{ color: '#4ade80' }}>
            {myValue !== null ? formatValue(myValue) : '--'} {currentTabConfig.valueLabel}
          </span>
        </div>
      </div>

      {/* 标签页切换 */}
      <div className="rank-tabs">
        {RANK_TABS.map(tab => (
          <button
            key={tab.type}
            className={`rank-tab ${activeTab === tab.type ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.type as RankType)}
          >
            <span style={{ fontSize: '16px' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 排行榜内容 */}
      <div className="rank-content">
        {isLoading ? (
          <div className="rank-loading">
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
            <div>加载排行榜中...</div>
          </div>
        ) : error ? (
          <div className="rank-error">
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>❌</div>
            <div>{error}</div>
          </div>
        ) : rankings.length === 0 ? (
          <div className="rank-empty">
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📭</div>
            <div>暂无排行数据</div>
          </div>
        ) : (
          <>
            {/* 表头 */}
            <div className="rank-header">
              <div className="rank-header-cell rank-cell-rank">排名</div>
              <div className="rank-header-cell rank-cell-player">玩家</div>
              <div className="rank-header-cell rank-cell-level">等级</div>
              <div className="rank-header-cell rank-cell-value">
                {currentTabConfig.icon} {currentTabConfig.valueLabel}
              </div>
            </div>

            {/* 排行榜列表 */}
            <div className="rank-list">
              {rankings.map((item, index) => (
                <div
                  key={`${item.wallet_address}-${index}`}
                  className={`rank-item ${item.isMe ? 'rank-item-me' : ''}`}
                >
                  {/* 排名 */}
                  <div className="rank-cell-rank" style={getRankStyle(item.rank)}>
                    {item.rank <= 3 ? (
                      <span style={{ fontSize: '18px' }}>{getRankIcon(item.rank)}</span>
                    ) : (
                      <span style={{ fontSize: '14px' }}>#{item.rank}</span>
                    )}
                  </div>

                  {/* 玩家信息 */}
                  <div className="rank-cell-player">
                    <div
                      className="rank-avatar"
                      style={{ background: getAvatarColor(item.wallet_address) }}
                    >
                      {getAvatarInitial(item.name)}
                    </div>
                    <div className="rank-player-info">
                      <div className="rank-player-name" style={{ color: item.isMe ? '#ffd700' : '#fff' }}>
                        {item.name}
                        {item.isMe && <span style={{ fontSize: '10px', marginLeft: '4px' }}>(我)</span>}
                      </div>
                      <div className="rank-player-wallet" style={{ fontSize: '10px' }}>
                        {item.wallet_address.slice(0, 6)}...{item.wallet_address.slice(-4)}
                      </div>
                    </div>
                  </div>

                  {/* 等级 */}
                  <div className="rank-cell-level">
                    <span style={{
                      background: 'rgba(255, 215, 0, 0.2)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: '#ffd700'
                    }}>
                      Lv.{item.level}
                    </span>
                  </div>

                  {/* 数值 */}
                  <div className="rank-cell-value">
                    <span style={{
                      color: activeTab === 3 ? '#ffd700' : activeTab === 2 ? '#ef4444' : '#4ade80',
                      fontWeight: 'bold'
                    }}>
                      {formatValue(item.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="rank-pagination">
                <button
                  className="rank-page-btn"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  ◀ 上一页
                </button>
                <div className="rank-page-info">
                  <span style={{ color: '#ffd700' }}>{page}</span>
                  <span style={{ color: '#aaa' }}> / {totalPages}</span>
                </div>
                <button
                  className="rank-page-btn"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  下一页 ▶
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 古风装饰 */}
      <style>{`
        .rank-panel {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .rank-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .rank-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #aaa;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .rank-tab:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.02);
        }

        .rank-tab.active {
          background: rgba(255, 215, 0, 0.2);
          border-color: #ffd700;
          color: #ffd700;
        }

        .rank-content {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          min-height: 400px;
        }

        .rank-loading,
        .rank-error,
        .rank-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #aaa;
        }

        .rank-header {
          display: grid;
          grid-template-columns: 80px 1fr 80px 120px;
          gap: 10px;
          padding: 10px 15px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          margin-bottom: 10px;
        }

        .rank-header-cell {
          color: #888;
          font-size: 12px;
          font-weight: bold;
        }

        .rank-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rank-item {
          display: grid;
          grid-template-columns: 80px 1fr 80px 120px;
          gap: 10px;
          padding: 12px 15px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          border: 1px solid transparent;
          transition: all 0.2s ease;
          align-items: center;
        }

        .rank-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .rank-item.rank-item-me {
          background: rgba(255, 215, 0, 0.1);
          border-color: rgba(255, 215, 0, 0.3);
        }

        .rank-cell-rank {
          text-align: center;
        }

        .rank-cell-player {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rank-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          color: #fff;
          flex-shrink: 0;
        }

        .rank-player-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .rank-player-name {
          font-size: 14px;
          font-weight: bold;
        }

        .rank-player-wallet {
          color: #666;
        }

        .rank-cell-level {
          text-align: center;
        }

        .rank-cell-value {
          text-align: right;
          font-size: 14px;
        }

        .rank-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .rank-page-btn {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: #aaa;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .rank-page-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .rank-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .rank-page-info {
          font-size: 14px;
        }

        @media (max-width: 600px) {
          .rank-header {
            grid-template-columns: 60px 1fr 60px;
          }
          
          .rank-header-cell.rank-cell-value,
          .rank-item .rank-cell-value {
            display: none;
          }
          
          .rank-item {
            grid-template-columns: 60px 1fr 60px;
          }
        }
      `}</style>
    </div>
  );
};

// 生成模拟排行榜数据
function generateMockRankings(type: RankType, page: number): RankItem[] {
  const mockNames = [
    '江湖剑客', '武林盟主', '逍遥派', '丐帮帮主', '大理段氏',
    '明教教主', '武当掌门', '少林方丈', '峨眉师太', '华山论剑',
    '嵩山派主', '恒山掌门', '衡山剑客', '泰山北斗', '崆峒派主',
    '昆仑派主', '雪山派主', '青城派主', '点苍派主', '唐门高手',
  ];
  
  const rankings: RankItem[] = [];
  const startIndex = (page - 1) * PAGE_SIZE;
  
  for (let i = 0; i < PAGE_SIZE; i++) {
    const index = startIndex + i;
    const name = mockNames[index % mockNames.length];
    let value: number;
    let level: number;
    
    switch (type) {
      case 1: // 等级
        level = Math.max(1, 100 - index);
        value = level;
        break;
      case 2: // 战力
        level = Math.max(1, 50 - Math.floor(index / 2));
        value = Math.floor(Math.random() * 100000) + (100 - index) * 10000;
        break;
      case 3: // 财富
        level = Math.max(1, 30 - Math.floor(index / 3));
        value = Math.floor(Math.random() * 10000000) + (100 - index) * 100000;
        break;
      case 4: // 武将
        level = Math.max(1, 80 - index);
        value = Math.floor(Math.random() * 50000) + (100 - index) * 5000;
        break;
      default:
        level = Math.max(1, 50 - index);
        value = Math.floor(Math.random() * 100000);
    }
    
    rankings.push({
      rank: index + 1,
      wallet_address: `0x${(1000000000 + index).toString(16)}`,
      name: `${name}${index > mockNames.length ? index : ''}`,
      level,
      value,
      isMe: index === 5, // 模拟当前用户在第6位
    });
  }
  
  return rankings;
}

export default RankPanel;
