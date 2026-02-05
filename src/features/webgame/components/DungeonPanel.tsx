/**
 * 副本面板组件
 * 副本关卡选择、挑战
 */
import React, { useState } from 'react';
import { apiPost } from '../utils/api';
import styles from '../styles/jxMain.module.css';

interface DungeonPanelProps {
  cityId: number;
  onClose: () => void;
}

interface Dungeon {
  id: number;
  name: string;
  description: string;
  minLevel: number;
  dailyLimit: number;
  completedStages: number;
  available: boolean;
  remainingTimes: number;
}

interface Stage {
  id: number;
  name: string;
  enemy: string;
  difficulty: number;
  hp: number;
  attack: number;
  defense: number;
}

const DUNGEON_LIST: Dungeon[] = [
  { id: 1, name: '虎牢关', description: '虎牢关前，三英战吕布', minLevel: 1, dailyLimit: 10, completedStages: 0, available: true, remainingTimes: 10 },
  { id: 2, name: '赤壁之战', description: '火烧连营，曹操败走华容道', minLevel: 15, dailyLimit: 5, completedStages: 0, available: true, remainingTimes: 5 },
  { id: 3, name: '长坂坡', description: '赵子龙单骑救主', minLevel: 25, dailyLimit: 3, completedStages: 0, available: true, remainingTimes: 3 },
];

const DUNGEON_CONFIGS: Record<number, {
  name: string;
  description: string;
  minLevel: number;
  dailyLimit: number;
  rewards: { exp: number; gold: number; items: { id: number; name: string; chance: number }[] };
  stages: Stage[];
}> = {
  1: {
    name: '虎牢关',
    description: '虎牢关前，三英战吕布',
    minLevel: 1,
    dailyLimit: 10,
    rewards: { exp: 100, gold: 50, items: [{ id: 1, name: '经验丹', chance: 0.3 }] },
    stages: [
      { id: 1, name: '普通', enemy: '普通守兵', difficulty: 1, hp: 100, attack: 10, defense: 5 },
      { id: 2, name: '困难', enemy: '精锐守兵', difficulty: 2, hp: 200, attack: 20, defense: 10 },
      { id: 3, name: '噩梦', enemy: '吕布亲卫', difficulty: 3, hp: 400, attack: 40, defense: 20 },
    ]
  },
  2: {
    name: '赤壁之战',
    description: '火烧连营，曹操败走华容道',
    minLevel: 15,
    dailyLimit: 5,
    rewards: { exp: 200, gold: 100, items: [{ id: 2, name: '金币袋', chance: 0.3 }] },
    stages: [
      { id: 1, name: '普通', enemy: '曹军小兵', difficulty: 1, hp: 300, attack: 25, defense: 15 },
      { id: 2, name: '困难', enemy: '曹军精锐', difficulty: 2, hp: 600, attack: 50, defense: 30 },
      { id: 3, name: '噩梦', enemy: '许褚', difficulty: 3, hp: 1200, attack: 100, defense: 60 },
    ]
  },
  3: {
    name: '长坂坡',
    description: '赵子龙单骑救主',
    minLevel: 25,
    dailyLimit: 3,
    rewards: { exp: 500, gold: 300, items: [{ id: 3, name: '神器碎片', chance: 0.2 }] },
    stages: [
      { id: 1, name: '普通', enemy: '普通敌兵', difficulty: 1, hp: 500, attack: 40, defense: 25 },
      { id: 2, name: '困难', enemy: '铁甲兵', difficulty: 2, hp: 1000, attack: 80, defense: 50 },
      { id: 3, name: '噩梦', enemy: '张郃', difficulty: 3, hp: 2000, attack: 160, defense: 100 },
    ]
  },
};

const DungeonPanel: React.FC<DungeonPanelProps> = ({ cityId, onClose }) => {
  const [selectedDungeon, setSelectedDungeon] = useState<Dungeon | null>(null);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [fighting, setFighting] = useState(false);
  const [battleResult, setBattleResult] = useState<any>(null);
  const [message, setMessage] = useState('');

  const handleFight = async () => {
    if (!selectedDungeon || !selectedStage) {
      setMessage('请选择关卡');
      return;
    }

    setFighting(true);
    setMessage('');
    setBattleResult(null);

    try {
      const res = await apiPost(`/dungeon/${selectedDungeon.id}/fight`, { 
        stageId: selectedStage.id, 
        cityId 
      });

      if (res.success) {
        setBattleResult(res.data);
      } else {
        setMessage(res.error || '挑战失败');
      }
    } catch (err) {
      setMessage('挑战失败');
    }
    setFighting(false);
  };

  return (
    <div className={styles.popupPanel} style={{ width: '750px' }}>
      <div className={styles.popupHeader}>
        <span>🏰 副本系统</span>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      <div className={styles.popupContent}>
        {message && <div className={styles.message}>{message}</div>}

        {battleResult ? (
          <div className={`${styles.battleResult} ${battleResult.win ? styles.win : styles.lose}`}>
            <div className={styles.battleResultHeader}>
              {battleResult.win ? '🎉 挑战成功!' : '💔 挑战失败'}
            </div>
            <div className={styles.battleResultContent}>
              <div className={styles.battleStats}>
                <div>副本: {selectedDungeon?.name}</div>
                <div>关卡: {selectedStage?.name}</div>
                <div>敌人: {selectedStage?.enemy}</div>
              </div>
              <div className={styles.battleRewards}>
                <span>+{battleResult.rewards?.exp || 0} 经验</span>
                <span>+{battleResult.rewards?.gold || 0} 金币</span>
              </div>
            </div>
            <button 
              className={styles.closeBtn}
              onClick={() => {
                setBattleResult(null);
                setSelectedStage(null);
              }}
            >
              继续挑战
            </button>
          </div>
        ) : selectedDungeon ? (
          <>
            <div className={styles.dungeonHeader}>
              <h3>{selectedDungeon.name}</h3>
              <p>{selectedDungeon.description}</p>
              <div className={styles.dungeonInfo}>
                <span>等级要求: {selectedDungeon.minLevel}</span>
                <span>剩余次数: {selectedDungeon.remainingTimes}</span>
              </div>
            </div>

            <div className={styles.stageList}>
              {DUNGEON_CONFIGS[selectedDungeon.id]?.stages.map((stage) => (
                <div 
                  key={stage.id}
                  className={`${styles.stageCard} ${selectedStage?.id === stage.id ? styles.selected : ''}`}
                  onClick={() => setSelectedStage(stage)}
                >
                  <div className={styles.stageName}>{stage.name}</div>
                  <div className={styles.stageEnemy}>敌人: {stage.enemy}</div>
                  <div className={styles.stageStats}>
                    血量: {stage.hp} 攻击: {stage.attack} 防御: {stage.defense}
                  </div>
                </div>
              ))}
            </div>

            {selectedStage && (
              <div className={styles.fightConfirm}>
                <div className={styles.fightInfo}>
                  确认挑战: {selectedStage.name} - {selectedStage.enemy}
                </div>
                <button 
                  className={styles.fightBtn}
                  onClick={handleFight}
                  disabled={fighting || selectedDungeon.remainingTimes <= 0}
                >
                  {fighting ? '战斗中...' : '开始战斗'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.dungeonList}>
            {DUNGEON_LIST.map((dungeon) => (
              <div 
                key={dungeon.id}
                className={styles.dungeonCard}
                onClick={() => setSelectedDungeon(dungeon)}
              >
                <div className={styles.dungeonName}>{dungeon.name}</div>
                <div className={styles.dungeonDesc}>{dungeon.description}</div>
                <div className={styles.dungeonInfo}>
                  <span>等级: {dungeon.minLevel}+</span>
                  <span>次数: {dungeon.remainingTimes}/{dungeon.dailyLimit}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.backBtn} onClick={() => {
          if (battleResult) {
            setBattleResult(null);
          }
          if (selectedDungeon && !battleResult) {
            setSelectedDungeon(null);
          } else {
            onClose();
          }
        }}>
          {battleResult ? '返回' : selectedDungeon ? '返回副本列表' : '返回'}
        </div>
      </div>
    </div>
  );
};

export default DungeonPanel;
