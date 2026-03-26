/**
 * PopUpChoose - 选择框组件
 * 
 * 功能：
 * - 确认/取消操作对话框
 * - 支持多种场景：拆除建筑、遣返侠客、删除邮件、退出游戏等
 * 
 * 对应 PopUp.js: PopUpChoose(id)
 */
import React from 'react';
import { Modal } from '../common/Modal';

export type ChooseHandleType = 
  | 5   // 拆除建筑
  | 17  // 遣返侠客
  | 23  // 其他确认
  | 24  // 遣返侠客
  | 49  // 确认操作
  | 15  // 特殊确认
  | 40; // 特殊确认

export interface ChooseDialogProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调（取消） */
  onClose: () => void;
  /** 确认回调 */
  onConfirm: () => void;
  /** 标题 */
  title?: string;
  /** 消息内容 */
  message: string;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 宽度 */
  width?: number;
}

export const PopUpChoose: React.FC<ChooseDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  width = 280,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={width}
      showClose={true}
      closeOnOverlayClick={false}
      footer={
        <div className="popup-button">
          <button className="popup-btn primary" onClick={onConfirm}>
            {confirmText}
          </button>
          <button className="popup-btn" onClick={onClose} style={{ marginLeft: '20px' }}>
            {cancelText}
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

/**
 * Predefined choose dialogs for common scenarios
 */
export interface BuildingDemolishProps extends Omit<ChooseDialogProps, 'message'> {
  buildingName: string;
  buildingLevel: number;
}

export const PopUpChooseDemolish: React.FC<BuildingDemolishProps> = ({
  buildingName,
  buildingLevel,
  ...props
}) => (
  <PopUpChoose
    {...props}
    message={`确定拆除${buildingName}${buildingLevel}吗？`}
  />
);

export interface HeroRecallProps extends Omit<ChooseDialogProps, 'message'> {
  heroName: string;
}

export const PopUpChooseHeroRecall: React.FC<HeroRecallProps> = ({
  heroName,
  ...props
}) => (
  <PopUpChoose
    {...props}
    message={`确定遣返${heroName}吗？`}
  />
);

export interface ExitGameProps extends Omit<ChooseDialogProps, 'message'> {
  message?: string;
}

export const PopUpChooseExit: React.FC<ExitGameProps> = ({
  message = '确定退出游戏吗？',
  ...props
}) => (
  <PopUpChoose
    {...props}
    message={message}
  />
);

export default PopUpChoose;
