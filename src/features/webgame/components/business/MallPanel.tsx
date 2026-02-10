/**
 * 商城面板组件
 * 从 Mall.js 迁移，使用 mallApi 服务
 */
import React, { useState, useEffect, memo } from 'react';
import gufengStyles from '../../styles/gufeng.module.css';

import styles from '../../styles/MallPanel.module.css';
import { mallApi, MallItem } from '../../services/api/mallApi';

// 物品类型配置
const ITEM_TYPES: { id: number; name: string }[] = [
  { id: 1, name: '热销' },
  { id: 4, name: '侠客' },
  { id: 5, name: '军事' },
  { id: 6, name: '道具' },
  { id: 7, name: '资源' },
  { id: 8, name: '其他' },
];

interface MallPanelProps {
  walletAddress?: string;
  onClose: () => void;
}

const MallPanel: React.FC<MallPanelProps> = memo(({ onClose }) => {
  const [items, setItems] = useState<MallItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentType, setCurrentType] = useState<MallItemType>(1);
  const [selectedItem, setSelectedItem] = useState<MallItem | null>(null);
  const [showBuyConfirm, setShowBuyConfirm] = useState(false);
  const [buyCount, setBuyCount] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);

  // 加载商城物品
  const fetchMallItems = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const res = await mallApi.getItems(currentType);
      if (res.success) {
        setItems(res.data);
      } else {
        setMessage(res.message || '加载商品失败');
      }
    } catch (err) {
      console.error('Failed to load mall items:', err);
      setMessage('加载商品失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMallItems();
  }, [currentType]);

  // 购买物品
  const handleBuy = async () => {
    if (!selectedItem || buying) return;
    
    setBuying(true);
    setMessage(null);
    
    try {
      const res = await mallApi.buy({
        itemId: selectedItem.Id,
        buyType: selectedItem.BuyType,
        count: buyCount,
      });
      
      if (res.success) {
        setMessage(`✓ 购买成功！获得 ${selectedItem.Name} x${buyCount}`);
        setShowBuyConfirm(false);
      } else {
        setMessage('✗ ' + (res.message || '购买失败'));
      }
    } catch (err) {
      console.error('Buy failed:', err);
      setMessage('✗ 购买失败');
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className={gufengStyles.container}>
      <div className={gufengStyles.header}>
        <h2>🏪 商城</h2>
        <button className={gufengStyles.closeBtn} onClick={onClose}>×</button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div style={{ 
          padding: '8px 12px', 
          margin: '0 10px 10px',
          borderRadius: '4px',
          background: message.includes('成功') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') ? '#155724' : '#721c24',
          fontSize: '13px'
        }}>
          {message}
        </div>
      )}

      {/* 物品类型 */}
      <div className={gufengStyles.typeNav}>
        {ITEM_TYPES.map((type) => (
          <button
            key={type.id}
            className={`${gufengStyles.typeBtn} ${currentType === type.id ? gufengStyles.active : ''}`}
            onClick={() => setCurrentType(type.id)}
          >
            {type.name}
          </button>
        ))}
      </div>

      {/* 物品列表 */}
      <div className={gufengStyles.itemGrid}>
        {loading ? (
          <div className={gufengStyles.loading}>加载中...</div>
        ) : items.length === 0 ? (
          <div className={gufengStyles.empty}>暂无商品</div>
        ) : (
          items.map((item) => (
            <div
              key={item.Id}
              className={`${gufengStyles.itemCard} ${selectedItem?.Id === item.Id ? gufengStyles.selected : ''}`}
              onClick={() => setSelectedItem(item)}
            >
              <img 
                src={item.Image ? `/jx/Web${item.Image}` : '/jx/Web/img/2/1.gif'} 
                alt={item.Name} 
                className={gufengStyles.itemIcon}
                onError={(e) => { (e.target as HTMLImageElement).src = '/jx/Web/img/2/1.gif'; }}
              />
              <div className={gufengStyles.itemInfo}>
                <span className={gufengStyles.itemName}>{item.Name}</span>
                <span className={gufengStyles.itemDesc}>{item.Desc || '暂无描述'}</span>
                <span className={gufengStyles.itemPrice}>💰 {item.Gold}</span>
                {item.Limit && item.Limit > 0 && (
                  <span className={gufengStyles.itemLimit}>限{item.Limit}个</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部操作 */}
      <div className={gufengStyles.footer}>
        <div className={gufengStyles.selectedInfo}>
          {selectedItem ? (
            <>
              <span>已选: {selectedItem.Name}</span>
              <span>💰 {selectedItem.Gold}</span>
            </>
          ) : (
            <span>请选择商品</span>
          )}
        </div>
        <button
          className={gufengStyles.buyBtn}
          disabled={!selectedItem || buying}
          onClick={() => selectedItem && setShowBuyConfirm(true)}
        >
          {buying ? '购买中...' : '购买'}
        </button>
      </div>

      {/* 购买确认弹窗 */}
      {showBuyConfirm && selectedItem && (
        <div className={gufengStyles.modal}>
          <div className={gufengStyles.modalContent}>
            <h3>购买确认</h3>
            <div className={gufengStyles.buyForm}>
              <div className={gufengStyles.formItem}>
                <label>商品:</label>
                <span>{selectedItem.Name}</span>
              </div>
              <div className={gufengStyles.formItem}>
                <label>单价:</label>
                <span>💰 {selectedItem.Gold} 元宝</span>
              </div>
              <div className={gufengStyles.formItem}>
                <label>数量:</label>
                <div className={gufengStyles.countControl}>
                  <button onClick={() => setBuyCount(Math.max(1, buyCount - 1))}>-</button>
                  <input
                    type="number"
                    value={buyCount}
                    onChange={(e) => setBuyCount(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={selectedItem.Limit || 99}
                  />
                  <button onClick={() => setBuyCount(Math.min(selectedItem.Limit || 99, buyCount + 1))}>+</button>
                </div>
              </div>
              <div className={gufengStyles.formItem}>
                <label>总价:</label>
                <span className={gufengStyles.totalPrice}>💰 {selectedItem.Gold * buyCount} 元宝</span>
              </div>
            </div>
            <div className={gufengStyles.modalActions}>
              <button 
                className={gufengStyles.confirmBtn} 
                onClick={handleBuy}
                disabled={buying}
              >
                {buying ? '购买中...' : '确认购买'}
              </button>
              <button 
                className={gufengStyles.cancelBtn} 
                onClick={() => setShowBuyConfirm(false)}
                disabled={buying}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MallPanel.displayName = 'MallPanel';

export default MallPanel;
