/**
 * 交易面板组件
 * 市场交易系统
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  getMarketItems,
  getMyInventory,
  getMyListings,
  buyMarketItem,
  listItemForSale,
  cancelMarketListing,
  getMarketStats,
  getItemTypeIcon,
} from '../../services/gameApi';
import type { MarketListingItem, UserInventoryItem, MyListingItem } from '../../types';
import { toast } from '../common/Toast';

interface MarketItem {
  id: number;
  name: string;
  icon: string;
  type: 'weapon' | 'armor' | 'consumable' | 'material';
  price: number;
  stock: number;
  seller: string;
  quality: number; // 1-5 品质
  listingId?: number;
  isMyListing?: boolean;
}

interface MarketStatsDisplay {
  todaySold: number;
  todayVolume: number;
  activeListings: number;
  hotItems: Array<{ name: string; avgPrice: number }>;
}

interface TradePanelProps {
  cityId?: number;
}

type TradeTab = 'buy' | 'sell' | 'my';
type SortType = 'price' | 'stock' | 'quality';

// 物品类型筛选配置（保留UI配置）
const ITEM_TYPE_FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'weapon', label: '⚔️ 武器' },
  { value: 'armor', label: '🛡️ 防具' },
  { value: 'consumable', label: '💊 消耗品' },
  { value: 'material', label: '📦 材料' },
];

// 将API的ItemType数字转换为字符串类型
function getItemTypeString(type: number): 'weapon' | 'armor' | 'consumable' | 'material' {
  switch (type) {
    case 1: return 'weapon';
    case 2: return 'armor';
    case 4: return 'consumable';
    case 5: return 'material';
    default: return 'material';
  }
}

// 将市场挂单转换为MarketItem格式
function transformMarketListingToItem(listing: MarketListingItem): MarketItem {
  const shortAddr = listing.SellerAddr 
    ? `${listing.SellerAddr.substring(0, 6)}...${listing.SellerAddr.substring(38)}`
    : '未知卖家';
  
  return {
    id: listing.ListingID,
    name: listing.ItemName || '未知物品',
    icon: listing.ItemIcon || getItemTypeIcon(listing.ItemType) || '❓',
    type: getItemTypeString(listing.ItemType),
    price: listing.Price || 0,
    stock: 1,
    seller: shortAddr,
    quality: listing.ItemQuality || 1,
    listingId: listing.ListingID,
    isMyListing: listing.IsMine || false,
  };
}

// 将我的挂单物品转换为MarketItem格式
function transformMyListingToItem(listing: MyListingItem): MarketItem {
  return {
    id: listing.ListingID,
    name: listing.ItemName || '未知物品',
    icon: listing.ItemIcon || getItemTypeIcon(listing.ItemType) || '❓',
    type: getItemTypeString(listing.ItemType),
    price: listing.Price || 0,
    stock: 1,
    seller: '我',
    quality: 1,
    listingId: listing.ListingID,
    isMyListing: true,
  };
}

// 将用户背包物品转换为MarketItem格式
function transformInventoryToItem(inv: UserInventoryItem): MarketItem {
  return {
    id: inv.itemId,
    name: inv.itemName || '未知物品',
    icon: inv.itemIcon || getItemTypeIcon(inv.itemType) || '❓',
    type: getItemTypeString(inv.itemType),
    price: inv.price || 0,
    stock: 1,
    seller: '我',
    quality: inv.quality || 1,
    listingId: undefined,
    isMyListing: false,
  };
}

export const TradePanel: React.FC<TradePanelProps> = ({ cityId = 1 }) => {
  const [activeTab, setActiveTab] = useState<TradeTab>('buy');
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<MarketItem[]>([]);
  const [myListingItems, setMyListingItems] = useState<MarketItem[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStatsDisplay | null>(null);
  const [sortType, setSortType] = useState<SortType>('price');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 加载市场数据
  const loadMarketData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getMarketItems(undefined, 1);
      if (result.success && result.data) {
        const items = (result.data.items || []).map(transformMarketListingToItem);
        setMarketItems(items);
      }
    } catch (err) {
      console.error('Failed to load market items:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 加载市场统计数据
  const loadMarketStats = useCallback(async () => {
    try {
      const result = await getMarketStats();
      if (result.success && result.data) {
        setMarketStats({
          todaySold: result.data.today?.soldCount || 0,
          todayVolume: result.data.today?.volume || 0,
          activeListings: result.data.activeListings || 0,
          hotItems: (result.data.hotItems || []).slice(0, 3).map(h => ({
            name: h.itemName,
            avgPrice: h.avgPrice,
          })),
        });
      }
    } catch (err) {
      console.error('Failed to load market stats:', err);
    }
  }, []);

  // 加载用户背包数据
  const loadInventoryData = useCallback(async () => {
    try {
      const result = await getMyInventory();
      if (result.success && result.data) {
        const items = (result.data.items || []).map(transformInventoryToItem);
        setInventoryItems(items);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  }, []);

  // 加载我的挂单数据
  const loadMyListingsData = useCallback(async () => {
    try {
      const result = await getMyListings(1);
      if (result.success && result.data) {
        const items = (result.data.items || []).map(transformMyListingToItem);
        setMyListingItems(items);
      }
    } catch (err) {
      console.error('Failed to load my listings:', err);
    }
  }, []);

  // 取消挂单
  const handleCancelListing = async (listingId: number) => {
    if (!window.confirm('确定要取消这个挂单吗？')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await cancelMarketListing(listingId);
      if (result.success && result.data) {
        toast.success(result.data.message || '取消成功！');
        setActionMessage({ type: 'success', text: result.data.message || '取消成功！' });
        setSelectedItem(null);
        // 刷新数据
        loadMyListingsData();
        loadMarketData();
      } else {
        toast.error(result.error || '取消失败');
        setActionMessage({ type: 'error', text: result.error || '取消失败' });
      }
    } catch (err: any) {
      toast.error(err.message || '取消失败');
      setActionMessage({ type: 'error', text: err.message || '取消失败' });
    } finally {
      setIsLoading(false);
    }
  };

  // 根据Tab加载数据
  useEffect(() => {
    if (activeTab === 'buy') {
      loadMarketData();
      loadMarketStats();
    } else if (activeTab === 'sell') {
      loadInventoryData();
    } else if (activeTab === 'my') {
      loadMyListingsData();
    }
  }, [activeTab, cityId, loadMarketData, loadMarketStats, loadInventoryData, loadMyListingsData]);

  // 排序和过滤物品
  const getFilteredItems = (): MarketItem[] => {
    let items: MarketItem[];
    
    if (activeTab === 'buy') {
      items = marketItems;
    } else if (activeTab === 'sell') {
      items = inventoryItems;
    } else {
      items = myListingItems;
    }
    
    if (filterType !== 'all') {
      items = items.filter(item => item.type === filterType);
    }

    // 排序
    switch (sortType) {
      case 'price':
        return [...items].sort((a, b) => a.price - b.price);
      case 'stock':
        return [...items].sort((a, b) => b.stock - a.stock);
      case 'quality':
        return [...items].sort((a, b) => b.quality - a.quality);
      default:
        return items;
    }
  };

  // 获取品质颜色
  const getQualityColor = (quality: number): string => {
    switch (quality) {
      case 1: return '#9ca3af';
      case 2: return '#22c55e';
      case 3: return '#3b82f6';
      case 4: return '#a855f7';
      case 5: return '#f59e0b';
      default: return '#9ca3af';
    }
  };

  // 获取类型图标
  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'weapon': return '⚔️';
      case 'armor': return '🛡️';
      case 'consumable': return '💊';
      case 'material': return '📦';
      default: return '❓';
    }
  };

  // 处理购买
  const handleBuy = async () => {
    if (!selectedItem || !selectedItem.listingId) {
      setActionMessage({ type: 'error', text: '请选择一个物品' });
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await buyMarketItem(selectedItem.listingId, cityId);
      if (result.success && result.data) {
        toast.success(result.data.message || '购买成功！');
        setActionMessage({ type: 'success', text: result.data.message || '购买成功！' });
        setSelectedItem(null);
        setQuantity(1);
        // 刷新市场数据
        loadMarketData();
      } else {
        toast.error(result.error || '购买失败');
        setActionMessage({ type: 'error', text: result.error || '购买失败' });
      }
    } catch (err: any) {
      toast.error(err.message || '购买失败');
      setActionMessage({ type: 'error', text: err.message || '购买失败' });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理出售（挂牌）
  const handleSell = async () => {
    if (!selectedItem) {
      setActionMessage({ type: 'error', text: '请选择一个物品' });
      return;
    }
    
    // 如果是库存物品，显示挂牌对话框
    const price = window.prompt(`请输入「${selectedItem.name}」的挂牌价格：`, String(selectedItem.price || 1000));
    if (!price) return;
    
    const priceNum = parseInt(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setActionMessage({ type: 'error', text: '请输入有效的价格' });
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await listItemForSale(selectedItem.id, priceNum);
      if (result.success && result.data) {
        toast.success(result.data.message || '挂牌成功！');
        setActionMessage({ type: 'success', text: result.data.message || '挂牌成功！' });
        setSelectedItem(null);
        setQuantity(1);
        // 刷新数据
        loadInventoryData();
        loadMyListingsData();
      } else {
        toast.error(result.error || '挂牌失败');
        setActionMessage({ type: 'error', text: result.error || '挂牌失败' });
      }
    } catch (err: any) {
      toast.error(err.message || '挂牌失败');
      setActionMessage({ type: 'error', text: err.message || '挂牌失败' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && marketItems.length === 0 && inventoryItems.length === 0) {
    return (
      <div className="trade-panel">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '300px',
          fontSize: '18px',
          color: '#aaa'
        }}>
          💰 加载市场中...
        </div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <div className="trade-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ color: '#ffd700', margin: 0 }}>💰 市场交易</h2>
          {marketStats && activeTab === 'buy' && (
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span>今日成交: {marketStats.todaySold}笔</span>
              <span>成交量: 💰{marketStats.todayVolume.toLocaleString()}</span>
              <span>活跃挂单: {marketStats.activeListings}</span>
            </div>
          )}
        </div>
        {actionMessage && (
          <div style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: actionMessage.type === 'success' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: actionMessage.type === 'success' ? '#4ade80' : '#ef4444',
            fontSize: '14px',
          }}>
            {actionMessage.text}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            value={sortType}
            onChange={(e) => setSortType(e.target.value as SortType)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '13px'
            }}
          >
            <option value="price">按价格排序</option>
            <option value="stock">按库存排序</option>
            <option value="quality">按品质排序</option>
          </select>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '13px'
            }}
          >
            {ITEM_TYPE_FILTERS.map(filter => (
              <option key={filter.value} value={filter.value}>{filter.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="trade-tabs" style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '15px'
      }}>
        <button
          className={`trade-tab ${activeTab === 'buy' ? 'active' : ''}`}
          onClick={() => setActiveTab('buy')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'buy' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255,255,255,0.1)',
            border: activeTab === 'buy' ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: activeTab === 'buy' ? '#ffd700' : '#fff',
            cursor: 'pointer',
            fontWeight: activeTab === 'buy' ? 'bold' : 'normal',
            transition: 'all 0.2s ease'
          }}
        >
          🛒 购买市场物品
        </button>
        <button
          className={`trade-tab ${activeTab === 'sell' ? 'active' : ''}`}
          onClick={() => setActiveTab('sell')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'sell' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255,255,255,0.1)',
            border: activeTab === 'sell' ? '1px solid #4ade80' : '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: activeTab === 'sell' ? '#4ade80' : '#fff',
            cursor: 'pointer',
            fontWeight: activeTab === 'sell' ? 'bold' : 'normal',
            transition: 'all 0.2s ease'
          }}
        >
          📤 我的背包出售
        </button>
        <button
          className={`trade-tab ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'my' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255,255,255,0.1)',
            border: activeTab === 'my' ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: activeTab === 'my' ? '#a855f7' : '#fff',
            cursor: 'pointer',
            fontWeight: activeTab === 'my' ? 'bold' : 'normal',
            transition: 'all 0.2s ease'
          }}
        >
          📋 我的挂单
        </button>
      </div>

      <div className="trade-detail-wrapper" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* 物品列表 */}
        <div className="trade-items" style={{
          flex: 1,
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '12px',
          padding: '15px',
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              {activeTab === 'buy' ? '暂无市场物品' : activeTab === 'sell' ? '背包空空如也' : '暂无挂单'}
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                className={`trade-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedItem(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '12px',
                  background: selectedItem?.id === item.id ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: selectedItem?.id === item.id ? '1px solid #ffd700' : '1px solid transparent',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  fontSize: '32px',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px'
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', color: '#fff' }}>{item.name}</span>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: getQualityColor(item.quality),
                      borderRadius: '4px',
                      color: '#000'
                    }}>
                      {item.quality}星
                    </span>
                    {item.isMyListing && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        background: '#a855f7',
                        borderRadius: '4px',
                        color: '#fff'
                      }}>
                        我的挂单
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#aaa' }}>
                    <span>{getTypeIcon(item.type)} {item.type === 'weapon' ? '武器' : item.type === 'armor' ? '防具' : item.type === 'consumable' ? '消耗品' : '材料'}</span>
                    <span>库存: {item.stock}</span>
                    <span>卖家: {item.seller}</span>
                  </div>
                </div>
                <div style={{
                  fontWeight: 'bold',
                  color: '#ffd700',
                  fontSize: '16px'
                }}>
                  💰 {item.price.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 交易详情面板 */}
        <div className="trade-detail" style={{
          width: '280px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          <div className="dashboard-card">
            <div className="dashboard-card-title">
              {activeTab === 'buy' ? '📦 购买详情' : activeTab === 'sell' ? '📤 出售详情' : '📋 挂单详情'}
            </div>
            <div className="dashboard-card-content">
              {selectedItem ? (
                <>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '15px',
                    padding: '15px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '48px' }}>{selectedItem.icon}</div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                        {selectedItem.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        background: getQualityColor(selectedItem.quality),
                        borderRadius: '4px',
                        color: '#000',
                        display: 'inline-block'
                      }}>
                        {selectedItem.quality}星品质
                      </div>
                    </div>
                  </div>

                  <div className="city-info-item">
                    <span className="city-info-label">单价</span>
                    <span className="city-info-value">💰 {selectedItem.price.toLocaleString()}</span>
                  </div>
                  <div className="city-info-item">
                    <span className="city-info-label">库存</span>
                    <span className="city-info-value">{selectedItem.stock}</span>
                  </div>
                  <div className="city-info-item">
                    <span className="city-info-label">卖家</span>
                    <span className="city-info-value">{selectedItem.seller}</span>
                  </div>

                  {activeTab === 'buy' && selectedItem.stock > 1 && (
                    <div className="city-info-item">
                      <span className="city-info-label">数量</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '18px',
                            touchAction: 'manipulation'
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 'bold', minWidth: '40px', textAlign: 'center', fontSize: '16px' }}>
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(Math.min(selectedItem.stock, quantity + 1))}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '18px',
                            touchAction: 'manipulation'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'my' && (
                    <div className="city-info-item" style={{ marginTop: '10px', padding: '10px', background: 'rgba(168,85,247,0.1)', borderRadius: '8px' }}>
                      <span className="city-info-label">取消可得</span>
                      <span className="city-info-value" style={{ color: '#a855f7', fontSize: '18px' }}>
                        💰 {Math.floor(selectedItem.price * 0.95).toLocaleString()}
                      </span>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>含5%取消手续费</div>
                    </div>
                  )}

                  <div className="city-info-item" style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,215,0,0.1)', borderRadius: '8px' }}>
                    <span className="city-info-label">{activeTab === 'buy' ? '总价' : activeTab === 'sell' ? '可得' : '挂单价'}</span>
                    <span className="city-info-value" style={{ color: '#ffd700', fontSize: '18px' }}>
                      💰 {activeTab === 'buy' 
                        ? (selectedItem.price * quantity).toLocaleString() 
                        : activeTab === 'sell'
                        ? Math.floor(selectedItem.price * 0.7 * quantity).toLocaleString()
                        : selectedItem.price.toLocaleString()}
                    </span>
                  </div>

                  {activeTab === 'my' ? (
                    <button
                      className="building-action"
                      style={{
                        width: '100%',
                        marginTop: '15px',
                        background: '#ef4444',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.6 : 1,
                        padding: '14px',
                        fontSize: '15px'
                      }}
                      onClick={() => selectedItem.listingId && handleCancelListing(selectedItem.listingId)}
                      disabled={isLoading}
                    >
                      {isLoading ? '处理中...' : '❌ 取消挂单'}
                    </button>
                  ) : (
                    <button
                      className="building-action"
                      style={{
                        width: '100%',
                        marginTop: '15px',
                        background: activeTab === 'buy' ? '#4ade80' : '#60a5fa',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.6 : 1,
                        padding: '14px',
                        fontSize: '15px'
                      }}
                      onClick={activeTab === 'buy' ? handleBuy : handleSell}
                      disabled={isLoading}
                    >
                      {isLoading ? '处理中...' : activeTab === 'buy' ? '🛒 立即购买' : '📤 立即出售'}
                    </button>
                  )}
                </>
              ) : (
                <p style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                  选择一个物品进行{activeTab === 'buy' ? '购买' : '出售'}
                </p>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-title">💡 交易提示</div>
            <div className="dashboard-card-content" style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.8' }}>
              <p>• 出售价格为您挂单价的 70%</p>
              <p>• 点击物品后再点击购买/出售</p>
              <p>• 可调节购买数量</p>
              <p>• 高品质物品价值更高</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradePanel;
