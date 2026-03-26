/**
 * 建筑面板
 */
import React from 'react';
import type { BuildingData } from '../../types';

interface BuildingPanelProps {
  buildings: BuildingData[];
  onUpgrade?: (buildingId: number) => void;
}

// 建筑图标映射
const BUILDING_ICONS: Record<string, string> = {
  town_hall: '🏛️',
  barracks: '⚔️',
  academy: '🎓',
  warehouse: '📦',
  farm: '🌾',
  lumber_mill: '🪓',
  quarry: '⛏️',
  iron_mine: '🔩',
  market: '🏪',
  wall: '🧱',
  watchtower: '🗼',
  hospital: '🏥',
};

// 建筑名称中文映射
const BUILDING_NAMES: Record<string, string> = {
  town_hall: '城主府',
  barracks: '兵营',
  academy: '校场',
  warehouse: '仓库',
  farm: '农田',
  lumber_mill: '伐木场',
  quarry: '采石场',
  iron_mine: '铁矿',
  market: '市场',
  wall: '城墙',
  watchtower: '瞭望塔',
  hospital: '医馆',
};

export const BuildingPanel: React.FC<BuildingPanelProps> = ({ 
  buildings,
  onUpgrade 
}) => {
  // 检测手机屏幕
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="building-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '12px' : '15px' }}>
        <h2 style={{ color: '#ffd700', fontSize: isMobile ? '18px' : '20px', margin: 0 }}>🏗️ 建筑列表</h2>
        <span style={{ color: '#aaa', fontSize: isMobile ? '12px' : '14px' }}>共 {buildings.length} 座建筑</span>
      </div>

      <div className="building-grid">
        {buildings.map(building => (
          <div key={building.id} className="building-card" style={isMobile ? { padding: '12px' } : undefined}>
            <div className="building-icon" style={{ fontSize: isMobile ? '32px' : '40px' }}>
              {BUILDING_ICONS[building.type] || '🏠'}
            </div>
            <div className="building-name" style={{ fontSize: isMobile ? '13px' : '14px' }}>
              {BUILDING_NAMES[building.type] || building.name}
            </div>
            <div className="building-level" style={{ fontSize: isMobile ? '11px' : '12px' }}>
              Lv.{building.level} / Lv.{building.maxLevel}
            </div>
            
            {/* 升级进度条 */}
            <div className="building-progress">
              <div 
                className="building-progress-bar"
                style={{ width: `${(building.level / building.maxLevel) * 100}%` }}
              />
            </div>

            <div className={`building-status ${building.status}`}>
              {building.status === 'normal' ? '正常' : 
               building.status === 'upgrading' ? '升级中' : '损坏'}
            </div>

            <button 
              className="building-action"
              disabled={building.level >= building.maxLevel || building.status === 'upgrading'}
              onClick={() => onUpgrade?.(building.id)}
              style={isMobile ? { width: '100%', marginTop: '8px' } : undefined}
            >
              {building.level >= building.maxLevel ? '已满级' : '升级'}
            </button>
          </div>
        ))}
      </div>

      {/* 建造新建筑（预留区域） */}
      <div style={{ 
        marginTop: isMobile ? '20px' : '30px', 
        padding: isMobile ? '30px' : '40px', 
        background: 'rgba(0,0,0,0.2)', 
        borderRadius: '12px',
        textAlign: 'center',
        color: '#666'
      }}>
        <div style={{ fontSize: isMobile ? '32px' : '40px', marginBottom: '10px' }}>🔨</div>
        <div style={{ fontSize: isMobile ? '13px' : '14px' }}>建造新建筑（开发中）</div>
      </div>
    </div>
  );
};

export default BuildingPanel;
