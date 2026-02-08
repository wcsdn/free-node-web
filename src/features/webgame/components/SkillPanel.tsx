/**
 * SkillPanel - 技能面板 (简化版)
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';
import { getApiBase, getAuthHeaders } from '../utils/api';

export const SkillPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [skills, setSkills] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${getApiBase()}/api/skill`, { headers: getAuthHeaders() }).then(r => r.json()),
      fetch(`${getApiBase()}/api/skill/configs`, { headers: getAuthHeaders() }).then(r => r.json()),
    ]).then(([data1, data2]) => {
      if (data1.success) setSkills(data1.data?.skills || []);
      if (data2.success) setConfigs(data2.data?.skills || []);
      setLoading(false);
    });
  }, []);

  const handleUpgrade = async (skillId: number) => {
    await fetch(`${getApiBase()}/api/skill/${skillId}/upgrade`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  };

  return (
    <GameCard title="技能">
      {loading ? <p>加载中...</p> : (
        <>
          {skills.map(s => {
            const config = configs.find(c => c.id === s.staticIndex);
            return (
              <div key={s.id} style={{ padding: 10, marginBottom: 10, border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#00FF00' }}>{s.name || config?.name || '未知技能'}</span>
                  <span>Lv.{s.level}</span>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 5 }}>{config?.description}</div>
                <GameButton onClick={() => handleUpgrade(s.id)} style={{ marginTop: 5 }}>升级</GameButton>
              </div>
            );
          })}
          <GameButton onClick={onClose}>关闭</GameButton>
        </>
      )}
    </GameCard>
  );
};
