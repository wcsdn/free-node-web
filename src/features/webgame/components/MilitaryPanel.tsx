/**
 * MilitaryPanel - 新版军事面板
 * 赛博朋克风格
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton, GameModal } from '@/shared/components/game';
import styles from './MilitaryPanel.module.css';

interface Troop {
  id: number;
  type: string;
  count: number;
  level: number;
}

interface MilitaryPanelProps {
  walletAddress: string;
}

export const MilitaryPanel: React.FC<MilitaryPanelProps> = ({ walletAddress }) => {
  const [troops, setTroops] = useState<Troop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTroop, setSelectedTroop] = useState<Troop | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 模拟数据
    setTroops([
      { id: 1, type: '弓兵', count: 50, level: 3 },
      { id: 2, type: '骑兵', count: 30, level: 2 },
      { id: 3, type: '步兵', count: 100, level: 5 },
    ]);
    setLoading(false);
  }, []);

  const getTroopIcon = (type: string): string => {
    const icons: Record<string, string> = {
      '弓兵': '🏹',
      '骑兵': '🐎',
      '步兵': '⚔️',
      '攻城': '🧨',
    };
    return icons[type] || '⚔️';
  };

  if (loading) {
    return <div className={styles.loading}>LOADING...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <span className={styles.glitch} data-text="MILITARY">MILITARY</span>
      </h1>

      {/* 军队概览 */}
      <GameCard title="军队概览" className={styles.overview}>
        <div className={styles.troopStats}>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>⚔️</span>
            <span className={styles.statValue}>{troops.reduce((sum, t) => sum + t.count, 0)}</span>
            <span className={styles.statLabel}>总兵力</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>🏆</span>
            <span className={styles.statValue}>{troops.length}</span>
            <span className={styles.statLabel}>兵种数</span>
          </div>
        </div>
      </GameCard>

      {/* 军队列表 */}
      <div className={styles.sectionTitle}>军队列表</div>
      <div className={styles.troopGrid}>
        {troops.map((troop) => (
          <div
            key={troop.id}
            className={styles.troopCard}
            onClick={() => { setSelectedTroop(troop); setShowModal(true); }}
          >
            <div className={styles.troopIcon}>{getTroopIcon(troop.type)}</div>
            <div className={styles.troopInfo}>
              <div className={styles.troopName}>{troop.type}</div>
              <div className={styles.troopLevel}>Lv.{troop.level}</div>
            </div>
            <div className={styles.troopCount}>{troop.count}人</div>
          </div>
        ))}
      </div>

      {/* 训练新兵 */}
      <div className={styles.actions}>
        <GameButton fullWidth>训练新兵</GameButton>
      </div>

      {/* 详情弹窗 */}
      <GameModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedTroop?.type || '军队详情'}
        size="small"
      >
        {selectedTroop && (
          <div className={styles.detailContent}>
            <div className={styles.detailIcon}>{getTroopIcon(selectedTroop.type)}</div>
            <div className={styles.detailInfo}>
              <p>兵种: {selectedTroop.type}</p>
              <p>等级: Lv.{selectedTroop.level}</p>
              <p>数量: {selectedTroop.count}人</p>
            </div>
            <div className={styles.detailActions}>
              <GameButton fullWidth variant="secondary">调动</GameButton>
              <GameButton fullWidth>解散</GameButton>
            </div>
          </div>
        )}
      </GameModal>
    </div>
  );
};

export default MilitaryPanel;
