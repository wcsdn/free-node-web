/**
 * ChatPopup - Ghost Oracle 聊天弹窗
 *
 * Matrix 风格的 AI 聊天终端
 * - CRT 扫描线效果
 * - 打字机输出
 * - Markdown 渲染
 * - Turnstile 人机验证
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Turnstile from 'react-turnstile';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useWalletAuth } from '@/shared/hooks/useWalletAuth';
import './styles.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 等级配置
const LEVEL_CONFIG = {
  zh: ['游客', '觉醒者', 'VIP'],
  en: ['Guest', 'Awakened', 'VIP'],
};

// Worker API 地址
const ORACLE_API =
  import.meta.env.VITE_ORACLE_API || 'https://ghost-oracle.unlocks.workers.dev';

// Turnstile Site Key
const TURNSTILE_SITE_KEY = '0x4AAAAAACFkDvmJNnbofax2';

export const ChatPopup: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [hasVerified, setHasVerified] = useState(false);
  const [quota, setQuota] = useState<{ today: number; limit: number | 'unlimited' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { authHeader, isAuthenticated, isSigning, authenticate } = useWalletAuth();

  // 多语言文本
  const texts = {
    welcomeMain: language === 'zh' ? '尾巴有在晃吗？😏' : 'Wanna see my tail? 😏',
    welcomeSub:
      language === 'zh'
        ? '关于 Free-Node 和 Web3 的问题都可以问我哦'
        : 'Ask me anything about Free-Node & Web3',
    placeholder: language === 'zh' ? '输入你的问题...' : 'Type your question...',
    verifyFirst:
      language === 'zh' ? '请先完成人机验证 ↑' : 'Please complete verification ↑',
    connectWallet: language === 'zh' ? '连接钱包升级配额' : 'Connect wallet for more quota',
    signing: language === 'zh' ? '签名中...' : 'Signing...',
  };

  // 获取用户等级
  const userLevel = isAuthenticated ? 1 : 0;
  const levelName = language === 'zh' ? LEVEL_CONFIG.zh[userLevel] : LEVEL_CONFIG.en[userLevel];

  // 计算剩余次数
  const remainingNum = quota
    ? quota.limit === 'unlimited'
      ? Infinity
      : Math.max(0, (quota.limit as number) - quota.today)
    : null;
  const remaining = remainingNum === null ? '--' : remainingNum === Infinity ? '∞' : remainingNum;
  const isQuotaExhausted = remainingNum !== null && remainingNum <= 0;

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // 初始化时获取配额
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const response = await fetch('https://core.free-node.xyz/api/user', {
          headers: authHeader ? { 'X-Wallet-Auth': authHeader } : {},
        });
        if (response.ok) {
          const data = await response.json();
          if (data.usage?.ai) {
            setQuota({
              today: data.usage.ai.today,
              limit: data.usage.ai.limit === 'unlimited' ? 'unlimited' : data.usage.ai.limit,
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch quota:', err);
      }
    };
    fetchQuota();
  }, [authHeader]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // 聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, [isStreaming]);

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    // 检查 Turnstile 验证（本次弹窗已验证过则跳过）
    if (!hasVerified && !turnstileToken) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: texts.verifyFirst },
      ]);
      return;
    }

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const response = await fetch(ORACLE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(turnstileToken && { 'X-Turnstile-Token': turnstileToken }),
          ...(authHeader && { 'X-Wallet-Auth': authHeader }),
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      // 标记本次弹窗已验证
      if (turnstileToken) {
        setHasVerified(true);
      }
      setTurnstileToken(null);

      // 更新配额信息 (从响应头获取)
      const usageToday = response.headers.get('X-Usage-Today');
      const usageLimit = response.headers.get('X-Usage-Limit');
      if (usageToday && usageLimit) {
        setQuota({
          today: parseInt(usageToday, 10),
          limit: usageLimit === 'Infinity' ? 'unlimited' : parseInt(usageLimit, 10),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Oracle 连接失败: ${response.status}`;
        const tip = errorData.tip ? `\n\n💡 ${errorData.tip}` : '';
        throw new Error(errorMsg + tip);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                setStreamingContent(fullContent);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      // 流结束，添加完整消息
      if (fullContent) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: fullContent },
        ]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `[ERROR] ${errorMsg}\n\n连接 Ghost Oracle 失败，请稍后重试。`,
        },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 简单的 Markdown 渲染
  const renderContent = (content: string) => {
    // 代码块
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
        if (match) {
          const [, lang, code] = match;
          return (
            <pre key={i} className="chat-code-block">
              {lang && <span className="chat-code-lang">{lang}</span>}
              <code>{code.trim()}</code>
            </pre>
          );
        }
      }

      // 行内代码
      const inlineCode = part.split(/(`[^`]+`)/g).map((segment, j) => {
        if (segment.startsWith('`') && segment.endsWith('`')) {
          return (
            <code key={j} className="chat-inline-code">
              {segment.slice(1, -1)}
            </code>
          );
        }
        // 粗体
        return segment.split(/(\*\*[^*]+\*\*)/g).map((s, k) => {
          if (s.startsWith('**') && s.endsWith('**')) {
            return <strong key={k}>{s.slice(2, -2)}</strong>;
          }
          return s;
        });
      });

      return <span key={i}>{inlineCode}</span>;
    });
  };

  return (
    <div className="chat-popup">
      {/* CRT 扫描线效果 */}
      <div className="chat-scanlines" />

      {/* 消息区域 */}
      <div className="chat-messages">
        {/* 欢迎消息 - 简洁版 */}
        {messages.length === 0 && !isStreaming && (
          <div className="chat-welcome">
            <p className="chat-welcome-main">{texts.welcomeMain}</p>
            <p className="chat-welcome-sub">{texts.welcomeSub}</p>
          </div>
        )}

        {/* 历史消息 */}
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message chat-${msg.role}`}>
            <span className="chat-prompt">
              {msg.role === 'user' ? '>' : '◈'}
            </span>
            <div className="chat-content">{renderContent(msg.content)}</div>
          </div>
        ))}

        {/* 流式输出 */}
        {isStreaming && streamingContent && (
          <div className="chat-message chat-assistant chat-streaming">
            <span className="chat-prompt">◈</span>
            <div className="chat-content">
              {renderContent(streamingContent)}
              <span className="chat-cursor">▊</span>
            </div>
          </div>
        )}

        {/* 加载中 */}
        {isStreaming && !streamingContent && (
          <div className="chat-message chat-assistant">
            <span className="chat-prompt">◈</span>
            <div className="chat-content chat-loading">
              <span className="chat-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 配额用尽升级引导 */}
      {isQuotaExhausted && (
        <div className="chat-upgrade-card">
          <div className="upgrade-icon">⚡</div>
          <div className="upgrade-content">
            <p className="upgrade-title">
              {language === 'zh' ? '今日能量已耗尽' : 'Daily quota exhausted'}
            </p>
            <p className="upgrade-desc">
              {!isConnected
                ? (language === 'zh' ? '连接钱包升级为觉醒者，每日 20 次' : 'Connect wallet to get 20/day')
                : !isAuthenticated
                  ? (language === 'zh' ? '签名认证升级为觉醒者，每日 20 次' : 'Verify to get 20/day')
                  : (language === 'zh' ? '升级 VIP 解锁无限次数' : 'Upgrade to VIP for unlimited')}
            </p>
          </div>
          {!isConnected ? (
            <button className="upgrade-btn" onClick={openConnectModal}>
              🔗 {language === 'zh' ? '连接钱包' : 'Connect'}
            </button>
          ) : !isAuthenticated ? (
            <button className="upgrade-btn" onClick={authenticate} disabled={isSigning}>
              🔐 {isSigning ? '...' : (language === 'zh' ? '认证' : 'Verify')}
            </button>
          ) : (
            <button className="upgrade-btn upgrade-vip">
              👑 VIP
            </button>
          )}
        </div>
      )}

      {/* Turnstile 验证 - 只在本次弹窗未验证过且没有 token 时显示 */}
      {!hasVerified && !turnstileToken && !isQuotaExhausted && (
        <div className="chat-turnstile">
          <Turnstile
            sitekey={TURNSTILE_SITE_KEY}
            theme="dark"
            onVerify={(token: string) => {
              console.log('验证成功, Token:', token);
              setTurnstileToken(token);
            }}
            onError={() => {
              console.error('验证失败');
              setTurnstileToken(null);
            }}
            onExpire={() => {
              console.log('Token 过期');
              setTurnstileToken(null);
            }}
          />
        </div>
      )}

      {/* 状态栏 */}
      <div className="chat-status-bar">
        <span className="chat-level">{levelName}</span>
        <span className="chat-quota" title={language === 'zh' ? '今日剩余次数' : 'Remaining today'}>
          ⚡ {language === 'zh' ? `剩余 ${remaining} 次` : `${remaining} left`}
        </span>
        {!isAuthenticated && isConnected && (
          <button
            className="chat-auth-btn"
            onClick={authenticate}
            disabled={isSigning}
          >
            {isSigning ? texts.signing : (language === 'zh' ? '🔐 认证升级' : '🔐 Verify')}
          </button>
        )}
        {!isConnected && (
          <button className="chat-auth-btn" onClick={openConnectModal}>
            🔗 {language === 'zh' ? '连接钱包 +10次' : 'Connect +10'}
          </button>
        )}
      </div>

      {/* 输入区域 */}
      <div className="chat-input-area">
        <span className="chat-input-prompt">{'>_'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={texts.placeholder}
          disabled={isStreaming || (!hasVerified && !turnstileToken)}
          className="chat-input"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          className="chat-send-btn"
          onClick={sendMessage}
          disabled={isStreaming || !input.trim() || (!hasVerified && !turnstileToken)}
          aria-label="Send"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatPopup;
