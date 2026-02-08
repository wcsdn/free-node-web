/**
 * ResourceBar - 游戏资源栏
 * 显示金钱、粮食、人口等资源
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

const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString();
};

export const ResourceBar: React.FC<ResourceBarProps> = ({
  resources,
  rates,
  onCollect,
  showCollect = false,
}) => {
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'money': return '💰';
      case 'food': return '🌾';
      case 'population': return '👥';
      case 'gold': return '🪙';
      default: return '📦';
    }
  };

  const getResourceName = (type: string) => {
    switch (type) {
      case 'money': return '银两';
      case 'food': return '粮草';
      case 'population': return '人口';
      case 'gold': return '金币';
      default: return type;
    }
  };

  return (
    <div className={styles.bar}>
      <div className={styles.resources}>
        {resources.map((resource, index) => (
          <div key={index} className={styles.resource}>
            <span className={styles.icon}>{getResourceIcon(resource.type)}</span>
            <span className={styles.name}>{getResourceName(resource.type)}</span>
            <span className={styles.value}>
              {formatNumber(resource.value)}
              {resource.limit && (
                <span className={styles.limit}>
                  / {formatNumber(resource.limit)}
                </span>
              )}
            </span>
            {rates && rates[resource.type as keyof typeof rates] !== undefined && (
              <span className={styles.rate}>
                (+{rates[resource.type as keyof typeof rates]}/h)
              </span>
            )}
          </div>
        ))}
      </div>
      {showCollect && onCollect && (
        <button className={styles.collectBtn} onClick={onCollect}>
          收集
        </button>
      )}
    </div>
  );
};

export default ResourceBar;
