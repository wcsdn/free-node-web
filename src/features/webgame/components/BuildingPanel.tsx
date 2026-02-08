/**
 * BuildingPanel - 新版建筑面板
 * 赛博朋克风格
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton, GameModal } from '@/shared/components/game';
import styles from './BuildingPanel.module.css';

interface Building {
  id: number;
  configId: number;
  name: string;
  type: string;
  level: number;
  position: number;
  state: number;
  upgradeTime?: number;
  maxLevel?: number;
}

interface BuildingPanelProps {
  walletAddress: string;
  cityId?: number;
}

export const BuildingPanel: React.FC<BuildingPanelProps> = ({ walletAddress, cityId = 1 }) => {
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // 加载建筑数据
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const res = await fetch(`http://localhost:8788/api/game/city/building-list/${cityId}`, {
          method: 'POST',
          headers: { 'X-Wallet-Auth': walletAddress || '' },
        });
        const data = await res.json();
        
        if (data.success && data.data) {
          setBuildings(data.data);
        }
      } catch (err) {
        console.error('Failed to load buildings:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadBuildings();
  }, [walletAddress, cityId]);

  // 获取建筑图标
  const getBuildingIcon = (configId: number): string => {
    const icons: Record<number, string> = {
      1: '🏛️', // 聚义厅
      2: '🏠', // 民居
      3: '💰', // 银库
      4: '🌾', // 粮仓
      5: '⚔️', // 校场
      101: '🧱', // 城墙
      102: '🏹', // 箭塔
    };
    return icons[configId] || '🏗️';
  };

  // 获取建筑类型名称
  const getTypeName = (type: string): string => {
    const names: Record<string, string> = {
      interior: '内政',
      defense: '防御',
    };
    return names[type] || type;
  };

  // 点击建筑
  const handleBuildingClick = (building: Building) => {
    setSelectedBuilding(building);
    setShowUpgradeModal(true);
  };

  if (loading) {
    return <div className={styles.loading}>LOADING...</div>;
  }

  return (
    <div className={styles.container}>
      {/* 标题 */}
      <h1 className={styles.title}>
        <span className={styles.glitch} data-text="BUILDINGS">BUILDINGS</span>
      </h1>

      {/* 建筑统计 */}
      <GameCard title="建筑概览" className={styles.overview}>
        <div className={styles.overviewStats}>
          <div className={styles.overviewItem}>
            <span className={styles.overviewValue}>{buildings.length}</span>
            <span className={styles.overviewLabel}>总建筑</span>
          </div>
          <div className={styles.overviewItem}>
            <span className={styles.overviewValue}>
              {buildings.filter(b => b.state === 0).length}
            </span>
            <span className={styles.overviewLabel}>空闲中</span>
          </div>
          <div className={styles.overviewItem}>
            <span className={styles.overviewValue}>
              {buildings.reduce((sum, b) => sum + b.level, 0)}
            </span>
            <span className={styles.overviewLabel}>总等级</span>
          </div>
        </div>
      </GameCard>

      {/* 建筑网格 */}
      <div className={styles.sectionTitle}>
        <span>建筑列表</span>
      </div>

      <div className={styles.buildingGrid}>
        {buildings.map((building) => (
          <div
            key={building.id}
            className={styles.buildingCard}
            onClick={() => handleBuildingClick(building)}
          >
            <div className={styles.buildingHeader}>
              <span className={styles.buildingIcon}>
                {getBuildingIcon(building.configId)}
              </span>
              <span className={styles.buildingType}>
                {getTypeName(building.type)}
              </span>
            </div>
            
            <div className={styles.buildingName}>{building.name}</div>
            
            <div className={styles.buildingLevel}>
              <span className={styles.levelBadge}>Lv.{building.level}</span>
              {building.state === 1 && (
                <span className={styles.working}>建造中...</span>
              )}
            </div>
            
            <div className={styles.buildingPosition}>
              位置: {building.position}
            </div>

            <div className={styles.buildingAction}>
              <GameButton size="small" variant="secondary">
                升级
              </GameButton>
            </div>
          </div>
        ))}
      </div>

      {/* 升级弹窗 */}
      <GameModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={selectedBuilding?.name || '建筑升级'}
        size="small"
      >
        {selectedBuilding && (
          <div className={styles.upgradeContent}>
            <div className={styles.upgradeHeader}>
              <span className={styles.upgradeIcon}>
                {getBuildingIcon(selectedBuilding.configId)}
              </span>
              <div className={styles.upgradeInfo}>
                <h3>{selectedBuilding.name}</h3>
                <p>当前等级: Lv.{selectedBuilding.level}</p>
              </div>
            </div>

            <div className={styles.upgradeRequirements}>
              <h4>升级需求</h4>
              <div className={styles.requireItem}>
                <span>💰 银两</span>
                <span>{selectedBuilding.level * 500}</span>
              </div>
              <div className={styles.requireItem}>
                <span>🌾 粮草</span>
                <span>{selectedBuilding.level * 300}</span>
              </div>
              <div className={styles.requireItem}>
                <span>⏱️ 时间</span>
                <span>{(selectedBuilding.level * 60)}秒</span>
              </div>
            </div>

            <div className={styles.upgradeActions}>
              <GameButton fullWidth disabled={selectedBuilding.level >= (selectedBuilding.maxLevel || 10)}>
                {selectedBuilding.level >= (selectedBuilding.maxLevel || 10) 
                  ? '已满级' 
                  : '开始升级'}
              </GameButton>
            </div>
          </div>
        )}
      </GameModal>
    </div>
  );
};

export default BuildingPanel;
