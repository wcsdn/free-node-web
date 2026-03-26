/**
 * ConfirmDialog - 确认对话框组件
 * 
 * 功能：
 * - 简洁的确认/取消对话框
 * - 支持自定义标题、消息、按钮文字
 * - 自动使用 Modal 组件
 */
import React from 'react';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调（取消或关闭按钮） */
  onClose: () => void;
  /** 确认回调 */
  onConfirm: () => void;
  /** 标题 */
  title?: React.ReactNode;
  /** 内容 */
  message?: React.ReactNode;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 确认按钮类型 */
  confirmVariant?: 'primary' | 'danger' | 'success';
  /** 是否显示取消按钮 */
  showCancel?: boolean;
  /** 是否在关闭时自动调用 onClose */
  autoClose?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
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
}) => {
  const handleConfirm = () => {
    onConfirm();
    if (autoClose) {
      onClose();
    }
  };

  const getConfirmClass = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'confirm-dialog-btn danger';
      case 'success':
        return 'confirm-dialog-btn success';
      default:
        return 'confirm-dialog-btn primary';
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={360}
      showClose={false}
      closeOnOverlayClick={false}
      footer={
        <div className="confirm-dialog-footer">
          {showCancel && (
            <button className="confirm-dialog-btn cancel" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button className={getConfirmClass()} onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      }
    >
      {message && <div className="confirm-dialog-message">{message}</div>}
    </Modal>
  );
};

export default ConfirmDialog;
