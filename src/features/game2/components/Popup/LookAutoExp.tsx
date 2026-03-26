/**
 * LookAutoExp - 查看自动闭关弹框内容组件
 * 
 * 功能：显示当前闭关修炼状态，可终止闭关
 */
import React from 'react';
import { Modal } from '../common/Modal';

interface LookAutoExpProps {
  open: boolean;
  onClose: () => void;
  onExit: () => void;
  /** 闭关信息 */
  autoExpInfo: {
    /** 闭关时间 */
    time: string;
    /** 总经验 */
    allExp: number;
    /** 当前经验 */
    exp: number;
  };
  /** 经验倍率 */
  expMultiple?: number;
}

export const PopUpLookAutoExp: React.FC<LookAutoExpProps> = ({
  open,
  onClose,
  onExit,
  autoExpInfo,
  expMultiple = 1,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="自动闭关"
      width={264}
      footer={
        <div className="popup_button">
          <button className="btn-danger" onClick={onExit}>
            终止闭关
          </button>
          <button
            className="btn-default"
            onClick={onClose}
            style={{ marginLeft: 30 }}
          >
            关闭
          </button>
        </div>
      }
    >
      <div className="look-auto-exp-content">
        <div id="autoexp">
          <p style={{ textAlign: 'center', marginBottom: 10 }}>
            当前闭关修炼状态
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>
              <span className="purple">
                使用元宝闭关经验 ×{expMultiple}
              </span>
            </li>
            <li style={{ marginBottom: 8 }}>
              <span style={{ color: '#888' }}>闭关时间：</span>
              <span>{autoExpInfo.time}</span>
            </li>
            <li style={{ marginBottom: 8 }}>
              <span style={{ color: '#888' }}>累计获得经验：</span>
              <span>{autoExpInfo.allExp}</span>
            </li>
            <li>
              <span style={{ color: '#888' }}>本次获得经验：</span>
              <span>{autoExpInfo.exp}</span>
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default PopUpLookAutoExp;
