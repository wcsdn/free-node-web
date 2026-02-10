/**
 * 排行面板组件
 * 从 Taxis.js 迁移
 */
import React, { useState, useEffect, memo } from 'react';
import gufengStyles from '../../styles/gufeng.module.css';

import { gameApi } from '../../services/gameApi';
import styles from '../../styles/RankingPanel.module.css';

interface RankingItem {
  rank: number;
  name: string;
  value: number;
  unit?: string;
  city_name?: string;
}

interface RankingPanelProps {
  walletAddress: string;
  onClose: () => void;
}

const RANK_TYPES = [
  { id: 'prosperity', name: '繁荣榜', apiType: 'prosperity', unit: '' },
  { id: 'level', name: '等级榜', apiType: 'level', unit: '级' },
  { id: 'gold', name: '财富榜', apiType: 'gold', unit: '金' },
  { id: 'hero_count', name: '武将榜', apiType: 'hero_count', unit: '名' },
  { id: 'battle_wins', name: '战绩榜', apiType: 'battle_wins', unit: '胜' },
];

const RankingPanel: React.FC<RankingPanelProps> = memo(({ walletAddress, onClose }) => {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentType, setCurrentType] = useState(RANK_TYPES[0]);
  const [myRank, setMyRank] = useState<number | null>(null);

  // 加载排行榜
  const fetchRankings = async () => {
    setLoading(true);
    try {
      const res = await gameApi.getRankList(currentType.apiType);
      if (res.success) {
        const data = (res.data || []) as RankingItem[];
        setRankings(data);
        // 模拟自己的排名
        setMyRank(Math.floor(Math.random() * 100) + 1);
      }
    } catch (err) {
      console.error('Failed to load rankings:', err);
      // 模拟数据
      const mockRankings: RankingItem[] = Array.from({ length: 20 }, (_, i) => ({
        rank: i + 1,
        name: `玩家${1000 - i}`,
        value: Math.floor(Math.random() * 10000),
        unit: currentType.unit,
        city_name: `主城${i + 1}`,
      }));
      setRankings(mockRankings);
      setMyRank(Math.floor(Math.random() * 100) + 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [walletAddress, currentType.apiType]);

  useEffect(() => {
    fetchRankings();
  }, [walletAddress, currentType]);

  // 获取排名样式
  const getRankStyle = (rank: number) => {
    if (rank === 1) return gufengStyles.rankGold;
    if (rank === 2) return gufengStyles.rankSilver;
    if (rank === 3) return gufengStyles.rankBronze;
    return '';
  };

  // 获取排名图标
  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  return (
    <div className={gufengStyles.container}>
      <div className={gufengStyles.header}>
        <h2>{currentType.name}</h2>
        <div className={gufengStyles.myRank}>
          我的排名: {myRank ? `#${myRank}` : '未上榜'}
        </div>
        <button className={gufengStyles.closeBtn} onClick={onClose}>×</button>
      </div>

      {/* 排行类型 */}
      <div className={gufengStyles.typeNav}>
        {RANK_TYPES.map((type) => (
          <button
            key={type.id}
            className={`${gufengStyles.typeBtn} ${currentType.id === type.id ? gufengStyles.active : ''}`}
            onClick={() => setCurrentType(type)}
          >
            {type.name}
          </button>
        ))}
      </div>

      {/* 排行列表 */}
      <div className={gufengStyles.rankingContainer}>
        {/* 标题栏 */}
        <div className={gufengStyles.rankingTitle}>
          <span className={gufengStyles.colRank}>排名</span>
          <span className={gufengStyles.colName}>玩家</span>
          <span className={gufengStyles.colValue}>{currentType.name}</span>
        </div>

        {/* 排行内容 */}
        <div className={gufengStyles.rankingList}>
          {loading ? (
            <div className={gufengStyles.loading}>加载中...</div>
          ) : rankings.length === 0 ? (
            <div className={gufengStyles.empty}>暂无排行数据</div>
          ) : (
            rankings.map((item) => (
              <div
                key={item.rank}
                className={`${gufengStyles.rankingItem} ${getRankStyle(item.rank)}`}
              >
                <div className={gufengStyles.colRank}>
                  <span className={gufengStyles.rankNum}>{item.rank}</span>
                  <span className={gufengStyles.rankIcon}>{getRankIcon(item.rank)}</span>
                </div>
                <div className={gufengStyles.colName}>
                  <span className={gufengStyles.playerName}>{item.name}</span>
                  {item.city_name && (
                    <span className={gufengStyles.cityName}>{item.city_name}</span>
                  )}
                </div>
                <div className={gufengStyles.colValue}>
                  <span className={gufengStyles.playerValue}>
                    {item.value.toLocaleString()}{currentType.unit}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 前三名展示 */}
      {rankings.length >= 3 && (
        <div className={gufengStyles.topThree}>
          <div className={`${gufengStyles.topItem} ${gufengStyles.second}`}>
            <div className={gufengStyles.topAvatar}>🥈</div>
            <div className={gufengStyles.topName}>{rankings[1]?.name}</div>
            <div className={gufengStyles.topValue}>{rankings[1]?.value?.toLocaleString()}</div>
          </div>
          <div className={`${gufengStyles.topItem} ${gufengStyles.first}`}>
            <div className={gufengStyles.topAvatar}>🏆</div>
            <div className={gufengStyles.topName}>{rankings[0]?.name}</div>
            <div className={gufengStyles.topValue}>{rankings[0]?.value?.toLocaleString()}</div>
          </div>
          <div className={`${gufengStyles.topItem} ${gufengStyles.third}`}>
            <div className={gufengStyles.topAvatar}>🥉</div>
            <div className={gufengStyles.topName}>{rankings[2]?.name}</div>
            <div className={gufengStyles.topValue}>{rankings[2]?.value?.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
});

RankingPanel.displayName = 'RankingPanel';

export default RankingPanel;
