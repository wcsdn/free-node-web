/**
 * CancelEffect - 取消效果弹框内容组件
 * 
 * 功能：取消免战等持续效果确认
 */
import React from 'react';
import { Modal } from '../common/Modal';

interface CancelEffectProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** 效果名称 */
  effectName: string;
  /** 效果类型 */
  effectType?: number;
}

export const PopUpCancelEffect: React.FC<CancelEffectProps> = ({
  open,
  onClose,
  onConfirm,
  effectName,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="取消效果"
      width={300}
      footer={
        <div className="popup_button">
          <button className="btn-primary" onClick={handleConfirm}>
            确定
          </button>
          <button
            className="btn-default"
            onClick={onClose}
            style={{ marginLeft: 30 }}
          >
            取消
          </button>
        </div>
      }
    >
      <div className="cancel-effect-content" style={{ padding: '10px 0' }}>
        <p>
          确认取消<span className="font_bold" style={{ fontWeight: 'bold' }}>
            {effectName}
          </span>效果？
        </p>
      </div>
    </Modal>
  );
};

export default PopUpCancelEffect;
