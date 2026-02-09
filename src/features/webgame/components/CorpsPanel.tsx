/**
 * 军团面板组件
 * 原则：移动端优先，简洁设计
 */
import React, { useState, useEffect, memo } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import PageLayout from '@/shared/layouts/PageLayout';
import { getApiBase } from '../utils/api';
import { GameCard, GameButton } from '@/shared/components/game';

interface Hero {
  id: number;
  name: string;
  level: number;
  hp: number;
  max_hp: number;
  attack: number;
  defense: number;
  quality: number;
  state: number;
}

interface Corps {
  id: number;
  name: string;
  city_id: number;
  state: number;
  stateText: string;
  heroCount: number;
  totalHp?: number;
  totalAttack?: number;
}

interface CorpsDetail extends Corps {
  heroes: Hero[];
}

interface CorpsPanelProps {
  walletAddress: string;
}

const CorpsPanel: React.FC<CorpsPanelProps> = memo(({ walletAddress }) => {
  const { language } = useLanguage();
  const [corpsList, setCorpsList] = useState<Corps[]>([]);
  const [availableHeroes, setAvailableHeroes] = useState<Hero[]>([]);
  const [selectedCorps, setSelectedCorps] = useState<CorpsDetail | null>(null);
  const [selectedHeroIds, setSelectedHeroIds] = useState<number[]>([]);
  const [createMode, setCreateMode] = useState(false);
  const [newCorpsName, setNewCorpsName] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [marchTarget, setMarchTarget] = useState('');

  const i18n = {
    title: language === 'en' ? 'Corps' : '军团',
    createCorps: language === 'en' ? 'Create Corps' : '创建军团',
    corpsName: language === 'en' ? 'Corps Name' : '军团名称',
    selectHeroes: language === 'en' ? 'Select Heroes' : '选择英雄',
    create: language === 'en' ? 'Create' : '创建',
    cancel: language === 'en' ? 'Cancel' : '取消',
    myCorps: language === 'en' ? 'My Corps' : '我的军团',
    noCorps: language === 'en' ? 'No corps yet' : '暂无军团',
    createFirst: language === 'en' ? 'Create your first corps!' : '创建你的第一个军团！',
    disband: language === 'en' ? 'Disband' : '解散',
    march: language === 'en' ? 'March' : '出征',
    recall: language === 'en' ? 'Recall' : '召回',
    idle: language === 'en' ? 'Idle' : '驻守',
    marching: language === 'en' ? 'Marching' : '行军中',
    heroes: language === 'en' ? 'Heroes' : '英雄',
    totalHp: language === 'en' ? 'Total HP' : '总生命',
    totalAtk: language === 'en' ? 'Total ATK' : '总攻击',
    marchTarget: language === 'en' ? 'Target Position' : '目标位置',
    loading: language === 'en' ? 'Loading...' : '加载中...',
    success: language === 'en' ? 'Success!' : '成功！',
    error: language === 'en' ? 'Error' : '错误',
  };

  // 获取军团列表
  const fetchCorps = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/corps`, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        setCorpsList(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load corps:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取可用英雄
  const fetchAvailableHeroes = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/hero/list`, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        // 只获取闲置英雄 (state = 1)
        setAvailableHeroes(data.data.filter((h: Hero) => h.state === 1));
      }
    } catch (err) {
      console.error('Failed to load heroes:', err);
    }
  };

  useEffect(() => {
    fetchCorps();
    fetchAvailableHeroes();
  }, [walletAddress]);

  // 获取军团详情
  const fetchCorpsDetail = async (corpsId: number) => {
    try {
      const res = await fetch(`${getApiBase()}/api/corps/${corpsId}`, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        setSelectedCorps(data.data);
      }
    } catch (err) {
      console.error('Failed to load corps detail:', err);
    }
  };

  // 创建军团
  const handleCreateCorps = async () => {
    if (!newCorpsName.trim() || selectedHeroIds.length === 0) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/corps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': walletAddress || '',
        },
        body: JSON.stringify({
          cityId: 1,
          name: newCorpsName,
          heroIds: selectedHeroIds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreateMode(false);
        setNewCorpsName('');
        setSelectedHeroIds([]);
        await fetchCorps();
        await fetchAvailableHeroes();
      }
    } catch (err) {
      console.error('Failed to create corps:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 解散军团
  const handleDisband = async (corpsId: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/corps/${corpsId}`, {
        method: 'DELETE',
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });

      const data = await res.json();
      if (data.success) {
        setSelectedCorps(null);
        await fetchCorps();
        await fetchAvailableHeroes();
      }
    } catch (err) {
      console.error('Failed to disband corps:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 行军
  const handleMarch = async (corpsId: number, targetPos: number) => {
    if (!targetPos) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/corps/${corpsId}/march`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': walletAddress || '',
        },
        body: JSON.stringify({ targetPosition: targetPos }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchCorps();
        await fetchCorpsDetail(corpsId);
      }
    } catch (err) {
      console.error('Failed to march:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 召回
  const handleRecall = async (corpsId: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/corps/${corpsId}/recall`, {
        method: 'POST',
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });

      const data = await res.json();
      if (data.success) {
        await fetchCorps();
        await fetchCorpsDetail(corpsId);
      }
    } catch (err) {
      console.error('Failed to recall:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 切换英雄选择
  const toggleHeroSelect = (heroId: number) => {
    setSelectedHeroIds(prev => 
      prev.includes(heroId) 
        ? prev.filter(id => id !== heroId)
        : [...prev, heroId]
    );
  };

  if (loading) {
    return (
      <PageLayout title={i18n.title}>
        <div className="flex items-center justify-center py-20 text-slate-500">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <span>{i18n.loading}</span>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={i18n.title}>
      <div className="p-4 md:p-6 lg:p-8">
        {/* 创建军团按钮 */}
        {!createMode && (
          <GameButton
            className="w-full mb-6"
            onClick={() => setCreateMode(true)}
          >
            ➕ {i18n.createCorps}
          </GameButton>
        )}

        {/* 创建军团表单 */}
        {createMode && (
          <GameCard title={i18n.createCorps} className="mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">{i18n.corpsName}</label>
                <input
                  type="text"
                  value={newCorpsName}
                  onChange={(e) => setNewCorpsName(e.target.value)}
                  placeholder={language === 'en' ? 'Enter corps name' : '输入军团名称'}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-400">{i18n.selectHeroes}</label>
                  <span className="text-sm text-emerald-400">{selectedHeroIds.length} selected</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {availableHeroes.map((hero) => (
                    <button
                      key={hero.id}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        selectedHeroIds.includes(hero.id)
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/30'
                      }`}
                      onClick={() => toggleHeroSelect(hero.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-200">{hero.name}</span>
                        <span className="text-xs text-slate-500">Lv.{hero.level}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>❤️ {hero.hp}</span>
                        <span>⚔️ {hero.attack}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <GameButton
                  variant="red"
                  fullWidth
                  onClick={() => {
                    setCreateMode(false);
                    setSelectedHeroIds([]);
                  }}
                >
                  {i18n.cancel}
                </GameButton>
                <GameButton
                  fullWidth
                  onClick={handleCreateCorps}
                  disabled={!newCorpsName.trim() || selectedHeroIds.length === 0}
                  loading={actionLoading}
                >
                  {i18n.create}
                </GameButton>
              </div>
            </div>
          </GameCard>
        )}

        {/* 军团列表 */}
        {!createMode && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
              {i18n.myCorps}
            </h3>
            {corpsList.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <div className="text-4xl mb-2">🏛️</div>
                <p>{i18n.noCorps}</p>
                <p className="text-sm mt-2">{i18n.createFirst}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {corpsList.map((corps) => (
                  <button
                    key={corps.id}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      selectedCorps?.id === corps.id
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/30'
                    }`}
                    onClick={() => fetchCorpsDetail(corps.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-emerald-400">{corps.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        corps.state === 2 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {corps.stateText}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>👥 {corps.heroCount} {i18n.heroes}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 军团详情 */}
        {selectedCorps && (
          <GameCard title={selectedCorps.name}>
            {/* 统计 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                <div className="text-xs text-slate-500 mb-1">❤️ {i18n.totalHp}</div>
                <div className="text-lg font-bold text-red-400">
                  {selectedCorps.totalHp?.toLocaleString() || 0}
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                <div className="text-xs text-slate-500 mb-1">⚔️ {i18n.totalAtk}</div>
                <div className="text-lg font-bold text-amber-400">
                  {selectedCorps.totalAttack?.toLocaleString() || 0}
                </div>
              </div>
            </div>

            {/* 英雄列表 */}
            <div className="mb-4">
              <h4 className="text-sm text-slate-400 mb-2">{i18n.heroes}</h4>
              <div className="space-y-2">
                {(selectedCorps.heroes || []).map((hero) => (
                  <div
                    key={hero.id}
                    className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-lg">
                      ⚔️
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">{hero.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-400">
                          品质{hero.quality}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>❤️ {hero.hp}/{hero.max_hp}</span>
                        <span>⚔️ {hero.attack}</span>
                        <span>🛡️ {hero.defense}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              {selectedCorps.state === 2 ? (
                <GameButton
                  fullWidth
                  onClick={() => handleRecall(selectedCorps.id)}
                  loading={actionLoading}
                >
                  ↩️ {i18n.recall}
                </GameButton>
              ) : (
                <>
                  <GameButton
                    variant="emerald"
                    fullWidth
                    onClick={() => setMarchTarget('')}
                    loading={actionLoading}
                  >
                    🚀 {i18n.march}
                  </GameButton>
                  <GameButton
                    variant="red"
                    fullWidth
                    onClick={() => handleDisband(selectedCorps.id)}
                    loading={actionLoading}
                  >
                    🗑️ {i18n.disband}
                  </GameButton>
                </>
              )}
            </div>

            {/* 行军目标输入 */}
            {selectedCorps.state !== 2 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <label className="block text-sm text-slate-400 mb-2">{i18n.marchTarget}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={marchTarget}
                    onChange={(e) => setMarchTarget(e.target.value)}
                    placeholder={language === 'en' ? 'Position' : '位置'}
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                  <GameButton
                    onClick={() => handleMarch(selectedCorps.id, parseInt(marchTarget) || 0)}
                    disabled={!marchTarget}
                    loading={actionLoading}
                  >
                    ✓
                  </GameButton>
                </div>
              </div>
            )}
          </GameCard>
        )}
      </div>
    </PageLayout>
  );
});

CorpsPanel.displayName = 'CorpsPanel';

export default CorpsPanel;
