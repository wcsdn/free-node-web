import React, { useState, useEffect } from 'react';
import gufengStyles from '../../styles/gufeng.module.css';

import gameApi from '../../services/gameApi';
import styles from './RankPanel.module.css';

interface RankPanelProps {
  onClose: () => void;
}

interface RankItem {
  rank: number;
  name: string;
  value: number;
  level?: number;
  title?: string;
}

type RankType = 'power' | 'level' | 'rich' | 'arena' | 'corps';

export const RankPanel: React.FC<RankPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<RankType>('power');
  const [rankings, setRankings] = useState<RankItem[]>([]);
  const [myRank, setMyRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings(activeTab);
  }, [activeTab]);

  const loadRankings = async (type: RankType) => {
    try {
      setLoading(true);
      const res = await gameApi.getRankList(type);
      if (res.success && res.data) {
        setRankings(res.data);
      }
      const myRes = await gameApi.getMyRank(type);
      if (myRes.success) {
        setMyRank(myRes.data);
      }
    } catch (error) {
      console.error('加载排行榜失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const rankTypes: { key: RankType; label: string; icon: string }[] = [
    { key: 'power', label: '战力榜', icon: '⚔️' },
    { key: 'level', label: '等级榜', icon: '⬆️' },
    { key: 'rich', label: '财富榜', icon: '💰' },
    { key: 'arena', label: '竞技榜', icon: '🏆' },
    { key: 'corps', label: '军团榜', icon: '🚩' },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const getRankClass = (rank: number) => {
    if (rank === 1) return gufengStyles.first;
    if (rank === 2) return gufengStyles.second;
    if (rank === 3) return gufengStyles.third;
    return '';
  };

  return (
    <div className={gufengStyles.overlay}>
      <div className={gufengStyles.panel}>
        <div className={gufengStyles.header}>
          <h2>🏆 排行榜</h2>
          <button className={gufengStyles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* 我的排名 */}
        {myRank && (
          <div className={gufengStyles.myRank}>
            <div className={gufengStyles.myRankInfo}>
              <span className={gufengStyles.myRankLabel}>我的排名</span>
              <span className={gufengStyles.myRankValue}>#{myRank.rank || '-'}</span>
            </div>
            <div className={gufengStyles.myRankInfo}>
              <span className={gufengStyles.myRankLabel}>我的{getTypeLabel(activeTab)}</span>
              <span className={gufengStyles.myRankValue}>{myRank.score || myRank.power || myRank.level || '-'}</span>
            </div>
          </div>
        )}

        {/* 标签页 */}
        <div className={gufengStyles.tabs}>
          {rankTypes.map(type => (
            <button
              key={type.key}
              className={`${gufengStyles.tab} ${activeTab === type.key ? gufengStyles.active : ''}`}
              onClick={() => setActiveTab(type.key)}
            >
              <span className={gufengStyles.tabIcon}>{type.icon}</span>
              <span className={gufengStyles.tabLabel}>{type.label}</span>
            </button>
          ))}
        </div>

        {/* 排行榜列表 */}
        <div className={gufengStyles.content}>
          {loading ? (
            <div className={gufengStyles.loading}>加载中...</div>
          ) : (
            <div className={gufengStyles.rankList}>
              {rankings.map((item, idx) => (
                <div key={idx} className={`${gufengStyles.rankItem} ${getRankClass(item.rank)}`}>
                  <div className={gufengStyles.rankNum}>
                    <span className={gufengStyles.rankIcon}>{getRankIcon(item.rank)}</span>
                    <span className={gufengStyles.rankNumber}>{item.rank}</span>
                  </div>
                  <div className={gufengStyles.playerInfo}>
                    <span className={gufengStyles.playerName}>{item.name}</span>
                    {item.level && <span className={gufengStyles.playerLevel}>Lv.{item.level}</span>}
                    {item.title && <span className={gufengStyles.playerTitle}>{item.title}</span>}
                  </div>
                  <div className={gufengStyles.rankValue}>
                    {getTypeValue(activeTab, item.value)}
                  </div>
                </div>
              ))}
              {rankings.length === 0 && (
                <div className={gufengStyles.empty}>暂无排名数据</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getTypeLabel = (type: RankType) => {
  switch (type) {
    case 'power': return '战力';
    case 'level': return '等级';
    case 'rich': return '财富';
    case 'arena': return '战功';
    case 'corps': return '成员';
    default: return '';
  }
};

const getTypeValue = (type: RankType, value: number) => {
  switch (type) {
    case 'power': return `${value} 战力`;
    case 'level': return `Lv.${value}`;
    case 'rich': return `${value} 银两`;
    case 'arena': return `${value} 战功`;
    case 'corps': return `${value} 成员`;
    default: return value;
  }
};

export default RankPanel;
