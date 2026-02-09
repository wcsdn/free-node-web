/**
 * DefensePanel - 城防面板
 * 原则：移动端优先，简洁设计
 */
import React, { useState } from 'react';
import { GameCard, GameButton, GameModal } from '@/shared/components/game';

interface Defense {
  id: number;
  name: string;
  level: number;
  count: number;
  defense: number;
}

interface DefensePanelProps {
}

const DEFENSE_ICONS: Record<string, string> = {
  '城墙': '🧱',
  '箭塔': '🏹',
  '拒马': '⚓',
  '烽火台': '🔥',
  '城门': '🚪',
};

export const DefensePanel: React.FC<DefensePanelProps> = () => {
  const [defenses] = useState<Defense[]>([
    { id: 1, name: '城墙', level: 5, count: 1, defense: 500 },
    { id: 2, name: '箭塔', level: 3, count: 4, defense: 120 },
    { id: 3, name: '拒马', level: 2, count: 8, defense: 80 },
  ]);
  const [selected, setSelected] = useState<Defense | null>(null);

  const totalDefense = defenses.reduce((sum, d) => sum + d.defense * d.count, 0);

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* 标题 */}
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-emerald-400 
                     tracking-wider uppercase">
        DEFENSE
      </h1>

      {/* 城防总览 */}
      <GameCard title="城防总览" className="mb-6">
        <div className="text-center p-4 bg-gradient-to-r from-emerald-500/10 to-slate-800/50 rounded-lg">
          <div className="text-slate-400 text-sm uppercase mb-2">总城防</div>
          <div className="text-4xl font-bold text-emerald-400">
            {totalDefense.toLocaleString()}
          </div>
        </div>
      </GameCard>

      {/* 城防设施标题 */}
      <div className="flex items-center gap-3 mb-4 text-emerald-400 font-mono text-base uppercase tracking-wider">
        <span>城防设施</span>
        <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
      </div>

      {/* 城防设施列表 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {defenses.map((d) => (
          <div
            key={d.id}
            onClick={() => setSelected(d)}
            className="flex items-center gap-3 p-4 bg-slate-800/60 border border-slate-700 rounded-lg
                       cursor-pointer hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10
                       transition-all duration-200 active:scale-[0.98]"
          >
            {/* 图标 */}
            <div className="text-3xl flex-shrink-0">
              {DEFENSE_ICONS[d.name] || '🛡️'}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="text-emerald-400 font-medium truncate">
                {d.name}
              </div>
              <div className="text-xs text-slate-500">
                Lv.{d.level} × {d.count}
              </div>
            </div>

            {/* 防御值 */}
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-emerald-400">
                {(d.defense * d.count).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">🛡️</div>
            </div>
          </div>
        ))}
      </div>

      {/* 详情弹窗 */}
      <GameModal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.name || ''} size="small">
        {selected && (
          <div className="space-y-4">
            {/* 头部 */}
            <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
              <div className="text-4xl">
                {DEFENSE_ICONS[selected.name] || '🛡️'}
              </div>
              <div>
                <h3 className="text-emerald-400 font-semibold text-lg">{selected.name}</h3>
                <p className="text-slate-500 text-sm">Lv.{selected.level}</p>
              </div>
            </div>

            {/* 统计 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-800/30 rounded-lg text-center">
                <div className="text-xl font-bold text-emerald-400">{selected.count}</div>
                <div className="text-xs text-slate-500 uppercase">数量</div>
              </div>
              <div className="p-3 bg-slate-800/30 rounded-lg text-center">
                <div className="text-xl font-bold text-emerald-400">{selected.defense}</div>
                <div className="text-xs text-slate-500 uppercase">单防</div>
              </div>
            </div>

            {/* 总防御 */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {(selected.defense * selected.count).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 uppercase">总防御</div>
            </div>

            {/* 操作 */}
            <GameButton fullWidth variant="secondary">
              升级
            </GameButton>
          </div>
        )}
      </GameModal>
    </div>
  );
};

export default DefensePanel;
