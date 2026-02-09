/**
 * HeroList - 武将列表 (简化版)
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';
import { getApiBase, getAuthHeaders } from '../utils/api';

interface Hero {
  id: number;
  name: string;
  quality: number;
  level: number;
  hp: number;
  atk: number;
  def: number;
}

export const HeroList: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiBase()}/api/hero/list`, {
      headers: getAuthHeaders(),
    }).then(res => res.json()).then(data => {
      if (data.success) setHeroes(data.data || []);
      setLoading(false);
    });
  }, []);

  const handleRecruit = async () => {
    const res = await fetch(`${getApiBase()}/api/hero/recruit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ city_id: 1 }),
    });
    const data = await res.json();
    if (data.success) {
      // 重新加载
      window.location.reload();
    }
  };

  const qualityColors = ['', '#888', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];

  return (
    <GameCard title="我的武将">
      {loading ? <p>加载中...</p> : (
        <>
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            {heroes.map(hero => (
              <div key={hero.id} style={{ padding: 10, marginBottom: 10, border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: qualityColors[hero.quality] || '#00FF00' }}>{hero.name}</span>
                  <span>Lv.{hero.level}</span>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 5 }}>
                  攻:{hero.atk} 防:{hero.def} 血:{hero.hp}
                </div>
              </div>
            ))}
          </div>
          <GameButton onClick={handleRecruit} style={{ marginTop: 10 }}>招募武将</GameButton>
          <GameButton onClick={onClose} style={{ marginLeft: 10 }}>关闭</GameButton>
        </>
      )}
    </GameCard>
  );
};

export default HeroList;
