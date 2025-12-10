/**
 * LiveCounter - 在线人数显示 + 聊天室入口
 */

import React from 'react';
import { useLivePresence } from '@/shared/hooks/useLivePresence';
import './styles.css';

interface LiveCounterProps {
  onOpenChat: () => void;
}

export const LiveCounter: React.FC<LiveCounterProps> = ({ onOpenChat }) => {
  const { count, connected } = useLivePresence();

  return (
    <div 
      className={`live-counter ${connected ? 'connected' : 'disconnected'}`}
      onClick={() => connected && onOpenChat()}
      title="点击打开聊天室"
    >
      <span className="live-dot" />
      <span className="live-text">
        {connected ? (
          <>👻 <strong>{count}</strong> 在线</>
        ) : (
          '连接中...'
        )}
      </span>
      {connected && <span className="live-chat-hint">💬</span>}
    </div>
  );
};

export default LiveCounter;
