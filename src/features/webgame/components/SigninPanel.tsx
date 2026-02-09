/**
 * SigninPanel - 签到面板 (简化版)
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';
import { getApiBase, getAuthHeaders } from '../utils/api';

interface SigninPanelProps {
  onClose?: () => void;
}

export const SigninPanel: React.FC<SigninPanelProps> = ({ onClose }) => {
  const [signedIn, setSignedIn] = useState(false);
  const [days, setDays] = useState(0);

  useEffect(() => {
    fetch(`${getApiBase()}/api/signin`, {
      headers: getAuthHeaders(),
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setSignedIn(data.data?.signedIn || false);
        setDays(data.data?.signinDays || 0);
      }
    });
  }, []);

  const handleSignin = async () => {
    const res = await fetch(`${getApiBase()}/api/signin`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (data.success) {
      setSignedIn(true);
      setDays(d => d + 1);
    }
  };

  return (
    <GameCard title="每日签到">
      <div style={{ textAlign: 'center', padding: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>📅</div>
        <div style={{ marginBottom: 20 }}>
          已连续签到 <span style={{ color: '#00FF00', fontSize: 24 }}>{days}</span> 天
        </div>
        {signedIn ? (
          <div style={{ color: '#00FF00' }}>✓ 今日已签到</div>
        ) : (
          <GameButton onClick={handleSignin}>签到</GameButton>
        )}
      </div>
      <GameButton onClick={onClose} style={{ marginTop: 20 }}>关闭</GameButton>
    </GameCard>
  );
};

export default SigninPanel;
