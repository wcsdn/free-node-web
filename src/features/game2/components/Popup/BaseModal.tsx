/**
 * BaseModal - 弹框基类组件
 * 
 * 功能：
 * - 背景遮罩（点击关闭，可配置）
 * - 关闭按钮（×）
 * - 标题栏
 * - 底部操作区（确定/取消按钮）
 * - ESC 键关闭
 * - 统一的动画和样式
 * - 手机端适配
 */
import React, { useEffect, useCallback, useState } from 'react';

/** 按钮变体类型 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
/** 按钮尺寸 */
export type ButtonSize = 'small' | 'medium' | 'large';

export interface BaseModalProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: React.ReactNode;
  /** 内容 */
  children?: React.ReactNode;
  /** 底部操作区 */
  footer?: React.ReactNode;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 点击遮罩是否关闭 */
  closeOnOverlayClick?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 宽度 */
  width?: string | number;
  /** 最大高度 */
  maxHeight?: string | number;
  /** 自定义遮罩颜色 */
  overlayColor?: string;
  /** 是否显示遮罩动画 */
  showOverlayAnimation?: boolean;
  /** 是否显示内容动画 */
  showContentAnimation?: boolean;
  /** 弹框位置 */
  position?: 'center' | 'top' | 'bottom';
  /** z-index 层级 */
  zIndex?: number;
  /** 是否在关闭时等待动画完成 */
  waitAnimationOnClose?: boolean;
  /** 动画时长（毫秒） */
  animationDuration?: number;
}

/**
 * 基础按钮组件
 */
export interface BaseButtonProps {
  /** 按钮文字 */
  children: React.ReactNode;
  /** 点击回调 */
  onClick?: () => void;
  /** 按钮变体 */
  variant?: ButtonVariant;
  /** 按钮尺寸 */
  size?: ButtonSize;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 类型 */
  type?: 'button' | 'submit' | 'reset';
  /** 图标 */
  icon?: React.ReactNode;
  /** 是否占满宽度 */
  fullWidth?: boolean;
}

export const BaseButton: React.FC<BaseButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  icon,
  fullWidth = false,
}) => {
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <button
      type={type}
      className={`base-button base-button--${variant} base-button--${size} ${fullWidth ? 'base-button--full' : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="base-button__loader" />
      ) : (
        <>
          {icon && <span className="base-button__icon">{icon}</span>}
          <span className="base-button__text">{children}</span>
        </>
      )}
    </button>
  );
};

/**
 * 基础弹框组件
 */
export const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  showClose = true,
  closeOnOverlayClick = true,
  className = '',
  width = 480,
  maxHeight,
  overlayColor = 'rgba(0, 0, 0, 0.5)',
  showOverlayAnimation = true,
  showContentAnimation = true,
  position = 'center',
  zIndex = 1000,
  waitAnimationOnClose = true,
  animationDuration = 200,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isHidden, setIsHidden] = useState(!open);

  // 处理关闭动画
  const handleClose = useCallback(() => {
    if (waitAnimationOnClose) {
      setIsClosing(true);
      setTimeout(() => {
        setIsClosing(false);
        setIsHidden(true);
        onClose();
      }, animationDuration);
    } else {
      onClose();
    }
  }, [onClose, waitAnimationOnClose, animationDuration]);

  // ESC 键关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !isClosing) {
        handleClose();
      }
    },
    [open, isClosing, handleClose]
  );

  useEffect(() => {
    if (open) {
      setIsHidden(false);
      setIsClosing(false);
      document.addEventListener('keydown', handleKeyDown);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  // 监听 open 变化
  useEffect(() => {
    if (!open && !isClosing) {
      setIsHidden(true);
    }
  }, [open, isClosing]);

  if (isHidden && !open) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      handleClose();
    }
  };

  const getPositionClass = () => {
    switch (position) {
      case 'top':
        return 'base-modal--top';
      case 'bottom':
        return 'base-modal--bottom';
      default:
        return 'base-modal--center';
    }
  };

  return (
    <div
      className={`base-modal-overlay ${showOverlayAnimation && !isClosing ? 'base-modal-overlay--fade-in' : ''} ${isClosing ? 'base-modal-overlay--fade-out' : ''} ${className}`}
      onClick={handleOverlayClick}
      style={{
        backgroundColor: overlayColor,
        zIndex,
      }}
    >
      <div
        className={`base-modal-container ${getPositionClass()} ${showContentAnimation && !isClosing ? 'base-modal-container--slide-in' : ''} ${isClosing ? 'base-modal-container--slide-out' : ''}`}
        style={{ width }}
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        {(title || showClose) && (
          <div className="base-modal-header">
            <div className="base-modal-title">{title}</div>
            {showClose && (
              <button
                className="base-modal-close"
                onClick={handleClose}
                aria-label="关闭"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* 内容区 */}
        <div
          className="base-modal-content"
          style={maxHeight ? { maxHeight: `calc(${maxHeight} - 120px)`, overflowY: 'auto' } : undefined}
        >
          {children}
        </div>

        {/* 底部操作区 */}
        {footer && <div className="base-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

/**
 * 确认弹框快捷组件
 */
export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: ButtonVariant;
  showCancel?: boolean;
  autoClose?: boolean;
  width?: string | number;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  title = '确认',
  message,
  confirmText = '确认',
  cancelText = '取消',
  confirmVariant = 'primary',
  showCancel = true,
  autoClose = true,
  width = 360,
}) => {
  const handleConfirm = () => {
    onConfirm();
    if (autoClose) {
      onClose();
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title}
      width={width}
      showClose={false}
      closeOnOverlayClick={true}
      footer={
        <div className="base-modal-confirm-footer">
          {showCancel && (
            <BaseButton variant="secondary" onClick={onClose}>
              {cancelText}
            </BaseButton>
          )}
          <BaseButton variant={confirmVariant} onClick={handleConfirm}>
            {confirmText}
          </BaseButton>
        </div>
      }
    >
      {message && <div className="base-modal-confirm-message">{message}</div>}
    </BaseModal>
  );
};

/**
 * 提示弹框快捷组件
 */
export interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  message: React.ReactNode;
  title?: string;
  confirmText?: string;
  width?: string | number;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  open,
  onClose,
  message,
  title = '提示',
  confirmText = '知道了',
  width = 360,
}) => {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onClose}
      title={title}
      message={message}
      confirmText={confirmText}
      showCancel={false}
      autoClose={false}
      width={width}
    />
  );
};

export default BaseModal;
