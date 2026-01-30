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
  type: 'chat' | 'system' | 'welcome' | 'security_alert' | 'iot_update' | 'announcement';
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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 连接逻辑
  const connect = useCallback((isReconnect = false) => {
    if (!isOpen) return;

    const nick = address ? `0x${address.slice(2, 6)}` : `Agent_${Math.floor(Math.random() * 999)}`;
    setNickname(nick);

    const reconnectParam = isReconnect ? '&reconnect=1' : '';
    const ws = new WebSocket(`${LIVE_WS_URL}?nickname=${encodeURIComponent(nick)}${reconnectParam}`);
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
        } else if (['chat', 'system', 'security_alert', 'iot_update', 'announcement'].includes(data.type)) {
          setMessages(prev => [...prev.slice(-50), { ...data, id: data.id || generateId() }]);
        }
      } catch {
        // 忽略
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      
      // 3秒后自动重连
      if (isOpen) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect(true);
        }, 3000);
      }
    };

    ws.onerror = () => {
      // 静默处理
    };
  }, [isOpen, address]);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    
    try {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        content: input.trim(),
      }));
      setInput('');
    } catch (err) {
      console.error('发送失败:', err);
    }
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
      <div className="ghost-chat terminal-style" onClick={e => e.stopPropagation()}>
        <div className="ghost-chat-header">
          <div className="flex items-center gap-2">
            <span className="status-pulse"></span>
            <span className="text-neon">GHOST_CHAT // {onlineCount} ONLINE</span>
          </div>
          <button className="ghost-chat-close" onClick={onClose}>[X]</button>
        </div>

        <div className="ghost-chat-messages custom-scrollbar">
          {messages.length === 0 && (
            <div className="ghost-chat-empty">
              {'>>> CONNECTED AS '}{nickname}
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`msg-row ${msg.type}`}>
              {msg.type === 'chat' ? (
                <p>
                  <span className="msg-nick">[{msg.nickname}]:</span>
                  <span className={`msg-text ${msg.content?.startsWith('@iot') ? 'text-command' : ''}`}>
                    {msg.content}
                  </span>
                </p>
              ) : (
                <p className="text-system">{'>>> '}{msg.message}</p>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="ghost-chat-input-area">
          <span className="input-prompt">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={input.startsWith('@iot ') ? "ENTER CMD..." : "TYPE MESSAGE..."}
            className={input.startsWith('@iot ') ? 'input-cmd' : ''}
            maxLength={500}
          />
        </div>
      </div>
    </>,
    document.body
  ) : null;
};

export default GhostChat;
