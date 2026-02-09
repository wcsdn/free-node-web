/**
 * ChatPanel - 聊天面板 (简化版)
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';
import { useChat } from '../hooks/useChat';

export const ChatPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { messages, loading, sendMessage } = useChat('global');
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput('');
  };

  return (
    <GameCard title="世界聊天">
      <div style={{ height: 200, overflow: 'auto', marginBottom: 10, padding: 10, background: 'rgba(0,0,0,0.3)' }}>
        {loading ? <p>加载中...</p> : messages.slice(-50).map(m => (
          <div key={m.id} style={{ marginBottom: 5 }}>
            <span style={{ color: '#00FF00' }}>{m.sender}:</span>
            <span style={{ color: '#fff' }}> {m.content}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="输入消息..."
          style={{ flex: 1, padding: 8, background: '#111', border: '1px solid #333', color: '#fff' }}
        />
        <GameButton onClick={handleSend}>发送</GameButton>
      </div>
      <GameButton onClick={onClose} style={{ marginTop: 10 }}>关闭</GameButton>
    </GameCard>
  );
};

export default ChatPanel;
