/**
 * 城市面板组件
 */
import React, { useState, useEffect, memo } from 'react';
import gufengStyles from '../../styles/gufeng.module.css';

import { useLanguage } from '@/shared/hooks/useLanguage';
import PageLayout from '@/shared/layouts/PageLayout';
import { getApiBase } from '../../utils/api';
import styles from '../../styles/CityPanel.module.css';

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
        <div className={gufengStyles.loading}>{i18n.loading}</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={i18n.title}>
      <div className={gufengStyles.container}>
        {/* 城市选择 */}
        <div className={gufengStyles.citySelector}>
          <h3>{i18n.selectCity}</h3>
          <div className={gufengStyles.cityList}>
            {cities.map((city) => (
              <button
                key={city.id}
                className={`${gufengStyles.cityBtn} ${selectedCityId === city.id ? gufengStyles.active : ''}`}
                onClick={() => setSelectedCityId(city.id)}
              >
                {city.name}
              </button>
            ))}
            {cities.length === 0 && (
              <div className={gufengStyles.empty}>{i18n.noCities}</div>
            )}
          </div>
        </div>

        {cityData && (
          <>
            {/* 资源栏 */}
            <div className={gufengStyles.resourceBar}>
              <div className={gufengStyles.resourceItem}>
                <span className={gufengStyles.resourceIcon}>💰</span>
                <div className={gufengStyles.resourceInfo}>
                  <span className={gufengStyles.resourceValue}>{cityData.money}</span>
                  <span className={gufengStyles.resourceRate}>+{cityData.money_rate}/h</span>
                </div>
              </div>
              <div className={gufengStyles.resourceItem}>
                <span className={gufengStyles.resourceIcon}>🌾</span>
                <div className={gufengStyles.resourceInfo}>
                  <span className={gufengStyles.resourceValue}>{cityData.food}</span>
                  <span className={gufengStyles.resourceRate}>+{cityData.food_rate}/h</span>
                </div>
              </div>
              <div className={gufengStyles.resourceItem}>
                <span className={gufengStyles.resourceIcon}>👥</span>
                <div className={gufengStyles.resourceInfo}>
                  <span className={gufengStyles.resourceValue}>{cityData.population}</span>
                  <span className={gufengStyles.resourceRate}>+{cityData.population_rate}/h</span>
                </div>
              </div>
              <button className={gufengStyles.collectBtn} onClick={collectResources}>
                {i18n.collect}
              </button>
            </div>

            {/* 建筑列表 */}
            <div className={gufengStyles.buildingSection}>
              <div className={gufengStyles.sectionHeader}>
                <h3>{i18n.buildings}</h3>
                <button className={gufengStyles.buildBtn} onClick={() => setShowBuildModal(true)}>
                  + {i18n.build}
                </button>
              </div>

              <div className={gufengStyles.buildingGrid}>
                {cityData.buildings.map((building) => (
                  <div key={building.id} className={gufengStyles.buildingCard}>
                    <div className={gufengStyles.buildingIcon}>
                      {buildingTypes.find(t => t.id === building.config_id)?.icon || '🏢'}
                    </div>
                    <div className={gufengStyles.buildingInfo}>
                      <div className={gufengStyles.buildingName}>
                        {buildingTypes.find(t => t.id === building.config_id)?.name || building.type}
                      </div>
                      <div className={gufengStyles.buildingLevel}>
                        Lv.{building.level}
                      </div>
                      {building.state === 0 && (
                        <div className={gufengStyles.constructing}>
                          {i18n.constructing}...
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {cityData.buildings.length === 0 && (
                  <div className={gufengStyles.emptyBuilding}>
                    还没有建筑，快去建造吧！
                  </div>
                )}
              </div>

              {/* 建造队列 */}
              {cityData.events.length > 0 && (
                <div className={gufengStyles.queueSection}>
                  <h4>建造队列</h4>
                  {cityData.events.map((event) => {
                    const endTime = new Date(event.end_time).getTime();
                    const now = Date.now();
                    const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
                    const minutes = Math.floor(remaining / 60);
                    const seconds = remaining % 60;

                    return (
                      <div key={event.id} className={gufengStyles.queueItem}>
                        <span>{event.event_type === 'build' ? '建造' : '升级'}</span>
                        <span>{minutes}:{seconds.toString().padStart(2, '0')}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* 建造弹窗 */}
        {showBuildModal && (
          <div className={gufengStyles.modal} onClick={() => setShowBuildModal(false)}>
            <div className={gufengStyles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3>{i18n.build}</h3>
              <div className={gufengStyles.buildingTypes}>
                {buildingTypes.map((type) => (
                  <div
                    key={type.id}
                    className={gufengStyles.typeCard}
                    onClick={() => buildBuilding(type.id, cityData?.buildings.length || 0)}
                  >
                    <span className={gufengStyles.typeIcon}>{type.icon}</span>
                    <span className={gufengStyles.typeName}>{type.name}</span>
                    <span className={gufengStyles.typeDesc}>{type.desc}</span>
                  </div>
                ))}
              </div>
              <button className={gufengStyles.closeBtn} onClick={() => setShowBuildModal(false)}>
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
});

CityPanel.displayName = 'CityPanel';

export default CityPanel;
