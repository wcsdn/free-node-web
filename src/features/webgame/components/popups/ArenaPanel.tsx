import React, { useState, useEffect } from 'react';
import gameApi from '../../services/gameApi';
import styles from './ArenaPanel.module.css';

interface ArenaPanelProps {
  onClose: () => void;
}

interface ArenaData {
  rank: number;
  score: number;
  winCount: number;
  totalCount: number;
  rankings: Array<{
    wallet_address: string;
    name: string;
    level: number;
    power: number;
  }>;
  recentRecords: Array<{
    id: number;
    opponent_name: string;
    result: string;
    reward: number;
    created_at: string;
  }>;
}

export const ArenaPanel: React.FC<ArenaPanelProps> = ({ onClose }) => {
  const [arenaData, setArenaData] = useState<ArenaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rank' | 'challenge' | 'record'>('rank');

  useEffect(() => {
    loadArenaData();
  }, []);

  const loadArenaData = async () => {
    try {
      setLoading(true);
      const res = await gameApi.getArenaInfo();
      if (res.success && res.data) {
        setArenaData(res.data as ArenaData);
      }
    } catch (error) {
      console.error('加载竞技场数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChallenge = async () => {
    try {
      const res = await gameApi.arenaChallenge('0x0000000000000000000000000000000000000001');
      if (res.success) {
        alert(res.data?.message || '战斗完成！');
        loadArenaData();
      } else {
        alert(res.error || '挑战失败');
      }
    } catch (error) {
      alert('挑战失败，请稍后重试');
    }
  };

  const getResultText = (result: string) => {
    switch (result) {
      case 'win': return '胜利';
      case 'loss': return '失败';
      default: return result;
    }
  };

  const getResultClass = (result: string) => {
    switch (result) {
      case 'win': return styles.win;
      case 'loss': return styles.loss;
      default: return '';
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>🏟️ 竞技场</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : (
          <>
            {/* 统计信息 */}
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>排名</span>
                <span className={styles.statValue}>#{arenaData?.rank || '-'}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>战功</span>
                <span className={styles.statValue}>{arenaData?.score || 0}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>战绩</span>
                <span className={styles.statValue}>{arenaData?.winCount || 0}胜 {arenaData?.totalCount || 0}负</span>
              </div>
            </div>

            {/* 标签页 */}
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'rank' ? styles.active : ''}`}
                onClick={() => setActiveTab('rank')}
              >
                排行榜
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'challenge' ? styles.active : ''}`}
                onClick={() => setActiveTab('challenge')}
              >
                挑战
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'record' ? styles.active : ''}`}
                onClick={() => setActiveTab('record')}
              >
                战报
              </button>
            </div>

            {/* 内容区域 */}
            <div className={styles.content}>
              {activeTab === 'rank' && (
                <div className={styles.rankList}>
                  {arenaData?.rankings?.map((player, index) => (
                    <div key={player.wallet_address} className={styles.rankItem}>
                      <span className={styles.rankNum}>{index + 1}</span>
                      <span className={styles.playerName}>{player.name}</span>
                      <span className={styles.playerLevel}>等级 {player.level}</span>
                      <span className={styles.playerPower}>战力 {player.power}</span>
                    </div>
                  ))}
                  {(!arenaData?.rankings || arenaData.rankings.length === 0) && (
                    <div className={styles.empty}>暂无排名数据</div>
                  )}
                </div>
              )}

              {activeTab === 'challenge' && (
                <div className={styles.challengeSection}>
                  <div className={styles.challengeInfo}>
                    <p>挑战其他玩家可以获得战功奖励！</p>
                    <p>胜利可获得 50 战功，失败可获得 10 战功</p>
                  </div>
                  <button className={styles.challengeBtn} onClick={handleChallenge}>
                    🎲 随机挑战
                  </button>
                </div>
              )}

              {activeTab === 'record' && (
                <div className={styles.recordList}>
                  {arenaData?.recentRecords?.map((record) => (
                    <div key={record.id} className={`${styles.recordItem} ${getResultClass(record.result)}`}>
                      <span className={styles.opponent}>{record.opponent_name}</span>
                      <span className={styles.result}>{getResultText(record.result)}</span>
                      <span className={styles.reward}>+{record.reward} 战功</span>
                      <span className={styles.time}>
                        {new Date(record.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {(!arenaData?.recentRecords || arenaData.recentRecords.length === 0) && (
                    <div className={styles.empty}>暂无战报</div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ArenaPanel;
