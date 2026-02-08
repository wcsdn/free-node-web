/**
 * GuildPanel - 帮派面板 (简化版)
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';
import { getApiBase, getAuthHeaders } from '../utils/api';

export const GuildPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [guild, setGuild] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiBase()}/api/guild/my`, {
      headers: getAuthHeaders(),
    }).then(res => res.json()).then(data => {
      if (data.success) setGuild(data.data);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    const name = prompt('请输入帮派名称:');
    if (!name) return;
    const res = await fetch(`${getApiBase()}/api/guild/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.success) setGuild(data.data);
  };

  const handleDonate = async () => {
    await fetch(`${getApiBase()}/api/guild/donate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ gold: 100 }),
    });
  };

  return (
    <GameCard title="帮派">
      {loading ? <p>加载中...</p> : !guild?.hasGuild ? (
        <>
          <p style={{ textAlign: 'center', color: '#888' }}>你还没有帮派</p>
          <GameButton onClick={handleCreate}>创建帮派</GameButton>
        </>
      ) : (
        <>
          <div style={{ padding: 15, background: 'rgba(0, 255, 0, 0.1)', marginBottom: 15 }}>
            <div style={{ color: '#00FF00', fontSize: 20 }}>{guild.guild?.name}</div>
            <div style={{ color: '#888', marginTop: 5 }}>等级: {guild.guild?.level}</div>
          </div>
          <div style={{ marginBottom: 15 }}>
            <div>我的职位: {guild.role}</div>
            <div>我的贡献: {guild.contribution}</div>
          </div>
          <GameButton onClick={handleDonate}>捐献 (100金币)</GameButton>
        </>
      )}
      <GameButton onClick={onClose} style={{ marginTop: 10 }}>关闭</GameButton>
    </GameCard>
  );
};
