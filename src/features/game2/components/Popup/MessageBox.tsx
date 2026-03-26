/**
 * PopUpMessageBox - 消息框组件
 * 
 * 功能：
 * - 显示提示信息
 * - 单个关闭按钮
 * 
 * 对应 PopUp.js: PopUpMessageBox()
 */
import React from 'react';
import { Modal } from '../common/Modal';

export interface MessageBoxProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 消息内容 */
  message: string;
  /** 关闭按钮文字 */
  closeText?: string;
  /** 宽度 */
  width?: number;
}

export const PopUpMessageBox: React.FC<MessageBoxProps> = ({
  open,
  onClose,
  message,
  closeText = '确定',
  width = 280,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      width={width}
      showClose={false}
      closeOnOverlayClick={true}
      footer={
        <div className="popup-button">
          <button className="popup-btn" onClick={onClose}>
            {closeText}
          </button>
        </div>
      }
    >
      <div className="popup-message">
        <p>{message}</p>
      </div>
    </Modal>
  );
};

export default PopUpMessageBox;
