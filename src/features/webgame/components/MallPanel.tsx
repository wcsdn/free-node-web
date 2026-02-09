/**
 * 商城面板组件
 * 原则：移动端优先，简洁设计
 */
import React, { useState, useEffect, memo } from 'react';
import { mallApi, MallItem, MallItemType } from '../services/api/mallApi';
import { GameCard, GameButton, GameModal } from '@/shared/components/game';

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
  onClose?: () => void;
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
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-emerald-400 tracking-wider uppercase">
          🏪 商城
        </h1>
        {onClose && (
          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            onClick={onClose}
          >
            ×
          </button>
        )}
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          message.includes('成功') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message}
        </div>
      )}

      {/* 物品类型导航 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {ITEM_TYPES.map((type) => (
          <button
            key={type.id}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              currentType === type.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
            }`}
            onClick={() => setCurrentType(type.id)}
          >
            {type.name}
          </button>
        ))}
      </div>

      {/* 物品列表 */}
      <GameCard className="mb-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <span>加载中...</span>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-4xl mb-2">📦</div>
            <p>暂无商品</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item) => (
              <button
                key={item.Id}
                className={`p-4 rounded-lg border transition-all text-left ${
                  selectedItem?.Id === item.Id
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/30'
                }`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                    <img 
                      src={item.Image ? `/jx/Web${item.Image}` : '/jx/Web/img/2/1.gif'} 
                      alt={item.Name}
                      className="w-10 h-10 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/jx/Web/img/2/1.gif'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-200 truncate">{item.Name}</div>
                    <div className="text-lg font-bold text-amber-400 mt-1">💰 {item.Gold}</div>
                    {item.Limit && item.Limit > 0 && (
                      <div className="text-xs text-slate-500 mt-1">限{item.Limit}个</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </GameCard>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="text-sm text-slate-400">
            {selectedItem ? (
              <>
                <span className="text-slate-300">已选: </span>
                <span className="text-emerald-400">{selectedItem.Name}</span>
                <span className="ml-3 text-amber-400">💰 {selectedItem.Gold}</span>
              </>
            ) : (
              <span>请选择商品</span>
            )}
          </div>
          <button
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              !selectedItem || buying
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
            disabled={!selectedItem || buying}
            onClick={() => selectedItem && setShowBuyConfirm(true)}
          >
            {buying ? '购买中...' : '购买'}
          </button>
        </div>
      </div>

      {/* 购买确认弹窗 */}
      <GameModal
        isOpen={showBuyConfirm}
        onClose={() => !buying && setShowBuyConfirm(false)}
        title="购买确认"
        size="small"
      >
        {selectedItem && (
          <div className="space-y-4">
            {/* 商品信息 */}
            <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
              <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src={selectedItem.Image ? `/jx/Web${selectedItem.Image}` : '/jx/Web/img/2/1.gif'} 
                  alt={selectedItem.Name}
                  className="w-12 h-12 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/jx/Web/img/2/1.gif'; }}
                />
              </div>
              <div>
                <div className="font-medium text-slate-200">{selectedItem.Name}</div>
                <div className="text-amber-400 mt-1">💰 {selectedItem.Gold} 元宝</div>
              </div>
            </div>

            {/* 数量选择 */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400">购买数量</label>
              <div className="flex items-center gap-3">
                <button
                  className="w-10 h-10 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
                  onClick={() => setBuyCount(Math.max(1, buyCount - 1))}
                  disabled={buying}
                >
                  -
                </button>
                <input
                  type="number"
                  value={buyCount}
                  onChange={(e) => setBuyCount(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max={selectedItem.Limit || 99}
                  disabled={buying}
                  className="flex-1 h-10 px-4 bg-slate-800 border border-slate-700 rounded-lg text-center text-white focus:border-emerald-500 focus:outline-none"
                />
                <button
                  className="w-10 h-10 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
                  onClick={() => setBuyCount(Math.min(selectedItem.Limit || 99, buyCount + 1))}
                  disabled={buying}
                >
                  +
                </button>
              </div>
            </div>

            {/* 总价 */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
              <span className="text-slate-400">总价: </span>
              <span className="text-xl font-bold text-amber-400">💰 {selectedItem.Gold * buyCount} 元宝</span>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <GameButton
                fullWidth
                variant="red"
                onClick={() => setShowBuyConfirm(false)}
                disabled={buying}
              >
                取消
              </GameButton>
              <GameButton
                fullWidth
                onClick={handleBuy}
                loading={buying}
              >
                {buying ? '购买中...' : '确认购买'}
              </GameButton>
            </div>
          </div>
        )}
      </GameModal>
    </div>
  );
});

MallPanel.displayName = 'MallPanel';

export default MallPanel;
