/**
 * 市场面板组件 (MarketPanel)
 * 玩家间物品交易市场
 *
 * 功能：
 * - 浏览市场挂单物品
 * - 搜索物品
 * - 购买物品
 * - 管理我的挂单（查看、取消）
 * - 市场统计信息
 * - 物品价格走势
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  getMarketInfo,
  getMarketItems,
  getMyListings,
  searchMarketItems,
  buyMarketItem,
  cancelMarketListing,
  getMarketStats,
  getPriceHistory,
  getItemTypeName,
  getItemTypeIcon,
  transformMarketItem,
} from '../../services/gameApi';
import {
  MarketTab,
  MarketListingItem,
  MarketInfo,
  MarketStats,
  PriceHistoryResponse,
  ITEM_QUALITY_COLORS,
  ITEM_QUALITY_NAMES,
  HotItem,
} from '../../types';
import { toast } from '../common/Toast';

interface MarketPanelProps {
  cityId?: number;
}

// 物品类型筛选配置
const ITEM_TYPE_FILTERS = [
  { value: 0, label: '全部' },
  { value: 1, label: '⚔️ 武器' },
  { value: 2, label: '🛡️ 防具' },
  { value: 3, label: '💍 饰品' },
  { value: 4, label: '💊 消耗品' },
  { value: 5, label: '📦 材料' },
];

// 排序选项
type SortOption = 'default' | 'price_asc' | 'price_desc' | 'quality_desc';

export const MarketPanel: React.FC<MarketPanelProps> = ({ cityId = 1 }) => {
  // Tab 状态
  const [activeTab, setActiveTab] = useState<MarketTab>('market');

  // 市场数据状态
  const [marketInfo, setMarketInfo] = useState<MarketInfo | null>(null);
  const [marketItems, setMarketItems] = useState<MarketListingItem[]>([]);
  const [myListings, setMyListings] = useState<MarketListingItem[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // 筛选和搜索状态
  const [selectedItemType, setSelectedItemType] = useState<number>(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // 选中物品状态
  const [selectedItem, setSelectedItem] = useState<MarketListingItem | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryResponse | null>(null);

  // 购买/挂牌状态
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 错误状态
  const [error, setError] = useState<string | null>(null);

  // 加载市场基本信息
  const loadMarketInfo = useCallback(async () => {
    try {
      const result = await getMarketInfo();
      if (result.success && result.data) {
        setMarketInfo(result.data);
      }
    } catch (err) {
      console.error('[Market] Failed to load market info:', err);
    }
  }, []);

  // 加载市场挂单列表
  const loadMarketItems = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      let result;
      if (searchKeyword.trim()) {
        result = await searchMarketItems(
          searchKeyword.trim(),
          selectedItemType > 0 ? selectedItemType : undefined,
          page
        );
      } else {
        result = await getMarketItems(
          selectedItemType > 0 ? selectedItemType : undefined,
          page
        );
      }

      if (result.success && result.data) {
        const items = (result.data.items || []).map(transformMarketItem);
        setMarketItems(items);
        setTotalPages(result.data.totalPages || 1);
        setTotalItems(result.data.total || 0);
        setCurrentPage(result.data.page || page);
      } else {
        setError(result.error || '加载市场数据失败');
      }
    } catch (err: any) {
      setError(err.message || '加载市场数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [searchKeyword, selectedItemType]);

  // 加载我的挂单
  const loadMyListings = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMyListings(page);
      if (result.success && result.data) {
        const items = (result.data.items || []).map((item: any) => ({
          ...transformMarketItem(item),
          StateName: item.StateName || (item.State === 1 ? '挂单中' : item.State === 2 ? '已售出' : '已取消'),
        }));
        setMyListings(items);
        setTotalPages(Math.ceil((result.data.total || 0) / (result.data.pageSize || 1)) || 1);
        setTotalItems(result.data.total || 0);
        setCurrentPage(result.data.page || page);
      } else {
        setError(result.error || '加载我的挂单失败');
      }
    } catch (err: any) {
      setError(err.message || '加载我的挂单失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 加载市场统计
  const loadMarketStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const result = await getMarketStats();
      if (result.success && result.data) {
        setMarketStats(result.data);
      }
    } catch (err) {
      console.error('[Market] Failed to load stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // 加载价格走势
  const loadPriceHistory = useCallback(async (configId: number) => {
    setIsLoadingHistory(true);
    try {
      const result = await getPriceHistory(configId);
      if (result.success && result.data) {
        setPriceHistory(result.data);
      }
    } catch (err) {
      console.error('[Market] Failed to load price history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    loadMarketInfo();
  }, [loadMarketInfo]);

  // Tab 切换时加载对应数据
  useEffect(() => {
    setSelectedItem(null);
    setPriceHistory(null);
    if (activeTab === 'market') {
      loadMarketItems(1);
    } else if (activeTab === 'my') {
      loadMyListings(1);
    } else if (activeTab === 'stats') {
      loadMarketStats();
    }
  }, [activeTab, loadMarketItems, loadMyListings, loadMarketStats]);

  // 筛选变化时重新加载
  useEffect(() => {
    if (activeTab === 'market') {
      loadMarketItems(1);
    }
  }, [selectedItemType, sortOption]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'market' && searchKeyword) {
        loadMarketItems(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchKeyword, loadMarketItems, activeTab]);

  // 排序物品列表
  const getSortedItems = useCallback((items: MarketListingItem[]): MarketListingItem[] => {
    const sorted = [...items];
    switch (sortOption) {
      case 'price_asc':
        return sorted.sort((a, b) => a.Price - b.Price);
      case 'price_desc':
        return sorted.sort((a, b) => b.Price - a.Price);
      case 'quality_desc':
        return sorted.sort((a, b) => b.ItemQuality - a.ItemQuality);
      default:
        return sorted;
    }
  }, [sortOption]);

  // 处理购买
  const handleBuy = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const result = await buyMarketItem(selectedItem.ListingID, cityId);
      if (result.success && result.data) {
        toast.success(result.data.message || `成功购买「${result.data.itemName}」！`);
        setActionMessage({
          type: 'success',
          text: result.data.message || `成功购买「${result.data.itemName}」！`,
        });
        setSelectedItem(null);
        loadMarketItems(currentPage);
        loadMarketInfo();
      } else {
        toast.error(result.error || '购买失败');
        setActionMessage({ type: 'error', text: result.error || '购买失败' });
      }
    } catch (err: any) {
      toast.error(err.message || '购买失败');
      setActionMessage({ type: 'error', text: err.message || '购买失败' });
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理取消挂单
  const handleCancelListing = async (listingId: number) => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const result = await cancelMarketListing(listingId);
      if (result.success && result.data) {
        toast.success(result.data.message || `已取消「${result.data.itemName}」的挂单`);
        setActionMessage({
          type: 'success',
          text: result.data.message || `已取消「${result.data.itemName}」的挂单`,
        });
        setSelectedItem(null);
        loadMyListings(currentPage);
        loadMarketInfo();
      } else {
        toast.error(result.error || '取消失败');
        setActionMessage({ type: 'error', text: result.error || '取消失败' });
      }
    } catch (err: any) {
      toast.error(err.message || '取消失败');
      setActionMessage({ type: 'error', text: err.message || '取消失败' });
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理物品选择（查看价格走势）
  const handleItemSelect = (item: MarketListingItem) => {
    setSelectedItem(item);
    setBuyQuantity(1);
    if (item.ConfigID && item.ConfigID > 0) {
      setSelectedConfigId(item.ConfigID);
      loadPriceHistory(item.ConfigID);
    } else {
      setSelectedConfigId(null);
      setPriceHistory(null);
    }
  };

  // 渲染品质标签
  const renderQualityBadge = (quality: number) => {
    const color = ITEM_QUALITY_COLORS[quality] || ITEM_QUALITY_COLORS[1];
    const name = ITEM_QUALITY_NAMES[quality] || ITEM_QUALITY_NAMES[1];
    return (
      <span
        className="market-quality-badge"
        style={{
          background: color,
        }}
      >
        {name}
      </span>
    );
  };

  // 渲染价格走势图表
  const renderPriceChart = () => {
    if (!priceHistory || priceHistory.history.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          暂无价格走势数据
        </div>
      );
    }

    const history = [...priceHistory.history].reverse().slice(-10);
    const maxPrice = Math.max(...history.map(h => h.price), 1);
    const minPrice = Math.min(...history.map(h => h.price), 1);
    const chartHeight = 80;

    return (
      <div style={{ marginTop: '10px' }}>
        <div className="market-chart-label">
          近{history.length}笔成交价格走势
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: `${chartHeight + 20}px` }}>
          {history.map((h, idx) => {
            const height = Math.max(10, (h.price / maxPrice) * chartHeight);
            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${height}px`,
                    background: 'linear-gradient(to top, #f59e0b, #fbbf24)',
                    borderRadius: '3px 3px 0 0',
                    minHeight: '4px',
                  }}
                  title={`¥${h.price.toLocaleString()}`}
                />
              </div>
            );
          })}
        </div>
        <div className="market-chart-stat" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>最低: ¥{minPrice.toLocaleString()}</span>
          <span>均价: ¥{priceHistory.avgPrice.toLocaleString()}</span>
          <span>最高: ¥{maxPrice.toLocaleString()}</span>
        </div>
      </div>
    );
  };

  // 渲染操作消息
  const renderActionMessage = () => {
    if (!actionMessage) return null;
    return (
      <div
        style={{
          padding: '10px 15px',
          borderRadius: '8px',
          background: actionMessage.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          border: `1px solid ${actionMessage.type === 'success' ? '#22c55e' : '#ef4444'}`,
          color: actionMessage.type === 'success' ? '#22c55e' : '#ef4444',
          fontSize: '13px',
          marginBottom: '10px',
        }}
      >
        {actionMessage.text}
      </div>
    );
  };

  // 渲染统计卡片
  const renderStatsCards = () => {
    if (!marketStats) return null;

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="dashboard-card">
          <div className="dashboard-card-title">📊 今日交易</div>
          <div className="dashboard-card-content">
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
              {marketStats.today.soldCount}
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              成交笔数 · 交易额 ¥{(marketStats.today.volume || 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">📈 昨日交易</div>
          <div className="dashboard-card-content">
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
              {marketStats.yesterday.soldCount}
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              成交笔数 · 交易额 ¥{(marketStats.yesterday.volume || 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">🏪 当前挂单</div>
          <div className="dashboard-card-content">
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
              {marketStats.activeListings}
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              在架物品数量
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">💰 历史总计</div>
          <div className="dashboard-card-content">
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#a855f7' }}>
              {marketStats.total.soldCount}
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              总成交笔数 · ¥{(marketStats.total.volume || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染热门物品
  const renderHotItems = () => {
    if (!marketStats?.hotItems?.length) return null;

    return (
      <div className="dashboard-card" style={{ marginTop: '15px' }}>
        <div className="dashboard-card-title">🔥 热门物品</div>
        <div className="dashboard-card-content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {marketStats.hotItems.map((item: HotItem, idx: number) => (
              <div
                key={item.configId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: idx < 3 ? '#f59e0b' : '#888', fontWeight: 'bold' }}>
                    #{idx + 1}
                  </span>
                  <span>{item.itemName}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#22c55e', fontWeight: 'bold' }}>
                    ¥{item.avgPrice.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {item.sellCount}笔成交
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 渲染物品列表项
  const renderItemCard = (item: MarketListingItem, isMyListing: boolean = false) => {
    const isSelected = selectedItem?.ListingID === item.ListingID;

    return (
      <div
        key={item.ListingID}
        onClick={() => !isMyListing && handleItemSelect(item)}
        className="market-item-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          background: isSelected ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255,255,255,0.03)',
          border: isSelected ? '1px solid #ffd700' : '1px solid transparent',
          borderRadius: '10px',
          marginBottom: '8px',
          cursor: isMyListing ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {/* 物品图标 */}
        <div
          style={{
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            fontSize: '24px',
            border: `2px solid ${ITEM_QUALITY_COLORS[item.ItemQuality] || '#666'}`,
          }}
        >
          {item.ItemIcon || '📦'}
        </div>

        {/* 物品信息 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontWeight: 'bold',
                color: ITEM_QUALITY_COLORS[item.ItemQuality] || '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.ItemName}
            </span>
            {renderQualityBadge(item.ItemQuality)}
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#888' }}>
            <span>{getItemTypeIcon(item.ItemType)} {getItemTypeName(item.ItemType)}</span>
            <span>
              卖家: {item.IsMine ? '我' : `${item.SellerAddr.slice(0, 6)}...${item.SellerAddr.slice(-4)}`}
            </span>
          </div>
        </div>

        {/* 价格 */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', color: '#ffd700', fontSize: '15px' }}>
            💰 {item.Price.toLocaleString()}
          </div>
          {isMyListing && (
            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
              {item.State === 1 ? '🟢 挂单中' : item.State === 2 ? '🔴 已售出' : '⚪ 已取消'}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染详情面板
  const renderDetailPanel = () => {
    if (!selectedItem) {
      return (
        <div
          className="dashboard-card market-detail-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            color: '#666',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📋</div>
          <div>选择物品查看详情</div>
        </div>
      );
    }

    const tax = Math.floor(selectedItem.Price * 0.05);
    const sellerReceives = selectedItem.Price - tax;

    return (
      <div className="dashboard-card market-detail-panel">
        <div className="dashboard-card-title">📦 {activeTab === 'market' ? '购买详情' : '挂单详情'}</div>
        <div className="dashboard-card-content">
          {/* 物品展示 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '15px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '10px',
              marginBottom: '15px',
            }}
          >
            <div
              style={{
                fontSize: '56px',
                marginBottom: '10px',
                filter: `drop-shadow(0 0 8px ${ITEM_QUALITY_COLORS[selectedItem.ItemQuality]})`,
              }}
            >
              {selectedItem.ItemIcon || '📦'}
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '6px', textAlign: 'center' }}>
              {selectedItem.ItemName}
            </div>
            {renderQualityBadge(selectedItem.ItemQuality)}
            {selectedItem.ItemDes && (
              <div style={{ fontSize: '12px', color: '#888', marginTop: '6px', textAlign: 'center' }}>
                {selectedItem.ItemDes.slice(0, 50)}{selectedItem.ItemDes.length > 50 ? '...' : ''}
              </div>
            )}
          </div>

          {/* 价格信息 */}
          <div className="market-detail-info">
            <div className="market-detail-row">
              <span className="market-detail-label">单价</span>
              <span className="market-detail-value" style={{ color: '#ffd700' }}>
                💰 {selectedItem.Price.toLocaleString()}
              </span>
            </div>
            <div className="market-detail-row">
              <span className="market-detail-label">交易税 (5%)</span>
              <span className="market-detail-value" style={{ color: '#f59e0b' }}>
                -¥{tax.toLocaleString()}
              </span>
            </div>
            <div className="market-detail-row" style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '8px' }}>
              <span className="market-detail-label">卖家实收</span>
              <span className="market-detail-value" style={{ color: '#22c55e' }}>
                ¥{sellerReceives.toLocaleString()}
              </span>
            </div>
            <div className="market-detail-row">
              <span className="market-detail-label">卖家</span>
              <span className="market-detail-value">
                {selectedItem.IsMine ? '我' : `${selectedItem.SellerAddr.slice(0, 8)}...`}
              </span>
            </div>
          </div>

          {/* 价格走势 */}
          {activeTab === 'market' && renderPriceChart()}

          {/* 操作按钮 */}
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeTab === 'market' && !selectedItem.IsMine && (
              <button
                onClick={handleBuy}
                disabled={isProcessing}
                className="gufeng-btn gufeng-btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  opacity: isProcessing ? 0.6 : 1,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                }}
              >
                {isProcessing ? '处理中...' : `💰 立即购买`}
              </button>
            )}

            {activeTab === 'my' && selectedItem.State === 1 && (
              <button
                onClick={() => handleCancelListing(selectedItem.ListingID)}
                disabled={isProcessing}
                className="gufeng-btn gufeng-btn-danger"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  opacity: isProcessing ? 0.6 : 1,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                }}
              >
                {isProcessing ? '处理中...' : '❌ 取消挂单'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 渲染市场 Tab
  const renderMarketTab = () => (
    <div style={{ display: 'flex', gap: '20px' }}>
      {/* 左侧：物品列表 */}
      <div style={{ flex: 1 }}>
        {/* 搜索和筛选 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 搜索物品名称..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
            }}
          />

          <select
            value={selectedItemType}
            onChange={(e) => setSelectedItemType(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              minWidth: '120px',
            }}
          >
            {ITEM_TYPE_FILTERS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            style={{
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              minWidth: '130px',
            }}
          >
            <option value="default">默认排序</option>
            <option value="price_asc">价格 ↑ 低到高</option>
            <option value="price_desc">价格 ↓ 高到低</option>
            <option value="quality_desc">品质 高到低</option>
          </select>
        </div>

        {/* 统计信息 */}
        {marketInfo && (
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
            共 {totalItems} 件物品在售 · 市场税率 {((marketInfo.taxRate || 0.05) * 100).toFixed(0)}%
          </div>
        )}

        {/* 物品列表 */}
        <div
          style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '12px',
            padding: '12px',
            maxHeight: '500px',
            overflowY: 'auto',
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
              加载中...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
              {error}
              <button
                className="gufeng-btn gufeng-btn-danger"
                style={{ display: 'block', margin: '10px auto' }}
                onClick={() => loadMarketItems(currentPage)}
              >
                重试
              </button>
            </div>
          ) : getSortedItems(marketItems).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
              暂无物品
            </div>
          ) : (
            getSortedItems(marketItems).map(item => renderItemCard(item))
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px', alignItems: 'center' }}>
            <button
              className="gufeng-btn gufeng-btn-secondary"
              onClick={() => loadMarketItems(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              ◀ 上一页
            </button>
            <span style={{ padding: '8px 12px', color: '#ffd700', fontSize: 14 }}>
              {currentPage} / {totalPages}
            </span>
            <button
              className="gufeng-btn gufeng-btn-secondary"
              onClick={() => loadMarketItems(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              下一页 ▶
            </button>
          </div>
        )}
      </div>

      {/* 右侧：详情面板 */}
      {renderDetailPanel()}
    </div>
  );

  // 渲染我的挂单 Tab
  const renderMyListingsTab = () => (
    <div style={{ display: 'flex', gap: '20px' }}>
      {/* 左侧：我的挂单列表 */}
      <div style={{ flex: 1 }}>
        {marketInfo && (
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '15px' }}>
            我已上架 {myListings.filter(i => i.State === 1).length} / {marketInfo.maxListings} 件物品
          </div>
        )}

        <div
          style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '12px',
            padding: '12px',
            maxHeight: '500px',
            overflowY: 'auto',
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
              加载中...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
              {error}
              <button
                className="gufeng-btn gufeng-btn-danger"
                style={{ display: 'block', margin: '10px auto' }}
                onClick={() => loadMyListings(currentPage)}
              >
                重试
              </button>
            </div>
          ) : myListings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
              暂无挂单物品
            </div>
          ) : (
            myListings.map(item => (
              <div
                key={item.ListingID}
                onClick={() => {
                  setSelectedItem(item);
                  setSelectedConfigId(item.ConfigID || null);
                  if (item.ConfigID) loadPriceHistory(item.ConfigID);
                }}
              >
                {renderItemCard(item, true)}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧：详情面板 */}
      {renderDetailPanel()}
    </div>
  );

  // 渲染统计 Tab
  const renderStatsTab = () => (
    <div>
      {isLoadingStats ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
          加载中...
        </div>
      ) : (
        <>
          {renderStatsCards()}
          {renderHotItems()}

          {/* 市场规则说明 */}
          <div className="dashboard-card" style={{ marginTop: '15px' }}>
            <div className="dashboard-card-title">📜 市场规则</div>
            <div className="dashboard-card-content" style={{ lineHeight: 1.8 }}>
              <p>• 交易税率为 <strong style={{ color: '#f59e0b' }}>5%</strong>，由卖家承担</p>
              <p>• 每个玩家最多同时挂 <strong style={{ color: '#ffd700' }}>20</strong> 件物品</p>
              <p>• 物品售出后扣除税费，剩余金额自动转入卖家账户</p>
              <p>• 可随时取消未售出的挂单，物品将返还背包</p>
              <p>• 购买他人物品后，物品将直接进入您的背包</p>
              <p>• 请注意辨别物品品质和价格，谨慎交易</p>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // 渲染主面板
  return (
    <div className="market-panel">
      {/* Tab 切换 */}
      <div className="market-tabs">
        <button
          className={`market-tab ${activeTab === 'market' ? 'active' : ''}`}
          onClick={() => setActiveTab('market')}
        >
          🏪 市场
          {totalItems > 0 && activeTab !== 'market' && (
            <span className="tab-badge">{totalItems}</span>
          )}
        </button>
        <button
          className={`market-tab ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          📦 我的挂单
          {marketInfo && marketInfo.myListings > 0 && (
            <span className="tab-badge">{marketInfo.myListings}</span>
          )}
        </button>
        <button
          className={`market-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 市场统计
        </button>
      </div>

      {/* 操作消息 */}
      {renderActionMessage()}

      {/* Tab 内容 */}
      {activeTab === 'market' && renderMarketTab()}
      {activeTab === 'my' && renderMyListingsTab()}
      {activeTab === 'stats' && renderStatsTab()}
    </div>
  );
};

export default MarketPanel;