/**
 * HeroPanel - 武将面板 (简化版)
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
  maxHp: number;
  atk: number;
  def: number;
  skill?: string;
}

export const HeroPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
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
    await fetch(`${getApiBase()}/api/hero/recruit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ city_id: 1 }),
    });
    window.location.reload();
  };

  const handleLevelUp = async (heroId: number) => {
    await fetch(`${getApiBase()}/api/hero/${heroId}/levelup`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    window.location.reload();
  };

  const qualityColors = ['', '#888', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];

  return (
    <GameCard title="武将">
      {loading ? <p>加载中...</p> : (
        <>
          {heroes.map(hero => (
            <div key={hero.id} style={{ padding: 15, marginBottom: 10, border: '1px solid #333', background: 'rgba(0, 255, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: qualityColors[hero.quality] || '#00FF00', fontSize: 18 }}>{hero.name}</span>
                <span>品质 {hero.quality}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 12, color: '#888' }}>
                <div>等级: {hero.level}</div>
                <div>攻击: {hero.atk}</div>
                <div>防御: {hero.def}</div>
                <div>生命: {hero.hp}/{hero.maxHp}</div>
                {hero.skill && <div>技能: {hero.skill}</div>}
              </div>
              <GameButton onClick={() => handleLevelUp(hero.id)} style={{ marginTop: 10 }}>升级</GameButton>
            </div>
          ))}
          <GameButton onClick={handleRecruit}>招募武将</GameButton>
          <GameButton onClick={onClose} style={{ marginLeft: 10 }}>关闭</GameButton>
        </>
      )}
    </GameCard>
  );
};

export default HeroPanel;
