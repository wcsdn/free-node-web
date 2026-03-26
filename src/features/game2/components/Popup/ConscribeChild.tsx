/**
 * PopUpConscribeChild - 招募弟子组件
 * 
 * 功能：
 * - 输入招募弟子数量
 * - 显示消耗资源（金币、粮食、人口）
 * - 实时计算总消耗
 * - 支持快速招募（使用元宝）
 * 
 * 对应 PopUp.js: PopUpConscribeChild(id) / PopUpFastConscribeChild(id)
 */
import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';

export interface HeroConscribeInfo {
  /** 最大可招募弟子数 */
  maxPrenticeNum: number;
  /** 当前弟子数 */
  prenticeNum: number;
  /** 单个招募消耗金币 */
  costMoney: number;
  /** 单个招募消耗粮食 */
  costFood: number;
  /** 单个招募消耗人口 */
  costMen: number;
  /** 单个招募时间（秒） */
  costTime: number;
  /** 快速招募消耗金币 */
  fastCostMoney?: number;
  /** 快速招募消耗粮食 */
  fastCostFood?: number;
  /** 快速招募消耗人口 */
  fastCostMen?: number;
  /** 快速招募消耗元宝 */
  fastCostGold?: number;
  /** 快速招募时间（秒） */
  fastCostTime?: number;
}

export interface CityResourceInfo {
  money: number;
  food: number;
  men: number;
  gold: number;
}

export interface ConscribeChildProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 确认回调（招募弟子） */
  onConfirm: (count: number) => void;
  /** 武将招募信息 */
  heroInfo: HeroConscribeInfo;
  /** 城市资源信息 */
  cityResource: CityResourceInfo;
  /** 是否快速招募模式 */
  isFastMode?: boolean;
  /** 宽度 */
  width?: number;
}

/** 格式化时间 */
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}小时${minutes}分${secs}秒`;
  }
  if (minutes > 0) {
    return `${minutes}分${secs}秒`;
  }
  return `${secs}秒`;
};

export const PopUpConscribeChild: React.FC<ConscribeChildProps> = ({
  open,
  onClose,
  onConfirm,
  heroInfo,
  cityResource,
  isFastMode = false,
  width = 280,
}) => {
  // 计算最大可招募数量
  const calculateMaxCount = (): number => {
    const { maxPrenticeNum, prenticeNum, costMoney, costFood, costMen } = heroInfo;
    const remainingSlots = maxPrenticeNum - prenticeNum;
    
    const moneyLimit = Math.floor(cityResource.money / costMoney);
    const foodLimit = Math.floor(cityResource.food / costFood);
    const menLimit = Math.floor(cityResource.men / costMen);
    
    const resourceLimit = Math.min(moneyLimit, foodLimit, menLimit);
    
    return Math.min(remainingSlots, resourceLimit);
  };

  const [inputCount, setInputCount] = useState(() => calculateMaxCount());

  // 当城市资源变化时重新计算最大数量
  useEffect(() => {
    const max = calculateMaxCount();
    if (inputCount > max) {
      setInputCount(max);
    }
  }, [cityResource]);

  // 计算总消耗
  const calculateTotalCost = () => {
    const count = Math.max(0, inputCount);
    
    if (isFastMode) {
      const { fastCostMoney = 0, fastCostFood = 0, fastCostMen = 0 } = heroInfo;
      return {
        money: count * fastCostMoney,
        food: count * fastCostFood,
        men: count * fastCostMen,
        gold: count * (heroInfo.fastCostGold || 0),
        time: heroInfo.fastCostTime || heroInfo.costTime,
      };
    }
    
    return {
      money: count * heroInfo.costMoney,
      food: count * heroInfo.costFood,
      men: count * heroInfo.costMen,
      gold: 0,
      time: count * heroInfo.costTime,
    };
  };

  const totalCost = calculateTotalCost();
  const maxCount = calculateMaxCount();

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let num = parseInt(value, 10) || 0;
    
    // 限制最大值
    if (num > maxCount) {
      num = maxCount;
    }
    
    setInputCount(num);
  };

  // 处理确认
  const handleConfirm = () => {
    if (inputCount > 0) {
      onConfirm(inputCount);
      onClose();
    }
  };

  // 快速招募模式下检查元宝是否足够
  const isGoldEnough = isFastMode && heroInfo.fastCostGold
    ? cityResource.gold >= totalCost.gold
    : true;

  const costClass = isGoldEnough ? '' : 'insufficient';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isFastMode ? '快速招募弟子' : '招募弟子'}
      width={width}
      showClose={true}
      closeOnOverlayClick={false}
      footer={
        <div className="popup-button">
          <button
            className="popup-btn primary"
            onClick={handleConfirm}
            disabled={inputCount <= 0 || !isGoldEnough}
          >
            招募
          </button>
          <button className="popup-btn" onClick={onClose} style={{ marginLeft: '20px' }}>
            取消
          </button>
        </div>
      }
    >
      <div className="conscribe-child-popup">
        {/* 招募数量输入 */}
        <div className="count-input-section">
          <p className="section-title">招募数量：</p>
          <div className="count-input-wrapper">
            <input
              type="text"
              className="input-child"
              value={inputCount}
              onChange={handleInputChange}
              maxLength={3}
            />
            <span className="count-separator">/</span>
            <span className="count-max">{maxCount}</span>
          </div>
        </div>

        {/* 单个消耗 */}
        <div className="cost-section">
          <p className="section-title">
            {isFastMode ? '快速招募消耗' : '单个招募消耗'}：
          </p>
          <table className="cost-table" width="100%">
            <tbody>
              <tr>
                <td>
                  <img src="img/4/1.gif" alt="金币" />
                </td>
                <td className="resource-value">
                  {isFastMode ? heroInfo.fastCostMoney : heroInfo.costMoney}
                </td>
                <td>
                  <img src="img/4/2.gif" alt="粮食" />
                </td>
                <td className="resource-value">
                  {isFastMode ? heroInfo.fastCostFood : heroInfo.costFood}
                </td>
                <td>
                  <img src="img/4/3.gif" alt="人口" />
                </td>
                <td className="resource-value">
                  {isFastMode ? heroInfo.fastCostMen : heroInfo.costMen}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 总消耗 */}
        <div className={`total-cost-section ${costClass}`}>
          <p className="section-title">总消耗：</p>
          <table className="cost-table" width="100%">
            <tbody>
              <tr>
                <td>
                  <img src="img/4/1.gif" alt="金币" />
                </td>
                <td className="resource-value" id="max_money">
                  {totalCost.money}
                </td>
                <td>
                  <img src="img/4/2.gif" alt="粮食" />
                </td>
                <td className="resource-value" id="max_food">
                  {totalCost.food}
                </td>
                <td>
                  <img src="img/4/3.gif" alt="人口" />
                </td>
                <td className="resource-value" id="max_men">
                  {totalCost.men}
                </td>
              </tr>
              {isFastMode && heroInfo.fastCostGold && (
                <tr>
                  <td>
                    <img src="img/4/4.gif" alt="元宝" />
                  </td>
                  <td className="resource-value" id="max_gold" colSpan={5}>
                    {totalCost.gold}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 预计时间 */}
        <div className="time-section">
          <p className="section-title">预计时间：</p>
          <div className="time-value">
            <img src="img/o/18.gif" alt="时间" />
            <span id="max_time">
              {isFastMode
                ? formatTime(heroInfo.fastCostTime || heroInfo.costTime)
                : formatTime(totalCost.time)
              }
            </span>
          </div>
        </div>

        {/* 元宝不足提示 */}
        {isFastMode && !isGoldEnough && (
          <p className="gold-insufficient-hint">
            元宝不足，无法进行快速招募
          </p>
        )}
      </div>
    </Modal>
  );
};

export default PopUpConscribeChild;
