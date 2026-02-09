/**
 * useChat - 聊天状态 Hook
 */
import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage } from '../types/game.types';
import { chatApi } from '../services/game.api';

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

export function useChat(channel = 'global') {
  const [state, setState] = useState<ChatState>({
    messages: [],
    loading: false,
    error: null,
  });

  const loadMessages = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await chatApi.getMessages(channel);
      if (result.success && result.data) {
        setState({ messages: result.data as ChatMessage[], loading: false, error: null });
      } else {
        setState(prev => ({ ...prev, loading: false, error: result.error || 'Failed to load' }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: (err as Error).message }));
    }
  }, [channel]);

  const sendMessage = useCallback(async (content: string) => {
    try {
      const result = await chatApi.sendMessage(content, channel);
      if (result.success) {
        await loadMessages();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [channel, loadMessages]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return { ...state, loadMessages, sendMessage };
}
