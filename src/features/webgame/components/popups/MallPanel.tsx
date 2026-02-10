import React, { useState, useEffect } from 'react';
import gameApi from '../../services/gameApi';
import styles from './MallPanel.module.css';

interface MallPanelProps {
  onClose: () => void;
}

interface ShopItem {
  id: number;
  name: string;
  type: number;
  price: number;
  description: string;
  icon?: string;
}

export const MallPanel: React.FC<MallPanelProps> = ({ onClose }) => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<number | 'all'>('all');
  const [cart, setCart] = useState<{id: number; count: number}[]>([]);

  useEffect(() => {
    loadShopItems();
  }, []);

  const loadShopItems = async () => {
    try {
      setLoading(true);
      const res = await gameApi.getShopItems('1');
      if (res.success && res.data?.items) {
        setItems(res.data.items);
      }
    } catch (error) {
      console.error('加载商城物品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (item: ShopItem) => {
    try {
      const res = await gameApi.buyShopItem(item.id, 1);
      if (res.success) {
        alert(`成功购买 ${item.name}！`);
      } else {
        alert(res.error || '购买失败');
      }
    } catch (error) {
      alert('购买失败，请稍后重试');
    }
  };

  const typeNames: Record<number, string> = {
    1: '道具',
    2: '装备',
    3: '材料',
    4: '技能书',
    5: '消耗品',
    6: '礼包',
    7: '资源',
    8: '服务',
  };

  const filteredItems = activeType === 'all' 
    ? items 
    : items.filter(item => item.type === activeType);

  const uniqueTypes = [...new Set(items.map(item => item.type))].sort();

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>🛒 商城</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : (
          <>
            {/* 分类标签 */}
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeType === 'all' ? styles.active : ''}`}
                onClick={() => setActiveType('all')}
              >
                全部
              </button>
              {uniqueTypes.map(type => (
                <button 
                  key={type}
                  className={`${styles.tab} ${activeType === type ? styles.active : ''}`}
                  onClick={() => setActiveType(type)}
                >
                  {typeNames[type] || `类型${type}`}
                </button>
              ))}
            </div>

            {/* 商品列表 */}
            <div className={styles.itemGrid}>
              {filteredItems.map(item => (
                <div key={item.id} className={styles.itemCard}>
                  <div className={styles.itemIcon}>
                    {item.icon ? (
                      <img src={item.icon} alt={item.name} />
                    ) : (
                      <div className={styles.defaultIcon}>📦</div>
                    )}
                  </div>
                  <div className={styles.itemInfo}>
                    <h3>{item.name}</h3>
                    <p className={styles.description}>{item.description}</p>
                    <div className={styles.price}>
                      <span className={styles.priceLabel}>💰</span>
                      <span className={styles.priceValue}>{item.price}</span>
                    </div>
                  </div>
                  <button 
                    className={styles.buyBtn}
                    onClick={() => handleBuy(item)}
                  >
                    购买
                  </button>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className={styles.empty}>暂无商品</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MallPanel;
