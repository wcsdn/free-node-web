/**
 * 商城面板组件 (MallPanel)
 * 🏪 官方商店 - 用元宝购买游戏物品
 *
 * 与市场(MarketPanel)的区别：
 * - 商城：官方定价，元宝购买，不可议价
 * - 市场：玩家自由定价，可砍价，玩家间交易
 *
 * 功能：
 * - 浏览商城商品分类
 * - 查看商品详情
 * - 购买确认弹窗
 * - 购买商品/VIP/免战牌
 * - 元宝兑换资源
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getMallInfo,
  getMallItemsByType,
  buyFromMall,
  goldBuyResource,
  getResToGoldRate,
  getVipSevenDays,
  getVipThirtyDays,
  getPeaceEightHours,
  getPeaceTwoDays,
  getPeaceSevenDays,
} from '../../services/gameApi';

// ============ 类型定义 ============

interface MallCategory {
  id: number;
  name: string;
  items: number;
}

interface CommodityItem {
  Id: number;
  Type: number;
  TypeName: string;
  Tips: string;
  Image: string;
  Usetype: number;
  Gold: number;
  BuyDes: string;
  MainEffectType: number;
  EffectType: number;
  Index: number;
  IsUsed: number;
  BuyType: number;
}

interface ExchangeRate {
  moneyToGold: number;
  foodToGold: number;
  menToGold: number;
  goldToMoney: number;
  goldToFood: number;
  goldToMen: number;
  maxExchange: {
    money: number;
    food: number;
    men: number;
  };
}

interface MallPanelProps {
  cityId?: number;
}

type MallTab = 'commodity' | 'vip' | 'peace' | 'exchange';

export const MallPanel: React.FC<MallPanelProps> = ({ cityId = 1 }) => {
  // Tab 状态
  const [activeTab, setActiveTab] = useState<MallTab>('commodity');

  // 数据状态
  const [categories, setCategories] = useState<MallCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(1);
  const [commodityItems, setCommodityItems] = useState<CommodityItem[]>([]);

  // VIP 相关
  const [vipSevenDays, setVipSevenDays] = useState<CommodityItem | null>(null);
  const [vipThirtyDays, setVipThirtyDays] = useState<CommodityItem | null>(null);

  // 免战牌相关
  const [peaceEight, setPeaceEight] = useState<CommodityItem | null>(null);
  const [peaceTwo, setPeaceTwo] = useState<CommodityItem | null>(null);
  const [peaceSeven, setPeaceSeven] = useState<CommodityItem | null>(null);

  // 兑换汇率
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);

  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  // 操作状态
  const [exchangeType, setExchangeType] = useState<42 | 43 | 44>(42);
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [isExchanging, setIsExchanging] = useState(false);

  // 消息提示（带自动消失）
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 购买确认弹窗
  const [confirmItem, setConfirmItem] = useState<CommodityItem | null>(null);

  // 自动消失消息
  useEffect(() => {
    if (message) {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
      messageTimerRef.current = setTimeout(() => setMessage(null), 3000);
    }
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, [message]);

  // 加载商城基本信息
  const loadMallInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getMallInfo();
      if (result.success && result.data?.categories) {
        setCategories(result.data.categories);
      }
    } catch (err) {
      console.error('Failed to load mall info:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 加载商品列表
  const loadCommodityItems = useCallback(async (type: number) => {
    setIsLoadingItems(true);
    try {
      const result = await getMallItemsByType(cityId, type);
      if (result.success && Array.isArray(result.data)) {
        setCommodityItems(result.data);
      }
    } catch (err) {
      console.error('Failed to load commodity items:', err);
    } finally {
      setIsLoadingItems(false);
    }
  }, [cityId]);

  // 加载VIP商品
  const loadVipItems = useCallback(async () => {
    try {
      const [seven, thirty] = await Promise.all([getVipSevenDays(), getVipThirtyDays()]);
      if (seven.success && seven.data) setVipSevenDays(seven.data);
      if (thirty.success && thirty.data) setVipThirtyDays(thirty.data);
    } catch (err) {
      console.error('Failed to load VIP items:', err);
    }
  }, []);

  // 加载免战牌
  const loadPeaceItems = useCallback(async () => {
    try {
      const [eight, two, seven] = await Promise.all([
        getPeaceEightHours(),
        getPeaceTwoDays(),
        getPeaceSevenDays(),
      ]);
      if (eight.success && eight.data) setPeaceEight(eight.data);
      if (two.success && two.data) setPeaceTwo(two.data);
      if (seven.success && seven.data) setPeaceSeven(seven.data);
    } catch (err) {
      console.error('Failed to load peace items:', err);
    }
  }, []);

  // 加载兑换汇率
  const loadExchangeRate = useCallback(async () => {
    try {
      const result = await getResToGoldRate();
      if (result.success && result.data) {
        setExchangeRate(result.data);
      }
    } catch (err) {
      console.error('Failed to load exchange rate:', err);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadMallInfo();
    loadCommodityItems(selectedCategory);
  }, [loadMallInfo, selectedCategory]);

  // 切换Tab时加载对应数据
  useEffect(() => {
    if (activeTab === 'commodity') {
      loadCommodityItems(selectedCategory);
    } else if (activeTab === 'vip') {
      loadVipItems();
    } else if (activeTab === 'peace') {
      loadPeaceItems();
    } else if (activeTab === 'exchange') {
      loadExchangeRate();
    }
  }, [activeTab, selectedCategory, loadCommodityItems, loadVipItems, loadPeaceItems, loadExchangeRate]);

  // 购买商品（打开确认弹窗）
  const handleBuy = (item: CommodityItem) => {
    if (item.IsUsed === 1) return;
    setConfirmItem(item);
  };

  // 确认购买
  const handleConfirmBuy = async () => {
    if (!confirmItem) return;
    setIsBuying(true);
    setMessage(null);
    try {
      const result = await buyFromMall(cityId, confirmItem.Type, confirmItem.Id, confirmItem.Index);
      if (result.success) {
        setMessage({ type: 'success', text: `🎉 购买成功！获得 ${confirmItem.TypeName}` });
        setConfirmItem(null);
        // 刷新商品列表
        if (activeTab === 'commodity') {
          loadCommodityItems(selectedCategory);
        } else if (activeTab === 'vip') {
          loadVipItems();
        } else if (activeTab === 'peace') {
          loadPeaceItems();
        }
      } else {
        const errorMsg = getErrorMessage(result);
        setMessage({ type: 'error', text: errorMsg });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '购买失败' });
    } finally {
      setIsBuying(false);
    }
  };

  // 元宝兑换资源
  const handleExchange = async () => {
    const amount = parseInt(exchangeAmount);
    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: '请输入有效的元宝数量' });
      return;
    }
    if (exchangeRate) {
      const maxExchange = exchangeType === 42 ? exchangeRate.maxExchange.money :
                         exchangeType === 43 ? exchangeRate.maxExchange.food :
                         exchangeRate.maxExchange.men;
      if (amount > maxExchange) {
        setMessage({ type: 'error', text: `本次最多兑换 ${maxExchange} 元宝` });
        return;
      }
    }
    setIsExchanging(true);
    setMessage(null);
    try {
      const result = await goldBuyResource(cityId, exchangeType, amount);
      if (result.success) {
        setMessage({ type: 'success', text: '兑换成功！' });
        setExchangeAmount('');
        await loadExchangeRate();
      } else {
        const errorMsg = getErrorMessage(result);
        setMessage({ type: 'error', text: errorMsg });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '兑换失败' });
    } finally {
      setIsExchanging(false);
    }
  };

  // 错误码解析
  const getErrorMessage = (code: any): string => {
    const errorMap: Record<number, string> = {
      30055: '元宝不足',
      30150: '已购买过此商品',
      30182: '商品不存在',
      30180: '购买失败',
      30101: '用户不存在',
    };
    if (typeof code === 'number' && errorMap[code]) {
      return errorMap[code];
    }
    return '操作失败';
  };

  // 资源类型标签
  const getResourceLabel = (type: number) => {
    switch (type) {
      case 42: return '💰 铜钱';
      case 43: return '🌾 粮食';
      case 44: return '👥 人口';
      default: return '资源';
    }
  };

  return (
    <div className="dashboard-card" style={{ padding: '12px', minHeight: '100%' }}>
      {/* 标题 */}
      <div className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span>🏪 商城 <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 'normal' }}>（元宝购买）</span></span>
        <button className="gufeng-btn" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => {
          loadMallInfo();
          loadCommodityItems(selectedCategory);
          setMessage({ type: 'success', text: '已刷新' });
        }}>
          🔄 刷新
        </button>
      </div>

      {/* 消息提示（Toast） */}
      {message && (
        <div style={{
          padding: '10px 14px',
          marginBottom: '10px',
          borderRadius: '8px',
          fontSize: '12px',
          background: message.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
          color: message.type === 'success' ? '#4ade80' : '#f87171',
          border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '2px 4px',
              fontSize: '14px',
              opacity: 0.7,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        {[
          { key: 'commodity' as const, label: '🛍️ 商品' },
          { key: 'vip' as const, label: '👑 VIP' },
          { key: 'peace' as const, label: '🛡️ 免战' },
          { key: 'exchange' as const, label: '💱 兑换' },
        ].map((tab) => (
          <button
            key={tab.key}
            className="building-action"
            style={{
              flex: 1,
              fontSize: '11px',
              padding: '8px 4px',
              minHeight: '36px',
              background: activeTab === tab.key ? 'var(--primary-color, #3b82f6)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab.key ? '#fff' : '#9ca3af',
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========== 商品分类 ========== */}
      {activeTab === 'commodity' && (
        <>
          {/* 分类选择 */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className="building-action"
                style={{
                  fontSize: '11px',
                  padding: '6px 10px',
                  minHeight: '32px',
                  whiteSpace: 'nowrap',
                  background: selectedCategory === cat.id ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.05)',
                  color: selectedCategory === cat.id ? '#a855f7' : '#9ca3af',
                  border: selectedCategory === cat.id ? '1px solid #a855f7' : '1px solid transparent',
                }}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name} ({cat.items})
              </button>
            ))}
          </div>

          {/* 商品列表 */}
          {isLoadingItems ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '12px' }}>加载中...</div>
          ) : commodityItems.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', maxHeight: '500px', overflowY: 'auto', paddingRight: '2px' }}>
              {commodityItems.map((item) => (
                <div
                  key={`${item.Type}-${item.Id}`}
                  className="dashboard-card"
                  style={{ padding: '10px', display: 'flex', flexDirection: 'column' }}
                >
                  {/* 商品图标 */}
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(59,130,246,0.3))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    marginBottom: '8px',
                    alignSelf: 'center',
                  }}>
                    {item.Image ? <img src={item.Image} alt="" style={{ width: '36px', height: '36px' }} /> : '🎁'}
                  </div>

                  {/* 商品名称 */}
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: '4px' }}>
                    {item.TypeName}
                  </div>

                  {/* 商品描述 */}
                  {(item.Tips || item.BuyDes) && (
                    <div style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', marginBottom: '6px', minHeight: '28px', overflow: 'hidden' }}>
                      {item.BuyDes || item.Tips}
                    </div>
                  )}

                  {/* 价格 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold' }}>💎</span>
                    <span style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold' }}>{item.Gold}</span>
                  </div>

                  {/* 购买按钮 */}
                  <button
                    className="building-action gufeng-btn"
                    style={{
                      width: '100%',
                      fontSize: '12px',
                      padding: '10px 6px',
                      minHeight: '44px',
                      opacity: item.IsUsed === 1 || isBuying ? 0.6 : 1,
                    }}
                    disabled={item.IsUsed === 1 || isBuying}
                    onClick={() => handleBuy(item)}
                  >
                    {item.IsUsed === 1 ? '✅ 已购买' : isBuying ? '购买中..' : '🛒 购买'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '12px' }}>
              该分类暂无商品
            </div>
          )}
        </>
      )}

      {/* ========== VIP 会员 ========== */}
      {activeTab === 'vip' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="dashboard-card" style={{ padding: '12px', background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,179,8,0.2))', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '4px' }}>👑 VIP特权</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', lineHeight: '1.5' }}>
              每日可领取元宝 | 专属VIP称号 | 经验加成 | 更多特权...
            </div>
          </div>

          {/* 周卡 */}
          {vipSevenDays && (
            <div className="dashboard-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                📅
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '2px' }}>VIP周卡</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>7天每日领100元宝</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '2px' }}>💎 {vipSevenDays.Gold}</div>
                <button
                  className="building-action gufeng-btn"
                  style={{ fontSize: '11px', padding: '4px 10px', minHeight: '28px' }}
                  disabled={isBuying}
                  onClick={() => handleBuy(vipSevenDays)}
                >
                  {isBuying ? '购买中..' : '购买'}
                </button>
              </div>
            </div>
          )}

          {/* 月卡 */}
          {vipThirtyDays && (
            <div className="dashboard-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                📆
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '2px' }}>VIP月卡</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>30天每日领500元宝</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '2px' }}>💎 {vipThirtyDays.Gold}</div>
                <button
                  className="building-action gufeng-btn"
                  style={{ fontSize: '11px', padding: '4px 10px', minHeight: '28px' }}
                  disabled={isBuying}
                  onClick={() => handleBuy(vipThirtyDays)}
                >
                  {isBuying ? '购买中..' : '购买'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== 免战牌 ========== */}
      {activeTab === 'peace' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="dashboard-card" style={{ padding: '12px', background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(59,130,246,0.2))', border: '1px solid rgba(34,197,94,0.3)' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#22c55e', marginBottom: '4px' }}>🛡️ 免战保护</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', lineHeight: '1.5' }}>
              购买免战牌后，在有效时间内不会被其他玩家攻击
            </div>
          </div>

          {/* 8小时免战 */}
          {peaceEight && (
            <div className="dashboard-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                ⏰
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '2px' }}>8小时免战牌</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>8小时内不会被攻击</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '2px' }}>💎 {peaceEight.Gold}</div>
                <button className="building-action gufeng-btn" style={{ fontSize: '11px', padding: '4px 10px', minHeight: '28px' }} disabled={isBuying} onClick={() => handleBuy(peaceEight)}>
                  {isBuying ? '购买中..' : '购买'}
                </button>
              </div>
            </div>
          )}

          {/* 2天免战 */}
          {peaceTwo && (
            <div className="dashboard-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                📅
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '2px' }}>2天免战牌</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>2天内不会被攻击</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '2px' }}>💎 {peaceTwo.Gold}</div>
                <button className="building-action gufeng-btn" style={{ fontSize: '11px', padding: '4px 10px', minHeight: '28px' }} disabled={isBuying} onClick={() => handleBuy(peaceTwo)}>
                  {isBuying ? '购买中..' : '购买'}
                </button>
              </div>
            </div>
          )}

          {/* 7天免战 */}
          {peaceSeven && (
            <div className="dashboard-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                🛡️
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '2px' }}>7天免战牌</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>7天内不会被攻击</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '2px' }}>💎 {peaceSeven.Gold}</div>
                <button className="building-action gufeng-btn" style={{ fontSize: '11px', padding: '4px 10px', minHeight: '28px' }} disabled={isBuying} onClick={() => handleBuy(peaceSeven)}>
                  {isBuying ? '购买中..' : '购买'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== 元宝兑换 ========== */}
      {activeTab === 'exchange' && exchangeRate && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="dashboard-card" style={{ padding: '12px', background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(245,158,11,0.2))', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>💱 元宝兑换</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', lineHeight: '1.5' }}>
              1元宝 = 100 铜钱/粮食/人口
            </div>
          </div>

          {/* 兑换类型选择 */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { key: 42 as const, label: '💰 铜钱', color: '#f59e0b' },
              { key: 43 as const, label: '🌾 粮食', color: '#22c55e' },
              { key: 44 as const, label: '👥 人口', color: '#3b82f6' },
            ].map((item) => (
              <button
                key={item.key}
                className="building-action"
                style={{
                  flex: 1,
                  fontSize: '11px',
                  padding: '8px',
                  minHeight: '36px',
                  background: exchangeType === item.key ? `${item.color}30` : 'rgba(255,255,255,0.05)',
                  color: exchangeType === item.key ? item.color : '#9ca3af',
                  border: exchangeType === item.key ? `1px solid ${item.color}` : '1px solid transparent',
                }}
                onClick={() => setExchangeType(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* 兑换说明 */}
          <div className="dashboard-card" style={{ padding: '10px' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
              本次可兑换上限
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b' }}>
              {exchangeType === 42 && exchangeRate.maxExchange.money.toLocaleString()}
              {exchangeType === 43 && exchangeRate.maxExchange.food.toLocaleString()}
              {exchangeType === 44 && exchangeRate.maxExchange.men.toLocaleString()}
              {' '}
              {exchangeType === 42 && '铜钱'}
              {exchangeType === 43 && '粮食'}
              {exchangeType === 44 && '人口'}
            </div>
          </div>

          {/* 输入框 */}
          <input
            type="number"
            placeholder="输入要使用的元宝数量..."
            value={exchangeAmount}
            onChange={(e) => setExchangeAmount(e.target.value)}
            min={1}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '10px 12px',
              color: '#fff',
              fontSize: '12px',
              minHeight: '40px',
              boxSizing: 'border-box',
            }}
          />

          {/* 预估获得 */}
          {exchangeAmount && parseInt(exchangeAmount) > 0 && (
            <div className="dashboard-card" style={{ padding: '10px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>预计获得</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>
                {(parseInt(exchangeAmount) * 100).toLocaleString()}
                {' '}
                {exchangeType === 42 && '铜钱'}
                {exchangeType === 43 && '粮食'}
                {exchangeType === 44 && '人口'}
              </div>
            </div>
          )}

          {/* 兑换按钮 */}
          <button
            className="building-action gufeng-btn"
            style={{ width: '100%', fontSize: '12px', padding: '12px', minHeight: '44px', opacity: isExchanging ? 0.7 : 1 }}
            disabled={isExchanging || !exchangeAmount}
            onClick={handleExchange}
          >
            {isExchanging ? '兑换中..' : '💎 确认兑换'}
          </button>
        </div>
      )}

      {activeTab === 'exchange' && !exchangeRate && (
        <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', fontSize: '12px' }}>
          加载汇率中...
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '12px' }}>
          加载中...
        </div>
      )}

      {/* ========== 购买确认弹窗 ========== */}
      {confirmItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid rgba(168,85,247,0.4)',
            borderRadius: '12px',
            padding: '20px',
            width: '100%',
            maxWidth: '360px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            {/* 标题 */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                🛒 确认购买
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                商城商品一经购买，概不退换
              </div>
            </div>

            {/* 商品信息 */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}>
              {/* 商品图标 */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(59,130,246,0.4))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                flexShrink: 0,
              }}>
                {confirmItem.Image ? <img src={confirmItem.Image} alt="" style={{ width: '40px', height: '40px' }} /> : '🎁'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '2px' }}>
                  {confirmItem.TypeName}
                </div>
                {confirmItem.Tips && (
                  <div style={{ fontSize: '11px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {confirmItem.Tips}
                  </div>
                )}
              </div>
            </div>

            {/* 价格 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              background: 'rgba(245,158,11,0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(245,158,11,0.3)',
              marginBottom: '16px',
            }}>
              <span style={{ fontSize: '20px' }}>💎</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                {confirmItem.Gold}
              </span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>元宝</span>
            </div>

            {/* 按钮 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setConfirmItem(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#9ca3af',
                  fontSize: '13px',
                  cursor: 'pointer',
                  minHeight: '44px',
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmBuy}
                disabled={isBuying}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isBuying ? 'rgba(168,85,247,0.5)' : 'linear-gradient(135deg, #a855f7, #7c3aed)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: isBuying ? 'not-allowed' : 'pointer',
                  minHeight: '44px',
                }}
              >
                {isBuying ? '购买中..' : '💎 确认支付'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
