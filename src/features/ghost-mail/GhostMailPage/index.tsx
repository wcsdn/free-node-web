/**
 * Ghost Mail 页面 - 带 Tab 切换
 */
import React, { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import PageLayout from '@/shared/layouts/PageLayout';
import AccessGuard from '../components/AccessGuard';
import MailTerminal from '../components/MailTerminal';
import AccountManager from '../components/AccountManager';
import NurtureStats from '../components/NurtureStats';
import { UserStatus } from '@/types/ghost-mail';
import { ghostMailService } from '@/services/ghost-mail';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useSoundEffect } from '@/shared/hooks/useSoundEffect';
import './styles.css';

type TabType = 'inbox' | 'accounts' | 'nurture';

const GhostMailPage: React.FC = () => {
  const { language } = useLanguage();
  const { address } = useAccount();
  const { playClick } = useSoundEffect();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('inbox');

  const handleAccessGranted = useCallback((status: UserStatus) => {
    setUserStatus(() => status);
  }, []);

  const handleStatusUpdate = useCallback(async () => {
    if (!address) return;
    try {
      const response = await ghostMailService.getStatus(address);
      if (response.success) {
        setUserStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }, [address]);

  const handleTabChange = (tab: TabType) => {
    playClick();
    setActiveTab(tab);
  };

  const isZh = language === 'zh';

  return (
    <PageLayout title={isZh ? '> 幽灵邮件' : '> GHOST MAIL'}>
      <AccessGuard onAccessGranted={handleAccessGranted}>
        {/* Tab 切换 */}
        <div className="ghost-mail-tabs">
          <button
            className={`ghost-mail-tab ${activeTab === 'inbox' ? 'active' : ''}`}
            onClick={() => handleTabChange('inbox')}
          >
            📬 {isZh ? '收件箱' : 'Inbox'}
          </button>
          {userStatus?.isAdmin && (
            <>
              <button
                className={`ghost-mail-tab ${activeTab === 'accounts' ? 'active' : ''}`}
                onClick={() => handleTabChange('accounts')}
              >
                🔐 {isZh ? '账号管理' : 'Accounts'}
              </button>
              <button
                className={`ghost-mail-tab ${activeTab === 'nurture' ? 'active' : ''}`}
                onClick={() => handleTabChange('nurture')}
              >
                🌱 {isZh ? '养号统计' : 'Nurture'}
              </button>
            </>
          )}
        </div>

        {/* Tab 内容 */}
        {activeTab === 'inbox' && userStatus && (
          <MailTerminal userStatus={userStatus} onStatusUpdate={handleStatusUpdate} />
        )}
        {activeTab === 'accounts' && userStatus?.isAdmin && <AccountManager />}
        {activeTab === 'nurture' && userStatus?.isAdmin && <NurtureStats address={address} />}
      </AccessGuard>
    </PageLayout>
  );
};

export default GhostMailPage;
