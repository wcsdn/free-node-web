/**
 * DungeonPanel - 新版副本面板
 * 赛博朋克风格
 */
import React, { useState } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';
import styles from './DungeonPanel.module.css';

interface Dungeon {
  id: number;
  name: string;
  difficulty: number;
  reward: string;
  bestTime?: number;
}

interface DungeonPanelProps {
  walletAddress: string;
}

export const DungeonPanel: React.FC<DungeonPanelProps> = ({ walletAddress }) => {
  const [dungeons] = useState<Dungeon[]>([
    { id: 1, name: '新手森林', difficulty: 1, reward: '大量经验', bestTime: 120 },
    { id: 2, name: '废弃矿坑', difficulty: 2, reward: '装备材料', bestTime: 180 },
    { id: 3, name: '幽暗洞穴', difficulty: 3, reward: '稀有道具' },
    { id: 4, name: '远古遗迹', difficulty: 5, reward: '传说装备' },
  ]);

  const getDifficultyColor = (d: number) => {
    const colors = ['#00FF00', '#00AAFF', '#AA00FF', '#FF00FF', '#FFD700'];
    return colors[d - 1] || '#888888';
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <span className={styles.glitch} data-text="DUNGEON">DUNGEON</span>
      </h1>

      <GameCard title="副本挑战" className={styles.intro}>
        <p>挑战副本，获取丰厚奖励！</p>
      </GameCard>

      <div className={styles.dungeonGrid}>
        {dungeons.map((d) => (
          <div
            key={d.id}
            className={styles.dungeonCard}
            style={{ borderColor: getDifficultyColor(d.difficulty) }}
          >
            <div className={styles.dungeonIcon}>🏰</div>
            <div className={styles.dungeonInfo}>
              <div className={styles.dungeonName} style={{ color: getDifficultyColor(d.difficulty) }}>
                {d.name}
              </div>
              <div className={styles.dungeonDifficulty}>
                难度 {d.difficulty}
                {Array.from({ length: d.difficulty }).map((_, i) => (
                  <span key={i} style={{ color: getDifficultyColor(d.difficulty) }}>★</span>
                ))}
              </div>
              <div className={styles.dungeonReward}>🎁 {d.reward}</div>
              {d.bestTime && (
                <div className={styles.dungeonBest}>⏱️ 最佳: {Math.floor(d.bestTime / 60)}分{d.bestTime % 60}秒</div>
              )}
            </div>
            <GameButton variant={d.difficulty >= 4 ? 'danger' : 'primary'}>
              挑战
            </GameButton>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DungeonPanel;
