/**
 * CityUpgradePanel - 城市升级面板
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';
import { getApiBase, getAuthHeaders } from '../../utils/api';

interface UpgradeInfo {
  currentLevel: number;
  cost: { money: number; food: number };
  nextLevel: number;
}

export const CityUpgradePanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [info, setInfo] = useState<UpgradeInfo | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${getApiBase()}/api/game/city`, {
      headers: getAuthHeaders(),
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setInfo({
          currentLevel: data.data.prosperity || 100,
          cost: { money: 1000, food: 1000 },
          nextLevel: (data.data.prosperity || 100) + 100,
        });
      }
    });
  }, []);

  const handleUpgrade = async () => {
    await fetch(`${getApiBase()}/api/game/city-interior/upgrade`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prosperity: 100 }),
    });
    setMessage('升级成功');
  };

  return (
    <GameCard title="城市升级">
      {info ? (
        <>
          <div style={{ marginBottom: 20 }}>
            <div>当前繁荣度: {info.currentLevel}</div>
            <div>升级消耗: 铜币 {info.cost.money} / 粮食 {info.cost.food}</div>
          </div>
          {message && <p style={{ color: '#00FF00' }}>{message}</p>}
          <GameButton onClick={handleUpgrade}>升级</GameButton>
          <GameButton onClick={onClose} style={{ marginLeft: 10 }}>关闭</GameButton>
        </>
      ) : <p>加载中...</p>}
    </GameCard>
  );
};
