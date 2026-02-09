/**
 * ShopPanel - 商城面板
 * 原则：移动端优先，简洁设计
 */
import React, { useState, useEffect } from 'react';
import { GameCard } from '@/shared/components/game';

interface ShopItem {
  id: number;
  name: string;
  type: number;
  price: number;
  description: string;
  icon?: string;
}

interface ShopPanelProps {
  walletAddress?: string;
}

type ShopTab = 1 | 2 | 3 | 4;

const SHOP_TABS: { value: ShopTab; label: string }[] = [
  { value: 1, label: '消耗品' },
  { value: 2, label: '材料' },
  { value: 3, label: '装备' },
  { value: 4, label: '其他' },
];

export const ShopPanel: React.FC<ShopPanelProps> = ({ walletAddress }) => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ShopTab>(1);
  const [gold, setGold] = useState(1000);

  useEffect(() => {
    const loadShopItems = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8788/api/shop/list?type=${filterType}`, {
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
  }, [walletAddress, filterType]);

  const buyItem = async (item: ShopItem) => {
    try {
      await fetch('http://localhost:8788/api/shop/buy', {
        method: 'POST',
        headers: { 'X-Wallet-Auth': walletAddress || '' },
        body: JSON.stringify({ item_id: item.id, count: 1 }),
      });
      setGold(prev => prev - item.price);
      alert('购买成功！');
    } catch (err) {
      console.error('Failed to buy item:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* 标题 */}
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-emerald-400 
                     tracking-wider uppercase">
        SHOP
      </h1>

      {/* 金币显示 */}
      <div className="flex justify-end mb-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <span className="text-amber-400">🪙</span>
          <span className="text-amber-400 font-mono font-bold">{gold.toLocaleString()}</span>
        </div>
      </div>

      {/* 分类标签 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
        {SHOP_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterType(tab.value)}
            className={`
              flex-shrink-0 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200
              ${filterType === tab.value 
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 物品列表 */}
      <GameCard>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            加载中...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            暂无商品
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => buyItem(item)}
                className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition-all"
              >
                <div className="text-2xl mb-2">{item.icon || '📦'}</div>
                <div className="font-medium text-slate-200 truncate">{item.name}</div>
                <div className="text-amber-400 mt-1">💰 {item.price}</div>
              </button>
            ))}
          </div>
        )}
      </GameCard>
    </div>
  );
};

export default ShopPanel;
