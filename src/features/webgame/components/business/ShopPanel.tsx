/**
 * 商城面板组件
 */
import React, { useEffect, useState } from 'react';
import { gameApi } from '../../services/gameApi';
import styles from '../../styles/jxMain.module.css';
import { getApiBase, getAuthHeaders } from '../../utils/api';

interface ShopItem {
  id: number;
  name: string;
  type: number;
  price: number;
  icon: string;
  desc: string;
  effect_value?: number;
}

interface ShopPanelProps {
  onClose: () => void;
}

// 获取API基础URL
//   return import.meta.env.PROD ? 'https://game.free-node.xyz' : 'http://localhost:8787';
// };

// 获取认证头
//   const auth = localStorage.getItem('wallet-auth');
//   return auth ? { 'X-Wallet-Auth': auth } : {};
// };

const ShopPanel: React.FC<ShopPanelProps> = ({ onClose }) => {
  const [resourceItems, setResourceItems] = useState<ShopItem[]>([]);
  const [itemItems, setItemItems] = useState<ShopItem[]>([]);
  const [recruitItems, setRecruitItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [gold, setGold] = useState(0);

  useEffect(() => {
    loadShopData();
  }, []);

  const loadShopData = async () => {
    setLoading(true);
    try {
      // 获取商城列表
      const shopRes = await fetch(`${getApiBase()}/api/shop/list`, {
        headers: getAuthHeaders(),
      });
      const shopData = await shopRes.json();
      
      if (shopData.success && shopData.data) {
        setResourceItems(shopData.data[1] || []);
        setItemItems(shopData.data[2] || []);
        setRecruitItems(shopData.data[3] || []);
      }

      // 获取角色信息(金币)
      const charRes = await fetch(`${getApiBase()}/api/character/info`, {
        headers: getAuthHeaders(),
      });
      const charData = await charRes.json();
      if (charData.success) {
        setGold(charData.data?.gold || 0);
      }
    } catch (err) {
      console.error('Failed to load shop:', err);
    }
    setLoading(false);
  };

  const handleBuy = async (item: ShopItem) => {
    setBuying(item.id);
    setMessage('');
    try {
      const res = await fetch(`${getApiBase()}/api/shop/buy`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ item_id: item.id, quantity: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`购买 ${item.name} 成功! 剩余金币: ${data.data?.remaining_gold || 0}`);
        setGold(data.data?.remaining_gold || 0);
      } else {
        setMessage(data.error || '购买失败');
      }
    } catch (err) {
      setMessage('购买失败');
    }
    setBuying(null);
  };

  const renderItem = (item: ShopItem) => (
    <div key={item.id} className={styles.shopItem}>
      <img src={item.icon} alt={item.name} className={styles.shopItemIcon} />
      <div className={styles.shopItemInfo}>
        <div className={styles.shopItemName}>{item.name}</div>
        <div className={styles.shopItemDesc}>{item.desc}</div>
      </div>
      <div className={styles.shopItemPrice}>
        <span className={styles.priceGold}>{item.price}</span>
        <button 
          onClick={() => handleBuy(item)}
          disabled={buying === item.id || gold < item.price}
          className={styles.buyBtn}
        >
          {buying === item.id ? '购买中...' : '购买'}
        </button>
      </div>
    </div>
  );

  const renderSection = (title: string, items: ShopItem[], icon: string) => (
    <div className={styles.shopSection}>
      <h4>{icon} {title}</h4>
      {items.length === 0 ? (
        <div className={styles.empty}>暂无商品</div>
      ) : (
        <div className={styles.shopGrid}>
          {items.map(renderItem)}
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.popupPanel}>
      <div className={styles.popupHeader}>
        <span>商城 (金币: {gold})</span>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>
      
      <div className={styles.popupContent}>
        {message && <div className={styles.message}>{message}</div>}
        
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : (
          <>
            {renderSection('资源道具', resourceItems, '💰')}
            {renderSection('实用道具', itemItems, '🎁')}
            {renderSection('招募道具', recruitItems, '🎫')}
          </>
        )}
      </div>
    </div>
  );
};

export default ShopPanel;
