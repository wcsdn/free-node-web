import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useWalletAuth } from '@/shared/hooks/useWalletAuth';
import { sanitizeAndValidate, sanitizeInput } from '../../utils/sanitize';
import { useSoundEffect } from '@/shared/hooks/useSoundEffect';
import { useToast } from '@/shared/components/Toast/ToastContext';
import { ADMIN_ADDRESS } from '@/config/constants';
import './styles.css';

interface GuestbookEntry {
  id: string;
  address: string;
  message: string;
  signature: string;
  timestamp: number;
  avatar: string;
  replyTo?: string; // 回复的消息 ID
}

// 管理员地址（你的钱包地址）
const ADMIN_ADDR = ADMIN_ADDRESS.toLowerCase();

// 生成地址对应的头像表情
const getAvatarForAddress = (address: string): string => {
  const avatars = ['🤖', '👾', '🎮', '🕹️', '💀', '👽', '🛸', '🚀', '⚡', '🔥', '💎', '🌟', '🎯', '🎪', '🎭', '🎨'];
  const index = parseInt(address.slice(2, 10), 16) % avatars.length;
  return avatars[index];
};

const Guestbook: React.FC = () => {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { t } = useLanguage();
  const { isAuthenticated, isSigning, authenticate } = useWalletAuth();
  const { playHover, playClick, playSuccess, playError } = useSoundEffect();
  const { showError } = useToast();
  const [message, setMessage] = useState('');
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  
  const isAdmin = address?.toLowerCase() === ADMIN_ADDR;

  // 恢复未发送的消息（防止签名后刷新丢失）
  useEffect(() => {
    const savedMessage = sessionStorage.getItem('guestbook_draft');
    if (savedMessage) {
      setMessage(savedMessage);
    }
  }, []);

  // 自动保存草稿（实时保存，防止签名时丢失）
  useEffect(() => {
    if (message.trim()) {
      sessionStorage.setItem('guestbook_draft', message);
    } else {
      sessionStorage.removeItem('guestbook_draft');
    }
  }, [message]);

  // 加载留言
  useEffect(() => {
    const stored = localStorage.getItem('guestbook_entries');
    if (stored) {
      setEntries(JSON.parse(stored));
    }
  }, []);

  // 轮询：每 10 秒自动刷新留言（降低频率）
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem('guestbook_entries');
      if (stored) {
        try {
          const parsedEntries = JSON.parse(stored);
          // 只在数据真的变化时才更新
          if (parsedEntries.length !== entries.length) {
            setEntries(parsedEntries);
          }
        } catch (e) {
          console.error('Failed to parse guestbook entries:', e);
        }
      }
    }, 10000); // 从 5 秒改为 10 秒

    return () => clearInterval(interval);
  }, [entries.length]); // 只依赖长度，减少重新创建

  // 提交留言
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 检查是否连接钱包
    if (!address) {
      openConnectModal?.();
      return;
    }
    
    // 检查消息是否为空
    if (!message.trim()) {
      playError();
      showError(t('emptyMessage'));
      return;
    }

    // 安全检查和清理消息
    const validation = sanitizeAndValidate(message, 100);
    
    if (!validation.isValid) {
      playError();
      showError(t('unsafeContent'));
      return;
    }

    const cleanedMessage = validation.cleaned;

    setIsSubmitting(true);
    try {
      // 使用统一的钱包认证签名
      if (!isAuthenticated) {
        // 保存消息到 sessionStorage，防止签名后刷新丢失
        sessionStorage.setItem('guestbook_draft', cleanedMessage);
        
        const success = await authenticate();
        if (!success) {
          playError();
          showError('Signature failed');
          setIsSubmitting(false);
          return;
        }
      }

      const newEntry: GuestbookEntry = {
        id: `${address}-${Date.now()}`,
        address,
        message: cleanedMessage,
        signature: 'authenticated', // 标记已通过认证
        timestamp: Date.now(),
        avatar: getAvatarForAddress(address),
        replyTo: replyTo || undefined,
      };

      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      localStorage.setItem('guestbook_entries', JSON.stringify(updatedEntries));
      
      // 清除草稿
      sessionStorage.removeItem('guestbook_draft');
      
      playSuccess();
      setMessage('');
      setReplyTo(null);
    } catch (error) {
      console.error('提交失败:', error);
      playError();
    } finally {
      setIsSubmitting(false);
    }
  }, [address, message, isAuthenticated, authenticate, replyTo, entries, playSuccess, playError, showError, t, openConnectModal]);

  // 删除单条留言（仅管理员）
  const handleDelete = useCallback((id: string) => {
    if (!isAdmin) return;
    
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    localStorage.setItem('guestbook_entries', JSON.stringify(updatedEntries));
  }, [isAdmin, entries]);

  // 删除所有留言（仅管理员）
  const handleDeleteAll = useCallback(() => {
    if (!isAdmin) return;
    
    if (window.confirm('确定要删除所有留言吗？此操作不可恢复！')) {
      setEntries([]);
      localStorage.setItem('guestbook_entries', JSON.stringify([]));
    }
  }, [isAdmin]);

  // 回复留言
  const handleReply = useCallback((id: string) => {
    setReplyTo(id);
    // 聚焦到输入框
    setTimeout(() => {
      const input = document.querySelector('.form-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, []);

  // 获取被回复的消息
  const getReplyMessage = useCallback((replyToId: string) => {
    return entries.find(entry => entry.id === replyToId);
  }, [entries]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="guestbook-container">
      <div className="guestbook-header">
        <div className="terminal-buttons">
          <span className="btn-close"></span>
          <span className="btn-minimize"></span>
          <span className="btn-maximize"></span>
        </div>
        <div className="guestbook-title">root@intrusion-log:~$</div>
      </div>

      <div className="guestbook-body">
        <div className="guestbook-intro">
          <p className="intro-line">{t('intrusionSystem')}</p>
          <p className="intro-line">{t('leaveYourMark')}</p>
          {/* <p className="intro-line">{hasSigned ? t('signatureVerified') : t('signatureRequired')}</p> */}
          <p className="intro-line">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
        </div>

        {/* 留言表单 */}
        <form onSubmit={handleSubmit} className="guestbook-form">
          {replyTo && (
            <div className="reply-indicator">
              <span>{t('replyingTo')} {formatAddress(getReplyMessage(replyTo)?.address || '')}</span>
              <button type="button" onClick={() => setReplyTo(null)} className="cancel-reply">✕</button>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">{t('yourMessage')}</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('enterMessage')}
              maxLength={100}
              className="form-input"
              disabled={isSubmitting}
            />
            <div className="char-count">{message.length}/100</div>
          </div>
          <button 
            type="submit" 
            className="submit-button"
            disabled={!message.trim() || isSubmitting || isSigning}
            onMouseEnter={playHover}
            onClick={playClick}
          >
            {isSubmitting || isSigning
              ? (isAuthenticated ? t('submitting') : t('signing')) 
              : (replyTo ? t('sendReply') : (isAuthenticated ? t('sendMessage') : t('signAndSubmit')))
            }
          </button>
        </form>

        {/* 留言列表 */}
        <div className="entries-section">
          <div className="section-header">
            <p className="section-title">&gt; {entries.length} {t('detectedIntrusions')}</p>
            {isAdmin && entries.length > 0 && (
              <button onClick={() => { playClick(); handleDeleteAll(); }} onMouseEnter={playHover} className="delete-all-btn" title="Delete All">
                🗑️
              </button>
            )}
          </div>
          <div className="entries-list">
            {entries.length === 0 ? (
              <p className="no-entries">{t('noIntrusions')}</p>
            ) : (
              entries.map((entry) => {
                const replyMessage = entry.replyTo ? getReplyMessage(entry.replyTo) : null;
                return (
                  <div key={entry.id} className="entry-item">
                    <div className="entry-header">
                      <div className="entry-left">
                        <span className="entry-avatar">{entry.avatar}</span>
                        <span className="entry-address">{formatAddress(entry.address)}</span>
                        <span className="entry-time">[{formatTime(entry.timestamp)}]</span>
                      </div>
                      <div className="entry-actions">
                        <button onClick={() => { playClick(); handleReply(entry.id); }} onMouseEnter={playHover} className="action-btn" title="Reply">💬</button>
                        {isAdmin && (
                          <button onClick={() => { playClick(); handleDelete(entry.id); }} onMouseEnter={playHover} className="action-btn delete-btn" title="Delete">🗑️</button>
                        )}
                      </div>
                    </div>
                    
                    {replyMessage && (
                      <div className="reply-context">
                        ↳ {replyMessage.avatar} {formatAddress(replyMessage.address)}: {sanitizeInput(replyMessage.message).slice(0, 25)}...
                      </div>
                    )}
                    
                    <div className="entry-message">
                      {sanitizeInput(entry.message)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guestbook;
