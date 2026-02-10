/**
 * 道具面板组件
 */
import React, { useState, useEffect, memo } from 'react';
import gufengStyles from '../../styles/gufeng.module.css';

import PageLayout from '@/shared/layouts/PageLayout';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { gameApi, Item } from '../../services/gameApi';
import styles from '../../styles/ItemPanel.module.css';

// 扩展 Item 接口以包含额外的显示字段
interface ItemDisplay extends Item {
  config_id?: number;
  configName?: string;
  configType?: string;
  configQuality?: number;
  value?: number;
  canEquip?: boolean;
  canUse?: boolean;
  qualityColor?: string;
}

interface ItemPanelProps {
  walletAddress: string;
  onClose?: () => void;
}

const ItemPanel: React.FC<ItemPanelProps> = memo(({ walletAddress }) => {
  const { language } = useLanguage();
  const [items, setItems] = useState<ItemDisplay[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const i18n = {
    title: language === 'en' ? 'Items' : '道具',
    all: language === 'en' ? 'All' : '全部',
    equipment: language === 'en' ? 'Equip' : '装备',
    consumable: language === 'en' ? 'Consumable' : '消耗',
    material: language === 'en' ? 'Material' : '材料',
    reward: language === 'en' ? 'Reward' : '奖励',
    use: language === 'en' ? 'Use' : '使用',
    sell: language === 'en' ? 'Sell' : '出售',
    organize: language === 'en' ? 'Organize' : '整理',
    count: language === 'en' ? 'Qty' : '数量',
    value: language === 'en' ? 'Value' : '价值',
    noItems: language === 'en' ? 'No items' : '背包为空',
    loading: language === 'en' ? 'Loading...' : '加载中...',
  };

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

  const sellItemHandler = async (itemId: number) => {
    try {
      await gameApi.sellItem(itemId);
      fetchItems();
    } catch (err) {
      console.error('Failed to sell item:', err);
    }
  };

  // 整理道具（暂未使用）
  // const organizeItemsHandler = async () => {
  //   try {
  //     await gameApi.organizeItems();
  //     fetchItems();
  //   } catch (err) {
  //     console.error('Failed to organize items:', err);
  //   }
  // };

  const filteredItems = activeTab === 'all'
    ? items
    : items.filter(i => i.type === Number(activeTab));

  // 按类型分组（暂未使用）
  // const groupedItems = filteredItems.reduce((acc, item) => {
  //   const type = String(item.type);
  //   if (!acc[type]) {
  //     acc[type] = [];
  //   }
  //   acc[type].push(item);
  //   return acc;
  // }, {} as Record<string, ItemDisplay[]>);

  return (
    <PageLayout title={i18n.title}>
      <div className={gufengStyles.container}>
        {/* 标签页 */}
        <div className={gufengStyles.tabs}>
          <button
            className={`${gufengStyles.tab} ${activeTab === 'all' ? gufengStyles.active : ''}`}
            onClick={() => setActiveTab('all')}
          >
            {i18n.all}
          </button>
          <button
            className={`${gufengStyles.tab} ${activeTab === 'equipment' ? gufengStyles.active : ''}`}
            onClick={() => setActiveTab('equipment')}
          >
            {i18n.equipment}
          </button>
          <button
            className={`${gufengStyles.tab} ${activeTab === 'consumable' ? gufengStyles.active : ''}`}
            onClick={() => setActiveTab('consumable')}
          >
            {i18n.consumable}
          </button>
          <button
            className={`${gufengStyles.tab} ${activeTab === 'material' ? gufengStyles.active : ''}`}
            onClick={() => setActiveTab('material')}
          >
            {i18n.material}
          </button>
          <button
            className={`${gufengStyles.tab} ${activeTab === 'reward' ? gufengStyles.active : ''}`}
            onClick={() => setActiveTab('reward')}
          >
            {i18n.reward}
          </button>
        </div>

        {loading ? (
          <div className={gufengStyles.loading}>{i18n.loading}</div>
        ) : filteredItems.length === 0 ? (
          <div className={gufengStyles.empty}>{i18n.noItems}</div>
        ) : (
          <div className={gufengStyles.grid}>
            {filteredItems.map(item => (
              <div key={item.id} className={gufengStyles.itemCard} style={{ borderColor: item.qualityColor }}>
                <div className={gufengStyles.itemHeader}>
                  <span className={gufengStyles.itemName} style={{ color: item.qualityColor }}>{item.configName}</span>
                  <span className={gufengStyles.itemCount}>x{item.count}</span>
                </div>
                <div className={gufengStyles.itemDesc}>{item.description}</div>
                <div className={gufengStyles.itemActions}>
                  {item.canUse && (
                    <button
                      className={gufengStyles.actionBtn}
                      onClick={() => useItemHandler(item.id)}
                    >
                      {i18n.use}
                    </button>
                  )}
                  <button
                    className={gufengStyles.sellBtn}
                    onClick={() => sellItemHandler(item.id)}
                  >
                    💰 {item.value}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
});

ItemPanel.displayName = 'ItemPanel';

export default ItemPanel;
