/**
 * ItemPanel - 道具面板
 * 原则：移动端优先，简洁设计
 */
import React, { useState, useEffect } from 'react';
import { gameApi } from '../services/gameApi';

interface ItemDisplay {
  id: number;
  name: string;
  type: number;
  count: number;
  description?: string;
  value?: number;
  quality?: number;
  canUse?: boolean;
}

interface ItemPanelProps {
  walletAddress: string;
}

type TabType = 'all' | 'equipment' | 'consumable' | 'material' | 'reward';

const TAB_CONFIG: Record<string, { label: string; value: number | null }> = {
  all: { label: '全部', value: null },
  equipment: { label: '装备', value: 1 },
  consumable: { label: '消耗', value: 2 },
  material: { label: '材料', value: 3 },
  reward: { label: '奖励', value: 4 },
};

const QUALITY_COLORS: Record<number, string> = {
  1: 'text-slate-400 border-slate-600',
  2: 'text-green-400 border-green-500',
  3: 'text-blue-400 border-blue-500',
  4: 'text-purple-400 border-purple-500',
  5: 'text-amber-400 border-amber-500',
};

export const ItemPanel: React.FC<ItemPanelProps> = ({ walletAddress }) => {
  const [items, setItems] = useState<ItemDisplay[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const result = await gameApi.getItemList();
      if (result.success) {
        setItems((result.data || []) as ItemDisplay[]);
      }
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [walletAddress]);

  const useItemHandler = async (itemId: number) => {
    try {
      await gameApi.useItem(itemId);
      fetchItems();
    } catch (err) {
      console.error('Failed to use item:', err);
    }
  };

  const sellItemHandler = async (_itemId: number) => {
    try {
      // await gameApi.sellItem(itemId);
      fetchItems();
    } catch (err) {
      console.error('Failed to sell item:', err);
    }
  };

  const filteredItems = activeTab === 'all'
    ? items
    : items.filter(i => i.type === TAB_CONFIG[activeTab].value);

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* 标题 */}
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-emerald-400 
                     tracking-wider uppercase">
        ITEMS
      </h1>

      {/* 标签页 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
        {(Object.keys(TAB_CONFIG) as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-shrink-0 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200
              ${activeTab === tab 
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
              }
            `}
          >
            {TAB_CONFIG[tab].label}
          </button>
        ))}
      </div>

      {/* 道具网格 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-emerald-400 font-mono animate-pulse">LOADING...</div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎒</div>
          <p className="text-slate-500">背包为空</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200
                ${QUALITY_COLORS[item.quality || 1]}
              `}
            >
              {/* 头部 */}
              <div className="flex items-start justify-between mb-2">
                <span className="font-semibold truncate">{item.name}</span>
                <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                  x{item.count}
                </span>
              </div>

              {/* 描述 */}
              {item.description && (
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                  {item.description}
                </p>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
                {item.canUse && (
                  <button
                    onClick={() => useItemHandler(item.id)}
                    className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 
                               text-white text-xs rounded transition-colors"
                  >
                    使用
                  </button>
                )}
                <button
                  onClick={() => sellItemHandler(item.id)}
                  className="flex-1 px-3 py-1.5 bg-amber-600/80 hover:bg-amber-500 
                             text-white text-xs rounded transition-colors"
                >
                  💰 {item.value || 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ItemPanel;
