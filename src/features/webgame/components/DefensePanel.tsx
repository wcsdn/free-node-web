/**
 * DefensePanel - 新版城防面板
 * 赛博朋克风格
 */
import React, { useState } from 'react';
import { GameCard, GameButton, GameModal } from '@/shared/components/game';
import styles from './DefensePanel.module.css';

interface Defense {
  id: number;
  name: string;
  level: number;
  count: number;
  defense: number;
}

interface DefensePanelProps {
  walletAddress: string;
}

export const DefensePanel: React.FC<DefensePanelProps> = ({ walletAddress }) => {
  const [defenses, setDefenses] = useState<Defense[]>([
    { id: 1, name: '城墙', level: 5, count: 1, defense: 500 },
    { id: 2, name: '箭塔', level: 3, count: 4, defense: 120 },
    { id: 3, name: '拒马', level: 2, count: 8, defense: 80 },
  ]);
  const [selected, setSelected] = useState<Defense | null>(null);

  const getDefenseIcon = (name: string) => ({城墙: '🧱', 箭塔: '🏹', 拒马: '⚓', 烽火台: '🔥', 城门: '🚪'}[name] || '🛡️');

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <span className={styles.glitch} data-text="DEFENSE">DEFENSE</span>
      </h1>

      <GameCard title="城防总览" className={styles.overview}>
        <div className={styles.totalDefense}>
          <span className={styles.defLabel}>总城防</span>
          <span className={styles.defValue}>
            {defenses.reduce((sum, d) => sum + d.defense * d.count, 0).toLocaleString()}
          </span>
        </div>
      </GameCard>

      <div className={styles.sectionTitle}>城防设施</div>

      <div className={styles.defenseGrid}>
        {defenses.map((d) => (
          <div
            key={d.id}
            className={styles.defenseCard}
            onClick={() => setSelected(d)}
          >
            <div className={styles.defenseIcon}>{getDefenseIcon(d.name)}</div>
            <div className={styles.defenseInfo}>
              <div className={styles.defenseName}>{d.name}</div>
              <div className={styles.defenseLevel}>Lv.{d.level} × {d.count}</div>
            </div>
            <div className={styles.defensePower}>🛡️{d.defense * d.count}</div>
          </div>
        ))}
      </div>

      <GameModal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.name || ''} size="small">
        {selected && (
          <div className={styles.modalContent}>
            <div className={styles.modalIcon}>{getDefenseIcon(selected.name)}</div>
            <div className={styles.modalInfo}>
              <p>等级: Lv.{selected.level}</p>
              <p>数量: {selected.count}</p>
              <p>单防: {selected.defense}</p>
              <p>总防: {selected.defense * selected.count}</p>
            </div>
            <GameButton fullWidth variant="secondary">升级</GameButton>
          </div>
        )}
      </GameModal>
    </div>
  );
};

export default DefensePanel;
