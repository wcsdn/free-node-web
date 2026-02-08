/**
 * RankingPanel - 新版排行榜面板
 * 赛博朋克风格
 */
import React, { useState } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';
import styles from './RankingPanel.module.css';

interface RankItem {
  rank: number;
  name: string;
  value: number;
  level: number;
}

interface RankingPanelProps {
  walletAddress: string;
}

export const RankingPanel: React.FC<RankingPanelProps> = ({ walletAddress }) => {
  const [tab, setTab] = useState<'level' | 'power' | 'wealth'>('power');
  
  const rankings: RankItem[] = [
    { rank: 1, name: '玩家_A', value: 10000, level: 50 },
    { rank: 2, name: '玩家_B', value: 9500, level: 48 },
    { rank: 3, name: '玩家_C', value: 9000, level: 45 },
    { rank: 4, name: '玩家_D', value: 8500, level: 42 },
    { rank: 5, name: '我', value: 5000, level: 25 },
  ];

  const getTabIcon = (t: string) => ({ level: '⚔️', power: '💪', wealth: '🪙' }[t] || '🏆');
  const getTabName = (t: string) => ({ level: '等级榜', power: '战力榜', wealth: '财富榜' }[t] || '排行榜');

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <span className={styles.glitch} data-text="RANKING">RANKING</span>
      </h1>

      {/* 分类切换 */}
      <div className={styles.tabs}>
        {(['level', 'power', 'wealth'] as const).map((t) => (
          <button
            key={t}
            className={[styles.tab, tab === t ? styles.active : ''].join(' ')}
            onClick={() => setTab(t)}
          >
            <span className={styles.tabIcon}>{getTabIcon(t)}</span>
            <span>{getTabName(t)}</span>
          </button>
        ))}
      </div>

      {/* 我的排名 */}
      <GameCard title="我的排名" className={styles.myRank}>
        <div className={styles.myInfo}>
          <div className={styles.myAvatar}>⚔️</div>
          <div className={styles.myDetails}>
            <div className={styles.myName}>我</div>
            <div className={styles.myStats}>排名 #{5} · 战力 5000</div>
          </div>
          <div className={styles.myPosition}>#5</div>
        </div>
      </GameCard>

      {/* 排行榜列表 */}
      <div className={styles.rankList}>
        {rankings.map((item) => (
          <div
            key={item.rank}
            className={[styles.rankItem, item.rank <= 3 ? styles.topThree : '']}
          >
            <div className={styles.rankBadge}>
              {item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : `#${item.rank}`}
            </div>
            <div className={styles.rankInfo}>
              <div className={styles.rankName}>{item.name}</div>
              <div className={styles.rankLevel}>Lv.{item.level}</div>
            </div>
            <div className={styles.rankValue}>{item.value.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RankingPanel;
