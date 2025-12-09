/**
 * ChatBtn - Ghost Oracle 悬浮按钮
 *
 * 右下角的神秘入口
 */

import React, { useState, useEffect } from 'react';
import Backdrop from '../Backdrop';
import ChatPopup from '../ChatPopup';
import LazyRabbit from '../LazyRabbit';
import { useSoundEffect } from '../../hooks/useSoundEffect';
import { useLanguage } from '../../hooks/useLanguage';
import './styles.css';

export const ChatBtn: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { playClick, playHover } = useSoundEffect();
  const { language } = useLanguage();

  const title = language === 'zh' ? '神谕兔兔' : 'GHOST ORACLE';

  const handleOpen = () => {
    playClick();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // ESC 键关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // 打开时锁定 body 滚动（包括移动端触摸滚动）
  useEffect(() => {
    if (isOpen) {
      // 保存当前滚动位置
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // 恢复滚动位置
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* FAB 按钮 - 使用兔子图标 */}
      <button
        className="chat-btn"
        onClick={handleOpen}
        onMouseEnter={playHover}
        aria-label="Open Ghost Oracle"
        title="Ghost Oracle"
      >
        <span className="chat-btn-icon">
          <LazyRabbit size="sm" />
        </span>
        <span className="chat-btn-pulse" />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <>
          <Backdrop onClick={handleClose} zIndex={9998} />
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            {/* 兔子趴在顶部边缘 */}
            <div className="chat-modal-rabbit">
              <LazyRabbit size="lg" />
            </div>
            <div className="chat-modal-header">
              <div className="chat-modal-title">
                <span>{title}</span>
              </div>
              <button onClick={handleClose} className="chat-modal-close">
                ✕
              </button>
            </div>
            <div className="chat-modal-body">
              <ChatPopup />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ChatBtn;
