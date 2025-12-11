/**
 * LiveCounter - 在线人数显示 + 聊天室入口
 */

import React from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useLivePresence } from '@/shared/hooks/useLivePresence';
import { useLanguage } from '@/shared/hooks/useLanguage';
import './styles.css';

interface LiveCounterProps {
  onOpenChat: () => void;
}

export const LiveCounter: React.FC<LiveCounterProps> = ({ onOpenChat }) => {
  const { count, connected } = useLivePresence();
  const { isConnected: walletConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { language } = useLanguage();

  const handleClick = () => {
    if (!connected) return;
    if (!walletConnected) {
      openConnectModal?.();
      return;
    }
    onOpenChat();
  };

  const hallText = language === 'zh' ? '交易大厅' : 'Trading Hall';
  const connectingText = language === 'zh' ? '连接中...' : 'Connecting...';
  const titleText = walletConnected 
    ? (language === 'zh' ? '点击打开聊天室' : 'Click to open chat')
    : (language === 'zh' ? '请先连接钱包' : 'Connect wallet first');

  return (
    <div 
      className={`live-counter ${connected ? 'connected' : 'disconnected'}`}
      onClick={handleClick}
      title={titleText}
    >
      <span className="live-dot" />
      <span className="live-text">
        {connected ? (
          <>🏛️ {hallText} <strong>{count}</strong></>
        ) : (
          connectingText
        )}
      </span>
      {connected && <span className="live-chat-hint">💬</span>}
    </div>
  );
};

export default LiveCounter;
