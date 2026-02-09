/**
 * ChatPanel - 聊天面板
 * 原则：移动端优先，简洁设计
 */
import React, { useState } from 'react';
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
      {/* 消息列表 */}
      <div 
        className="h-40 sm:h-48 overflow-y-auto bg-slate-900/50 rounded-lg p-3 mb-3
                   scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
      >
        {loading ? (
          <p className="text-slate-400 text-center py-4">加载中...</p>
        ) : messages.slice(-50).map(m => (
          <div key={m.id} className="mb-2">
            <span className="text-emerald-400 font-mono text-sm">{m.sender}:</span>
            <span className="text-slate-200 ml-2">{m.content}</span>
          </div>
        ))}
      </div>

      {/* 输入框 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="输入消息..."
          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg
                     text-slate-200 placeholder-slate-500
                     focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
        <GameButton onClick={handleSend}>
          发送
        </GameButton>
      </div>

      {/* 关闭按钮 */}
      <GameButton onClick={onClose} variant="secondary" className="w-full mt-2">
        关闭
      </GameButton>
    </GameCard>
  );
};

export default ChatPanel;
