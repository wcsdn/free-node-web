/**
 * 市场面板组件 - 资源交易
 */
import React, { useEffect, useState } from 'react';
import { gameApi } from '../services/gameApi';
import styles from '../styles/jxMain.module.css';

interface MarketItem {
  id: number;
  resource_type: string;
  resource_name: string;
  price: number;
  min_amount: number;
  max_amount: number;
  icon: string;
}

interface CityResource {
  id: number;
  name: string;
  money: number;
  food: number;
  population: number;
}

interface MarketPanelProps {
  walletAddress: string;
  onClose: () => void;
}

const MarketPanel: React.FC<MarketPanelProps> = ({ onClose }) => {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [cities, setCities] = useState<CityResource[]>([]);
  const [selectedCity, setSelectedCity] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState(100);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    setLoading(true);
    try {
      const res = await gameApi.getMarketList(1, 20);
      if (res.success) {
        setItems(res.data || []);
        setCities([{ id: 1, name: '主城', money: 0, food: 0, population: 0 }]);
        setSelectedCity(1);
      }
    } catch (err) {
      console.error('Failed to load market:', err);
    }
    setLoading(false);
  };

  const handleTrade = async () => {
    if (!selectedItem || !selectedCity) {
      setMessage('请选择城市和商品');
      return;
    }

    setMessage('');
    try {
      if (action === 'buy') {
        const res = await gameApi.buyFromMarket(selectedItem.id, amount);
        if (res.success) {
          setMessage(`买入 ${amount} 成功!`);
          loadMarketData();
        } else {
          setMessage(res.error || '购买失败');
        }
      } else {
        const res = await gameApi.sellToMarket(selectedItem.id, amount, selectedItem.price);
        if (res.success) {
          setMessage(`卖出 ${amount} 成功!`);
          loadMarketData();
        } else {
          setMessage(res.error || '卖出失败');
        }
      }
    } catch (err) {
      setMessage('交易失败');
    }
  };

  const currentCity = cities.find(c => c.id === selectedCity);

  return (
    <div className={styles.popupPanel}>
      <div className={styles.popupHeader}>
        <span>市场交易</span>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>
      
      <div className={styles.popupContent}>
        {message && <div className={styles.message}>{message}</div>}
        
        {/* 城市选择 */}
        <div className={styles.marketCitySelect}>
          <label>选择城市: </label>
          <select 
            value={selectedCity} 
            onChange={(e) => setSelectedCity(parseInt(e.target.value))}
            className={styles.citySelect}
          >
            {cities.map(city => (
              <option key={city.id} value={city.id}>
                {city.name} (银:{city.money} 粮:{city.food} 人:{city.population})
              </option>
            ))}
          </select>
        </div>

        {/* 买卖切换 */}
        <div className={styles.marketActions}>
          <button 
            className={`${styles.actionTab} ${action === 'buy' ? styles.active : ''}`}
            onClick={() => setAction('buy')}
          >
            买入资源
          </button>
          <button 
            className={`${styles.actionTab} ${action === 'sell' ? styles.active : ''}`}
            onClick={() => setAction('sell')}
          >
            卖出资源
          </button>
        </div>

        {/* 资源列表 */}
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : (
          <div className={styles.marketItems}>
            {items.map(item => (
              <div 
                key={item.id}
                className={`${styles.marketItem} ${selectedItem?.id === item.id ? styles.selected : ''}`}
                onClick={() => setSelectedItem(item)}
              >
                <img src={item.icon} alt={item.resource_name} className={styles.itemIcon} />
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{item.resource_name}</div>
                  <div className={styles.itemPrice}>
                    单价: <span className={action === 'buy' ? styles.sellPrice : styles.buyPrice}>
                      {item.price} 金币
                    </span>
                  </div>
                  <div className={styles.itemRange}>
                    数量: {item.min_amount}-{item.max_amount}
                  </div>
                </div>
                {currentCity && (
                  <div className={styles.itemStock}>
                    拥有: {currentCity[item.resource_type as keyof typeof currentCity] || 0}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 交易区域 */}
        {selectedItem && (
          <div className={styles.tradeArea}>
            <div className={styles.tradeForm}>
              <label>数量: </label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(Math.max(selectedItem.min_amount, Math.min(selectedItem.max_amount, parseInt(e.target.value) || 0)))}
                min={selectedItem.min_amount}
                max={selectedItem.max_amount}
                className={styles.amountInput}
              />
              <button 
                onClick={handleTrade}
                className={action === 'buy' ? styles.buyBtn : styles.sellBtn}
              >
                {action === 'buy' ? '买入' : '卖出'} 
                ({(amount * selectedItem.price)} 金币)
              </button>
            </div>
            <div className={styles.tradeTips}>
              {action === 'buy' 
                ? `买入 ${amount} ${selectedItem.resource_name} 需要 ${amount * selectedItem.price} 金币`
                : `卖出 ${amount} ${selectedItem.resource_name} 将获得 ${amount * selectedItem.price} 金币`
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPanel;
