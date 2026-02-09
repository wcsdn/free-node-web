/**
 * HeroPanel - 武将面板
 * 原则：移动端优先，简洁设计
 */
import React, { useState, useEffect } from 'react';
import { GameButton } from '@/shared/components/game';
import { getApiBase, getAuthHeaders } from '../utils/api';
import './panel-styles.css';

interface Hero {
  id: number;
  name: string;
  quality: number;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  skill?: string;
}

// 品质颜色
const QUALITY_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
  2: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  3: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  4: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  5: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
};

const QUALITY_NAMES: Record<number, string> = {
  1: '普通',
  2: '优秀',
  3: '精良',
  4: '史诗',
  5: '传说',
};

export const HeroPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiBase()}/api/hero/list`, {
      headers: getAuthHeaders(),
    }).then(res => res.json()).then(data => {
      if (data.success) setHeroes(data.data || []);
      setLoading(false);
    });
  }, []);

  const handleRecruit = async () => {
    await fetch(`${getApiBase()}/api/hero/recruit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ city_id: 1 }),
    });
    window.location.reload();
  };

  const handleLevelUp = async (heroId: number) => {
    await fetch(`${getApiBase()}/api/hero/${heroId}/levelup`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-emerald-400">⚔️ 武将</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* 武将列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <span className="ml-2">加载中...</span>
            </div>
          ) : heroes.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">⚔️</div>
              <p className="text-slate-500 mb-4">暂无武将</p>
              <GameButton onClick={handleRecruit}>招募武将</GameButton>
            </div>
          ) : (
            <div className="space-y-4">
              {heroes.map((hero) => {
                const quality = QUALITY_COLORS[hero.quality] || QUALITY_COLORS[1];
                return (
                  <div
                    key={hero.id}
                    className={`p-4 rounded-xl border ${quality.border} ${quality.bg}`}
                  >
                    {/* 头部 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${quality.bg} flex items-center justify-center text-2xl`}>
                          ⚔️
                        </div>
                        <div>
                          <div className={`font-bold ${quality.text}`}>{hero.name}</div>
                          <div className="text-xs text-slate-500">Lv.{hero.level}</div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${quality.bg} ${quality.text}`}>
                        {QUALITY_NAMES[hero.quality]}
                      </span>
                    </div>

                    {/* 属性 */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500">⚔️</span>
                        <span className="text-slate-300">攻击: <span className="text-amber-400">{hero.atk}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500">🛡️</span>
                        <span className="text-slate-300">防御: <span className="text-blue-400">{hero.def}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm col-span-2">
                        <span className="text-slate-500">❤️</span>
                        <span className="text-slate-300">生命: <span className="text-red-400">{hero.hp}/{hero.maxHp}</span></span>
                      </div>
                      {hero.skill && (
                        <div className="flex items-center gap-2 text-sm col-span-2">
                          <span className="text-slate-500">✨</span>
                          <span className="text-slate-300">技能: <span className="text-emerald-400">{hero.skill}</span></span>
                        </div>
                      )}
                    </div>

                    {/* 操作 */}
                    <GameButton
                      size="sm"
                      fullWidth
                      onClick={() => handleLevelUp(hero.id)}
                    >
                      升级
                    </GameButton>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="p-4 border-t border-slate-700 flex gap-3">
          <GameButton fullWidth onClick={handleRecruit}>
            招募武将
          </GameButton>
          <GameButton variant="red" fullWidth onClick={onClose}>
            关闭
          </GameButton>
        </div>
      </div>
    </div>
  );
};

export default HeroPanel;
