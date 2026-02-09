/**
 * RankingPanel - 排行榜面板
 * 原则：移动端优先，简洁设计
 */
import React, { useState } from 'react';
import { GameCard } from '@/shared/components/game';

interface RankItem {
  rank: number;
  name: string;
  value: number;
  level: number;
}

interface RankingPanelProps {
  walletAddress: string;
}

type TabType = 'level' | 'power' | 'wealth';

export const RankingPanel: React.FC<RankingPanelProps> = () => {
  const [tab, setTab] = useState<TabType>('power');
  
  const rankings: RankItem[] = [
    { rank: 1, name: '玩家_A', value: 10000, level: 50 },
    { rank: 2, name: '玩家_B', value: 9500, level: 48 },
    { rank: 3, name: '玩家_C', value: 9000, level: 45 },
    { rank: 4, name: '玩家_D', value: 8500, level: 42 },
    { rank: 5, name: '我', value: 5000, level: 25 },
  ];

  const getTabIcon = (t: TabType) => ({ level: '⚔️', power: '💪', wealth: '🪙' }[t]);
  const getTabName = (t: TabType) => ({ level: '等级榜', power: '战力榜', wealth: '财富榜' }[t]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* 标题 */}
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-emerald-400 
                     tracking-wider uppercase">
        RANKING
      </h1>

      {/* 分类切换 */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {(['level', 'power', 'wealth'] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`
              flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all duration-200
              ${tab === t 
                ? 'border-emerald-500 bg-emerald-500/10' 
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }
            `}
          >
            <span className="text-xl">{getTabIcon(t)}</span>
            <span className={`text-xs font-medium ${tab === t ? 'text-emerald-400' : 'text-slate-400'}`}>
              {getTabName(t)}
            </span>
          </button>
        ))}
      </div>

      {/* 我的排名 */}
      <GameCard title="我的排名" className="mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-2xl">
            ⚔️
          </div>
          <div className="flex-1">
            <div className="text-emerald-400 font-semibold">我</div>
            <div className="text-slate-500 text-sm">
              排名 #{5} · 战力 5000
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-500">#5</div>
        </div>
      </GameCard>

      {/* 排行榜列表 */}
      <div className="space-y-2">
        {rankings.map((item) => (
          <div
            key={item.rank}
            className={`
              flex items-center gap-3 p-3 rounded-lg transition-all duration-200
              ${item.rank <= 3 
                ? 'bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/30' 
                : 'bg-slate-800/40 border border-slate-700/50'
              }
            `}
          >
            {/* 排名徽章 */}
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${item.rank <= 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}
            `}>
              {getRankBadge(item.rank)}
            </div>

            {/* 玩家信息 */}
            <div className="flex-1 min-w-0">
              <div className="text-emerald-400 font-medium truncate">
                {item.name}
              </div>
              <div className="text-xs text-slate-500">
                Lv.{item.level}
              </div>
            </div>

            {/* 数值 */}
            <div className="text-lg font-bold text-amber-400">
              {item.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RankingPanel;
