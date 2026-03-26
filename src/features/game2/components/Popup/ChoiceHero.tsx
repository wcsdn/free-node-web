/**
 * PopUpChoiceHero - 武将选择弹框组件
 * 
 * 功能：
 * - 显示可选择装备物品的武将列表
 * - 点击武将后将物品装备到该武将
 * 
 * 对应 PopUp.js: PopUpChoiceHero(id)
 */
import React from 'react';
import { Modal } from '../common/Modal';

export interface HeroInfo {
  id: number;
  name: string;
  quality: number; // 1-5 对应 N-R 品质
  level: number;
  state: number; // 武将状态
  childrenCount?: number; // 弟子数量
}

export interface ChoiceHeroProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 选择武将回调 */
  onSelectHero: (heroId: number) => void;
  /** 武将列表 */
  heroes: HeroInfo[];
  /** 物品名称 */
  itemName?: string;
  /** 宽度 */
  width?: number;
}

/** 武将品质对应的样式类 */
const QUALITY_CLASS: Record<number, string> = {
  1: 'hquality_1', // 白色
  2: 'hquality_2', // 绿色
  3: 'hquality_3', // 蓝色
  4: 'hquality_4', // 紫色
  5: 'hquality_5', // 橙色
};

/** 武将状态名称 */
const HERO_STATE_NAME = ['空闲', '训练中', '驻守中', '经商中', '采集中', '修炼中'];

/** 品质名称 */
const QUALITY_NAME = ['', 'N', 'R', 'SR', 'SSR', 'UR'];

export const PopUpChoiceHero: React.FC<ChoiceHeroProps> = ({
  open,
  onClose,
  onSelectHero,
  heroes,
  itemName,
  width = 500,
}) => {
  const handleSelectHero = (heroId: number) => {
    onSelectHero(heroId);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={itemName ? `选择装备${itemName}的武将` : '选择武将'}
      width={width}
      showClose={true}
      closeOnOverlayClick={true}
    >
      <div className="choice-hero-popup">
        <p className="hint-text">请选择要装备的武将：</p>
        <div className="hero-list">
          {heroes.length === 0 ? (
            <p className="empty-hint">暂无可用武将</p>
          ) : (
            <table className="hero-table" width="100%">
              <thead>
                <tr>
                  <th>武将</th>
                  <th>品质</th>
                  <th>等级</th>
                  <th>状态</th>
                  <th>弟子</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {heroes.map((hero) => (
                  <tr key={hero.id}>
                    <td>
                      <span className={`hero-name ${QUALITY_CLASS[hero.quality] || ''}`}>
                        {hero.name}
                      </span>
                    </td>
                    <td>
                      <span className={`hero-quality ${QUALITY_CLASS[hero.quality] || ''}`}>
                        {QUALITY_NAME[hero.quality] || 'N'}
                      </span>
                    </td>
                    <td>{hero.level}</td>
                    <td>
                      <span className="hero-state">
                        {HERO_STATE_NAME[hero.state - 1] || '未知'}
                      </span>
                    </td>
                    <td>{hero.childrenCount || 0}</td>
                    <td>
                      <button
                        className="select-btn"
                        onClick={() => handleSelectHero(hero.id)}
                      >
                        选择
                      </button>
                    </td>
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

export default PopUpChoiceHero;
