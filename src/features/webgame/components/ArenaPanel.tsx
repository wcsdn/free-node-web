/**
 * 竞技场面板组件
 * 原则：移动端优先，简洁设计
 */
import React, { useState, useEffect, memo } from 'react';
import { gameApi } from '../services/gameApi';
import { GameCard } from '@/shared/components/game';
import { getApiBase } from '../utils/api';

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
  onClose?: () => void;
}

const ArenaPanel: React.FC<ArenaPanelProps> = memo(({ walletAddress }) => {
  const [myRank] = useState(0);
  const [myPower] = useState(0);
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
      const res = await fetch(`${getApiBase()}/api/arena/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opponent_id: opponent.wallet_address }),
      });
      const data = await res.json();
      if (data.success) {
        const result = data.data?.win ? '胜利' : '失败';
        const exp = data.data?.rewards?.exp || 0;
        const gold = data.data?.rewards?.gold || 0;
        const reward = data.data?.win ? `经验+${exp} 金币+${gold}` : `经验+${Math.floor(exp/3)}`;
        const logItem: BattleLogItem = {
          result,
          reward,
          opponent: data.data?.report?.opponent || opponent.name,
          time: new Date().toLocaleString(),
        };
        setBattleLog([logItem, ...battleLog].slice(0, 10));
        setMessage(`${result}！${reward}`);
      } else {
        setMessage(data.error || '挑战失败');
      }
    } catch (err) {
      setMessage('挑战失败');
    } finally {
      setChallenging(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-emerald-400 tracking-wider uppercase">
          竞技场
        </h1>
        <div className="flex gap-4 text-sm">
          <span className="px-3 py-1 bg-slate-800 rounded-full text-slate-300">
            排名: <span className="text-emerald-400 font-bold">#{myRank}</span>
          </span>
          <span className="px-3 py-1 bg-slate-800 rounded-full text-slate-300">
            战力: <span className="text-amber-400 font-bold">{myPower}</span>
          </span>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          message.includes('胜利') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message}
        </div>
      )}

      {/* 内容区域 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 对手列表 */}
        <GameCard title="挑战对手" className="lg:sticky lg:top-4 h-fit">
          {opponents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              暂无对手
            </div>
          ) : (
            <div className="space-y-3">
              {opponents.map((opponent) => (
                <div
                  key={opponent.wallet_address}
                  className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-all"
                >
                  {/* 排名/AI标识 */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    opponent.isAi ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {opponent.isAi ? 'AI' : '#?'}
                  </div>

                  {/* 对手信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-400 truncate">{opponent.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-400">
                        Lv.{opponent.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>⚔️ {opponent.win_count || 0} 胜场</span>
                    </div>
                  </div>

                  {/* 挑战按钮 */}
                  <button
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      challenging
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30'
                    }`}
                    onClick={() => handleChallenge(opponent)}
                    disabled={challenging}
                  >
                    {challenging ? '挑战中...' : '挑战'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </GameCard>

        {/* 战斗记录 */}
        <GameCard title="战斗记录">
          {battleLog.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-2">⚔️</div>
              <p>暂无战斗记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {battleLog.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg"
                >
                  <span className={`font-bold text-sm ${
                    log.result === '胜利' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {log.result}
                  </span>
                  <span className="flex-1 text-slate-400 text-sm truncate">
                    vs {log.opponent}
                  </span>
                  <span className="text-xs text-amber-400">
                    {log.reward}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GameCard>
      </div>
    </div>
  );
});

ArenaPanel.displayName = 'ArenaPanel';

export default ArenaPanel;
