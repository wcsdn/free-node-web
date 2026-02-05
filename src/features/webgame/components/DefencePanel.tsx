/**
 * 城防面板组件
 */
import React, { useState, useEffect, memo } from 'react';
import PageLayout from '@/shared/layouts/PageLayout';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useToast } from '@/shared/components/Toast/ToastContext';
import styles from '../styles/DefencePanel.module.css';
import { getApiBase } from '../utils/api';

interface DefenceBuilding {
  id: number;
  index: number;
  position: number;
  level: number;
  name: string;
  icon: string;
  attack: number;
  hitPoint: number;
  attackRange: number;
  effRange: number;
}

interface DefenceHero {
  id: number;
  name: string;
  level: number;
  attack: number;
  defence: number;
  hp: number;
  defencePos: number;
}

interface DefencePanelProps {
  walletAddress: string;
  cityId?: number;
}

const DefencePanel: React.FC<DefencePanelProps> = memo(({ walletAddress, cityId: propCityId }) => {
  const { language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const [buildings, setBuildings] = useState<DefenceBuilding[]>([]);
  const [heroes, setHeroes] = useState<DefenceHero[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHero, setSelectedHero] = useState<DefenceHero | null>(null);


  // 获取城防信息
  const fetchDefence = async () => {
    try {
      // 获取城防建筑
      const buildingRes = await fetch(`${getApiBase()}/api/city/${propCityId || 0}/buildings`, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const buildingData = await buildingRes.json();
      if (buildingData.success && buildingData.data) {
        // 过滤城防建筑 (type=3)
        setBuildings(buildingData.data.filter((b: any) => b.type === 3) || []);
      }

      // 获取可驻防英雄
      const heroRes = await fetch(`${getApiBase()}/api/hero/defence/list`, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const heroData = await heroRes.json();
      if (heroData.success && heroData.data) {
        setHeroes(heroData.data);
      }
    } catch (err) {
      showError(language === 'en' ? 'Failed to load defence' : '加载城防失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefence();
  }, [walletAddress, propCityId]);

  // 设置英雄驻防
  const handleSetDefence = async (heroId: number, position: number) => {
    try {
      const res = await fetch(`${getApiBase()}/api/hero/${heroId}/defence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': walletAddress || '',
        },
        body: JSON.stringify({ position }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(language === 'en' ? 'Hero deployed!' : '英雄已部署！');
        await fetchDefence();
      } else {
        showError(data.message || (language === 'en' ? 'Deploy failed' : '部署失败'));
      }
    } catch (err) {
      showError(language === 'en' ? 'Deploy failed' : '部署失败');
    }
  };

  // 撤防
  const handleRemoveDefence = async (heroId: number) => {
    await handleSetDefence(heroId, -1);
  };

  // 品质颜色

  const i18n = {
    title: language === 'en' ? 'Defence' : '城防',
    loading: language === 'en' ? 'Loading...' : '加载中...',
    buildings: language === 'en' ? 'Defence Buildings' : '城防建筑',
    heroes: language === 'en' ? 'Defence Heroes' : '驻防英雄',
    attack: language === 'en' ? 'Attack' : '攻击',
    hp: language === 'en' ? 'HP' : '生命',
    range: language === 'en' ? 'Range' : '射程',
    selectHero: language === 'en' ? 'Select Hero' : '选择英雄',
    deploy: language === 'en' ? 'Deploy' : '部署',
    remove: language === 'en' ? 'Remove' : '撤防',
    noBuildings: language === 'en' ? 'No defence buildings' : '暂无城防建筑',
    noHeroes: language === 'en' ? 'No heroes available' : '无可用英雄',
    clickToSelect: language === 'en' ? 'Click to select hero' : '点击选择英雄',
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
        {/* 城防建筑 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{i18n.buildings}</h2>
          {buildings.length === 0 ? (
            <div className={styles.empty}>{i18n.noBuildings}</div>
          ) : (
            <div className={styles.buildingGrid}>
              {buildings.map((building) => (
                <div key={building.id} className={styles.buildingCard}>
                  <div className={styles.buildingIcon}>{building.icon || '🏰'}</div>
                  <div className={styles.buildingInfo}>
                    <h4>{building.name}</h4>
                    <div className={styles.buildingStats}>
                      <span>⚔️ {building.attack}</span>
                      <span>❤️ {building.hitPoint}</span>
                      <span>🎯 {building.attackRange}</span>
                    </div>
                    <div className={styles.buildingLevel}>
                      {language === 'en' ? 'Level' : '等级'}: {building.level}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 驻防英雄 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{i18n.heroes}</h2>
          {heroes.length === 0 ? (
            <div className={styles.empty}>{i18n.noHeroes}</div>
          ) : (
            <div className={styles.heroGrid}>
              {heroes.map((hero) => (
                <div
                  key={hero.id}
                  className={`${styles.heroCard} ${selectedHero?.id === hero.id ? styles.selected : ''}`}
                  onClick={() => setSelectedHero(selectedHero?.id === hero.id ? null : hero)}
                >
                  <div className={styles.heroInfo}>
                    <h4>{hero.name}</h4>
                    <div className={styles.heroStats}>
                      <span>⚔️ {hero.attack}</span>
                      <span>🛡️ {hero.defence}</span>
                      <span>❤️ {hero.hp}</span>
                    </div>
                  </div>
                  {hero.defencePos > 0 && (
                    <div className={styles.deployed}>
                      📍 {hero.defencePos}
                    </div>
                  )}
                  {selectedHero?.id === hero.id && (
                    <div className={styles.heroActions}>
                      <button
                        className={styles.deployBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefence(hero.id, 1); // 默认位置1
                        }}
                      >
                        {i18n.deploy} 📍1
                      </button>
                      {hero.defencePos > 0 && (
                        <button
                          className={styles.removeBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDefence(hero.id);
                          }}
                        >
                          {i18n.remove}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 选择提示 */}
        {selectedHero && (
          <div className={styles.selectTip}>
            {i18n.clickToSelect}: {selectedHero.name}
          </div>
        )}
      </div>
    </PageLayout>
  );
});

DefencePanel.displayName = 'DefencePanel';

export default DefencePanel;
