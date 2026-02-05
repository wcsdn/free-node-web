/**
 * 竞技场面板组件
 */
import React, { useState, useEffect, memo } from 'react';
import { gameApi } from '../services/gameApi';
import styles from '../styles/ArenaPanel.module.css';

interface ArenaOpponent {
  wallet_address: string;
  name: string;
  level: number;
  rank?: number;
  power?: number;
  win_count?: number;
  isAi?: boolean;
}

interface BattleLogItem {
  result: string;
  reward: string;
  opponent?: string;
  time?: string;
}

interface ArenaPanelProps {
  walletAddress: string;
  onClose: () => void;
}

const ArenaPanel: React.FC<ArenaPanelProps> = memo(({ walletAddress, onClose }) => {
  const [myRank, setMyRank] = useState(0);
  const [myPower, setMyPower] = useState(0);
  const [opponents, setOpponents] = useState<ArenaOpponent[]>([]);
  const [battleLog, setBattleLog] = useState<BattleLogItem[]>([]);
  const [challenging, setChallenging] = useState(false);
  const [message, setMessage] = useState('');

  const fetchArenaData = async () => {
    try {
      const res = await gameApi.getArenaInfo();
      if (res.success) {
        // 合并玩家和AI对手
        const players = res.data?.players || [];
        const aiOpponents = res.data?.aiOpponents || [];
        setOpponents([...players, ...aiOpponents]);
        setBattleLog(res.data?.battles || []);
      }
    } catch (err) {
      console.error('Failed to load arena data:', err);
      // 模拟数据
      setOpponents([
        { wallet_address: 'ai_1', name: 'NPC-关羽', level: 30, win_count: 999, isAi: true },
        { wallet_address: 'ai_2', name: 'NPC-张飞', level: 28, win_count: 888, isAi: true },
        { wallet_address: 'ai_3', name: 'NPC-赵云', level: 25, win_count: 777, isAi: true },
      ]);
    }
  };

  useEffect(() => {
    fetchArenaData();
  }, [walletAddress]);

  const handleChallenge = async (opponent: ArenaOpponent) => {
    setChallenging(true);
    setMessage('');
    try {
      // 获取第一个城市ID
      const cityRes = await gameApi.getCityList();
      const cities = cityRes.data || [];
      if (cities.length === 0) {
        setMessage('没有城市无法挑战');
        setChallenging(false);
        return;
      }
      const cityId = cities[0].id;

      const res = await gameApi.challengeArena(opponent.wallet_address);
      if (res.success) {
        const result = res.data?.win ? '胜利' : '失败';
        const exp = res.data?.rewards?.exp || 0;
        const gold = res.data?.rewards?.gold || 0;
        const reward = res.data?.win ? `经验+${exp} 金币+${gold}` : `经验+${Math.floor(exp/3)}`;
        const logItem: BattleLogItem = {
          result,
          reward,
          opponent: res.data?.report?.opponent || opponent.name,
          time: new Date().toLocaleString(),
        };
        setBattleLog([logItem, ...battleLog].slice(0, 10));
        setMessage(`${result}！${reward}`);
      } else {
        setMessage(res.error || '挑战失败');
      }
    } catch (err) {
      setMessage('挑战失败');
    } finally {
      setChallenging(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>竞技场</h2>
        <div className={styles.myInfo}>
          <span>排名: #{myRank}</span>
          <span>战力: {myPower}</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      <div className={styles.content}>
        {/* 对手列表 */}
        <div className={styles.opponentPanel}>
          <h3>挑战对手</h3>
          <div className={styles.opponentList}>
            {opponents.map((opponent) => (
              <div key={opponent.wallet_address} className={styles.opponentCard}>
                <div className={styles.opponentRank}>{opponent.isAi ? 'AI' : '#?'}</div>
                <div className={styles.opponentInfo}>
                  <span className={styles.opponentName}>{opponent.name}</span>
                  <span className={styles.opponentLevel}>等级 {opponent.level}</span>
                  <span className={styles.opponentPower}>胜场 {opponent.win_count || 0}</span>
                </div>
                <div className={styles.opponentStats}>
                  <span className={styles.winRate}>{opponent.isAi ? 'AI对手' : '玩家'}</span>
                </div>
                <button 
                  className={styles.challengeBtn}
                  onClick={() => handleChallenge(opponent)}
                  disabled={challenging}
                >
                  挑战
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 战斗记录 */}
        <div className={styles.logPanel}>
          <h3>战斗记录</h3>
          <div className={styles.battleLog}>
            {battleLog.length === 0 ? (
              <div className={styles.emptyLog}>暂无战斗记录</div>
            ) : (
              battleLog.map((log, idx) => (
                <div key={idx} className={styles.logItem}>
                  <span className={log.result === '胜利' ? styles.winText : styles.loseText}>
                    {log.result}
                  </span>
                  <span className={styles.logReward}>{log.reward}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ArenaPanel.displayName = 'ArenaPanel';

export default ArenaPanel;
