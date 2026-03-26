/**
 * GoldConsumer - 元宝消费确认弹框内容组件
 * 
 * 功能：各种需要消耗元宝/战勋的操作确认
 * subType: 56=快速寻访, 57=占领山寨, 58=放弃占领, 60=赎身
 */
import React, { useState } from 'react';
import { Modal } from '../common/Modal';

interface GoldConsumerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (useGold: boolean) => void;
  /** 56=快速寻访, 57=占领山寨, 58=放弃占领, 60=赎身 */
  subType: 56 | 57 | 58 | 60;
  /** 村镇名称 (subType 57,58) */
  cityName?: string;
  /** 坐标 (subType 57,58) */
  position?: { x: number; y: number };
  /** 占领消耗元宝 (subType 57) */
  occupationGold?: number;
  /** 占领消耗战勋 (subType 57) */
  occupationInsignia?: number;
  /** 赎身战勋消耗 (subType 60) */
  ransomInsignia?: number;
  /** 赎身元宝消耗 (subType 60) */
  ransomGold?: number;
}

export const PopUpGoldConsumer: React.FC<GoldConsumerProps> = ({
  open,
  onClose,
  onConfirm,
  subType,
  cityName = '',
  position,
  occupationGold = 0,
  occupationInsignia = 0,
  ransomInsignia = 500,
  ransomGold = 1,
}) => {
  // subType 60 赎身选项: true=战勋, false=元宝
  const [useGold, setUseGold] = useState(false);

  const renderContent = () => {
    switch (subType) {
      case 56: {
        // 快速寻访确认
        return (
          <p>
            确认使用<strong>快速寻访</strong>功能？
          </p>
        );
      }

      case 57: {
        // 占领山寨
        const pos = position ? `(${position.x},${position.y})` : '';
        return (
          <div>
            <p style={{ marginBottom: 8 }}>
              确认占领{' '}
              <strong style={{ fontWeight: 'bold' }}>{cityName}</strong>
              {pos}？
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>占领后可以使用战勋或元宝购买资源</li>
              <li>占领后每分钟可领取资源</li>
              <li>占领后可派遣侠客驻守</li>
              <li>占领后可建造建筑</li>
              <li>消耗：</li>
              <li>
                <img src="img/4/4.gif" alt="元宝" style={{ marginRight: 4 }} />
                {occupationGold}
              </li>
              <li>
                <img src="img/o/76.gif" alt="战勋" style={{ marginRight: 4 }} />
                {occupationInsignia}
              </li>
            </ul>
          </div>
        );
      }

      case 58: {
        // 放弃占领
        const pos = position ? `(${position.x},${position.y})` : '';
        return (
          <div>
            <p style={{ marginBottom: 8 }}>
              确认放弃{' '}
              <strong style={{ fontWeight: 'bold' }}>{cityName}</strong>
              {pos}？
            </p>
          </div>
        );
      }

      case 60: {
        // 赎身
        return (
          <div>
            <p style={{ marginBottom: 10 }}>请选择赎身方式：</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: 8 }}>
                <label>
                  <input
                    type="radio"
                    name="ransom"
                    checked={!useGold}
                    onChange={() => setUseGold(false)}
                    style={{ marginRight: 8 }}
                  />
                  <img src="img/o/76.gif" alt="战勋" style={{ marginRight: 4 }} />
                  <span>{ransomInsignia}</span>
                </label>
              </li>
              <li>
                <label>
                  <input
                    type="radio"
                    name="ransom"
                    checked={useGold}
                    onChange={() => setUseGold(true)}
                    style={{ marginRight: 8 }}
                  />
                  <img src="img/4/4.gif" alt="元宝" style={{ marginRight: 4 }} />
                  <span>{ransomGold}</span>
                </label>
              </li>
            </ul>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (subType) {
      case 56:
        return '快速寻访';
      case 57:
        return '占领山寨';
      case 58:
        return '放弃占领';
      case 60:
        return '赎身';
      default:
        return '确认';
    }
  };

  const handleConfirm = () => {
    if (subType === 60) {
      onConfirm(useGold);
    } else {
      onConfirm(true);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={getTitle()}
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
      <div className="gold-consumer-content" style={{ padding: '10px 0' }}>
        {renderContent()}
      </div>
    </Modal>
  );
};

export default PopUpGoldConsumer;
