/**
 * GhostChat - 公共聊天室
 * 基于 WebSocket 实时通信
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAccount } from 'wagmi';
import Backdrop from '@/shared/components/Backdrop';
import './styles.css';

// 统一使用线上地址
const LIVE_WS_URL = 'wss://live.free-node.xyz';

// 兼容 HTTP 环境的 UUID 生成
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

interface Message {
  id: string;
  type: 'chat' | 'system' | 'welcome';
  nickname?: string;
  content?: string;
  message?: string;
  timestamp: number;
}

interface GhostChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GhostChat: React.FC<GhostChatProps> = ({ isOpen, onClose }) => {
  const { address } = useAccount();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [nickname, setNickname] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 生成昵称
  const generateNickname = useCallback(() => {
    if (address) {
      return `0x${address.slice(2, 6)}`;
    }
    return `特工${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
  }, [address]);

  // 连接 WebSocket
  useEffect(() => {
    if (!isOpen) return;

    const nick = generateNickname();
    setNickname(nick);

    const ws = new WebSocket(`${LIVE_WS_URL}?nickname=${encodeURIComponent(nick)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'welcome') {
          setOnlineCount(data.count);
          setNickname(data.nickname);
        } else if (data.type === 'count') {
          setOnlineCount(data.count);
        } else if (data.type === 'chat' || data.type === 'system') {
          setMessages(prev => [...prev.slice(-99), { ...data, id: data.id || generateId() }]);
        }
      } catch {
        // 忽略
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    // 心跳
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
      wsRef.current = null;
    };
  }, [isOpen, generateNickname]);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'chat',
      content: input.trim(),
    }));
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return isOpen ? createPortal(
    <>
      <Backdrop onClick={onClose} zIndex={799} />
      <div className="ghost-chat" onClick={e => e.stopPropagation()}>
        <div className="ghost-chat-header">
          <span className="ghost-chat-title">👻 Ghost Chat</span>
          <span className="ghost-chat-status">
            <span className={`status-dot ${connected ? 'online' : ''}`} />
            {onlineCount} 在线
          </span>
          <button className="ghost-chat-close" onClick={onClose}>✕</button>
        </div>

        <div className="ghost-chat-messages">
          {messages.length === 0 && (
            <div className="ghost-chat-empty">
              欢迎来到 Ghost Chat，{nickname}！<br />
              在这里与其他特工交流...
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`ghost-msg ${msg.type}`}>
              {msg.type === 'system' ? (
                <span className="msg-system">{msg.message}</span>
              ) : (
                <>
                  <span className="msg-nick">{msg.nickname}</span>
                  <span className="msg-content">{msg.content}</span>
                </>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="ghost-chat-input">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connected ? '输入消息...' : '连接中...'}
            disabled={!connected}
            maxLength={500}
          />
          <button onClick={sendMessage} disabled={!connected || !input.trim()}>
            发送
          </button>
        </div>
      </div>
    </>,
    document.body
  ) : null;
};

export default GhostChat;
