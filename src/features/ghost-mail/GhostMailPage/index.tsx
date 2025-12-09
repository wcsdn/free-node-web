/**
 * Ghost Mail 页面
 */
import React, { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import PageLayout from '@/shared/layouts/PageLayout';
import AccessGuard from '../components/AccessGuard';
import MailTerminal from '../components/MailTerminal';
import { UserStatus } from '@/types/ghost-mail';
import { ghostMailService } from '@/services/ghost-mail';
import { useLanguage } from '@/shared/hooks/useLanguage';

const GhostMailPage: React.FC = () => {
  const { language } = useLanguage();
  const { address } = useAccount();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);

  const handleAccessGranted = useCallback(
    (status: UserStatus) => {
      setUserStatus(() => status);
    },
    []
  );

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

  return (
    <PageLayout title={language === 'en' ? '> GHOST MAIL' : '> 幽灵邮件'}>
      <AccessGuard onAccessGranted={handleAccessGranted}>
        {userStatus && (
          <MailTerminal userStatus={userStatus} onStatusUpdate={handleStatusUpdate} />
        )}
      </AccessGuard>
    </PageLayout>
  );
};

export default GhostMailPage;
