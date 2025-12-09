/**
 * Button 组件
 */

import React from 'react';
import { useSoundEffect } from '../../../hooks/useSoundEffect';
import type { ButtonProps } from '@/types';
import './styles.css';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  onClick,
  className = '',
  ...props
}) => {
  const { playHover, playClick } = useSoundEffect();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      playClick();
      onClick?.(e);
    }
  };

  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading && 'btn-loading',
    disabled && 'btn-disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseEnter={playHover}
      {...props}
    >
      {loading && <span className="btn-spinner" />}
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
};
