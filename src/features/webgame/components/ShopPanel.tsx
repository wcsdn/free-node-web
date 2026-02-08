/**
 * ShopPanel - 新版商城面板
 * 赛博朋克风格
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';
import styles from './ShopPanel.module.css';

interface ShopItem {
  id: number;
  name: string;
  type: number;
  price: number;
  description: string;
  icon?: string;
}

interface ShopPanelProps {
  walletAddress: string;
}

export const ShopPanel: React.FC<ShopPanelProps> = ({ walletAddress }) => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<number>(1);
  const [gold, setGold] = useState(1000);

  // 加载商品数据
  useEffect(() => {
    const loadShopItems = async () => {
      try {
        const res = await fetch('http://localhost:8788/api/shop/list?type=1', {
          method: 'GET',
          headers: { 'X-Wallet-Auth': walletAddress || '' },
        });
        const data = await res.json();
        
        if (data.success && data.data?.items) {
          setItems(data.data.items);
        }
      } catch (err) {
        console.error('Failed to load shop items:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadShopItems();
  }, [walletAddress]);

  // 获取类型名称
  const getTypeName = (type: number): string => {
    const names: Record<number, string> = {
      1: '消耗品',
      2: '材料',
      3: '装备',
      4: '其他',
    };
    return names[type] || '未知';
  };

  // 获取类型图标
  const getTypeIcon = (type: number): string => {
    const icons: Record<number, string> = {
      1: '🧪',
      2: '📦',
      3: '⚔️',
      4: '🎁',
    };
    return icons[type] || '📦';
  };

  // 购买商品
  const handleBuy = async (item: ShopItem) => {
    try {
      const res = await fetch('http://localhost:8788/api/shop/buy', {
        method: 'POST',
        headers: { 
          'X-Wallet-Auth': walletAddress || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ item_id: item.id, count: 1 }),
      });
      const data = await res.json();
      
      if (data.success) {
        setGold(gold - item.price);
        alert(`购买了 ${item.name}！`);
      } else {
        alert(data.error || '购买失败');
      }
    } catch (err) {
      console.error('Buy failed:', err);
    }
  };

  // 筛选商品
  const filteredItems = items.filter(item => 
    filterType === 0 || item.type === filterType
  );

  if (loading) {
    return <div className={styles.loading}>LOADING...</div>;
  }

  return (
    <div className={styles.container}>
      {/* 标题 */}
      <h1 className={styles.title}>
        <span className={styles.glitch} data-text="SHOP">SHOP</span>
      </h1>

      {/* 用户资产 */}
      <GameCard title="我的资产" className={styles.assets}>
        <div className={styles.assetRow}>
          <span className={styles.assetIcon}>🪙</span>
          <span className={styles.assetLabel}>金币</span>
          <span className={styles.assetValue}>{gold.toLocaleString()}</span>
        </div>
      </GameCard>

      {/* 分类筛选 */}
      <div className={styles.categories}>
        {[0, 1, 2, 3, 4].map((type) => (
          <button
            key={type}
            className={[styles.categoryBtn, filterType === type ? styles.active : ''].join(' ')}
            onClick={() => setFilterType(type)}
          >
            {type === 0 ? '全部' : getTypeIcon(type)}
            <span>{type === 0 ? 'ALL' : getTypeName(type)}</span>
          </button>
        ))}
      </div>

      {/* 商品列表 */}
      <div className={styles.itemGrid}>
        {filteredItems.map((item) => (
          <div key={item.id} className={styles.itemCard}>
            <div className={styles.itemIcon}>
              {getTypeIcon(item.type)}
            </div>
            
            <div className={styles.itemInfo}>
              <div className={styles.itemName}>{item.name}</div>
              <div className={styles.itemDesc}>{item.description}</div>
            </div>
            
            <div className={styles.itemPrice}>
              <span className={styles.priceIcon}>🪙</span>
              <span className={styles.priceValue}>{item.price}</span>
            </div>
            
            <GameButton 
              size="small" 
              onClick={() => handleBuy(item)}
              disabled={gold < item.price}
            >
              购买
            </GameButton>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {filteredItems.length === 0 && (
        <div className={styles.empty}>
          <p>暂无商品</p>
        </div>
      )}
    </div>
  );
};

export default ShopPanel;
