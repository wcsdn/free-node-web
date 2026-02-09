/**
 * GameButton - 赛博朋克风格按钮
 * 矩阵风格，带扫描线动画
 */
import React from 'react';
import styles from './GameButton.module.css';

interface GameButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  className?: string;
}

const GameButton: React.FC<GameButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  className = ''
}) => {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    disabled ? styles.disabled : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={styles.scanline} />
      <span className={styles.content}>{children}</span>
    </button>
  );
};

export default GameButton;
