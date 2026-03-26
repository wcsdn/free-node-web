/**
 * PopUpAttackDecision - 攻击/支援决策组件
 * 
 * 功能：
 * - 显示攻击/支援目标信息
 * - 选择行军速度
 * - 显示可用武将列表
 * - 发起攻击/支援事件
 * 
 * 对应 PopUp.js: PopUpAttackDecision(id)
 * 
 * 攻击类型:
 * - 29: 征服玩家
 * - 30: 支援城市
 * - 82: 占领山寨攻击
 * - 92: 占领山寨
 * - 94: 特殊占领
 * - 110: 征服玩家(元宝)
 */

/** 全局游戏对象类型声明 */
declare global {
  interface Window {
    game2AppGlobal?: {
      isZhengzai?: boolean;
    };
  }
}

import React, { useState } from 'react';
import { Modal } from '../common/Modal';

export type AttackType = 29 | 30 | 82 | 92 | 94 | 110;

export interface HeroInfo {
  id: number;
  name: string;
  quality: number;
  level: number;
  state: number;
}

export interface TargetInfo {
  name: string;
  posX: number;
  posY: number;
}

export interface AttackDecisionProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 确认回调（发起攻击/支援） */
  onConfirm: (speedType: number, useGoldFlag?: boolean) => void;
  /** 攻击类型 */
  attackType: AttackType;
  /** 目标信息 */
  target: TargetInfo;
  /** 可用武将列表 */
  heroes: HeroInfo[];
  /** 基础行军时间（秒） */
  baseTime: number;
  /** 元宝加速消耗 */
  goldSpeedCost?: number;
  /** 占领消费元宝数量 */
  occupyGoldCost?: number;
  /** 占领消费战勋数量 */
  occupyInsigniaCost?: number;
  /** 宽度 */
  width?: number;
}

/** 行军速度类型 */
export type SpeedType = 0 | 1;

/** 行军速度名称 */
const SPEED_NAME: Record<SpeedType, string> = {
  0: '正常行军',
  1: '快速行军',
};

export const PopUpAttackDecision: React.FC<AttackDecisionProps> = ({
  open,
  onClose,
  onConfirm,
  attackType,
  target,
  heroes,
  baseTime,
  goldSpeedCost = 20,
  occupyGoldCost = 10,
  occupyInsigniaCost = 3500,
  width = 320,
}) => {
  const [speedType, setSpeedType] = useState<SpeedType>(0);
  const [useGoldForOccupy, setUseGoldForOccupy] = useState(false);

  // 格式化时间
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

  // 获取攻击类型描述
  const getAttackTypeDesc = (): string => {
    switch (attackType) {
      case 29:
      case 110:
        return '征服玩家';
      case 30:
        return '支援城市';
      case 82:
        return '占领山寨';
      case 92:
        return '占领山寨';
      case 94:
        return '特殊占领';
      default:
        return '攻击';
    }
  };

  // 获取消耗说明
  const renderCostInfo = () => {
    if (speedType === 1) {
      return (
        <li className="cost-item">
          <span className="label">加速消耗：</span>
          <img src="img/4/4.gif" alt="元宝" />
          <span className="value">{goldSpeedCost}</span>
        </li>
      );
    }
    return null;
  };

  // 占领类型的额外选项
  const renderOccupyOptions = () => {
    if (attackType === 110 || attackType === 92) {
      return (
        <>
          <li className="occupy-option">
            <label>
              <input
                type="radio"
                name="occupyCost"
                checked={!useGoldForOccupy}
                onChange={() => setUseGoldForOccupy(false)}
              />
              <img src="img/o/76.gif" alt="战勋" />
              <span>{occupyInsigniaCost} 战勋</span>
            </label>
          </li>
          <li className="occupy-option">
            <label>
              <input
                type="radio"
                name="occupyCost"
                checked={useGoldForOccupy}
                onChange={() => setUseGoldForOccupy(true)}
              />
              <img src="img/4/4.gif" alt="元宝" />
              <span>{occupyGoldCost} 元宝</span>
            </label>
          </li>
        </>
      );
    }
    return null;
  };

  const handleConfirm = () => {
    if (attackType === 110) {
      onConfirm(speedType, useGoldForOccupy);
    } else {
      onConfirm(speedType);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={getAttackTypeDesc()}
      width={width}
      showClose={true}
      closeOnOverlayClick={false}
      footer={
        <div className="popup-button">
          <button className="popup-btn primary" onClick={handleConfirm}>
            发起{window.game2AppGlobal?.isZhengzai ? '攻击' : '支援'}
          </button>
          <button className="popup-btn" onClick={onClose} style={{ marginLeft: '20px' }}>
            取消
          </button>
        </div>
      }
    >
      <div className="attack-decision-popup">
        {/* 目标信息 */}
        <div className="target-info">
          <p className="target-name">
            <span className="label">目标：</span>
            <span className="value font-bold">{target.name}</span>
          </p>
          <p className="target-pos">
            <span className="label">坐标：</span>
            <span className="value">({target.posX}, {target.posY})</span>
          </p>
        </div>

        {/* 行军速度选择 */}
        <div className="speed-selection">
          <p className="section-title">行军速度：</p>
          <ul className="speed-list">
            <li className="speed-item">
              <label>
                <input
                  type="radio"
                  name="speed"
                  value={0}
                  checked={speedType === 0}
                  onChange={() => setSpeedType(0)}
                />
                <span className="speed-name">{SPEED_NAME[0]}</span>
                <span className="speed-time">{formatTime(baseTime)}</span>
              </label>
            </li>
            <li className="speed-item">
              <label>
                <input
                  type="radio"
                  name="speed"
                  value={1}
                  checked={speedType === 1}
                  onChange={() => setSpeedType(1)}
                />
                <span className="speed-name purple">{SPEED_NAME[1]}</span>
                <span className="speed-time">{formatTime(Math.floor(baseTime / 2))}</span>
              </label>
            </li>
          </ul>
          {renderCostInfo()}
        </div>

        {/* 占领消费选项 */}
        {renderOccupyOptions()}

        {/* 警告信息 */}
        <p className="warning-text">请确保目标城市有足够的驻守部队！</p>

        {/* 参战武将列表 */}
        <div className="heroes-section">
          <p className="section-title">参战武将：</p>
          {heroes.length === 0 ? (
            <p className="empty-hint">无可用武将</p>
          ) : (
            <table className="heroes-table" width="100%">
              <thead>
                <tr>
                  <th>武将</th>
                  <th>等级</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {heroes.map((hero) => (
                  <tr key={hero.id}>
                    <td className={`hero-name hquality_${hero.quality}`}>
                      {hero.name}
                    </td>
                    <td>{hero.level}</td>
                    <td>{getHeroStateName(hero.state)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
};

/** 获取武将状态名称 */
function getHeroStateName(state: number): string {
  const stateNames = ['空闲', '训练中', '驻守中', '经商中', '采集中', '修炼中'];
  return stateNames[state - 1] || '未知';
}

export default PopUpAttackDecision;
