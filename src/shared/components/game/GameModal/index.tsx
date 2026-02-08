/**
 * GameModal - 赛博朋克风格模态框
 */
import React, { useEffect, useRef } from 'react';
import styles from './GameModal.module.css';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export const GameModal: React.FC<GameModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className={styles.overlay} 
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className={[styles.modal, styles[size]].join(' ')}>
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export default GameModal;
