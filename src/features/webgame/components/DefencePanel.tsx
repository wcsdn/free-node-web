/**
 * 城防面板组件
 * 原则：移动端优先，简洁设计
 */
import React, { useState, useEffect, memo } from 'react';
import PageLayout from '@/shared/layouts/PageLayout';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useToast } from '@/shared/components/Toast/ToastContext';
import { getApiBase } from '../utils/api';
import { GameCard, GameButton } from '@/shared/components/game';

interface DefenceBuilding {
  id: number;
  index: number;
  position: number;
  level: number;
  name: string;
  icon: string;
  attack: number;
  hitPoint: number;
  attackRange: number;
  effRange: number;
}

interface DefenceHero {
  id: number;
  name: string;
  level: number;
  attack: number;
  defence: number;
  hp: number;
  defencePos: number;
}

interface DefencePanelProps {
  walletAddress: string;
  cityId?: number;
}

const DefencePanel: React.FC<DefencePanelProps> = memo(({ walletAddress, cityId: propCityId }) => {
  const { language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const [buildings, setBuildings] = useState<DefenceBuilding[]>([]);
  const [heroes, setHeroes] = useState<DefenceHero[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHero, setSelectedHero] = useState<DefenceHero | null>(null);


  // 获取城防信息
  const fetchDefence = async () => {
    try {
      // 获取城防建筑
      const buildingRes = await fetch(`${getApiBase()}/api/city/${propCityId || 0}/buildings`, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const buildingData = await buildingRes.json();
      if (buildingData.success && buildingData.data) {
        // 过滤城防建筑 (type=3)
        setBuildings(buildingData.data.filter((b: any) => b.type === 3) || []);
      }

      // 获取可驻防英雄
      const heroRes = await fetch(`${getApiBase()}/api/hero/defence/list`, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const heroData = await heroRes.json();
      if (heroData.success && heroData.data) {
        setHeroes(heroData.data);
      }
    } catch (err) {
      showError(language === 'en' ? 'Failed to load defence' : '加载城防失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefence();
  }, [walletAddress, propCityId]);

  // 设置英雄驻防
  const handleSetDefence = async (heroId: number, position: number) => {
    try {
      const res = await fetch(`${getApiBase()}/api/hero/${heroId}/defence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': walletAddress || '',
        },
        body: JSON.stringify({ position }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(language === 'en' ? 'Hero deployed!' : '英雄已部署！');
        await fetchDefence();
      } else {
        showError(data.message || (language === 'en' ? 'Deploy failed' : '部署失败'));
      }
    } catch (err) {
      showError(language === 'en' ? 'Deploy failed' : '部署失败');
    }
  };

  // 撤防
  const handleRemoveDefence = async (heroId: number) => {
    await handleSetDefence(heroId, -1);
  };

  // 部署英雄（包装函数，用于 GameButton）
  const deployHero = () => {
    if (selectedHero) {
      handleSetDefence(selectedHero.id, 1);
    }
  };

  // 撤防英雄（包装函数，用于 GameButton）
  const removeHeroDefence = () => {
    if (selectedHero) {
      handleRemoveDefence(selectedHero.id);
    }
  };

  const i18n = {
    title: language === 'en' ? 'Defence' : '城防',
    loading: language === 'en' ? 'Loading...' : '加载中...',
    buildings: language === 'en' ? 'Defence Buildings' : '城防建筑',
    heroes: language === 'en' ? 'Defence Heroes' : '驻防英雄',
    attack: language === 'en' ? 'Attack' : '攻击',
    hp: language === 'en' ? 'HP' : '生命',
    range: language === 'en' ? 'Range' : '射程',
    selectHero: language === 'en' ? 'Select Hero' : '选择英雄',
    deploy: language === 'en' ? 'Deploy' : '部署',
    remove: language === 'en' ? 'Remove' : '撤防',
    noBuildings: language === 'en' ? 'No defence buildings' : '暂无城防建筑',
    noHeroes: language === 'en' ? 'No heroes available' : '无可用英雄',
    clickToSelect: language === 'en' ? 'Click to select hero' : '点击选择英雄',
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
        {/* 城防建筑 */}
        <GameCard title={i18n.buildings} className="mb-6">
          {buildings.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-2">🏰</div>
              <p>{i18n.noBuildings}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {buildings.map((building) => (
                <div
                  key={building.id}
                  className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-all"
                >
                  <div className="text-3xl text-center mb-2">{building.icon || '🏰'}</div>
                  <div className="text-center">
                    <div className="font-semibold text-emerald-400">{building.name}</div>
                    <div className="text-xs text-slate-500 mt-1">Lv.{building.level}</div>
                    <div className="flex justify-center gap-3 mt-2 text-xs text-slate-400">
                      <span>⚔️ {building.attack}</span>
                      <span>❤️ {building.hitPoint}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GameCard>

        {/* 驻防英雄 */}
        <GameCard title={i18n.heroes}>
          {heroes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-2">⚔️</div>
              <p>{i18n.noHeroes}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {heroes.map((hero) => (
                <div
                  key={hero.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedHero?.id === hero.id
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/30'
                  }`}
                  onClick={() => setSelectedHero(selectedHero?.id === hero.id ? null : hero)}
                >
                  <div className="flex items-center gap-3">
                    {/* 英雄信息 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-400">{hero.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-400">
                          Lv.{hero.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>⚔️ {hero.attack}</span>
                        <span>🛡️ {hero.defence}</span>
                        <span>❤️ {hero.hp}</span>
                      </div>
                    </div>

                    {/* 驻防位置 */}
                    {hero.defencePos > 0 && (
                      <div className="px-3 py-1 bg-emerald-500/20 rounded-full text-sm text-emerald-400">
                        📍 位置 {hero.defencePos}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  {selectedHero?.id === hero.id && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
                      <GameButton
                        size="small"
                        variant="emerald"
                        onClick={deployHero}
                      >
                        📍 {i18n.deploy} 1
                      </GameButton>
                      {hero.defencePos > 0 && (
                        <GameButton
                          size="small"
                          variant="red"
                          onClick={removeHeroDefence}
                        >
                          {i18n.remove}
                        </GameButton>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </GameCard>

        {/* 选择提示 */}
        {selectedHero && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center text-amber-400 text-sm">
            {i18n.clickToSelect}: {selectedHero.name}
          </div>
        )}
      </div>
    </PageLayout>
  );
});

DefencePanel.displayName = 'DefencePanel';

export default DefencePanel;
