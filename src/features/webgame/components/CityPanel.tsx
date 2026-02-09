/**
 * 城市面板组件
 * 原则：移动端优先，简洁设计
 */
import React, { useState, useEffect, memo } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import PageLayout from '@/shared/layouts/PageLayout';
import { getApiBase } from '../utils/api';
import { GameCard, GameButton, GameModal } from '@/shared/components/game';

interface City {
  id: number;
  name: string;
  money: number;
  food: number;
  population: number;
  money_rate: number;
  food_rate: number;
  population_rate: number;
}

interface Building {
  id: number;
  type: string;
  level: number;
  position: number | null;
  state: number;
  config_id: number;
}

interface BuildingEvent {
  id: number;
  event_type: string;
  target_id: number;
  end_time: string;
}

interface CityPanelProps {
  walletAddress: string;
  cityId?: number;
}

const CityPanel: React.FC<CityPanelProps> = memo(({ walletAddress, cityId: propCityId }) => {
  const { language } = useLanguage();
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(propCityId || null);
  const [cityData, setCityData] = useState<City & { buildings: Building[]; events: BuildingEvent[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);


  const i18n = {
    title: language === 'en' ? 'City' : '城市',
    resources: language === 'en' ? 'Resources' : '资源',
    money: language === 'en' ? 'Gold' : '金币',
    food: language === 'en' ? 'Food' : '粮食',
    population: language === 'en' ? 'Population' : '人口',
    collect: language === 'en' ? 'Collect' : '采集',
    buildings: language === 'en' ? 'Buildings' : '建筑',
    build: language === 'en' ? 'Build' : '建造',
    upgrade: language === 'en' ? 'Upgrade' : '升级',
    constructing: language === 'en' ? 'Constructing' : '建造中',
    loading: language === 'en' ? 'Loading...' : '加载中...',
    selectCity: language === 'en' ? 'Select City' : '选择城市',
    noCities: language === 'en' ? 'No cities' : '暂无城市',
  };

  // 获取城市列表 - 使用 game API 以支持自动注册
  const fetchCities = async () => {
    try {
      // 使用 /api/game/user-info 来触发自动注册并获取城市列表
      const res = await fetch(`${getApiBase()}/api/game/user-info`, {
        method: 'POST',
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success && data.data.CityList && data.data.CityList.length > 0) {
        // 从 user-info 返回的城市列表
        const citiesFromUser = data.data.CityList.map((c: any) => ({
          id: c.ID,
          name: c.Name,
          money: 0,
          food: 0,
          population: 0,
          money_rate: 0,
          food_rate: 0,
          population_rate: 0,
        }));
        setCities(citiesFromUser);
        if (!selectedCityId) {
          setSelectedCityId(citiesFromUser[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load cities:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取城市详情 - 使用 game API 以支持自动注册
  const fetchCityDetail = async (id: number) => {
    try {
      const res = await fetch(`${getApiBase()}/api/game/city/interior/${id}`, {
        method: 'POST',
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        // 转换为 CityPanel 期望的格式
        const cityInfo = data.data;
        setCityData({
          id: cityInfo.cityId,
          name: cityInfo.userName,
          money: cityInfo.money,
          food: cityInfo.food,
          population: cityInfo.population,
          money_rate: cityInfo.moneyRate,
          food_rate: cityInfo.foodRate,
          population_rate: cityInfo.populationRate,
          buildings: [],
          events: [],
        });

        // 同时获取建筑列表
        fetchBuildings(id);
      } else {
        console.error('Failed to load city:', data.error);
      }
    } catch (err) {
      console.error('Failed to load city:', err);
    }
  };

  // 获取建筑列表
  const fetchBuildings = async (cityId: number) => {
    try {
      const res = await fetch(`${getApiBase()}/api/game/city/building-list/${cityId}`, {
        method: 'POST',
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        // 更新 cityData 中的建筑列表
        setCityData(prev => prev ? {
          ...prev,
          buildings: data.data.buildings.map((b: any) => ({
            id: b.id,
            type: b.type,
            level: b.level,
            position: b.position,
            state: b.state,
            config_id: b.configId,
          }))
        } : null);
      }
    } catch (err) {
      console.error('Failed to load buildings:', err);
    }
  };

  useEffect(() => {
    fetchCities();
  }, [walletAddress]);

  useEffect(() => {
    if (selectedCityId) {
      fetchCityDetail(selectedCityId);
    }
  }, [selectedCityId]);

  // 收集资源
  const collectResources = async () => {
    if (!selectedCityId) return;
    try {
      const res = await fetch(`${getApiBase()}/api/city/${selectedCityId}/collect`, {
        method: 'POST',
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        fetchCityDetail(selectedCityId);
      }
    } catch (err) {
      console.error('Collect failed:', err);
    }
  };

  // 建造建筑
  const buildBuilding = async (configId: number, position: number) => {
    if (!selectedCityId || building) return;
    setBuilding(true);
    try {
      const res = await fetch(`${getApiBase()}/api/city/${selectedCityId}/build`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': walletAddress || '',
        },
        body: JSON.stringify({ buildingId: configId, position }),
      });
      const data = await res.json();
      if (data.success) {
        setShowBuildModal(false);
        fetchCityDetail(selectedCityId);
      }
    } catch (err) {
      console.error('Build failed:', err);
    } finally {
      setBuilding(false);
    }
  };

  // 建筑类型配置
  const buildingTypes = [
    { id: 1, name: '聚义厅', icon: '🏛️', desc: '城市核心' },
    { id: 2, name: '民居', icon: '🏠', desc: '提供人口' },
    { id: 3, name: '农田', icon: '🌾', desc: '生产粮食' },
    { id: 4, name: '集市', icon: '💰', desc: '产出金币' },
    { id: 5, name: '仓库', icon: '📦', desc: '储存资源' },
    { id: 6, name: '兵营', icon: '⚔️', desc: '训练士兵' },
  ];

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
        {/* 城市选择 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
            {i18n.selectCity}
          </h3>
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <button
                key={city.id}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCityId === city.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
                }`}
                onClick={() => setSelectedCityId(city.id)}
              >
                {city.name}
              </button>
            ))}
            {cities.length === 0 && (
              <div className="text-slate-500 py-2">{i18n.noCities}</div>
            )}
          </div>
        </div>

        {cityData && (
          <>
            {/* 资源栏 */}
            <GameCard className="mb-6">
              <div className="grid grid-cols-3 gap-3">
                {/* 金币 */}
                <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-lg">
                    💰
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-400">{cityData.money.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">+{cityData.money_rate}/h</div>
                  </div>
                </div>
                {/* 粮食 */}
                <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-lg">
                    🌾
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-400">{cityData.food.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">+{cityData.food_rate}/h</div>
                  </div>
                </div>
                {/* 人口 */}
                <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-lg">
                    👥
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-400">{cityData.population.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">+{cityData.population_rate}/h</div>
                  </div>
                </div>
              </div>
              <GameButton fullWidth className="mt-4" onClick={collectResources}>
                {i18n.collect}
              </GameButton>
            </GameCard>

            {/* 建筑列表 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-emerald-400">{i18n.buildings}</h3>
                <button
                  className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/30"
                  onClick={() => setShowBuildModal(true)}
                >
                  + {i18n.build}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {cityData.buildings.map((building) => (
                  <div
                    key={building.id}
                    className={`p-4 rounded-lg border transition-all ${
                      building.state === 0
                        ? 'bg-slate-800/30 border-slate-700/50 opacity-75'
                        : 'bg-slate-800/60 border-slate-700 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="text-3xl text-center mb-2">
                      {buildingTypes.find(t => t.id === building.config_id)?.icon || '🏢'}
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-slate-200 truncate">
                        {buildingTypes.find(t => t.id === building.config_id)?.name || building.type}
                      </div>
                      <div className="text-sm text-emerald-400">Lv.{building.level}</div>
                      {building.state === 0 && (
                        <div className="text-xs text-amber-400 mt-1">
                          {i18n.constructing}...
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {cityData.buildings.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="text-4xl mb-2">🏗️</div>
                    <p>还没有建筑，快去建造吧！</p>
                  </div>
                )}
              </div>

              {/* 建造队列 */}
              {cityData.events.length > 0 && (
                <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <h4 className="text-sm font-medium text-slate-400 mb-3">建造队列</h4>
                  <div className="space-y-2">
                    {cityData.events.map((event) => {
                      const endTime = new Date(event.end_time).getTime();
                      const now = Date.now();
                      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
                      const minutes = Math.floor(remaining / 60);
                      const seconds = remaining % 60;

                      return (
                        <div key={event.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                          <span className="text-sm text-slate-300">
                            {event.event_type === 'build' ? '建造' : '升级'}
                          </span>
                          <span className="text-sm font-mono text-amber-400">
                            {minutes}:{seconds.toString().padStart(2, '0')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* 建造弹窗 */}
        <GameModal
          isOpen={showBuildModal}
          onClose={() => setShowBuildModal(false)}
          title={i18n.build}
          size="medium"
        >
          <div className="grid grid-cols-2 gap-3">
            {buildingTypes.map((type) => (
              <button
                key={type.id}
                className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition-all text-left"
                onClick={() => buildBuilding(type.id, cityData?.buildings.length || 0)}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="font-medium text-slate-200">{type.name}</div>
                <div className="text-xs text-slate-500 mt-1">{type.desc}</div>
              </button>
            ))}
          </div>
        </GameModal>
      </div>
    </PageLayout>
  );
});

CityPanel.displayName = 'CityPanel';

export default CityPanel;
