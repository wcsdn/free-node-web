/**
 * BattlePanel - 新版战斗面板
 * 赛博朋克风格
 */
import React, { useState } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';
import styles from './BattlePanel.module.css';

interface BattlePanelProps {
  walletAddress: string;
}

export const BattlePanel: React.FC<BattlePanelProps> = ({ walletAddress }) => {
  const [battleType, setBattleType] = useState<'pve' | 'pvp'>('pve');
  const [battleLog, setBattleLog] = useState<string[]>([]);

  const startBattle = async () => {
    const log = [
      `[${new Date().toLocaleTimeString()}] 战斗开始...`,
      `[${new Date().toLocaleTimeString()}] 敌方: 初级山贼`,
      `[${new Date().toLocaleTimeString()}] 我方: 弓兵 x10`,
      `[${new Date().toLocaleTimeString()}] 战斗进行中...`,
    ];
    setBattleLog(log);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <span className={styles.glitch} data-text="BATTLE">BATTLE</span>
      </h1>

      {/* 战斗类型选择 */}
      <div className={styles.battleTypes}>
        <button
          className={[styles.typeBtn, battleType === 'pve' ? styles.active : ''].join(' ')}
          onClick={() => setBattleType('pve')}
        >
          🏰 PVE
          <span>副本挑战</span>
        </button>
        <button
          className={[styles.typeBtn, battleType === 'pvp' ? styles.active : ''].join(' ')}
          onClick={() => setBattleType('pvp')}
        >
          ⚔️ PVP
          <span>竞技挑战</span>
        </button>
      </div>

      {/* 战斗信息 */}
      <GameCard title={battleType === 'pve' ? '副本挑战' : '竞技场'} className={styles.battleInfo}>
        <div className={styles.battleStats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>胜利</span>
            <span className={styles.statValue}>0</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>失败</span>
            <span className={styles.statValue}>0</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>连胜</span>
            <span className={styles.statValue}>0</span>
          </div>
        </div>
      </GameCard>

      {/* 挑战按钮 */}
      <div className={styles.challenge}>
        <GameButton size="large" fullWidth onClick={startBattle}>
          {battleType === 'pve' ? '挑战副本' : '挑战对手'}
        </GameButton>
      </div>

      {/* 战斗记录 */}
      {battleLog.length > 0 && (
        <GameCard title="战斗记录" className={styles.battleLog}>
          <div className={styles.logContent}>
            {battleLog.map((log, index) => (
              <div key={index} className={styles.logItem}>{log}</div>
            ))}
          </div>
        </GameCard>
      )}

      {/* 副本/竞技列表 */}
      <div className={styles.sectionTitle}>
        {battleType === 'pve' ? '可挑战副本' : '排行榜'}
      </div>
      <div className={styles.listGrid}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.listCard}>
            <div className={styles.listIcon}>
              {battleType === 'pve' ? '🏰' : '🏆'}
            </div>
            <div className={styles.listInfo}>
              <div className={styles.listName}>
                {battleType === 'pve' ? `副本 ${i}` : `排名 #${i}`}
              </div>
              <div className={styles.listDesc}>
                {battleType === 'pve' ? '初级难度' : '战绩 10-0'}
              </div>
            </div>
            <GameButton size="small" variant="secondary">挑战</GameButton>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BattlePanel;
