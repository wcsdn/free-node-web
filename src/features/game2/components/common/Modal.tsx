/**
 * Modal - 通用弹窗组件
 * 
 * 功能：
 * - 背景遮罩（点击遮罩可关闭）
 * - 关闭按钮（×）
 * - 标题栏 + 内容区
 * - 可选底部操作按钮
 * - ESC 键关闭
 * - 点击遮罩关闭
 */
import React, { useEffect, useCallback } from 'react';

export interface ModalProps {
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
}

export const Modal: React.FC<ModalProps> = ({
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
}) => {
  // ESC 键关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    },
    [open, onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={`modal-overlay ${className}`} onClick={handleOverlayClick}>
      <div
        className="modal-container"
        style={{ width, maxHeight }}
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        {(title || showClose) && (
          <div className="modal-header">
            <div className="modal-title">{title}</div>
            {showClose && (
              <button className="modal-close" onClick={onClose}>
                ×
              </button>
            )}
          </div>
        )}

        {/* 内容区 */}
        <div className="modal-content" style={maxHeight ? { maxHeight: `calc(${maxHeight} - 120px)`, overflowY: 'auto' } : undefined}>
          {children}
        </div>

        {/* 底部操作区 */}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
