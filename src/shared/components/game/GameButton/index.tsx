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
}

export { GameButton } from './GameButton';
export { default as GameButton } from './GameButton';
