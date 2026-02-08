/**
 * CityView - 重构后的主城界面
 * 原则：UI 逻辑最小化，调用 Hook 获取数据
 */
import React, { useEffect } from 'react';
import { ResourceBar, GameCard, GameButton, GameModal } from '@/shared/components/game';
import { useCity } from '../hooks/useCity';
import styles from './CityView.module.css';

// ============ Component ============
export const CityView: React.FC<{ walletAddress: string; cityId?: number }> = ({ 
  walletAddress, 
  cityId 
}) => {
  const { city, buildings, loading, error, collect } = useCity(cityId);

  // 初始加载
  useEffect(() => {
    // 数据由 useCity hook 自动加载
  }, [walletAddress, cityId]);

  // 获取建筑图标
  const getBuildingIcon = (configId: number): string => {
    const icons: Record<number, string> = {
      1: '🏛️', 2: '🏠', 3: '💰', 4: '🌾', 5: '⚔️',
    };
    return icons[configId] || '🏗️';
  };

  // 加载状态
  if (loading) {
    return (
      <div className={styles.loading}>
        <span>LOADING...</span>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <GameButton onClick={() => window.location.reload()}>
          重试
        </GameButton>
      </div>
    );
  }

  // 空状态
  if (!city) {
    return (
      <div className={styles.empty}>
        <p>暂无城市</p>
        <GameButton>创建城市</GameButton>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 标题 */}
      <h1 className={styles.title}>
        <span className={styles.glitch} data-text="CITY VIEW">CITY VIEW</span>
      </h1>

      {/* 资源栏 */}
      <ResourceBar
        resources={[
          { type: 'money', value: city.money },
          { type: 'food', value: city.food },
          { type: 'population', value: city.population },
        ]}
        rates={{
          money: city.moneyRate,
          food: city.foodRate,
        }}
        onCollect={collect}
        showCollect
      />

      {/* 城市信息 */}
      <GameCard title={city.name} className={styles.cityCard}>
        <div className={styles.cityInfo}>
          <span>城市ID: {city.id}</span>
          <span>繁荣度: {city.prosperity}</span>
        </div>
      </GameCard>

      {/* 建筑列表 */}
      <div className={styles.sectionTitle}>
        <span>建筑列表</span>
        <span className={styles.count}>{buildings.length}</span>
      </div>

      <div className={styles.buildingGrid}>
        {buildings.map((building) => (
          <div
            key={building.id}
            className={styles.buildingItem}
          >
            <div className={styles.buildingIcon}>
              {getBuildingIcon(building.configId)}
            </div>
            <div className={styles.buildingName}>{building.name}</div>
            <div className={styles.buildingLevel}>Lv.{building.level}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CityView;
