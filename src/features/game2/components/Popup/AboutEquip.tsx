/**
 * PopUpAboutEquip - 物品操作组件
 * 
 * 功能：
 * - 物品使用/购买/出售/分解/修复/卸下
 * - 根据操作类型显示不同内容
 * 
 * 对应 PopUp.js: PopUpAboutEquip(id)
 * 
 * 操作类型 (pos):
 * - 33: 回收物品
 * - 37: 使用物品
 * - 101: 使用节日礼包
 * - 35: 购买物品
 * - 32: 出售物品(输入价格)
 * - 42: 修复物品
 * - 43: 卸下物品
 * - 47: 分解物品
 */
import React, { useState } from 'react';
import { Modal } from '../common/Modal';

export type EquipActionType = 33 | 37 | 35 | 32 | 42 | 43 | 47 | 101;

export interface ItemInfo {
  id?: number;
  name: string;
  price?: number;
  sellMoney?: number;
  sellFood?: number;
  useGold?: number;
  buyGold?: number;
  staticIndex?: number;
}

export interface AboutEquipProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 确认回调 */
  onConfirm: (price?: number) => void;
  /** 操作类型 */
  actionType: EquipActionType;
  /** 物品信息 */
  item: ItemInfo;
  /** 宽度 */
  width?: number;
}

// 操作类型对应的文本配置
const ACTION_CONFIG: Record<EquipActionType, { title: string; hasGold: boolean; goldLabel: string }> = {
  33: { title: '回收物品', hasGold: false, goldLabel: '售出获得' },
  37: { title: '使用物品', hasGold: true, goldLabel: '使用消耗' },
  35: { title: '购买物品', hasGold: true, goldLabel: '购买价格' },
  32: { title: '出售物品', hasGold: false, goldLabel: '出售价格' },
  42: { title: '修复物品', hasGold: true, goldLabel: '修复费用' },
  43: { title: '卸下物品', hasGold: false, goldLabel: '' },
  47: { title: '分解物品', hasGold: false, goldLabel: '分解获得' },
  101: { title: '使用节日礼包', hasGold: true, goldLabel: '使用消耗' },
};

export const PopUpAboutEquip: React.FC<AboutEquipProps> = ({
  open,
  onClose,
  onConfirm,
  actionType,
  item,
  width = 280,
}) => {
  const [sellPrice, setSellPrice] = useState('');
  const config = ACTION_CONFIG[actionType];

  const handleConfirm = () => {
    if (actionType === 32) {
      // 出售物品需要输入价格
      onConfirm(parseInt(sellPrice, 10) || 0);
    } else {
      onConfirm();
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setSellPrice(value);
  };

  const renderContent = () => {
    switch (actionType) {
      case 33: // 回收物品
        return (
          <div className="equip-popup-content">
            <p className="item-name">
              <span className="label">物品：</span>
              <span className="value">{item.name}</span>
            </p>
            <div className="item-sell-info">
              <span className="label">售出获得：</span>
              <div className="resource-row">
                {item.sellMoney && (
                  <span className="resource-item">
                    <img src="img/4/1.gif" alt="金币" />
                    {item.sellMoney}
                  </span>
                )}
                {item.sellFood && (
                  <span className="resource-item">
                    <img src="img/4/2.gif" alt="粮食" />
                    {item.sellFood}
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case 37: // 使用物品
      case 101: // 使用节日礼包
        return (
          <div className="equip-popup-content">
            <p className="item-name">
              <span className="label">物品：</span>
              <span className="value">{item.name}</span>
            </p>
            {item.useGold && item.useGold > 0 && (
              <div className="item-gold-info">
                <span className="label">使用消耗：</span>
                <span className="resource-item">
                  <img src="img/4/4.gif" alt="元宝" />
                  {item.useGold}
                </span>
              </div>
            )}
          </div>
        );

      case 35: // 购买物品
        return (
          <div className="equip-popup-content">
            <p className="item-name">
              <span className="label">物品：</span>
              <span className="value">{item.name}</span>
            </p>
            <div className="item-gold-info">
              <span className="label">购买价格：</span>
              <span className="resource-item">
                <img src="img/4/4.gif" alt="元宝" />
                {item.buyGold}
              </span>
            </div>
          </div>
        );

      case 32: // 出售物品(输入价格)
        return (
          <div className="equip-popup-content">
            <p className="item-name">
              <span className="label">物品：</span>
              <span className="value">{item.name}</span>
            </p>
            <div className="sell-price-input">
              <span className="label">出售价格：</span>
              <input
                type="text"
                className="input-sell"
                maxLength={6}
                value={sellPrice}
                onChange={handlePriceChange}
                placeholder="请输入价格"
              />
              <span className="unit">金币</span>
            </div>
          </div>
        );

      case 42: // 修复物品
        return (
          <div className="equip-popup-content">
            <p className="item-name">
              <span className="label">物品：</span>
              <span className="value">{item.name}</span>
            </p>
            {item.useGold && item.useGold > 0 && (
              <div className="item-gold-info">
                <span className="label">修复费用：</span>
                <span className="resource-item">
                  <img src="img/4/4.gif" alt="元宝" />
                  {item.useGold}
                </span>
              </div>
            )}
          </div>
        );

      case 43: // 卸下物品
        return (
          <div className="equip-popup-content">
            <p className="item-name">
              确定卸下此装备？
            </p>
          </div>
        );

      case 47: // 分解物品
        return (
          <div className="equip-popup-content">
            <p className="item-name">
              <span className="label">物品：</span>
              <span className="value">{item.name}</span>
            </p>
            <p className="item-hint">
              分解后将获得一定材料
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={config.title}
      width={width}
      showClose={true}
      closeOnOverlayClick={false}
      footer={
        <div className="popup-button">
          <button className="popup-btn primary" onClick={handleConfirm}>
            确定
          </button>
          <button className="popup-btn" onClick={onClose} style={{ marginLeft: '20px' }}>
            取消
          </button>
        </div>
      }
    >
      {renderContent()}
    </Modal>
  );
};

export default PopUpAboutEquip;
