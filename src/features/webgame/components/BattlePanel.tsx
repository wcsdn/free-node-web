/**
 * 战斗面板组件
 * PVE副本挑战、PVP竞技挑战
 */
import React, { useState } from 'react';
import styles from '../styles/jxMain.module.css';

interface BattlePanelProps {
  walletAddress: string;
  cityId?: number;
  onClose: () => void;
}

interface Stage {
  id: number;
  name: string;
  enemy: string;
  enemyLevel: number;
  requiredLevel: number;
  cleared: boolean;
}

interface Opponent {
  wallet_address?: string;
  name: string;
  level: number;
  win_count: number;
  isAi?: boolean;
}

const BATTLE_STAGES: Stage[] = [
  { id: 1, name: '山贼营地', enemy: '山贼', enemyLevel: 5, requiredLevel: 1, cleared: false },
  { id: 2, name: '土匪山寨', enemy: '土匪头目', enemyLevel: 10, requiredLevel: 5, cleared: false },
  { id: 3, name: '狼烟平原', enemy: '流寇', enemyLevel: 15, requiredLevel: 10, cleared: false },
  { id: 4, name: '黑风寨', enemy: '寨主', enemyLevel: 20, requiredLevel: 15, cleared: false },
  { id: 5, name: '虎牢关', enemy: '守将', enemyLevel: 30, requiredLevel: 20, cleared: false },
];

const BattlePanel: React.FC<BattlePanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'pve' | 'pvp'>('pve');
  const [clearedStages, setClearedStages] = useState<number[]>([]);
  const [aiOpponents] = useState<Opponent[]>([
    { name: 'NPC-关羽', level: 30, win_count: 999, isAi: true },
    { name: 'NPC-张飞', level: 28, win_count: 888, isAi: true },
    { name: 'NPC-赵云', level: 25, win_count: 777, isAi: true },
  ]);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(null);
  const [fighting, setFighting] = useState(false);
  const [battleResult, setBattleResult] = useState<any>(null);
  const [message, setMessage] = useState('');

  const handleFight = async () => {
    if (activeTab === 'pve') {
      if (!selectedStage) {
        setMessage('请选择要挑战的关卡');
        return;
      }
      await fightPVE(selectedStage);
    } else {
      if (!selectedOpponent) {
        setMessage('请选择要挑战的对手');
        return;
      }
      await fightPVP(selectedOpponent);
    }
  }

  const fightPVE = async (stage: Stage) => {
    setFighting(true);
    setMessage('');
    setBattleResult(null);

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/battle/pve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(localStorage.getItem('wallet-auth') ? { 'X-Wallet-Auth': localStorage.getItem('wallet-auth')! } : {})
        },
        body: JSON.stringify({ stageId: stage.id, cityId }),
      }).then(r => r.json());

      if (res.success) {
        setBattleResult(res.data);
        if (res.data.win) {
          setClearedStages(prev => [...new Set([...prev, stage.id])]);
        }
      } else {
        setMessage(res.error || '战斗失败');
      }
    } catch (err) {
      setMessage('战斗失败: ' + (err instanceof Error ? err.message : String(err)));
    }
    setFighting(false);
  }

  const fightPVP = async (opponent: Opponent) => {
    setFighting(true);
    setMessage('');
    setBattleResult(null);

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/arena/challenge`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(localStorage.getItem('wallet-auth') ? { 'X-Wallet-Auth': localStorage.getItem('wallet-auth')! } : {})
        },
        body: JSON.stringify({ opponent_address: opponent.wallet_address, city_id: cityId }),
      }).then(r => r.json());

      if (res.success) {
        setBattleResult(res.data);
      } else {
        setMessage(res.error || '挑战失败');
      }
    } catch (err) {
      setMessage('挑战失败: ' + (err instanceof Error ? err.message : String(err)));
    }
    setFighting(false);
  }

  return (
    <div className={styles.popupPanel} style={{ width: '700px' }}>
      <div className={styles.popupHeader}>
        <span>⚔️ 战斗系统</span>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      <div className={styles.popupContent}>
        {/* Tab 切换 */}
        <div className={styles.battleTabs}>
          <button
            className={`${styles.battleTab} ${activeTab === 'pve' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('pve');
              setSelectedStage(null);
              setSelectedOpponent(null);
              setBattleResult(null);
            }}
          >
            🏰 PVE副本
          </button>
          <button
            className={`${styles.battleTab} ${activeTab === 'pvp' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('pvp');
              setSelectedStage(null);
              setSelectedOpponent(null);
              setBattleResult(null);
            }}
          >
            ⚔️ PVP竞技
          </button>
        </div>

        {/* 消息提示 */}
        {message && <div className={styles.message}>{message}</div>}

        {/* 战斗结果 */}
        {battleResult && (
          <div className={`${styles.battleResult} ${battleResult.win ? styles.win : styles.lose}`}>
            <div className={styles.battleResultHeader}>
              {battleResult.win ? '🎉 战斗胜利!' : '💔 战斗失败'}
            </div>
            <div className={styles.battleResultContent}>
              <div className={styles.battleStats}>
                {activeTab === 'pve' ? (
                  <>
                    <div>关卡: {battleResult.report?.stageName}</div>
                    <div>敌人: {battleResult.report?.enemy}</div>
                  </>
                ) : (
                  <div>对手: {battleResult.report?.opponent}</div>
                )}
                <div>回合数: {battleResult.rounds}</div>
                <div>战力对比: {battleResult.report?.yourPower} vs {battleResult.report?.opponentPower}</div>
              </div>
              <div className={styles.battleRewards}>
                <span>获得经验: +{battleResult.rewards.exp}</span>
                <span>获得金币: +{battleResult.rewards.gold}</span>
              </div>
              <div className={styles.battleLog}>
                {battleResult.report?.battleLog?.map((log: string, i: number) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
            <button 
              className={styles.closeResultBtn}
              onClick={() => setBattleResult(null)}
            >
              继续
            </button>
          </div>
        )}

        {/* PVE副本列表 */}
        {activeTab === 'pve' && !battleResult && (
          <div className={styles.stageList}>
            <h4>副本关卡</h4>
            <div className={styles.stageGrid}>
              {stages.map(stage => (
                <div
                  key={stage.id}
                  className={`${styles.stageCard} ${selectedStage?.id === stage.id ? styles.selected : ''} ${clearedStages.includes(stage.id) ? styles.cleared : ''}`}
                  onClick={() => setSelectedStage(stage)}
                >
                  <div className={styles.stageName}>{stage.name}</div>
                  <div className={styles.stageEnemy}>
                    {clearedStages.includes(stage.id) ? '✅' : '👹'} {stage.enemy}
                  </div>
                  <div className={styles.stageLevel}>
                    推荐等级: {Math.floor(stage.enemyLevel / 2)}
                  </div>
                  {clearedStages.includes(stage.id) && (
                    <div className={styles.clearedBadge}>已通关</div>
                  )}
                </div>
              ))}
            </div>

            {selectedStage && (
              <div className={styles.fightConfirm}>
                <div className={styles.fightInfo}>
                  挑战: <strong>{selectedStage.name}</strong>
                  <br />
                  敌人: {selectedStage.enemy} (Lv.{selectedStage.enemyLevel})
                </div>
                <button
                  className={styles.fightBtn}
                  onClick={() => fightPVE(selectedStage)}
                  disabled={fighting}
                >
                  {fighting ? '战斗中...' : '开始战斗'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* PVP竞技对手 */}
        {activeTab === 'pvp' && !battleResult && (
          <div className={styles.arenaList}>
            <h4>AI对手</h4>
            <div className={styles.opponentList}>
              {aiOpponents.map((opponent, i) => (
                <div
                  key={`ai-${i}`}
                  className={`${styles.opponentCard} ${selectedOpponent?.name === opponent.name ? styles.selected : ''}`}
                  onClick={() => setSelectedOpponent(opponent)}
                >
                  <div className={styles.opponentName}>
                    {opponent.name}
                    {opponent.isAi && <span className={styles.aiBadge}>AI</span>}
                  </div>
                  <div className={styles.opponentLevel}>等级: {opponent.level}</div>
                  <div className={styles.opponentWins}>胜场: {opponent.win_count}</div>
                </div>
              ))}
            </div>

            {selectedOpponent && (
              <div className={styles.fightConfirm}>
                <div className={styles.fightInfo}>
                  挑战: <strong>{selectedOpponent.name}</strong>
                  <br />
                  等级: {selectedOpponent.level}
                </div>
                <button
                  className={styles.fightBtn}
                  onClick={() => fightPVP(selectedOpponent)}
                  disabled={fighting}
                >
                  {fighting ? '战斗中...' : '发起挑战'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BattlePanel;
