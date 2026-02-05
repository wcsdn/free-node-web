/**
 * 商城面板组件
 * 从 Mall.js 迁移，使用 mallApi 服务
 */
import React, { useState, useEffect, memo } from 'react';
import styles from '../styles/MallPanel.module.css';
import { mallApi, MallItem, MALL_ITEM_TYPES, MallItemType } from '../services/api/mallApi';
import { getAuthHeaders } from '../utils/api';

// 物品类型配置
const ITEM_TYPES: { id: MallItemType; name: string }[] = [
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

const MallPanel: React.FC<MallPanelProps> = memo(({ walletAddress, onClose }) => {
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
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🏪 商城</h2>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
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
      <div className={styles.typeNav}>
        {ITEM_TYPES.map((type) => (
          <button
            key={type.id}
            className={`${styles.typeBtn} ${currentType === type.id ? styles.active : ''}`}
            onClick={() => setCurrentType(type.id)}
          >
            {type.name}
          </button>
        ))}
      </div>

      {/* 物品列表 */}
      <div className={styles.itemGrid}>
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>暂无商品</div>
        ) : (
          items.map((item) => (
            <div
              key={item.Id}
              className={`${styles.itemCard} ${selectedItem?.Id === item.Id ? styles.selected : ''}`}
              onClick={() => setSelectedItem(item)}
            >
              <img 
                src={item.Image ? `/jx/Web${item.Image}` : '/jx/Web/img/2/1.gif'} 
                alt={item.Name} 
                className={styles.itemIcon}
                onError={(e) => { (e.target as HTMLImageElement).src = '/jx/Web/img/2/1.gif'; }}
              />
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.Name}</span>
                <span className={styles.itemDesc}>{item.Desc || '暂无描述'}</span>
                <span className={styles.itemPrice}>💰 {item.Gold}</span>
                {item.Limit && item.Limit > 0 && (
                  <span className={styles.itemLimit}>限{item.Limit}个</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部操作 */}
      <div className={styles.footer}>
        <div className={styles.selectedInfo}>
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
          className={styles.buyBtn}
          disabled={!selectedItem || buying}
          onClick={() => selectedItem && setShowBuyConfirm(true)}
        >
          {buying ? '购买中...' : '购买'}
        </button>
      </div>

      {/* 购买确认弹窗 */}
      {showBuyConfirm && selectedItem && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>购买确认</h3>
            <div className={styles.buyForm}>
              <div className={styles.formItem}>
                <label>商品:</label>
                <span>{selectedItem.Name}</span>
              </div>
              <div className={styles.formItem}>
                <label>单价:</label>
                <span>💰 {selectedItem.Gold} 元宝</span>
              </div>
              <div className={styles.formItem}>
                <label>数量:</label>
                <div className={styles.countControl}>
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
              <div className={styles.formItem}>
                <label>总价:</label>
                <span className={styles.totalPrice}>💰 {selectedItem.Gold * buyCount} 元宝</span>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.confirmBtn} 
                onClick={handleBuy}
                disabled={buying}
              >
                {buying ? '购买中...' : '确认购买'}
              </button>
              <button 
                className={styles.cancelBtn} 
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
