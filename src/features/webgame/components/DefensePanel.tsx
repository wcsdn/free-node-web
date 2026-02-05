/**
 * 城防面板组件
 * 防御设施建造、升级
 */
import React, { useEffect, useState } from 'react';
import styles from '../styles/jxMain.module.css';
import { getApiBase } from '../utils/api';

interface DefensePanelProps {
  walletAddress: string;
  cityId: number;
  cityMoney: number;
  onClose: () => void;
}

interface Defense {
  id: number;
  city_id: number;
  type: string;
  level: number;
  defense: number;
}

interface DefenseConfig {
  type: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  baseCost: number;
  baseDefense: number;
  maxLevel: number;
  bonusType: string;
  bonusValue: number;
  currentLevel: number;
  defense: number;
}

const DEFENSE_CONFIGS: DefenseConfig[] = [
  { type: 'wall', name: '城墙', nameEn: 'City Wall', icon: '🧱', description: '提高城市防御力，减少受到的伤害', baseCost: 500, baseDefense: 50, maxLevel: 10, bonusType: 'defense_bonus', bonusValue: 10, currentLevel: 0, defense: 0 },
  { type: 'tower', name: '箭塔', nameEn: 'Arrow Tower', icon: '🗼', description: '增加远程攻击力，提升战斗胜率', baseCost: 800, baseDefense: 30, maxLevel: 10, bonusType: 'attack_bonus', bonusValue: 15, currentLevel: 0, defense: 0 },
  { type: 'moat', name: '护城河', nameEn: 'Moat', icon: '🌊', description: '降低敌方移动速度，减缓进攻', baseCost: 600, baseDefense: 40, maxLevel: 10, bonusType: 'enemy_speed', bonusValue: -10, currentLevel: 0, defense: 0 },
  { type: 'gate', name: '城门', nameEn: 'City Gate', icon: '🚪', description: '控制进出，提升安全性', baseCost: 400, baseDefense: 35, maxLevel: 10, bonusType: 'defense_bonus', bonusValue: 8, currentLevel: 0, defense: 0 },
  { type: 'watchtower', name: '烽火台', nameEn: 'Watchtower', icon: '🔥', description: '预警敌情，提前准备防御', baseCost: 300, baseDefense: 20, maxLevel: 10, bonusType: 'warning', bonusValue: 5, currentLevel: 0, defense: 0 },
];

const DefensePanel: React.FC<DefensePanelProps> = ({ cityId, cityMoney, onClose }) => {
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [building, setBuilding] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    loadDefenses();
  }, [cityId]);

  const loadDefenses = async () => {
    setLoading(true);
    try {
      // 模拟获取城防数据
      setDefenses([]);
    } catch (err) {
      console.error('Failed to load defenses:', err);
    }
    setLoading(false);
  };

  const getConfig = (type: string) => DEFENSE_CONFIGS.find(c => c.type === type);

  const getUpgradeCost = (type: string, level: number) => {
    const config = getConfig(type);
    if (!config) return 0;
    return Math.floor(config.baseCost * (level + 1) * 0.5);
  };

  const handleBuild = async (type: string) => {
    const config = getConfig(type);
    if (!config) return;

    if (cityMoney < config.baseCost) {
      setMessage(`银两不足，需要 ${config.baseCost} 银两`);
      return;
    }

    setBuilding(true);
    setMessage('');

    try {
      const res = await fetch(`${getApiBase()}/api/defense/build`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(localStorage.getItem('wallet-auth') ? { 'X-Wallet-Auth': localStorage.getItem('wallet-auth')! } : {})
        },
        body: JSON.stringify({ cityId, defenseType: type }),
      }).then(r => r.json());

      if (res.success) {
        setMessage(`建造成功！${config.name} 防御力 +${res.data.defense}`);
        loadDefenses();
      } else {
        setMessage(res.error || '建造失败');
      }
    } catch (err) {
      setMessage('建造失败');
    }
    setBuilding(false);
  };

  const handleUpgrade = async (type: string) => {
    const config = getConfig(type);
    if (!config) return;

    const currentDefense = defenses.find(d => d.type === type);
    const level = currentDefense?.level || 0;
    const cost = getUpgradeCost(type, level);

    if (cityMoney < cost) {
      setMessage(`银两不足，需要 ${cost} 银两`);
      return;
    }

    setUpgrading(type);
    setMessage('');

    try {
      const res = await fetch(`${getApiBase()}/api/defense/upgrade`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(localStorage.getItem('wallet-auth') ? { 'X-Wallet-Auth': localStorage.getItem('wallet-auth')! } : {})
        },
        body: JSON.stringify({ cityId, defenseType: type }),
      }).then(r => r.json());

      if (res.success) {
        setMessage(`升级成功！${config.name} Lv.${res.data.newLevel}，防御力 +${res.data.defense}`);
        loadDefenses();
      } else {
        setMessage(res.error || '升级失败');
      }
    } catch (err) {
      setMessage('升级失败');
    }
    setUpgrading(null);
  };

  const handleDemolish = async (type: string) => {
    const config = getConfig(type);
    if (!config) return;

    if (!confirm(`确定要拆除 ${config.name} 吗？`)) return;

    try {
      const res = await fetch(`${getApiBase()}/api/defense/demolish`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(localStorage.getItem('wallet-auth') ? { 'X-Wallet-Auth': localStorage.getItem('wallet-auth')! } : {})
        },
        body: JSON.stringify({ cityId, defenseType: type }),
      }).then(r => r.json());

      if (res.success) {
        setMessage(`拆除成功，返还 ${res.data.refund} 银两`);
        loadDefenses();
      } else {
        setMessage(res.error || '拆除失败');
      }
    } catch (err) {
      setMessage('拆除失败');
    }
  };

  const totalDefense = defenses.reduce((sum, d) => {
    const config = getConfig(d.type);
    return sum + (config ? d.level * config.bonusValue : 0);
  }, 0);

  // 更新配置中的当前等级
  const updatedConfigs = DEFENSE_CONFIGS.map(config => {
    const defense = defenses.find(d => d.type === config.type);
    return {
      ...config,
      currentLevel: defense?.level || 0,
      defense: defense ? defense.level * config.bonusValue : 0
    };
  });

  return (
    <div className={styles.popupPanel} style={{ width: '750px' }}>
      <div className={styles.popupHeader}>
        <span>🛡️ 城防系统</span>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      <div className={styles.popupContent}>
        {/* 城防概览 */}
        <div className={styles.defenseOverview}>
          <div className={styles.defenseTotal}>
            <span className={styles.defenseLabel}>总防御力</span>
            <span className={styles.defenseValue}>{totalDefense}</span>
          </div>
          <div className={styles.defenseMoney}>
            <span>💰 银两: {cityMoney.toLocaleString()}</span>
          </div>
        </div>

        {/* 消息 */}
        {message && <div className={styles.message}>{message}</div>}

        {/* 城防设施列表 */}
        <div className={styles.defenseList}>
          <h4>我的城防</h4>
          {loading ? (
            <div className={styles.loading}>加载中...</div>
          ) : defenses.length === 0 ? (
            <div className={styles.empty}>暂无城防设施</div>
          ) : (
            <div className={styles.defenseGrid}>
              {updatedConfigs.filter(c => c.currentLevel > 0).map(config => (
                <div key={config.type} className={styles.defenseCard}>
                  <div className={styles.defenseIcon}>{config.icon}</div>
                  <div className={styles.defenseInfo}>
                    <div className={styles.defenseName}>
                      {config.name}
                      <span className={styles.defenseLevel}>Lv.{config.currentLevel}</span>
                    </div>
                    <div className={styles.defenseBonus}>
                      防御力: +{config.defense}
                    </div>
                    <div className={styles.defenseDesc}>{config.description}</div>
                  </div>
                  <div className={styles.defenseActions}>
                    {config.currentLevel < config.maxLevel ? (
                      <button
                        className={styles.upgradeBtn}
                        onClick={() => handleUpgrade(config.type)}
                        disabled={upgrading === config.type}
                      >
                        {upgrading === config.type ? '升级中...' : `升级 (${getUpgradeCost(config.type, config.currentLevel)})`}
                      </button>
                    ) : (
                      <span className={styles.maxBadge}>满级</span>
                    )}
                    <button
                      className={styles.demolishBtn}
                      onClick={() => handleDemolish(config.type)}
                    >
                      拆除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 可建造设施 */}
        <div className={styles.availableDefenses}>
          <h4>可建造设施</h4>
          <div className={styles.availableGrid}>
            {updatedConfigs.map(config => {
              const canBuild = config.currentLevel === 0;
              return (
                <div
                  key={config.type}
                  className={`${styles.availableCard} ${canBuild ? '' : styles.disabled}`}
                >
                  <div className={styles.availableIcon}>{config.icon}</div>
                  <div className={styles.availableInfo}>
                    <div className={styles.availableName}>{config.name}</div>
                    <div className={styles.availableDesc}>{config.description}</div>
                    <div className={styles.availableStats}>
                      <span>建造: 💰{config.baseCost}</span>
                      <span>满级防御: +{config.maxLevel * config.bonusValue}</span>
                    </div>
                  </div>
                  <div className={styles.availableAction}>
                    {canBuild ? (
                      <button
                        className={styles.buildBtn}
                        onClick={() => handleBuild(config.type)}
                        disabled={building || cityMoney < config.baseCost}
                      >
                        {building ? '建造中...' : '建造'}
                      </button>
                    ) : (
                      <span className={styles.builtBadge}>已建造</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefensePanel;
