/**
 * ChatPanel - 新版聊天面板
 * 赛博朋克风格
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameInput, GameButton } from '@/shared/components/game';
import styles from './ChatPanel.module.css';

interface Message {
  id: number;
  sender: string;
  content: string;
  time: string;
  channel: string;
}

interface ChatPanelProps {
  walletAddress: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ walletAddress }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentChannel, setCurrentChannel] = useState('world');

  useEffect(() => {
    setMessages([
      { id: 1, sender: '系统', content: '欢迎来到剑侠情缘！', time: '12:00', channel: 'world' },
      { id: 2, sender: '玩家_A', content: '有人一起副本吗？', time: '12:05', channel: 'world' },
    ]);
  }, []);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg: Message = {
      id: Date.now(),
      sender: '我',
      content: inputText,
      time: new Date().toLocaleTimeString().split(' ')[0],
      channel: currentChannel,
    };
    setMessages([...messages, newMsg]);
    setInputText('');
  };

  const channels = [
    { id: 'world', name: '世界', icon: '🌍' },
    { id: 'city', name: '城市', icon: '🏰' },
    { id: 'corps', name: '军团', icon: '⚔️' },
    { id: 'private', name: '私聊', icon: '💬' },
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <span className={styles.glitch} data-text="CHAT">CHAT</span>
      </h1>

      {/* 频道选择 */}
      <div className={styles.channels}>
        {channels.map((ch) => (
          <button
            key={ch.id}
            className={[styles.channelBtn, currentChannel === ch.id ? styles.active : ''].join(' ')}
            onClick={() => setCurrentChannel(ch.id)}
          >
            <span className={styles.channelIcon}>{ch.icon}</span>
            <span>{ch.name}</span>
          </button>
        ))}
      </div>

      {/* 消息列表 */}
      <GameCard className={styles.messageCard}>
        <div className={styles.messageList}>
          {messages.map((msg) => (
            <div key={msg.id} className={styles.messageItem}>
              <div className={styles.messageHeader}>
                <span className={styles.sender}>{msg.sender}</span>
                <span className={styles.time}>{msg.time}</span>
              </div>
              <div className={styles.content}>{msg.content}</div>
            </div>
          ))}
        </div>
      </GameCard>

      {/* 输入框 */}
      <div className={styles.inputArea}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="输入消息..."
          className={styles.chatInput}
        />
        <GameButton onClick={sendMessage}>发送</GameButton>
      </div>
    </div>
  );
};

export default ChatPanel;
