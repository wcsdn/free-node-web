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
import { useLanguage } from '../../hooks/useLanguage';
import './styles.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

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
  // 本次弹窗会话是否已验证过
  const [hasVerified, setHasVerified] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();

  // 多语言文本
  const texts = {
    welcomeMain: language === 'zh' ? '你想问啥涅~(￣▽￣)~*' : 'Wake up, Neo...',
    welcomeSub:
      language === 'zh'
        ? '关于 Free-Node 和 Web3 的问题都可以问我哦'
        : 'Ask me anything about Free-Node & Web3',
    placeholder: language === 'zh' ? '输入你的问题...' : 'Type your question...',
    verifyFirst:
      language === 'zh' ? '请先完成人机验证 ↑' : 'Please complete verification ↑',
  };

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      // 标记本次弹窗已验证，token 用完后不再显示验证组件
      if (turnstileToken) {
        setHasVerified(true);
      }
      setTurnstileToken(null);

      if (!response.ok) {
        throw new Error(`Oracle 连接失败: ${response.status}`);
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

      {/* Turnstile 验证 - 只在本次弹窗未验证过且没有 token 时显示 */}
      {!hasVerified && !turnstileToken && (
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
