/**
 * 竞技场面板 - ArenaPanel
 * 竞技场对战系统前端组件
 */
import React, { useState, useEffect, useCallback } from 'react';

// ==================== 类型定义 ====================

export interface ArenaOpponent {
  name: string;
  level: number;
  power: number;
  walletAddress: string;
}

export interface ArenaInfo {
  myRank: number;
  score: number;
  winCount: number;
  loseCount: number;
  challengeTimes: number;
  maxTimes: number;
  userName: string;
  userLevel: number;
  opponents: ArenaOpponent[];
}

export interface ChallengeResult {
  result: 'win' | 'lose';
  myPower: number;
  oppPower: number;
  scoreChange: number;
  newScore: number;
  newRank: number;
  reward: {
    gold: number;
    exp: number;
  };
  myName: string;
  oppName: string;
}

export interface ArenaRecord {
  id: string;
  opponentName: string;
  result: 'win' | 'lose';
  scoreChange: number;
  timestamp: string;
}

export interface ArenaReward {
  dailyReward: {
    gold: number;
    exp: number;
    rankBonus: number;
  };
  seasonReward: {
    rank: number;
    gold: number;
    exp: number;
    title: string;
  } | null;
}

// ==================== API 函数 ====================

const BASE_URL = '/api';

async function fetchArenaInfo(): Promise<ArenaInfo | null> {
  try {
    const res = await fetch(`${BASE_URL}/arena/info`, {
      credentials: 'include',
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.error('fetchArenaInfo error:', err);
    return null;
  }
}

async function fetchChallengeResult(opponentAddress: string): Promise<ChallengeResult | null> {
  try {
    const res = await fetch(`${BASE_URL}/arena/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ opponentAddress }),
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.error('fetchChallengeResult error:', err);
    return null;
  }
}

async function fetchArenaRecords(): Promise<ArenaRecord[]> {
  try {
    const res = await fetch(`${BASE_URL}/arena/record`, {
      credentials: 'include',
    });
    const json = await res.json();
    if (json.success && Array.isArray(json.data?.records)) {
      return json.data.records;
    }
    return [];
  } catch (err) {
    console.error('fetchArenaRecords error:', err);
    return [];
  }
}

async function fetchArenaReward(): Promise<ArenaReward | null> {
  try {
    const res = await fetch(`${BASE_URL}/arena/reward`, {
      credentials: 'include',
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.error('fetchArenaReward error:', err);
    return null;
  }
}

// ==================== 子组件 ====================

interface OpponentCardProps {
  opponent: ArenaOpponent;
  onChallenge: (addr: string) => void;
  disabled: boolean;
  isChallenging: boolean;
  challengingAddr: string;
}

const OpponentCard: React.FC<OpponentCardProps> = ({
  opponent,
  onChallenge,
  disabled,
  isChallenging,
  challengingAddr,
}) => {
  const isBusy = isChallenging && challengingAddr === opponent.walletAddress;

  return (
    <div className="dashboard-card" style={{ minWidth: 200 }}>
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 8px',
            fontSize: 24,
            border: '2px solid #f87171',
            boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
          }}
        >
          ⚔️
        </div>
        <div className="hero-name">{opponent.name}</div>
        <div style={{ fontSize: 14, color: '#aaa' }}>等级 {opponent.level}</div>
      </div>
      <div style={{ fontSize: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#aaa' }}>战力</span>
          <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{opponent.power.toLocaleString()}</span>
        </div>
      </div>
      <button
        className="building-action"
        style={{
          width: '100%',
          background: disabled ? '#666' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        }}
        disabled={disabled || isBusy}
        onClick={() => onChallenge(opponent.walletAddress)}
      >
        {isBusy ? '挑战中...' : '挑战'}
      </button>
    </div>
  );
};

interface ChallengeResultModalProps {
  result: ChallengeResult;
  onClose: () => void;
}

const ChallengeResultModal: React.FC<ChallengeResultModalProps> = ({ result, onClose }) => {
  const isWin = result.result === 'win';

  return (
    <div className="game-over-overlay" onClick={onClose}>
      <div className="game-over-content arena-result-modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>
          {isWin ? '🏆' : '💀'}
        </div>
        <h2 style={{ color: isWin ? '#ffd700' : '#ef4444', marginBottom: 20, fontSize: 28 }}>
          {isWin ? '挑战胜利!' : '挑战失败'}
        </h2>

        <div style={{ textAlign: 'left', marginBottom: 20, fontSize: 14 }}>
          <div className="city-info-item" style={{ marginBottom: 8 }}>
            <span className="city-info-label">我方战力</span>
            <span className="city-info-value">{result.myPower.toLocaleString()}</span>
          </div>
          <div className="city-info-item" style={{ marginBottom: 8 }}>
            <span className="city-info-label">敌方战力</span>
            <span className="city-info-value" style={{ color: '#ef4444' }}>
              {result.oppPower.toLocaleString()}
            </span>
          </div>
          <div className="city-info-item" style={{ marginBottom: 8 }}>
            <span className="city-info-label">分数变化</span>
            <span
              className="city-info-value"
              style={{ color: result.scoreChange >= 0 ? '#4ade80' : '#ef4444' }}
            >
              {result.scoreChange >= 0 ? '+' : ''}{result.scoreChange}
            </span>
          </div>
          <div className="city-info-item" style={{ marginBottom: 8 }}>
            <span className="city-info-label">新分数</span>
            <span className="city-info-value">{result.newScore}</span>
          </div>
          <div className="city-info-item" style={{ marginBottom: 8 }}>
            <span className="city-info-label">新排名</span>
            <span className="city-info-value" style={{ color: '#87ceeb' }}>#{result.newRank}</span>
          </div>
          {isWin && result.reward.gold > 0 && (
            <div className="city-info-item">
              <span className="city-info-label">获得奖励</span>
              <span className="city-info-value" style={{ color: '#4ade80' }}>
                💰{result.reward.gold} +{result.reward.exp}经验
              </span>
            </div>
          )}
        </div>

        <button
          className="building-action"
          style={{ background: '#4ade80', padding: '10px 30px', fontSize: 14 }}
          onClick={onClose}
        >
          确定
        </button>
      </div>
    </div>
  );
};

interface RecordItemProps {
  record: ArenaRecord;
}

const RecordItem: React.FC<RecordItemProps> = ({ record }) => {
  const isWin = record.result === 'win';
  return (
    <div
      className="city-info-item"
      style={{ marginBottom: 6, flexWrap: 'wrap', gap: 8 }}
    >
      <span
        style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 12,
          background: isWin ? '#4ade80' : '#ef4444',
          color: '#000',
          fontWeight: 'bold',
        }}
      >
        {isWin ? '胜' : '负'}
      </span>
      <span style={{ color: '#87ceeb', fontSize: 13 }}>vs {record.opponentName}</span>
      <span
        style={{
          color: record.scoreChange >= 0 ? '#4ade80' : '#ef4444',
          fontSize: 12,
          marginLeft: 'auto',
        }}
      >
        {record.scoreChange >= 0 ? '+' : ''}{record.scoreChange}
      </span>
      <span style={{ color: '#666', fontSize: 11 }}>
        {new Date(record.timestamp).toLocaleString('zh-CN')}
      </span>
    </div>
  );
};

// ==================== 主组件 ====================

export const ArenaPanel: React.FC = () => {
  const [arenaInfo, setArenaInfo] = useState<ArenaInfo | null>(null);
  const [records, setRecords] = useState<ArenaRecord[]>([]);
  const [reward, setReward] = useState<ArenaReward | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'challenge' | 'record' | 'reward'>('challenge');
  const [challengingAddr, setChallengingAddr] = useState('');
  const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [info, recs, rw] = await Promise.all([
        fetchArenaInfo(),
        fetchArenaRecords(),
        fetchArenaReward(),
      ]);
      setArenaInfo(info);
      setRecords(recs);
      setReward(rw);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChallenge = async (opponentAddress: string) => {
    if (!arenaInfo || arenaInfo.challengeTimes <= 0) return;
    setChallengingAddr(opponentAddress);
    setError(null);

    const result = await fetchChallengeResult(opponentAddress);
    setChallengingAddr('');

    if (result) {
      setChallengeResult(result);
      // 刷新数据
      await loadData();
    } else {
      setError('挑战失败，请重试');
    }
  };

  const winRate =
    arenaInfo
      ? arenaInfo.winCount + arenaInfo.loseCount > 0
        ? Math.round((arenaInfo.winCount / (arenaInfo.winCount + arenaInfo.loseCount)) * 100)
        : 0
      : 0;

  return (
    <div className="battle-panel">
      {/* 顶部标题栏 */}
      <div
        className="arena-info-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        }}
      >
        <h2 style={{ color: '#ffd700', margin: 0 }}>⚔️ 竞技场</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {arenaInfo && (
            <>
              <span style={{ color: '#87ceeb', fontSize: 13 }}>
                🏆 排名 #{arenaInfo.myRank}
              </span>
              <span style={{ color: '#ffd700', fontSize: 13 }}>
                💎 {arenaInfo.score} 分
              </span>
              <span
                style={{
                  color: arenaInfo.challengeTimes > 0 ? '#4ade80' : '#ef4444',
                  fontSize: 13,
                }}
              >
                ⚡ 剩余 {arenaInfo.challengeTimes}/{arenaInfo.maxTimes} 次
              </span>
            </>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            borderRadius: 8,
            padding: '10px 15px',
            marginBottom: 15,
            color: '#ef4444',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && !arenaInfo && (
        <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
          加载中...
        </div>
      )}

      {/* 无数据 */}
      {!isLoading && !arenaInfo && !error && (
        <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏟️</div>
          <p>暂无竞技场数据</p>
          <button className="building-action" onClick={loadData}>
            刷新
          </button>
        </div>
      )}

      {/* 竞技场信息 */}
      {arenaInfo && (
        <>
          {/* 玩家状态卡片 */}
          <div className="dashboard-card arena-player-card" style={{ marginBottom: 15 }}>
            <div className="arena-player-stats" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>玩家</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                  {arenaInfo.userName}
                </div>
                <div style={{ fontSize: 12, color: '#87ceeb' }}>等级 {arenaInfo.userLevel}</div>
              </div>
              <div style={{ flex: 1, minWidth: 100 }}>
                <div style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>排名</div>
                <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: 20 }}>#{arenaInfo.myRank}</div>
              </div>
              <div style={{ flex: 1, minWidth: 100 }}>
                <div style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>积分</div>
                <div style={{ color: '#87ceeb', fontWeight: 'bold', fontSize: 20 }}>
                  {arenaInfo.score}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 100 }}>
                <div style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>胜率</div>
                <div
                  style={{
                    color: winRate >= 50 ? '#4ade80' : '#ef4444',
                    fontWeight: 'bold',
                    fontSize: 20,
                  }}
                >
                  {winRate}%
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 100 }}>
                <div style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>战绩</div>
                <div style={{ fontSize: 14 }}>
                  <span style={{ color: '#4ade80' }}>{arenaInfo.winCount}胜</span>
                  <span style={{ color: '#aaa', margin: '0 4px' }}>|</span>
                  <span style={{ color: '#ef4444' }}>{arenaInfo.loseCount}负</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 100 }}>
                <div style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>剩余挑战</div>
                <div
                  style={{
                    color: arenaInfo.challengeTimes > 0 ? '#4ade80' : '#ef4444',
                    fontWeight: 'bold',
                    fontSize: 20,
                  }}
                >
                  {arenaInfo.challengeTimes}
                </div>
              </div>
            </div>
          </div>

          {/* Tab 导航 */}
          <div
            className="arena-tabs"
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 15,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: 10,
            }}
          >
            {(['challenge', 'record', 'reward'] as const).map(tab => (
              <button
                key={tab}
                className="building-action"
                style={{
                  background: activeTab === tab ? '#ffd700' : 'rgba(255,255,255,0.1)',
                  color: activeTab === tab ? '#000' : '#aaa',
                  fontSize: 13,
                  padding: '6px 16px',
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'challenge' ? '⚔️ 挑战' : tab === 'record' ? '📜 记录' : '🎁 奖励'}
              </button>
            ))}
          </div>

          {/* 挑战列表 */}
          {activeTab === 'challenge' && (
            <div>
              <div
                style={{
                  fontSize: 14,
                  color: '#aaa',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>选择对手发起挑战</span>
                {arenaInfo.challengeTimes <= 0 && (
                  <span style={{ color: '#ef4444' }}>—— 今日挑战次数已用完</span>
                )}
              </div>
              <div className="hero-list arena-opponent-list">
                {arenaInfo.opponents.map(opp => (
                  <OpponentCard
                    key={opp.walletAddress}
                    opponent={opp}
                    onChallenge={handleChallenge}
                    disabled={arenaInfo.challengeTimes <= 0}
                    isChallenging={!!challengingAddr}
                    challengingAddr={challengingAddr}
                  />
                ))}
                {arenaInfo.opponents.length === 0 && (
                  <div style={{ color: '#aaa', textAlign: 'center', padding: 20 }}>
                    暂无可挑战的对手
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 挑战记录 */}
          {activeTab === 'record' && (
            <div className="dashboard-card">
              <div className="dashboard-card-title">📜 挑战记录</div>
              <div className="dashboard-card-content">
                {records.length === 0 ? (
                  <div style={{ color: '#aaa', textAlign: 'center', padding: 20 }}>
                    暂无挑战记录
                  </div>
                ) : (
                  records.map(rec => <RecordItem key={rec.id} record={rec} />)
                )}
              </div>
            </div>
          )}

          {/* 奖励信息 */}
          {activeTab === 'reward' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {reward?.dailyReward && (
                <div className="dashboard-card">
                  <div className="dashboard-card-title">🎁 每日奖励</div>
                  <div className="dashboard-card-content">
                    <div className="city-info-item" style={{ marginBottom: 8 }}>
                      <span className="city-info-label">金币奖励</span>
                      <span className="city-info-value" style={{ color: '#ffd700' }}>
                        💰 {reward.dailyReward.gold}
                      </span>
                    </div>
                    <div className="city-info-item" style={{ marginBottom: 8 }}>
                      <span className="city-info-label">经验奖励</span>
                      <span className="city-info-value" style={{ color: '#87ceeb' }}>
                        ✨ {reward.dailyReward.exp}
                      </span>
                    </div>
                    <div className="city-info-item">
                      <span className="city-info-label">排名加成</span>
                      <span className="city-info-value" style={{ color: '#4ade80' }}>
                        ×{reward.dailyReward.rankBonus}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {reward?.seasonReward && (
                <div className="dashboard-card">
                  <div className="dashboard-card-title">🏆 赛季奖励</div>
                  <div className="dashboard-card-content">
                    <div className="city-info-item" style={{ marginBottom: 8 }}>
                      <span className="city-info-label">当前排名</span>
                      <span className="city-info-value" style={{ color: '#ffd700' }}>
                        #{reward.seasonReward.rank}
                      </span>
                    </div>
                    <div className="city-info-item" style={{ marginBottom: 8 }}>
                      <span className="city-info-label">称号</span>
                      <span className="city-info-value" style={{ color: '#87ceeb' }}>
                        {reward.seasonReward.title}
                      </span>
                    </div>
                    <div className="city-info-item" style={{ marginBottom: 8 }}>
                      <span className="city-info-label">金币奖励</span>
                      <span className="city-info-value" style={{ color: '#ffd700' }}>
                        💰 {reward.seasonReward.gold}
                      </span>
                    </div>
                    <div className="city-info-item">
                      <span className="city-info-label">经验奖励</span>
                      <span className="city-info-value" style={{ color: '#87ceeb' }}>
                        ✨ {reward.seasonReward.exp}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {!reward && (
                <div style={{ color: '#aaa', textAlign: 'center', padding: 20 }}>
                  暂无奖励信息
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 挑战结果弹窗 */}
      {challengeResult && (
        <ChallengeResultModal
          result={challengeResult}
          onClose={() => setChallengeResult(null)}
        />
      )}
    </div>
  );
};

export default ArenaPanel;
