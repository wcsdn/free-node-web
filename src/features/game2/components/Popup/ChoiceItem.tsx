/**
 * PopUpChoiceItem - 物品选择弹框组件
 * 
 * 功能：
 * - 显示可选择给武将穿戴的物品列表
 * - 支持分页
 * 
 * 对应 PopUp.js: PopUpChoiceItem(id)
 */
import React from 'react';
import { Modal } from '../common/Modal';

export interface ItemInfo {
  id: number;
  name: string;
  type: number; // 物品类型
  icon?: string; // 图标路径
  quality?: number; // 品质
  level?: number; // 等级需求
  property?: string; // 属性描述
}

export interface ChoiceItemProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 选择物品回调 */
  onSelectItem: (itemId: number) => void;
  /** 物品列表 */
  items: ItemInfo[];
  /** 武将名称 */
  heroName?: string;
  /** 标题 */
  title?: string;
  /** 当前页码 */
  currentPage?: number;
  /** 总页数 */
  totalPages?: number;
  /** 页码变化回调 */
  onPageChange?: (page: number) => void;
  /** 宽度 */
  width?: number;
}

export const PopUpChoiceItem: React.FC<ChoiceItemProps> = ({
  open,
  onClose,
  onSelectItem,
  items,
  heroName,
  title,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  width = 450,
}) => {
  const displayTitle = title || (heroName ? `选择${heroName}的装备` : '选择物品');

  const handleSelectItem = (itemId: number) => {
    onSelectItem(itemId);
    onClose();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && onPageChange) {
      onPageChange(newPage);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={displayTitle}
      width={width}
      showClose={true}
      closeOnOverlayClick={true}
    >
      <div className="choice-item-popup">
        <p className="hint-text">请选择要穿戴的物品：</p>
        <div className="item-list">
          {items.length === 0 ? (
            <p className="empty-hint">暂无可用物品</p>
          ) : (
            <table className="item-table" width="100%">
              <thead>
                <tr>
                  <th>物品</th>
                  <th>类型</th>
                  <th>等级</th>
                  <th>属性</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="item-name-cell">
                        {item.icon && (
                          <img src={item.icon} alt={item.name} className="item-icon" />
                        )}
                        <span className={`item-name ${getQualityClass(item.quality)}`}>
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td>{getItemTypeName(item.type)}</td>
                    <td>Lv.{item.level || 0}</td>
                    <td>
                      <span className="item-property">{item.property || '-'}</span>
                    </td>
                    <td>
                      <button
                        className="select-btn"
                        onClick={() => handleSelectItem(item.id)}
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

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              上一页
            </button>
            <span className="page-info">
              {currentPage} / {totalPages}
            </span>
            <button
              className="page-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

/** 获取品质样式类 */
function getQualityClass(quality?: number): string {
  if (!quality) return '';
  return `item-quality-${quality}`;
}

/** 获取物品类型名称 */
function getItemTypeName(type: number): string {
  const typeNames: Record<number, string> = {
    1: '武器',
    2: '防具',
    3: '饰品',
    4: '消耗品',
    5: '材料',
    6: '任务物品',
  };
  return typeNames[type] || '其他';
}

export default PopUpChoiceItem;
