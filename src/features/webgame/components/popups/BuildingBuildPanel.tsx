/**
 * BuildingBuildPanel - 建筑建造面板
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';
import { getApiBase, getAuthHeaders } from '../../utils/api';

interface Building {
  id: number;
  name: string;
  type: string;
  level: number;
  position: number;
}

export const BuildingBuildPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Building | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${getApiBase()}/api/game/building/list`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(res => res.json()).then(data => {
      if (data.success) setBuildings(data.data || []);
      setLoading(false);
    });
  }, []);

  const handleBuild = async () => {
    if (!selected) return setMessage('请选择建筑');
    await fetch(`${getApiBase()}/api/game/building`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ config_id: selected.id, position: 1 }),
    });
    setMessage('建造成功');
  };

  return (
    <GameCard title="建造建筑">
      {loading ? <p>加载中...</p> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {buildings.map(b => (
              <div
                key={b.id}
                onClick={() => setSelected(b)}
                style={{
                  padding: 15,
                  border: selected?.id === b.id ? '2px solid #00FF00' : '1px solid #333',
                  cursor: 'pointer',
                  background: selected?.id === b.id ? 'rgba(0, 255, 0, 0.1)' : 'transparent',
                }}
              >
                <div>{b.name}</div>
                <div style={{ fontSize: 12, color: '#888' }}>Lv.{b.level}</div>
              </div>
            ))}
          </div>
          {message && <p style={{ color: '#00FF00' }}>{message}</p>}
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <GameButton onClick={handleBuild}>建造</GameButton>
            <GameButton onClick={onClose}>关闭</GameButton>
          </div>
        </>
      )}
    </GameCard>
  );
};
