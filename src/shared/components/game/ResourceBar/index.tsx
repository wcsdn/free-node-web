/**
 * ResourceBar - 游戏资源栏
 * 原则：移动端优先，简洁设计
 */
import React from 'react';
import styles from './ResourceBar.module.css';

interface Resource {
  type: 'money' | 'food' | 'population' | 'gold';
  value: number;
  limit?: number;
}

interface ResourceBarProps {
  resources: Resource[];
  rates?: { money?: number; food?: number; population?: number };
  onCollect?: () => void;
  showCollect?: boolean;
}

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString();
};

// 资源图标
const RESOURCE_ICONS: Record<string, string> = {
  money: '💰',
  food: '🌾',
  population: '👥',
  gold: '🪙',
};

// 资源名称
const RESOURCE_NAMES: Record<string, string> = {
  money: '银两',
  food: '粮草',
  population: '人口',
  gold: '金币',
};

export const ResourceBar: React.FC<ResourceBarProps> = ({
  resources,
  rates,
  onCollect,
  showCollect = false,
}) => {
  return (
    <div className={styles.bar}>
      <div className={styles.resources}>
        {resources.map((resource, index) => (
          <div key={index} className={styles.resource}>
            {/* 图标 */}
            <span className={styles.icon}>
              {RESOURCE_ICONS[resource.type] || '📦'}
            </span>
            
            {/* 名称（移动端隐藏） */}
            <span className={`${styles.name} mobile`}>
              {RESOURCE_NAMES[resource.type] || resource.type}
            </span>
            
            {/* 数值 */}
            <span className={styles.value}>
              {formatNumber(resource.value)}
              {resource.limit && (
                <span className={styles.limit}>
                  / {formatNumber(resource.limit)}
                </span>
              )}
            </span>
            
            {/* 产量 */}
            {rates && rates[resource.type as keyof typeof rates] !== undefined && (
              <span className={styles.rate}>
                (+{rates[resource.type as keyof typeof rates]}/h)
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 收集按钮 */}
      {showCollect && onCollect && (
        <button
          className={styles.collectBtn}
          onClick={onCollect}
        >
          收集
        </button>
      )}
    </div>
  );
};

export default ResourceBar;
