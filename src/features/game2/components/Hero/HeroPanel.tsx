/**
 * 武将面板 - HeroPanel
 * 
 * 功能：
 * - 武将列表展示（卡片形式）
 * - 武将详情弹窗（升级、装备）
 * - 武将排序（等级/战斗力/名称）
 * - 武将筛选（状态）
 * - 装备穿戴/卸下
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { toast } from '../common/Toast';
import type { HeroData, UserInventoryItem } from '../../types';
import { ITEM_QUALITY_COLORS, ITEM_QUALITY_NAMES } from '../../types';
import { getMyInventory } from '../../services/gameApi';
import {
  // API 和服务
  getHeroList,
  unequipHeroItem,
  // 数据转换
  transformHeroData,
  // 工具函数
  calculateHeroPower,
  getLevelupExp,
  getLevelupPreview,
  sortHeroes,
  filterHeroes,
  // 类型
  EquipSlotType,
  EQUIP_SLOT_NAMES,
  type HeroSortType,
  type HeroFilterType,
} from '../../services/HeroService';

interface HeroPanelProps {
  heroes: HeroData[];
  cityId?: number;
  onHeroUpdate?: (heroes: HeroData[]) => void;
}

type SortOption = { value: HeroSortType; label: string };
type FilterOption = { value: HeroFilterType; label: string };

const SORT_OPTIONS: SortOption[] = [
  { value: 'level', label: '等级' },
  { value: 'power', label: '战斗力' },
  { value: 'name', label: '名称' },
];

const FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: '全部' },
  { value: 'idle', label: '待命' },
  { value: 'fighting', label: '战斗' },
  { value: 'resting', label: '休整' },
];

/** 武将卡片组件 */
const HeroCard: React.FC<{
  hero: HeroData;
  onClick: () => void;
}> = ({ hero, onClick }) => {
  const power = calculateHeroPower(hero);
  
  return (
    <div className="hero-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="hero-avatar">
        {hero.avatar ? (
          <img src={hero.avatar} alt={hero.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
        ) : (
          hero.name.charAt(0)
        )}
      </div>
      <div className="hero-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="hero-name">{hero.name}</span>
          <span className={`hero-status ${hero.status}`}>
            {hero.status === 'idle' ? '待命' : hero.status === 'fighting' ? '战斗' : '休整'}
          </span>
        </div>
        <div style={{ color: '#ffd700', fontSize: '14px', marginBottom: '8px' }}>
          Lv.{hero.level} · ⚡ {power}
        </div>
        <div className="hero-stats">
          <div>
            ⚔️ 攻击: <span className="hero-stat-value">{hero.attack}</span>
          </div>
          <div>
            🛡️ 防御: <span className="hero-stat-value">{hero.defense}</span>
          </div>
          <div>
            ❤️ 生命: <span className="hero-stat-value">{hero.health}</span>
          </div>
          <div>
            ⭐ 技能: <span className="hero-stat-value">{hero.skill}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/** 武将详情弹窗 */
const HeroDetailModal: React.FC<{
  hero: HeroData;
  open: boolean;
  onClose: () => void;
  cityId: number;
  onHeroAction: () => void;
}> = ({ hero, open, onClose, cityId, onHeroAction }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'equip'>('info');
  const [upgrading, setUpgrading] = useState(false);
  const [selectedEquipSlot, setSelectedEquipSlot] = useState<number | null>(null);
  const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UserInventoryItem | null>(null);

  // 检测手机屏幕
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const power = calculateHeroPower(hero);
  const levelupPreview = getLevelupPreview(hero);
  const maxExp = getLevelupExp(hero.level);
  const expProgress = maxExp > 0 ? Math.min(100, (hero.exp / maxExp) * 100) : 0;
  
  // 加载背包物品
  const loadInventory = useCallback(async () => {
    setLoadingInventory(true);
    try {
      const result = await getMyInventory();
      if (result.success && result.data) {
        // 只显示可装备的物品（类型1=武器, 2=防具, 3=饰品）
        const equippableItems = result.data.items?.filter(
          item => [1, 2, 3].includes(item.itemType) && !item.equipped
        ) || [];
        setInventory(equippableItems);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoadingInventory(false);
    }
  }, []);
  
  useEffect(() => {
    if (activeTab === 'equip') {
      loadInventory();
    }
  }, [activeTab, loadInventory]);
  
  // 升级武将
  const handleUpgrade = async () => {
    if (hero.level >= 100) {
      toast.warning('武将已达满级！');
      return;
    }
    
    setUpgrading(true);
    try {
      const apiBase = (import.meta.env as unknown as Record<string, string>).VITE_API_BASE || 'http://localhost:8788';
      const result = await fetch(`${apiBase}/api/hero/levelup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: '0x1234567890123456789012345678901234567890', city_id: cityId, hero_id: hero.id }),
      });
      const data = await result.json();
      
      if (data.success) {
        toast.success(`升级成功！${hero.name} 已升至 Lv.${hero.level + 1}`);
        onHeroAction();
        onClose();
      } else {
        toast.error(data.error || '升级失败');
      }
    } catch (err) {
      console.error('Upgrade failed:', err);
      toast.error('升级失败，请稍后重试');
    } finally {
      setUpgrading(false);
    }
  };
  
  // 选择装备槽位
  const handleSlotClick = (slotType: number) => {
    setSelectedEquipSlot(slotType);
    setSelectedItem(null);
  };
  
  // 选择背包物品进行装备
  const handleItemSelect = (item: UserInventoryItem) => {
    if (selectedEquipSlot !== null) {
      // 检查物品类型是否匹配槽位
      const slotToItemType: Record<number, number> = {
        [EquipSlotType.Weapon]: 1,
        [EquipSlotType.Armor]: 2,
        [EquipSlotType.Accessory]: 3,
      };
      
      if (item.itemType === slotToItemType[selectedEquipSlot]) {
        setSelectedItem(item);
      } else {
        toast.warning(`该物品不适合当前槽位（需要 ${EQUIP_SLOT_NAMES[selectedEquipSlot]}）`);
      }
    } else {
      toast.info('请先选择一个装备槽位');
    }
  };
  
  // 确认装备
  const handleEquipConfirm = async () => {
    if (!selectedItem) return;
    
    try {
      // TODO: 调用装备API
      toast.success(`${selectedItem.itemName} 已装备到 ${hero.name}`);
      setSelectedItem(null);
      setSelectedEquipSlot(null);
      onHeroAction();
    } catch (err) {
      console.error('Equip failed:', err);
      toast.error('装备失败，请稍后重试');
    }
  };
  
  // 确认卸下
  const handleUnequipConfirm = async () => {
    try {
      const result = await unequipHeroItem(cityId, hero.id);
      if (result.success) {
        toast.success('装备已卸下');
        onHeroAction();
      } else {
        toast.error(result.error || '卸下失败');
      }
    } catch (err) {
      console.error('Unequip failed:', err);
      toast.error('卸下失败，请稍后重试');
    }
  };
  
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${hero.name} - 武将详情`}
      width={isMobile ? '100%' : 560}
      maxHeight={isMobile ? '100vh' : '80vh'}
    >
      {/* 标签页 */}
      <div style={{ display: 'flex', gap: isMobile ? '6px' : '10px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('info')}
          style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeTab === 'info' ? 'bold' : 'normal',
            background: activeTab === 'info' ? '#ffd700' : 'rgba(255,255,255,0.1)',
            color: activeTab === 'info' ? '#000' : '#fff',
          }}
        >
          📊 武将信息
        </button>
        <button
          onClick={() => setActiveTab('equip')}
          style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeTab === 'equip' ? 'bold' : 'normal',
            background: activeTab === 'equip' ? '#ffd700' : 'rgba(255,255,255,0.1)',
            color: activeTab === 'equip' ? '#000' : '#fff',
          }}
        >
          ⚔️ 装备管理
        </button>
      </div>
      
      {/* 武将信息 */}
      {activeTab === 'info' && (
        <div>
          {/* 基础属性 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
              <div style={{ color: '#aaa', marginBottom: '5px' }}>等级</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffd700' }}>Lv.{hero.level}</div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '12px' }}>
                  <span>经验 {hero.exp}/{maxExp}</span>
                  <span>{expProgress.toFixed(0)}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '4px' }}>
                  <div style={{ width: `${expProgress}%`, height: '100%', background: '#ffd700', borderRadius: '3px', transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
              <div style={{ color: '#aaa', marginBottom: '5px' }}>战斗力</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>⚡ {power}</div>
              <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>综合实力评估</div>
            </div>
          </div>
          
          {/* 属性详情 */}
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ color: '#aaa', marginBottom: '12px' }}>属性</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '10px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px' }}>⚔️</div>
                <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '18px' }}>{hero.attack}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>攻击</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px' }}>🛡️</div>
                <div style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '18px' }}>{hero.defense}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>防御</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px' }}>❤️</div>
                <div style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '18px' }}>{hero.health}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>生命</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px' }}>⭐</div>
                <div style={{ color: '#a855f7', fontWeight: 'bold', fontSize: '18px' }}>{hero.skill}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>技能</div>
              </div>
            </div>
          </div>
          
          {/* 升级预览 */}
          {hero.level < 100 && (
            <div style={{ background: 'rgba(255,215,0,0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(255,215,0,0.2)' }}>
              <div style={{ color: '#ffd700', marginBottom: '10px', fontWeight: 'bold' }}>📈 升级预览</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#aaa', fontSize: '12px' }}>攻击</div>
                  <div style={{ color: '#fff' }}>{hero.attack} → <span style={{ color: '#22c55e' }}>{levelupPreview.attack}</span></div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#aaa', fontSize: '12px' }}>防御</div>
                  <div style={{ color: '#fff' }}>{hero.defense} → <span style={{ color: '#22c55e' }}>{levelupPreview.defense}</span></div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#aaa', fontSize: '12px' }}>生命</div>
                  <div style={{ color: '#fff' }}>{hero.health} → <span style={{ color: '#22c55e' }}>{levelupPreview.health}</span></div>
                </div>
              </div>
              <div style={{ textAlign: 'center', color: '#aaa', fontSize: '14px' }}>
                升级所需: 💰 {levelupPreview.costGold.toLocaleString()} 金币 | 📚 {levelupPreview.expRequired} 经验
              </div>
            </div>
          )}
          
          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleUpgrade}
              disabled={upgrading || hero.level >= 100}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                cursor: upgrading || hero.level >= 100 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                background: hero.level >= 100 ? '#666' : 'linear-gradient(135deg, #ffd700, #ff8c00)',
                color: '#000',
                opacity: upgrading ? 0.7 : 1,
              }}
            >
              {upgrading ? '升级中...' : hero.level >= 100 ? '已满级' : '🎉 升级武将'}
            </button>
            <button
              onClick={handleUnequipConfirm}
              style={{
                padding: '12px 20px',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
              }}
            >
              卸下装备
            </button>
          </div>
        </div>
      )}
      
      {/* 装备管理 */}
      {activeTab === 'equip' && (
        <div>
          {/* 装备槽位 */}
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <div style={{ color: '#aaa', marginBottom: '12px' }}>装备槽位（点击选择）</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { type: EquipSlotType.Weapon, icon: '⚔️', name: '武器' },
                { type: EquipSlotType.Armor, icon: '🛡️', name: '防具' },
                { type: EquipSlotType.Accessory, icon: '💍', name: '饰品' },
              ].map(slot => (
                <div
                  key={slot.type}
                  onClick={() => handleSlotClick(slot.type)}
                  style={{
                    flex: 1,
                    padding: '15px',
                    background: selectedEquipSlot === slot.type ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)',
                    border: selectedEquipSlot === slot.type ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '5px' }}>{slot.icon}</div>
                  <div style={{ color: '#fff', fontSize: '14px' }}>{slot.name}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 背包物品 */}
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
            <div style={{ color: '#aaa', marginBottom: '12px' }}>背包物品（点击选择装备）</div>
            
            {loadingInventory ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>加载中...</div>
            ) : inventory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>背包中没有可装备的物品</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '10px', maxHeight: isMobile ? '250px' : '200px', overflowY: 'auto' }}>
                {inventory.map(item => (
                  <div
                    key={item.itemId}
                    onClick={() => handleItemSelect(item)}
                    style={{
                      padding: '10px',
                      background: selectedItem?.itemId === item.itemId ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)',
                      border: selectedItem?.itemId === item.itemId ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>{item.itemName}</div>
                    <div style={{ fontSize: '12px', color: ITEM_QUALITY_COLORS[item.quality] || '#fff' }}>
                      {ITEM_QUALITY_NAMES[item.quality] || '普通'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                      {item.itemType === 1 && '⚔️ 武器'}
                      {item.itemType === 2 && '🛡️ 防具'}
                      {item.itemType === 3 && '💍 饰品'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 确认装备 */}
          {selectedItem && (
            <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(34,197,94,0.1)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ color: '#22c55e', fontWeight: 'bold' }}>已选择:</span> {selectedItem.itemName}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleEquipConfirm}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    background: '#22c55e',
                    color: '#fff',
                  }}
                >
                  ✅ 确认装备
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: 'transparent',
                    color: '#fff',
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

/** 主武将面板组件 */
export const HeroPanel: React.FC<HeroPanelProps> = ({ heroes, cityId = 1, onHeroUpdate }) => {
  const [sortBy, setSortBy] = useState<HeroSortType>('level');
  const [filterBy, setFilterBy] = useState<HeroFilterType>('all');
  const [selectedHero, setSelectedHero] = useState<HeroData | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 排序和筛选后的武将列表
  const filteredHeroes = useMemo(() => {
    const filtered = filterHeroes(heroes, filterBy);
    return sortHeroes(filtered, sortBy);
  }, [heroes, sortBy, filterBy]);
  
  // 打开武将详情
  const handleHeroClick = (hero: HeroData) => {
    setSelectedHero(hero);
    setDetailModalOpen(true);
  };
  
  // 关闭详情
  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedHero(null);
  };
  
  // 刷新武将数据
  const handleHeroAction = async () => {
    setLoading(true);
    try {
      const result = await getHeroList(cityId);
      if (result.success && result.data) {
        const updatedHeroes = transformHeroData(result.data);
        onHeroUpdate?.(updatedHeroes);
      }
    } catch (err) {
      console.error('Failed to refresh heroes:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="hero-panel">
      {/* 标题栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#ffd700', margin: 0 }}>⚔️ 武将列表</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ color: '#aaa' }}>共 {filteredHeroes.length} 名武将</span>
          {loading && <span style={{ color: '#ffd700' }}>刷新中...</span>}
        </div>
      </div>
      
      {/* 筛选和排序 */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
        {/* 排序 */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ color: '#aaa', fontSize: '14px' }}>排序:</span>
          {SORT_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                background: sortBy === option.value ? '#ffd700' : 'rgba(255,255,255,0.1)',
                color: sortBy === option.value ? '#000' : '#fff',
                fontWeight: sortBy === option.value ? 'bold' : 'normal',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        {/* 筛选 */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ color: '#aaa', fontSize: '14px' }}>筛选:</span>
          {FILTER_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setFilterBy(option.value)}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                background: filterBy === option.value ? '#ffd700' : 'rgba(255,255,255,0.1)',
                color: filterBy === option.value ? '#000' : '#fff',
                fontWeight: filterBy === option.value ? 'bold' : 'normal',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 武将列表 */}
      <div className="hero-list">
        {filteredHeroes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            {heroes.length === 0 ? '暂无武将' : '没有符合条件的武将'}
          </div>
        ) : (
          filteredHeroes.map(hero => (
            <HeroCard
              key={hero.id}
              hero={hero}
              onClick={() => handleHeroClick(hero)}
            />
          ))
        )}
      </div>
      
      {/* 武将详情弹窗 */}
      {selectedHero && (
        <HeroDetailModal
          hero={selectedHero}
          open={detailModalOpen}
          onClose={handleCloseDetail}
          cityId={cityId}
          onHeroAction={handleHeroAction}
        />
      )}
    </div>
  );
};

export default HeroPanel;
