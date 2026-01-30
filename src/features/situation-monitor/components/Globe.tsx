/**
 * 3D 地球组件 - 稳定版本
 */
import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import './Globe.css';

interface Location {
  name: string;
  lat: number;
  lng: number;
  count: number;
  titles: string[];
}

interface GlobeProps {
  locations: Location[];
  isZh?: boolean;
}

declare global {
  interface Window {
    Globe: any;
  }
}

const GlobeComponent: React.FC<GlobeProps> = ({ locations, isZh = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const globeStyle = useAppStore((state) => state.globeStyle);

  // 加载 Globe.gl 脚本（只加载一次）
  useEffect(() => {
    if (window.Globe) {
      setScriptLoaded(true);
      return;
    }

    if (document.querySelector('script[src*="globe.gl"]')) {
      const checkInterval = setInterval(() => {
        if (window.Globe) {
          clearInterval(checkInterval);
          setScriptLoaded(true);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/globe.gl@2.31.0/dist/globe.gl.min.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => console.error('Failed to load Globe.gl');
    document.head.appendChild(script);
  }, []);

  // 初始化地球（当脚本加载完成或样式改变时）
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.Globe) return;

    // 清理旧实例
    if (globeRef.current) {
      containerRef.current.innerHTML = '';
      globeRef.current = null;
    }

    // 配置
    const config = globeStyle === 'realistic' ? {
      globeImage: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      atmosphereColor: '#4488ff',
    } : {
      globeImage: '//unpkg.com/three-globe/example/img/earth-dark.jpg',
      atmosphereColor: '#ff4444',
    };

    // 创建地球
    const globe = window.Globe()(containerRef.current)
      .globeImageUrl(config.globeImage)
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .pointLat('lat')
      .pointLng('lng')
      .pointColor('color')
      .pointAltitude('altitude')
      .pointRadius('radius')
      .pointLabel((d: any) => `<b>${d.name}</b><br/>${d.count} ${isZh ? '篇文章' : 'articles'}`)
      .atmosphereColor(config.atmosphereColor)
      .atmosphereAltitude(0.15)
      .width(containerRef.current.clientWidth)
      .height(containerRef.current.clientHeight);

    globe.pointOfView({ lat: 30, lng: 0, altitude: 2.5 });
    
    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
    }

    globeRef.current = globe;
  }, [scriptLoaded, globeStyle, isZh]);

  // 更新数据（只在 locations 变化时）
  useEffect(() => {
    if (!globeRef.current || !locations || locations.length === 0) return;

    const points = locations.map(loc => ({
      lat: loc.lat,
      lng: loc.lng,
      name: loc.name,
      count: loc.count,
      color: loc.count >= 20 ? '#ff4444' : loc.count >= 5 ? '#ffaa00' : '#44ff88',
      altitude: Math.min(loc.count / 50, 0.5),
      radius: Math.max(0.3, Math.min(loc.count / 10, 1.5)),
    }));

    globeRef.current.pointsData(points);
  }, [locations]);

  return (
    <div className="globe-container">
      <div ref={containerRef} className="globe-canvas" />
      
      <div className="globe-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#44ff88' }}></span>
          <span className="legend-text">{isZh ? '低 (1-4)' : 'Low (1-4)'}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#ffaa00' }}></span>
          <span className="legend-text">{isZh ? '中 (5-19)' : 'Mid (5-19)'}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#ff4444' }}></span>
          <span className="legend-text">{isZh ? '高 (20+)' : 'High (20+)'}</span>
        </div>
      </div>
    </div>
  );
};

export default GlobeComponent;
