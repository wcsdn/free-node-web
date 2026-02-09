/**
 * MilitaryPanel - 军事面板
 * 原则：移动端优先，简洁设计
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton, GameModal } from '@/shared/components/game';

interface Troop {
  id: number;
  type: string;
  count: number;
  level: number;
}

interface MilitaryPanelProps {
  walletAddress?: string;
}

// 兵种图标
const TROOP_ICONS: Record<string, string> = {
  '弓兵': '🏹',
  '骑兵': '🐎',
  '步兵': '⚔️',
  '攻城': '🧨',
};

// 模拟数据
const MOCK_TROOPS: Troop[] = [
  { id: 1, type: '弓兵', count: 50, level: 3 },
  { id: 2, type: '骑兵', count: 30, level: 2 },
  { id: 3, type: '步兵', count: 100, level: 5 },
];

export const MilitaryPanel: React.FC<MilitaryPanelProps> = () => {
  const [troops, setTroops] = useState<Troop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTroop, setSelectedTroop] = useState<Troop | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 模拟数据加载
    setTroops(MOCK_TROOPS);
    setLoading(false);
  }, []);

  // 统计数据
  const stats = {
    totalTroops: troops.reduce((sum, t) => sum + t.count, 0),
    troopTypes: troops.length,
  };

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-emerald-400 font-mono text-lg animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* 标题 */}
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-emerald-400 
                     tracking-wider uppercase">
        MILITARY
      </h1>

      {/* 军队概览 */}
      <GameCard title="军队概览" className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl">⚔️</div>
            <div>
              <div className="text-xl font-bold text-emerald-400">{stats.totalTroops}</div>
              <div className="text-xs text-slate-500 uppercase">总兵力</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl">🏆</div>
            <div>
              <div className="text-xl font-bold text-emerald-400">{stats.troopTypes}</div>
              <div className="text-xs text-slate-500 uppercase">兵种数</div>
            </div>
          </div>
        </div>
      </GameCard>

      {/* 军队列表标题 */}
      <div className="flex items-center gap-3 mb-4 text-emerald-400 font-mono text-base uppercase tracking-wider">
        <span>军队列表</span>
        <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
      </div>

      {/* 军队列表 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {troops.map((troop) => (
          <div
            key={troop.id}
            onClick={() => { setSelectedTroop(troop); setShowModal(true); }}
            className="flex items-center gap-3 p-4 bg-slate-800/60 border border-slate-700 rounded-lg
                       cursor-pointer hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10
                       transition-all duration-200 active:scale-[0.98]"
          >
            {/* 图标 */}
            <div className="text-3xl flex-shrink-0">
              {TROOP_ICONS[troop.type] || '⚔️'}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="text-emerald-400 font-medium truncate">
                {troop.type}
              </div>
              <div className="text-xs text-slate-500">
                Lv.{troop.level} · {troop.count}人
              </div>
            </div>

            {/* 箭头 */}
            <div className="text-slate-600">›</div>
          </div>
        ))}
      </div>

      {/* 训练按钮 */}
      <GameButton fullWidth>
        训练新兵
      </GameButton>

      {/* 详情弹窗 */}
      <GameModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedTroop?.type || '军队详情'}
        size="small"
      >
        {selectedTroop && (
          <div className="space-y-4">
            {/* 头部 */}
            <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
              <div className="text-4xl">
                {TROOP_ICONS[selectedTroop.type] || '⚔️'}
              </div>
              <div>
                <h3 className="text-emerald-400 font-semibold text-lg">{selectedTroop.type}</h3>
                <p className="text-slate-500 text-sm">Lv.{selectedTroop.level}</p>
              </div>
            </div>

            {/* 统计 */}
            <div className="p-3 bg-slate-800/30 rounded-lg text-center">
              <div className="text-2xl font-bold text-emerald-400">{selectedTroop.count}</div>
              <div className="text-xs text-slate-500 uppercase">当前数量</div>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-2">
              <GameButton variant="secondary" fullWidth>
                调动
              </GameButton>
              <GameButton variant="danger" fullWidth>
                解散
              </GameButton>
            </div>
          </div>
        )}
      </GameModal>
    </div>
  );
};

export default MilitaryPanel;
