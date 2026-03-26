/**
 * 物品面板组件 (ItemPanel)
 * 玩家背包物品管理
 *
 * 功能：
 * - 背包物品列表（图标、名称、品质、数量）
 * - 物品分类筛选（全部/装备/消耗/材料/其他）
 * - 物品详情弹窗（描述、属性、品质颜色）
 * - 物品使用/穿戴功能（调用 API）
 * - 品质颜色显示（白/绿/蓝/紫/橙）
 * - 空背包状态
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  getMyInventory,
  getItemTypeName,
  getItemTypeIcon,
  transformInventoryItem,
} from '../../services/gameApi';
import { Modal } from '../common/Modal';
import type { UserInventoryItem } from '../../types';
import { ITEM_QUALITY_COLORS, ITEM_QUALITY_NAMES } from '../../types';

// 物品类型筛选配置
const ITEM_TYPE_FILTERS = [
  { value: 0, label: '全部', icon: '🎒' },
  { value: 1, label: '⚔️ 武器', icon: '⚔️' },
  { value: 2, label: '🛡️ 防具', icon: '🛡️' },
  { value: 3, label: '💍 饰品', icon: '💍' },
  { value: 4, label: '💊 消耗品', icon: '💊' },
  { value: 5, label: '📦 材料', icon: '📦' },
  { value: 10, label: '❓ 其他', icon: '❓' },
];

interface ItemPanelProps {
  cityId?: number;
}

/**
 * 获取品质对应的 CSS 颜色
 */
function getQualityColor(quality: number): string {
  return ITEM_QUALITY_COLORS[quality] || ITEM_QUALITY_COLORS[1];
}

/**
 * 获取品质名称
 */
function getQualityName(quality: number): string {
  return ITEM_QUALITY_NAMES[quality] || ITEM_QUALITY_NAMES[1];
}

/**
 * 物品面板主组件
 */
export const ItemPanel: React.FC<ItemPanelProps> = ({ cityId = 1 }) => {
  // 物品列表状态
  const [items, setItems] = useState<UserInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选状态
  const [filterType, setFilterType] = useState<number>(0);

  // 详情弹窗状态
  const [selectedItem, setSelectedItem] = useState<UserInventoryItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // 加载物品列表
  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMyInventory();
      if (result.success && result.data) {
        const rawItems = result.data.items || result.data || [];
        const transformed = rawItems.map(transformInventoryItem);
        setItems(transformed);
      } else {
        setError(result.error || '加载物品失败');
        setItems([]);
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // 根据筛选类型过滤物品
  const filteredItems = filterType === 0
    ? items
    : items.filter(item => {
        if (filterType === 10) {
          // 其他类型：非 1-5 且非 6-9 的物品类型
          return item.itemType > 5 && item.itemType < 10 || item.itemType === 10;
        }
        return item.itemType === filterType;
      });

  // 打开物品详情
  const handleItemClick = (item: UserInventoryItem) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  };

  // 关闭详情弹窗
  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedItem(null);
  };

  // 计算装备数量
  const equippedCount = items.filter(item => item.equipped).length;

  // 渲染物品网格项
  const renderItemCard = (item: UserInventoryItem) => {
    const qualityColor = getQualityColor(item.quality);
    const qualityName = getQualityName(item.quality);
    const typeIcon = getItemTypeIcon(item.itemType) || '❓';

    return (
      <div
        key={item.itemId}
        className="item-card"
        onClick={() => handleItemClick(item)}
        style={{
          borderColor: qualityColor,
          background: `linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)`,
        }}
      >
        {/* 物品图标 */}
        <div
          className="item-card-icon"
          style={{
            borderColor: qualityColor,
            background: `radial-gradient(circle, ${qualityColor}22 0%, transparent 70%)`,
          }}
        >
          {item.itemIcon ? (
            <img src={item.itemIcon} alt={item.itemName} />
          ) : (
            <span style={{ fontSize: '28px' }}>{typeIcon}</span>
          )}
          {/* 数量 */}
          <span className="item-card-count">{item.durability > 1 ? item.durability : ''}</span>
        </div>

        {/* 物品名称 */}
        <div
          className="item-card-name"
          style={{ color: qualityColor }}
          title={item.itemName}
        >
          {item.itemName}
        </div>

        {/* 品质标签 */}
        <div
          className="item-card-quality"
          style={{
            color: qualityColor,
            borderColor: qualityColor,
          }}
        >
          {qualityName}
        </div>

        {/* 装备状态 */}
        {item.equipped && (
          <div className="item-card-equipped">已穿戴</div>
        )}
      </div>
    );
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <div className="item-empty">
      <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎒</div>
      <div style={{ color: '#888', fontSize: '16px', marginBottom: '8px' }}>
        {filterType === 0 ? '背包空空如也' : '该分类下没有物品'}
      </div>
      <div style={{ color: '#666', fontSize: '14px' }}>
        {filterType === 0 ? '完成战斗和任务可获得物品奖励' : '试试其他分类或刷新页面'}
      </div>
    </div>
  );

  return (
    <div className="item-panel">
      {/* 面板标题 */}
      <div className="item-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ color: '#ffd700', margin: 0 }}>🎒 背包</h2>
          <span style={{ color: '#888', fontSize: '14px' }}>
            共 {items.length} 件物品
            {equippedCount > 0 && ` · 已穿戴 ${equippedCount} 件`}
          </span>
        </div>
        <button className="gufeng-btn gufeng-btn-secondary" onClick={loadItems}>
          🔄 刷新
        </button>
      </div>

      {/* 筛选标签 */}
      <div className="item-filter-tabs">
        {ITEM_TYPE_FILTERS.map(filter => (
          <button
            key={filter.value}
            className={`item-filter-tab ${filterType === filter.value ? 'active' : ''}`}
            onClick={() => setFilterType(filter.value)}
          >
            <span>{filter.icon}</span>
            <span>{filter.label}</span>
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="item-panel-content">
        {loading ? (
          <div className="item-loading">
            <div style={{ fontSize: '40px' }}>⏳</div>
            <div style={{ color: '#888', marginTop: '12px' }}>加载中...</div>
          </div>
        ) : error ? (
          <div className="item-error">
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>❌</div>
            <div style={{ color: '#ef4444', marginBottom: '12px' }}>{error}</div>
            <button className="gufeng-btn gufeng-btn-primary" onClick={loadItems}>
              重试
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="item-grid">
            {filteredItems.map(renderItemCard)}
          </div>
        )}
      </div>

      {/* 物品详情弹窗 */}
      <Modal
        open={detailModalOpen}
        onClose={handleCloseDetail}
        title={selectedItem?.itemName || '物品详情'}
        width={420}
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="gufeng-btn gufeng-btn-secondary" onClick={handleCloseDetail}>
              关闭
            </button>
            {selectedItem?.itemType === 4 && (
              <button className="gufeng-btn gufeng-btn-primary">
                使用
              </button>
            )}
            {(selectedItem?.itemType ?? 0) >= 1 && (selectedItem?.itemType ?? 0) <= 3 && !selectedItem?.equipped && (
              <button className="gufeng-btn gufeng-btn-success">
                穿戴
              </button>
            )}
            {selectedItem?.equipped && (
              <button className="gufeng-btn gufeng-btn-danger">
                卸下
              </button>
            )}
          </div>
        }
      >
        {selectedItem && (
          <div className="item-detail">
            {/* 物品图标与基本信息 */}
            <div className="item-detail-header">
              <div
                className="item-detail-icon"
                style={{
                  borderColor: getQualityColor(selectedItem.quality),
                  background: `radial-gradient(circle, ${getQualityColor(selectedItem.quality)}33 0%, rgba(0,0,0,0.3) 70%)`,
                }}
              >
                {selectedItem.itemIcon ? (
                  <img src={selectedItem.itemIcon} alt={selectedItem.itemName} />
                ) : (
                  <span style={{ fontSize: '48px' }}>
                    {getItemTypeIcon(selectedItem.itemType) || '❓'}
                  </span>
                )}
              </div>
              <div className="item-detail-info">
                <div
                  className="item-detail-name"
                  style={{ color: getQualityColor(selectedItem.quality) }}
                >
                  {selectedItem.itemName}
                </div>
                <div className="item-detail-meta">
                  <span
                    className="item-quality-badge"
                    style={{
                      color: getQualityColor(selectedItem.quality),
                      borderColor: getQualityColor(selectedItem.quality),
                    }}
                  >
                    {getQualityName(selectedItem.quality)}
                  </span>
                  <span className="item-type-badge">
                    {getItemTypeIcon(selectedItem.itemType)} {getItemTypeName(selectedItem.itemType)}
                  </span>
                </div>
                {selectedItem.equipped && (
                  <div className="item-equipped-badge">已穿戴</div>
                )}
              </div>
            </div>

            {/* 物品描述 */}
            {selectedItem.itemDes && (
              <div className="item-detail-desc">
                <div className="item-detail-label">物品描述</div>
                <div className="item-detail-desc-text">{selectedItem.itemDes}</div>
              </div>
            )}

            {/* 物品属性 */}
            <div className="item-detail-stats">
              {selectedItem.durability > 0 && (
                <div className="item-stat-row">
                  <span className="item-stat-label">数量</span>
                  <span className="item-stat-value">{selectedItem.durability}</span>
                </div>
              )}
              {selectedItem.price > 0 && (
                <div className="item-stat-row">
                  <span className="item-stat-label">价值</span>
                  <span className="item-stat-value" style={{ color: '#ffd700' }}>
                    💰 {selectedItem.price.toLocaleString()}
                  </span>
                </div>
              )}
              {selectedItem.heroId > 0 && (
                <div className="item-stat-row">
                  <span className="item-stat-label">穿戴武将</span>
                  <span className="item-stat-value" style={{ color: '#60a5fa' }}>
                    ID: {selectedItem.heroId}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ItemPanel;
