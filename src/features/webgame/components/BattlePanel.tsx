/**
 * BattlePanel - 战斗面板
 * 原则：移动端优先，简洁设计
 */
import React, { useState } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';

interface BattlePanelProps {
}

export const BattlePanel: React.FC<BattlePanelProps> = () => {
  const [battleType, setBattleType] = useState<'pve' | 'pvp'>('pve');
  const [battleLog, setBattleLog] = useState<string[]>([]);

  const startBattle = async () => {
    const log = [
      `[${new Date().toLocaleTimeString()}] 战斗开始...`,
      `[${new Date().toLocaleTimeString()}] 敌方: 初级山贼`,
      `[${new Date().toLocaleTimeString()}] 我方: 弓兵 x10`,
      `[${new Date().toLocaleTimeString()}] 战斗进行中...`,
    ];
    setBattleLog(log);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* 标题 */}
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-emerald-400 
                     tracking-wider uppercase">
        BATTLE
      </h1>

      {/* 战斗类型选择 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setBattleType('pve')}
          className={`
            p-4 rounded-lg border-2 transition-all duration-200
            ${battleType === 'pve' 
              ? 'border-emerald-500 bg-emerald-500/10' 
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }
          `}
        >
          <div className="text-3xl mb-2">🏰</div>
          <div className={`font-bold ${battleType === 'pve' ? 'text-emerald-400' : 'text-slate-400'}`}>
            PVE
          </div>
          <div className="text-xs text-slate-500 mt-1">副本挑战</div>
        </button>
        
        <button
          onClick={() => setBattleType('pvp')}
          className={`
            p-4 rounded-lg border-2 transition-all duration-200
            ${battleType === 'pvp' 
              ? 'border-red-500 bg-red-500/10' 
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }
          `}
        >
          <div className="text-3xl mb-2">⚔️</div>
          <div className={`font-bold ${battleType === 'pvp' ? 'text-red-400' : 'text-slate-400'}`}>
            PVP
          </div>
          <div className="text-xs text-slate-500 mt-1">竞技挑战</div>
        </button>
      </div>

      {/* 战斗统计 */}
      <GameCard title={battleType === 'pve' ? '副本挑战' : '竞技场'} className="mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400">0</div>
            <div className="text-xs text-slate-500 uppercase mt-1">胜利</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-red-400">0</div>
            <div className="text-xs text-slate-500 uppercase mt-1">失败</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-amber-400">0</div>
            <div className="text-xs text-slate-500 uppercase mt-1">连胜</div>
          </div>
        </div>
      </GameCard>

      {/* 挑战按钮 */}
      <GameButton fullWidth size="lg" onClick={startBattle} className="mb-6">
        {battleType === 'pve' ? '挑战副本' : '挑战对手'}
      </GameButton>

      {/* 战斗记录 */}
      {battleLog.length > 0 && (
        <GameCard title="战斗记录" className="mb-6">
          <div className="h-40 overflow-y-auto bg-slate-900/50 rounded-lg p-3
                         scrollbar-thin scrollbar-thumb-slate-600">
            {battleLog.map((log, index) => (
              <div key={index} className="text-xs text-slate-400 font-mono mb-1">
                {log}
              </div>
            ))}
          </div>
        </GameCard>
      )}

      {/* 列表标题 */}
      <div className="flex items-center gap-3 mb-4 text-emerald-400 font-mono text-base uppercase tracking-wider">
        <span>{battleType === 'pve' ? '可挑战副本' : '排行榜'}</span>
        <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
      </div>

      {/* 列表网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="flex items-center gap-3 p-4 bg-slate-800/60 border border-slate-700 
                       rounded-lg hover:border-emerald-500/50 transition-all duration-200 cursor-pointer"
          >
            <div className="text-2xl">
              {battleType === 'pve' ? '🏰' : '🏆'}
            </div>
            <div className="flex-1">
              <div className="text-emerald-400 font-medium">
                {battleType === 'pve' ? `副本 ${i}` : `排名 #${i}`}
              </div>
              <div className="text-xs text-slate-500">
                {battleType === 'pve' ? '初级难度' : '战绩 10-0'}
              </div>
            </div>
            <GameButton size="small" variant="secondary">
              挑战
            </GameButton>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BattlePanel;
