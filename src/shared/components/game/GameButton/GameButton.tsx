/**
 * GameButton - 通用按钮组件
 * 支持多种变体和大小，使用 Tailwind CSS
 */
import React from 'react';

interface GameButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'emerald' | 'red';
  size?: 'small' | 'medium' | 'large' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const variantStyles = {
  primary: 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500',
  secondary: 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-slate-600',
  danger: 'bg-red-500 text-white hover:bg-red-600 border-red-500',
  emerald: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white border-emerald-500/30',
  red: 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border-red-500/30',
};

const sizeStyles = {
  small: 'px-3 py-1.5 text-xs',
  medium: 'px-4 py-2 text-sm',
  large: 'px-6 py-3 text-base',
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const GameButton: React.FC<GameButtonProps> = ({
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  style,
  className = ''
}) => {
  const baseClasses = `
    relative font-medium rounded-lg transition-all duration-200
    border focus:outline-none focus:ring-2 focus:ring-emerald-500/50
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center justify-center
  `.trim();

  const classes = [
    baseClasses,
    variantStyles[variant] || variantStyles.primary,
    sizeStyles[size] || sizeStyles.medium,
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={disabled || loading}
      style={style}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>加载中...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default GameButton;
