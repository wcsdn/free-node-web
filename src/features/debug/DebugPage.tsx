/**
 * 调试页面 - 检查认证状态和任务完成情况
 */
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWalletAuth } from '@/shared/hooks/useWalletAuth';
import PageLayout from '@/shared/layouts/PageLayout';

export const DebugPage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { authHeader, isAuthenticated, isSigning, authenticate } = useWalletAuth();
  const [questData, setQuestData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  // 获取用户信息
  const fetchUserData = async () => {
    try {
      const headers: HeadersInit = authHeader ? { 'X-Wallet-Auth': authHeader } : {};
      const res = await fetch('https://core.free-node.xyz/api/user', { headers });
      const data = await res.json();
      setUserData(data);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    }
  };

  // 获取任务数据
  const fetchQuestData = async () => {
    try {
      const headers: HeadersInit = authHeader ? { 'X-Wallet-Auth': authHeader } : {};
      const res = await fetch('https://core.free-node.xyz/api/quests', { headers });
      const data = await res.json();
      setQuestData(data);
    } catch (err) {
      console.error('Failed to fetch quest data:', err);
    }
  };

  useEffect(() => {
    if (authHeader) {
      fetchUserData();
      fetchQuestData();
    }
  }, [authHeader]);

  const box = { padding: '8px', marginBottom: '8px', border: '1px solid #0f0', fontSize: '11px', lineHeight: '1.4' };
  
  return (
    <PageLayout title="> DEBUG">
      <div style={{ padding: '15px', color: '#0f0', fontFamily: 'monospace', fontSize: '11px' }}>
        {/* 钱包 */}
        <div style={box}>
          <b>🔗</b> {isConnected ? '✅' : '❌'} | {isAuthenticated ? '✅认证' : '❌未认证'} | {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '无'}
          {!isAuthenticated && isConnected && (
            <button onClick={authenticate} disabled={isSigning} style={{ marginLeft: '10px', padding: '3px 8px', background: '#0f0', color: '#000', border: 'none', cursor: 'pointer' }}>
              {isSigning ? '...' : '签名'}
            </button>
          )}
        </div>

        {/* 用户 */}
        {userData && (
          <div style={box}>
            <b>👤</b> Lv{userData.level}({userData.levelName}) XP:{userData.xp}(Lv{userData.xp_level}) 邀请:{userData.inviteCode||'无'} 邮箱:{userData.mailQuota} AI:{userData.usage?.ai?.today}/{userData.usage?.ai?.limit}
          </div>
        )}

        {/* 任务 */}
        {questData && (
          <div style={box}>
            <b>📋</b> 任务({questData.quests?.length||0})
            {questData.quests?.filter((q: any) => q.type === 'growth').map((q: any) => (
              <div key={q.id} style={{ marginLeft: '15px' }}>
                {q.icon} {q.name_zh.slice(0,4)} {q.progress}/{q.target} {q.completed?'✅':'❌'} {q.claimed?'✅':'❌'}
              </div>
            ))}
            <button onClick={fetchQuestData} style={{ marginTop: '3px', padding: '2px 6px', background: '#0f0', color: '#000', border: 'none', fontSize: '10px', cursor: 'pointer' }}>刷新</button>
          </div>
        )}

        {/* Storage */}
        <div style={box}>
          <b>💾</b> Auth:{localStorage.getItem('ghost_wallet_auth')?'✅':'❌'} Draft:{sessionStorage.getItem('guestbook_draft')?'✅':'❌'}
        </div>
      </div>
    </PageLayout>
  );
};

export default DebugPage;
