/**
 * 科技面板组件
 */
import React, { useState, useEffect, memo } from 'react';
import PageLayout from '@/shared/layouts/PageLayout';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useToast } from '@/shared/components/Toast/ToastContext';
import styles from '../../styles/TechnicPanel.module.css';
import { apiGet, apiPost, apiDelete, getApiBase, getAuthHeaders } from '../../utils/api';

interface Technic {
  id: number;
  index: number;
  level: number;
  maxLevel: number;
  name: string;
  des: string;
  icon: string;
  currEff: number;
  nextEff: number;
  state: number;
  upNeedBuildingID: number;
  upNeedBuildingLevel: number;
  upNeedBuildingName: string;
  upNeedFood: number;
  upNeedGold: number;
  upNeedMen: number;
  upNeedMoney: number;
  upNeedTime: number;
}

interface TechnicPanelProps {
  walletAddress: string;
}

const TechnicPanel: React.FC<TechnicPanelProps> = memo(({ walletAddress }) => {
  const { language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const [technics, setTechnics] = useState<Technic[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<number | null>(null);


  // 获取科技列表
  const fetchTechnics = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/technic/list`, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTechnics(data.data);
      }
    } catch (err) {
      showError(language === 'en' ? 'Failed to load technics' : '加载科技失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnics();
  }, [walletAddress]);

  // 升级科技
  const handleUpgrade = async (techIndex: number) => {
    setUpgrading(techIndex);
    try {
      const res = await fetch(`${getApiBase()}/api/technic/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': walletAddress || '',
        },
        body: JSON.stringify({ technicIndex: techIndex }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(language === 'en' ? 'Technology upgraded!' : '科技升级成功！');
        await fetchTechnics();
      } else {
        showError(data.message || (language === 'en' ? 'Upgrade failed' : '升级失败'));
      }
    } catch (err) {
      showError(language === 'en' ? 'Upgrade failed' : '升级失败');
    } finally {
      setUpgrading(null);
    }
  };

  // 格式化时间
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const i18n = {
    title: language === 'en' ? 'Technology' : '科技',
    loading: language === 'en' ? 'Loading...' : '加载中...',
    noTechnics: language === 'en' ? 'No technologies available' : '暂无可用科技',
    level: language === 'en' ? 'Level' : '等级',
    currentEffect: language === 'en' ? 'Current Effect' : '当前效果',
    nextEffect: language === 'en' ? 'Next Level' : '下一级',
    upgrade: language === 'en' ? 'Upgrade' : '升级',
    upgrading: language === 'en' ? 'Upgrading...' : '升级中...',
    maxLevel: language === 'en' ? 'MAX' : '满级',
    cost: language === 'en' ? 'Cost' : '消耗',
    require: language === 'en' ? 'Requirement' : '需求',
  };

  if (loading) {
    return (
      <PageLayout title={i18n.title}>
        <div className={styles.loading}>{i18n.loading}</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={i18n.title}>
      <div className={styles.container}>
        {technics.length === 0 ? (
          <div className={styles.empty}>{i18n.noTechnics}</div>
        ) : (
          <div className={styles.techGrid}>
            {technics.map((tech) => (
              <div key={tech.id} className={styles.techCard}>
                <div className={styles.techHeader}>
                  <span className={styles.techIcon}>{tech.icon || '⚙️'}</span>
                  <div className={styles.techTitle}>
                    <h3>{tech.name}</h3>
                    <span className={styles.techLevel}>
                      {i18n.level}: {tech.level}/{tech.maxLevel}
                    </span>
                  </div>
                </div>

                <div className={styles.techDesc}>{tech.des}</div>

                <div className={styles.techEffects}>
                  <div className={styles.effectRow}>
                    <span>{i18n.currentEffect}:</span>
                    <span className={styles.effectValue}>{tech.currEff}</span>
                  </div>
                  {tech.level < tech.maxLevel && tech.nextEff > 0 && (
                    <div className={styles.effectRow}>
                      <span>{i18n.nextEffect}:</span>
                      <span className={styles.effectValueNext}>{tech.nextEff}</span>
                    </div>
                  )}
                </div>

                {tech.level < tech.maxLevel && (
                  <div className={styles.techCost}>
                    <div className={styles.costTitle}>{i18n.cost}:</div>
                    <div className={styles.costItems}>
                      {tech.upNeedGold > 0 && (
                        <span className={styles.costItem}>💰 {tech.upNeedGold}</span>
                      )}
                      {tech.upNeedFood > 0 && (
                        <span className={styles.costItem}>🌾 {tech.upNeedFood}</span>
                      )}
                      {tech.upNeedMoney > 0 && (
                        <span className={styles.costItem}>💵 {tech.upNeedMoney}</span>
                      )}
                      {tech.upNeedTime > 0 && (
                        <span className={styles.costItem}>⏱️ {formatTime(tech.upNeedTime)}</span>
                      )}
                    </div>
                    {tech.upNeedBuildingName && (
                      <div className={styles.require}>
                        {i18n.require}: {tech.upNeedBuildingName} Lv.{tech.upNeedBuildingLevel}
                      </div>
                    )}
                  </div>
                )}

                {tech.level < tech.maxLevel ? (
                  <button
                    className={styles.upgradeBtn}
                    onClick={() => handleUpgrade(tech.index)}
                    disabled={upgrading === tech.index}
                  >
                    {upgrading === tech.index ? i18n.upgrading : i18n.upgrade}
                  </button>
                ) : (
                  <div className={styles.maxLevel}>{i18n.maxLevel}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
});

TechnicPanel.displayName = 'TechnicPanel';

export default TechnicPanel;
