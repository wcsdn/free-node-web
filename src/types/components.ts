/**
 * 组件 Props 类型定义
 */

import React from 'react';

/**
 * 按钮变体
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/**
 * 按钮尺寸
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * 按钮组件 Props
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

/**
 * 输入框组件 Props
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * 模态框组件 Props
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * 卡片组件 Props
 */
export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * 加载组件 Props
 */
export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}
