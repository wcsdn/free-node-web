/**
 * 市场面板组件 - 资源交易
 * 原则：移动端优先，简洁设计
 */
import React, { useEffect, useState } from 'react';
import { gameApi } from '../services/gameApi';
import { GameButton } from '@/shared/components/game';

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
  const totalPrice = (amount * (selectedItem?.price || 0));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-emerald-400">🏪 市场交易</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className="mx-4 mt-4 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm border border-emerald-500/30">
            {message}
          </div>
        )}

        {/* 城市选择 */}
        <div className="p-4 border-b border-slate-700">
          <label className="block text-sm text-slate-400 mb-2">选择城市</label>
          <select
            value={selectedCity || ''}
            onChange={(e) => setSelectedCity(parseInt(e.target.value))}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
          >
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name} (银:{city.money} 粮:{city.food} 人:{city.population})
              </option>
            ))}
          </select>
        </div>

        {/* 买卖切换 */}
        <div className="flex border-b border-slate-700">
          {(['buy', 'sell'] as const).map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-3 font-medium transition-all ${
                action === tab
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              onClick={() => setAction(tab)}
            >
              {tab === 'buy' ? '买入资源' : '卖出资源'}
            </button>
          ))}
        </div>

        {/* 资源列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <span className="ml-2">加载中...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    selectedItem?.id === item.id
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/30'
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📦</span>
                    <div>
                      <div className="font-medium text-emerald-400">{item.resource_name}</div>
                      <div className={`text-sm ${action === 'buy' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {item.price} 金币
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    数量: {item.min_amount}-{item.max_amount}
                  </div>
                  {currentCity && (
                    <div className="text-xs text-slate-500 mt-1">
                      拥有: {currentCity[item.resource_type as keyof typeof currentCity] || 0}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 交易区域 */}
        {selectedItem && (
          <div className="p-4 border-t border-slate-700 bg-slate-800/30">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  数量 (范围: {selectedItem.min_amount}-{selectedItem.max_amount})
                </label>
                <div className="flex items-center gap-3">
                  <button
                    className="w-10 h-10 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                    onClick={() => setAmount(Math.max(selectedItem.min_amount, amount - 10))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(selectedItem.min_amount, Math.min(selectedItem.max_amount, parseInt(e.target.value) || 0)))}
                    min={selectedItem.min_amount}
                    max={selectedItem.max_amount}
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    className="w-10 h-10 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                    onClick={() => setAmount(Math.min(selectedItem.max_amount, amount + 10))}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-400">总价</span>
                <span className={`text-xl font-bold ${action === 'buy' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {totalPrice} 金币
                </span>
              </div>

              <GameButton
                fullWidth
                variant={action === 'buy' ? 'red' : 'emerald'}
                onClick={handleTrade}
              >
                {action === 'buy' ? '买入' : '卖出'} {selectedItem.resource_name}
              </GameButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPanel;
