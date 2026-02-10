import React, { useState, useEffect } from 'react';
import gameApi from '../../services/gameApi';
import styles from './DungeonPanel.module.css';

interface DungeonPanelProps {
  onClose: () => void;
}

interface Dungeon {
  id: number;
  name: string;
  difficulty: number;
  stages: number;
  recommendedPower: number;
  icon?: string;
}

export const DungeonPanel: React.FC<DungeonPanelProps> = ({ onClose }) => {
  const [dungeons, setDungeons] = useState<Dungeon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDungeon, setSelectedDungeon] = useState<Dungeon | null>(null);
  const [battleResult, setBattleResult] = useState<any>(null);

  useEffect(() => {
    loadDungeons();
  }, []);

  const loadDungeons = async () => {
    try {
      setLoading(true);
      const res = await gameApi.getDungeonList();
      if (res.success && res.data?.dungeons) {
        setDungeons(res.data.dungeons);
      }
    } catch (error) {
      console.error('加载副本列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterDungeon = async (dungeon: Dungeon) => {
    setSelectedDungeon(dungeon);
    setBattleResult(null);
  };

  const handleStartBattle = async (dungeon: Dungeon) => {
    try {
      const res = await gameApi.startPveBattle(dungeon.id, []);
      if (res.success) {
        setBattleResult(res.data);
      } else {
        alert(res.error || '战斗开始失败');
      }
    } catch (error) {
      alert('战斗开始失败，请稍后重试');
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return '⭐'.repeat(Math.min(difficulty, 5));
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return '#2ecc71';
      case 2: return '#3498db';
      case 3: return '#9b59b6';
      case 4: return '#e67e22';
      case 5: return '#e74c3c';
      default: return '#888';
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>⚔️ 副本</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : selectedDungeon ? (
          /* 副本详情 */
          <div className={styles.detailContent}>
            <div className={styles.dungeonHeader}>
              <h3>{selectedDungeon.name}</h3>
              <div className={styles.dungeonMeta}>
                <span style={{ color: getDifficultyColor(selectedDungeon.difficulty) }}>
                  {getDifficultyStars(selectedDungeon.difficulty)}
                </span>
                <span>关卡: {selectedDungeon.stages}</span>
                <span>推荐战力: {selectedDungeon.recommendedPower}</span>
              </div>
            </div>

            {battleResult ? (
              <div className={styles.battleResult}>
                <div className={styles.resultHeader}>
                  {battleResult.victory ? '🎉 战斗胜利！' : '💀 战斗失败'}
                </div>
                <div className={styles.resultStats}>
                  <div className={styles.resultItem}>
                    <span>获得经验</span>
                    <span>+{battleResult.exp || 0}</span>
                  </div>
                  <div className={styles.resultItem}>
                    <span>获得银两</span>
                    <span>+{battleResult.gold || 0}</span>
                  </div>
                  {battleResult.drops?.map((drop: any, idx: number) => (
                    <div key={idx} className={styles.resultItem}>
                      <span>获得道具</span>
                      <span>{drop.name} x{drop.count}</span>
                    </div>
                  ))}
                </div>
                <button 
                  className={styles.backBtn}
                  onClick={() => setBattleResult(null)}
                >
                  返回副本列表
                </button>
              </div>
            ) : (
              <div className={styles.dungeonActions}>
                <p>进入副本进行挑战，通关可获得大量奖励！</p>
                <button 
                  className={styles.startBtn}
                  onClick={() => handleStartBattle(selectedDungeon)}
                >
                  🚀 开始挑战
                </button>
                <button 
                  className={styles.backBtn}
                  onClick={() => setSelectedDungeon(null)}
                >
                  返回列表
                </button>
              </div>
            )}
          </div>
        ) : (
          /* 副本列表 */
          <div className={styles.dungeonList}>
            {dungeons.map(dungeon => (
              <div 
                key={dungeon.id} 
                className={styles.dungeonItem}
                onClick={() => handleEnterDungeon(dungeon)}
              >
                <div className={styles.dungeonIcon}>
                  {dungeon.icon ? (
                    <img src={dungeon.icon} alt={dungeon.name} />
                  ) : (
                    <span style={{ fontSize: '2rem' }}>🏰</span>
                  )}
                </div>
                <div className={styles.dungeonInfo}>
                  <h3>{dungeon.name}</h3>
                  <div className={styles.dungeonMeta}>
                    <span style={{ color: getDifficultyColor(dungeon.difficulty) }}>
                      {getDifficultyStars(dungeon.difficulty)}
                    </span>
                    <span>{dungeon.stages} 关卡</span>
                    <span>推荐 {dungeon.recommendedPower} 战力</span>
                  </div>
                </div>
                <div className={styles.enterBtn}>
                  前往
                </div>
              </div>
            ))}
            {dungeons.length === 0 && (
              <div className={styles.empty}>暂无副本</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DungeonPanel;
