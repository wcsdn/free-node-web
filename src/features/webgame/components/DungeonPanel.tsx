/**
 * DungeonPanel - 副本面板
 * 原则：移动端优先，简洁设计
 */
import React, { useState } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';

interface Dungeon {
  id: number;
  name: string;
  difficulty: number;
  reward: string;
  bestTime?: number;
}

interface DungeonPanelProps {
}

const DIFFICULTY_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500' },
  2: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500' },
  3: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500' },
  4: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500' },
  5: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500' },
};

export const DungeonPanel: React.FC<DungeonPanelProps> = () => {
  const [dungeons] = useState<Dungeon[]>([
    { id: 1, name: '新手森林', difficulty: 1, reward: '大量经验', bestTime: 120 },
    { id: 2, name: '废弃矿坑', difficulty: 2, reward: '装备材料', bestTime: 180 },
    { id: 3, name: '幽暗洞穴', difficulty: 3, reward: '稀有道具' },
    { id: 4, name: '远古遗迹', difficulty: 5, reward: '传说装备' },
  ]);

  const formatTime = (seconds?: number) => {
    if (!seconds) return null;
    return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* 标题 */}
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-emerald-400 
                     tracking-wider uppercase">
        DUNGEON
      </h1>

      {/* 介绍 */}
      <GameCard title="副本挑战" className="mb-6">
        <p className="text-slate-400 text-sm">
          挑战副本，获取丰厚奖励！
        </p>
      </GameCard>

      {/* 副本列表 */}
      <div className="space-y-4">
        {dungeons.map((d) => {
          const colors = DIFFICULTY_COLORS[d.difficulty] || DIFFICULTY_COLORS[1];
          
          return (
            <div
              key={d.id}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200
                ${colors.bg} ${colors.border}
                hover:shadow-lg hover:shadow-${colors.text.replace('text-', '')}/20
              `}
            >
              <div className="flex items-start gap-4">
                {/* 图标 */}
                <div className="text-4xl flex-shrink-0">🏰</div>

                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`font-bold ${colors.text}`}>{d.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                      难度 {d.difficulty}
                    </span>
                  </div>

                  {/* 难度星级 */}
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span 
                        key={i} 
                        className={`text-sm ${i < d.difficulty ? colors.text : 'text-slate-600'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  {/* 奖励 */}
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <span>🎁</span>
                    <span>{d.reward}</span>
                  </div>

                  {/* 最佳时间 */}
                  {d.bestTime && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>⏱️</span>
                      <span>最佳: {formatTime(d.bestTime)}</span>
                    </div>
                  )}
                </div>

                {/* 挑战按钮 */}
                <GameButton 
                  variant={d.difficulty >= 4 ? 'danger' : 'primary'}
                  className="flex-shrink-0"
                >
                  挑战
                </GameButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DungeonPanel;
