/**
 * useMail - 邮件状态 Hook
 */
import { useState, useCallback, useEffect } from 'react';
import type { Mail } from '../types/game.types';
import { mailApi } from '../services/game.api';

interface MailState {
  mails: Mail[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export function useMail(_walletAddress: string) {
  const [state, setState] = useState<MailState>({
    mails: [],
    unreadCount: 0,
    loading: false,
    error: null,
  });

  const loadMails = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await mailApi.getMails();
      if (result.success && result.data) {
        const mails = (result.data as any).items || [];
        setState({
          mails,
          unreadCount: mails.filter((m: Mail) => !m.read).length,
          loading: false,
          error: null,
        });
      } else {
        setState(prev => ({ ...prev, loading: false, error: result.error || 'Failed to load' }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: (err as Error).message }));
    }
  }, []);

  const markAsRead = useCallback(async (mailId: number) => {
    try {
      await fetch(`/api/mail/${mailId}/read`, { method: 'POST' });
      await loadMails();
    } catch {
      // 静默失败
    }
  }, [loadMails]);

  const deleteMail = useCallback(async (mailId: number) => {
    try {
      await fetch(`/api/mail/${mailId}`, { method: 'DELETE' });
      await loadMails();
    } catch {
      // 静默失败
    }
  }, [loadMails]);

  useEffect(() => {
    loadMails();
  }, [loadMails]);

  return { ...state, loadMails, markAsRead, deleteMail };
}
