/**
 * 城市面板
 */
import React from 'react';
import type { CityData } from '../../types';

interface CityPanelProps {
  city: CityData;
}

export const CityPanel: React.FC<CityPanelProps> = ({ city }) => {
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
    <div className="city-panel">
      <div className="city-main">
        <h2 style={{ marginBottom: isMobile ? '15px' : '20px', color: '#ffd700', fontSize: isMobile ? '18px' : '20px' }}>🏰 {city.name}</h2>
        
        <div className="city-info">
          <div className="city-info-item">
            <span className="city-info-label">城市等级</span>
            <span className="city-info-value">Lv.{city.level}</span>
          </div>
          <div className="city-info-item">
            <span className="city-info-label">城市ID</span>
            <span className="city-info-value">#{city.id}</span>
          </div>
          <div className="city-info-item">
            <span className="city-info-label">人口</span>
            <span className="city-info-value">{city.population.toLocaleString()}</span>
          </div>
          <div className="city-info-item">
            <span className="city-info-label">城市容量</span>
            <span className="city-info-value">{city.level * 2000}</span>
          </div>
        </div>

        {/* 城市装饰/地图区域 */}
        <div style={{ 
          marginTop: isMobile ? '20px' : '30px', 
          padding: isMobile ? '15px' : '20px', 
          background: 'rgba(0,0,0,0.2)', 
          borderRadius: '12px',
          textAlign: 'center',
          color: '#666',
          minHeight: isMobile ? '150px' : '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div>
            <div style={{ fontSize: isMobile ? '48px' : '60px', marginBottom: '10px' }}>🗺️</div>
            <div style={{ fontSize: isMobile ? '13px' : '14px' }}>城市地图区域（开发中）</div>
          </div>
        </div>
      </div>

      <div className="city-sidebar">
        <div className="dashboard-card">
          <div className="dashboard-card-title">📊 产出统计</div>
          <div className="dashboard-card-content">
            <div className="city-info-item">
              <span className="city-info-label">金币/小时</span>
              <span className="city-info-value">+{city.level * 100}</span>
            </div>
            <div className="city-info-item">
              <span className="city-info-label">粮食/小时</span>
              <span className="city-info-value">+{city.level * 50}</span>
            </div>
            <div className="city-info-item">
              <span className="city-info-label">木材/小时</span>
              <span className="city-info-value">+{city.level * 30}</span>
            </div>
            <div className="city-info-item">
              <span className="city-info-label">石料/小时</span>
              <span className="city-info-value">+{city.level * 20}</span>
            </div>
            <div className="city-info-item">
              <span className="city-info-label">铁矿/小时</span>
              <span className="city-info-value">+{city.level * 10}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">⚔️ 防御能力</div>
          <div className="dashboard-card-content">
            <div style={{ textAlign: 'center', padding: isMobile ? '15px' : '20px' }}>
              <div style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: 'bold', color: '#ffd700' }}>
                {city.level * 50}
              </div>
              <div style={{ color: '#aaa', marginTop: '5px', fontSize: isMobile ? '12px' : '13px' }}>城防值</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityPanel;
