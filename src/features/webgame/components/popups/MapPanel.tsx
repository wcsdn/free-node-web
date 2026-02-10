import React, { useState, useEffect } from 'react';
import gameApi from '../../services/gameApi';
import styles from './MapPanel.module.css';

interface MapPanelProps {
  onClose: () => void;
}

interface MapUnit {
  id: number;
  name: string;
  type: 'city' | 'npc' | 'bandit' | 'resource';
  position: { x: number; y: number };
  level?: number;
  power?: number;
  owner?: string;
  occupied?: boolean;
}

export const MapPanel: React.FC<MapPanelProps> = ({ onClose }) => {
  const [mapUnits, setMapUnits] = useState<MapUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<MapUnit | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);
      // 模拟地图数据
      setMapUnits([
        { id: 1, name: '青龙寨', type: 'bandit', position: { x: 120, y: 80 }, level: 5, power: 5000 },
        { id: 2, name: '白虎岭', type: 'bandit', position: { x: 280, y: 150 }, level: 8, power: 8000 },
        { id: 3, name: '资源点-铁矿', type: 'resource', position: { x: 450, y: 200 }, level: 3 },
        { id: 4, name: '朱雀坡', type: 'bandit', position: { x: 180, y: 350 }, level: 10, power: 12000 },
        { id: 5, name: '玄武潭', type: 'bandit', position: { x: 380, y: 380 }, level: 12, power: 15000 },
        { id: 6, name: '资源点-木材', type: 'resource', position: { x: 520, y: 100 }, level: 2 },
      ]);
    } catch (error) {
      console.error('加载地图数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnitClick = (unit: MapUnit) => {
    setSelectedUnit(unit);
  };

  const handleAttack = (unit: MapUnit) => {
    alert(`进攻 ${unit.name} - 战斗系统开发中`);
  };

  const handleOccupy = (unit: MapUnit) => {
    alert(`占领 ${unit.name} - 正在计算行军时间...`);
  };

  const getUnitIcon = (type: string) => {
    switch (type) {
      case 'city': return '🏰';
      case 'npc': return '👤';
      case 'bandit': return '👹';
      case 'resource': return '💎';
      default: return '📍';
    }
  };

  const getUnitColor = (type: string) => {
    switch (type) {
      case 'city': return '#3498db';
      case 'npc': return '#9b59b6';
      case 'bandit': return '#e74c3c';
      case 'resource': return '#2ecc71';
      default: return '#888';
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>🗺️ 世界地图</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.toolbar}>
          <button 
            className={`${styles.viewBtn} ${viewMode === 'map' ? styles.active : ''}`}
            onClick={() => setViewMode('map')}
          >
            🗺️ 地图
          </button>
          <button 
            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 列表
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : viewMode === 'map' ? (
          /* 地图视图 */
          <div className={styles.mapContainer}>
            <div className={styles.mapView}>
              {mapUnits.map(unit => (
                <div
                  key={unit.id}
                  className={`${styles.mapUnit} ${selectedUnit?.id === unit.id ? styles.selected : ''}`}
                  style={{
                    left: `${unit.position.x}px`,
                    top: `${unit.position.y}px`,
                    backgroundColor: getUnitColor(unit.type)
                  }}
                  onClick={() => handleUnitClick(unit)}
                  title={unit.name}
                >
                  <span className={styles.unitIcon}>{getUnitIcon(unit.type)}</span>
                  <span className={styles.unitName}>{unit.name}</span>
                </div>
              ))}
              {/* 玩家城市 */}
              <div className={`${styles.mapUnit} ${styles.playerCity}`} style={{ left: '350px', top: '250px' }}>
                <span className={styles.unitIcon}>🏠</span>
                <span className={styles.unitName}>我的城池</span>
              </div>
            </div>

            {/* 选中详情 */}
            {selectedUnit && (
              <div className={styles.unitDetail}>
                <h3>{selectedUnit.name}</h3>
                <div className={styles.detailInfo}>
                  <p>类型: {selectedUnit.type === 'bandit' ? '土匪窝' : selectedUnit.type === 'resource' ? '资源点' : 'NPC'}</p>
                  {selectedUnit.level && <p>等级: {selectedUnit.level}</p>}
                  {selectedUnit.power && <p>驻守战力: {selectedUnit.power}</p>}
                </div>
                <div className={styles.detailActions}>
                  {selectedUnit.type === 'bandit' && (
                    <button className={styles.attackBtn} onClick={() => handleAttack(selectedUnit)}>
                      ⚔️ 进攻
                    </button>
                  )}
                  {selectedUnit.type === 'resource' && (
                    <button className={styles.occupyBtn} onClick={() => handleOccupy(selectedUnit)}>
                      🚩 占领
                    </button>
                  )}
                  <button className={styles.closeDetailBtn} onClick={() => setSelectedUnit(null)}>
                    关闭
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 列表视图 */
          <div className={styles.listView}>
            {mapUnits.map(unit => (
              <div 
                key={unit.id}
                className={styles.listItem}
                onClick={() => handleUnitClick(unit)}
              >
                <span className={styles.listIcon} style={{ color: getUnitColor(unit.type) }}>
                  {getUnitIcon(unit.type)}
                </span>
                <div className={styles.listInfo}>
                  <span className={styles.listName}>{unit.name}</span>
                  <span className={styles.listMeta}>
                    {unit.level && `等级 ${unit.level}`}
                    {unit.power && ` • 战力 ${unit.power}`}
                  </span>
                </div>
                <span className={styles.listAction}>
                  {unit.type === 'bandit' ? '进攻' : unit.type === 'resource' ? '占领' : '查看'}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span style={{ color: '#e74c3c' }}>●</span> 土匪窝
          </div>
          <div className={styles.legendItem}>
            <span style={{ color: '#2ecc71' }}>●</span> 资源点
          </div>
          <div className={styles.legendItem}>
            <span style={{ color: '#9b59b6' }}>●</span> NPC
          </div>
          <div className={styles.legendItem}>
            <span style={{ color: '#3498db' }}>●</span> 城池
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPanel;
