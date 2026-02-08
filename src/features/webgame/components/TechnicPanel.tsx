/**
 * TechnicPanel - 科技面板 (简化版)
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';
import { getApiBase, getAuthHeaders } from '../utils/api';

export const TechnicPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [techs, setTechs] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${getApiBase()}/api/tech`, { headers: getAuthHeaders() }).then(r => r.json()),
      fetch(`${getApiBase()}/api/tech/configs`, { headers: getAuthHeaders() }).then(r => r.json()),
    ]).then(([data1, data2]) => {
      if (data1.success) setTechs(data1.data?.techs || []);
      if (data2.success) setConfigs(data2.data?.techs || []);
      setLoading(false);
    });
  }, []);

  const handleResearch = async (configId: number) => {
    await fetch(`${getApiBase()}/api/tech/research`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ config_id: configId }),
    });
    window.location.reload();
  };

  return (
    <GameCard title="科技">
      {loading ? <p>加载中...</p> : (
        <>
          {configs.map(config => {
            const tech = techs.find(t => t.configId === config.id);
            return (
              <div key={config.id} style={{ padding: 10, marginBottom: 10, border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#00FF00' }}>{config.name}</span>
                  <span>{tech ? `Lv.${tech.level}` : '未研究'}</span>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 5 }}>{config.description}</div>
                {!tech && <GameButton onClick={() => handleResearch(config.id)} style={{ marginTop: 5 }}>研究</GameButton>}
              </div>
            );
          })}
          <GameButton onClick={onClose}>关闭</GameButton>
        </>
      )}
    </GameCard>
  );
};
