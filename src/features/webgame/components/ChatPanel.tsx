/**
 * 聊天面板组件
 */
import React, { useState, useEffect, useRef, memo } from 'react';
import styles from '../styles/ChatPanel.module.css';
import { getApiBase } from '../utils/api';

interface ChatMessage {
  id: number;
  sender: string;
  name?: string;
  content: string;
  created_at: string;
}

interface ChatConversation {
  partner: string;
  last_message: string;
  last_time: string;
}

interface ChatPanelProps {
  walletAddress: string;
  onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = memo(({ walletAddress }) => {
  const { language } = useLanguage();
  const [channel, setChannel] = useState<1 | 2 | 3>(1); // 1=世界, 2=帮派, 3=私聊
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [privateTo, setPrivateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const i18n = {
    title: language === 'en' ? 'Chat' : '聊天',
    world: language === 'en' ? 'World' : '世界',
    guild: language === 'en' ? 'Guild' : '帮派',
    private: language === 'en' ? 'Private' : '私聊',
    send: language === 'en' ? 'Send' : '发送',
    placeholder: language === 'en' ? 'Type a message...' : '输入消息...',
    noMessages: language === 'en' ? 'No messages yet' : '暂无消息',
    loading: language === 'en' ? 'Loading...' : '加载中...',
    noConversations: language === 'en' ? 'No conversations' : '暂无对话',
    privateTo: language === 'en' ? 'To:' : '发送给:',
    switchChannel: language === 'en' ? 'Switch to' : '切换到',
    empty: language === 'en' ? '—' : '—',
  };

  // 获取消息列表
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const url = channel === 3 && selectedPartner
        ? `${getApiBase()}/api/chat/conversations/${selectedPartner}?limit=50`
        : `${getApiBase()}/api/chat/list?channel=${channel}&limit=50`;
      
      const res = await fetch(url, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      
      if (data.success) {
        if (channel === 3 && selectedPartner) {
          setMessages(data.data.messages || []);
        } else {
          setMessages(data.data.messages || []);
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取私聊会话列表
  const fetchConversations = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/chat/conversations`, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    if (channel === 1 || channel === 2) {
      fetchMessages();
    } else if (channel === 3 && selectedPartner) {
      fetchMessages();
    } else if (channel === 3) {
      fetchConversations();
    }
  }, [channel, selectedPartner, walletAddress]);

  // 定时刷新消息
  useEffect(() => {
    const interval = setInterval(() => {
      if (channel === 1 || channel === 2) {
        fetchMessages();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [channel, selectedPartner]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const handleSend = async () => {
    if (!inputText.trim()) return;

    try {
      const body: any = { channel, content: inputText };
      if (channel === 3) {
        if (selectedPartner) {
          body.toAddress = selectedPartner;
        } else if (privateTo) {
          body.toAddress = privateTo;
        } else {
          alert(language === 'en' ? 'Please select or enter a recipient' : '请选择或输入收件人');
          return;
        }
      }

      const res = await fetch(`${getApiBase()}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': walletAddress || '',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setInputText('');
        fetchMessages();
        if (channel === 3) {
          fetchConversations();
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timeStr: string): string => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return language === 'en' ? 'Just now' : '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}${language === 'en' ? 'm ago' : '分钟前'}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}${language === 'en' ? 'h ago' : '小时前'}`;
    return date.toLocaleDateString();
  };

  const getChannelName = (ch: 1 | 2 | 3): string => {
    switch (ch) {
      case 1: return i18n.world;
      case 2: return i18n.guild;
      case 3: return i18n.private;
    }
  };

  return (
    <PageLayout title={i18n.title} showBackButton={true}>
      <div className={styles.container}>
        {/* 频道切换 */}
        <div className={styles.channelBar}>
          <button
            className={`${styles.channelBtn} ${channel === 1 ? styles.active : ''}`}
            onClick={() => { setChannel(1); setSelectedPartner(null); }}
          >
            🌍 {i18n.world}
          </button>
          <button
            className={`${styles.channelBtn} ${channel === 2 ? styles.active : ''}`}
            onClick={() => { setChannel(2); setSelectedPartner(null); }}
          >
            🏰 {i18n.guild}
          </button>
          <button
            className={`${styles.channelBtn} ${channel === 3 ? styles.active : ''}`}
            onClick={() => setChannel(3)}
          >
            💬 {i18n.private}
          </button>
        </div>

        {/* 私聊收件人选择 */}
        {channel === 3 && !selectedPartner && (
          <div className={styles.privateSection}>
            <div className={styles.privateInput}>
              <label>{i18n.privateTo}</label>
              <input
                type="text"
                value={privateTo}
                onChange={(e) => setPrivateTo(e.target.value)}
                placeholder={language === 'en' ? 'Wallet address' : '钱包地址'}
              />
            </div>
            <div className={styles.conversationList}>
              {conversations.map((conv) => (
                <div
                  key={conv.partner}
                  className={styles.conversationItem}
                  onClick={() => setSelectedPartner(conv.partner)}
                >
                  <div className={styles.convPartner}>{conv.partner.slice(0, 8)}...</div>
                  <div className={styles.convLast}>{conv.last_message}</div>
                  <div className={styles.convTime}>{formatTime(conv.last_time)}</div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className={styles.empty}>{i18n.noConversations}</div>
              )}
            </div>
          </div>
        )}

        {/* 消息列表 */}
        <div className={styles.messageList}>
          {loading && messages.length === 0 ? (
            <div className={styles.loading}>{i18n.loading}</div>
          ) : messages.length === 0 ? (
            <div className={styles.empty}>{i18n.noMessages}</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={styles.messageItem}>
                <div className={styles.messageHeader}>
                  <span className={styles.sender}>{msg.name || msg.sender.slice(0, 8)}</span>
                  <span className={styles.time}>{formatTime(msg.created_at)}</span>
                </div>
                <div className={styles.messageContent}>{msg.content}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className={styles.inputArea}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`${getChannelName(channel)} - ${i18n.placeholder}`}
            rows={2}
          />
          <button className={styles.sendBtn} onClick={handleSend}>
            ➤
          </button>
        </div>
      </div>
    </PageLayout>
  );
});

ChatPanel.displayName = 'ChatPanel';

export default ChatPanel;
