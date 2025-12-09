/**
 * OracleFab - Ghost Oracle 悬浮按钮
 *
 * 右下角的神秘入口
 */

import React, { useState, useEffect } from 'react';
import Backdrop from '../Backdrop';
import OracleTerminal from '../OracleTerminal';
import LazyRabbit from '../LazyRabbit';
import { useSoundEffect } from '../../hooks/useSoundEffect';
import { useLanguage } from '../../hooks/useLanguage';
import './styles.css';

export const OracleFab: React.FC = () => {
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

  return (
    <>
      {/* FAB 按钮 - 使用兔子图标 */}
      <button
        className="oracle-fab"
        onClick={handleOpen}
        onMouseEnter={playHover}
        aria-label="Open Ghost Oracle"
        title="Ghost Oracle"
      >
        <span className="oracle-fab-icon">
          <LazyRabbit size="sm" />
        </span>
        <span className="oracle-fab-pulse" />
      </button>

      {/* Oracle Modal */}
      {isOpen && (
        <>
          <Backdrop onClick={handleClose} zIndex={9998} />
          <div className="oracle-modal" onClick={(e) => e.stopPropagation()}>
            {/* 兔子趴在顶部边缘 */}
            <div className="oracle-modal-rabbit">
              <LazyRabbit size="lg" />
            </div>
            <div className="oracle-modal-header">
              <div className="oracle-modal-title">
                <span>{title}</span>
              </div>
              <button onClick={handleClose} className="oracle-modal-close">
                ✕
              </button>
            </div>
            <div className="oracle-modal-body">
              <OracleTerminal />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default OracleFab;
