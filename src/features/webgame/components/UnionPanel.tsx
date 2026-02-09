/**
 * UnionPanel - 联盟/军团面板 (简化版)
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';
import { getApiBase, getAuthHeaders } from '../utils/api';

export const UnionPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [corps, setCorps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiBase()}/api/corps`, {
      headers: getAuthHeaders(),
    }).then(res => res.json()).then(data => {
      if (data.success) setCorps(data.data || []);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    const name = prompt('军团名称:');
    if (!name) return;
    const res = await fetch(`${getApiBase()}/api/corps`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, cityId: 1, formation: 0 }),
    });
    const data = await res.json();
    if (data.success) setCorps(prev => [...prev, data.data]);
  };

  return (
    <GameCard title="军团">
      {loading ? <p>加载中...</p> : (
        <>
          {corps.length === 0 ? (
            <>
              <p style={{ color: '#888', textAlign: 'center' }}>暂无军团</p>
              <GameButton onClick={handleCreate}>创建军团</GameButton>
            </>
          ) : (
            <>
              {corps.map(c => (
                <div key={c.id} style={{ padding: 15, marginBottom: 10, border: '1px solid #333', background: 'rgba(0, 255, 0, 0.05)' }}>
                  <div style={{ color: '#00FF00', fontSize: 18 }}>{c.name}</div>
                  <div style={{ color: '#888', marginTop: 5 }}>城市: {c.cityName}</div>
                  <div style={{ color: '#888' }}>阵型: {['鱼鳞阵', '锋矢阵', '鹤翼阵', '八卦阵'][c.formation] || '未知'}</div>
                </div>
              ))}
              <GameButton onClick={handleCreate}>创建军团</GameButton>
            </>
          )}
          <GameButton onClick={onClose} style={{ marginLeft: 10 }}>关闭</GameButton>
        </>
      )}
    </GameCard>
  );
};

export default UnionPanel;
