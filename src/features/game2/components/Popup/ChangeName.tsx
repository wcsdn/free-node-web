/**
 * ChangeName - 改名弹框内容组件
 * 
 * 功能：修改村镇名称、侠客名称或占领信息
 * type: 1=侠客改名, 2=村镇改名, 3=占领信息
 */
import React, { useState } from 'react';
import { Modal } from '../common/Modal';

interface ChangeNameProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  /** 1=侠客改名, 2=村镇改名, 3=占领信息 */
  type: 1 | 2 | 3;
  /** 消耗元宝数量 (type=3时使用) */
  goldCost?: number;
}

export const PopUpChangeName: React.FC<ChangeNameProps> = ({
  open,
  onClose,
  onConfirm,
  type,
  goldCost = 5,
}) => {
  const [newName, setNewName] = useState('');

  const getMaxLength = () => {
    switch (type) {
      case 1:
        return 4; // 侠客名称
      case 2:
        return 9; // 村镇名称
      case 3:
        return 34; // 占领信息
      default:
        return 9;
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case 1:
        return '请输入新的侠客名称';
      case 2:
        return '请输入新的村镇名称';
      case 3:
        return '请输入新的占领信息';
      default:
        return '请输入名称';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 1:
        return '修改侠客名称';
      case 2:
        return '修改村镇名称';
      case 3:
        return '修改占领信息';
      default:
        return '修改名称';
    }
  };

  const getHint = () => {
    switch (type) {
      case 1:
        return '名称不能超过4个汉字';
      case 2:
        return '名称不能超过9个汉字';
      case 3:
        return '名称不能超过34个汉字';
      default:
        return '';
    }
  };

  const handleConfirm = () => {
    if (!newName.trim()) return;
    onConfirm(newName.trim());
    setNewName('');
  };

  const handleClose = () => {
    setNewName('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={getTitle()}
      width={214}
      footer={
        <div className="popup_button">
          <button className="btn-primary" onClick={handleConfirm}>
            确定
          </button>
          <button
            className="btn-default"
            onClick={handleClose}
            style={{ marginLeft: 30 }}
          >
            取消
          </button>
        </div>
      }
    >
      <div className="change-name-content" style={{ padding: '10px 0' }}>
        {type === 3 ? (
          <p style={{ marginBottom: 10 }}>请输入新的占领信息</p>
        ) : (
          <p style={{ marginBottom: 10 }}>请输入新名称</p>
        )}

        <input
          type="text"
          className="input_searchitem"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          maxLength={getMaxLength()}
          placeholder={getPlaceholder()}
          style={{ width: '100%', marginBottom: 8 }}
        />

        <p style={{ color: '#6F6F6F', marginBottom: 8 }}>{getHint()}</p>

        {type === 3 && (
          <>
            <p style={{ marginBottom: 4 }}>元宝消耗：</p>
            <p>
              <img
                src="img/4/4.gif"
                alt="元宝"
                style={{ marginRight: 4 }}
              />
              {goldCost}
            </p>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PopUpChangeName;
