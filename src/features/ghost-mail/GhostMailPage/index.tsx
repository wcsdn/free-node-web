import React, { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import AccessGuard from '../components/AccessGuard';
import MailTerminal from '../components/MailTerminal';
import { UserStatus } from '../../../types/ghost-mail';
import { API_ENDPOINTS } from '../../../config/constants';

const GhostMail: React.FC = () => {
  const { address } = useAccount();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);

  const handleAccessGranted = useCallback((status: UserStatus) => {
    setUserStatus(status);
  }, []);

  const handleStatusUpdate = useCallback(async () => {
    if (!address) return;

    try {
      const response = await fetch(
        `${API_ENDPOINTS.GHOST_MAIL}/api/status?address=${address}`
      );
      const data = await response.json();

      if (data.success) {
        setUserStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }, [address]);

  return (
    <AccessGuard onAccessGranted={handleAccessGranted}>
      {userStatus && (
        <MailTerminal userStatus={userStatus} onStatusUpdate={handleStatusUpdate} />
      )}
    </AccessGuard>
  );
};

export default GhostMail;
