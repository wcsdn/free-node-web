/**
 * 军团面板组件
 */
import React, { useState, useEffect, memo } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import PageLayout from '@/shared/layouts/PageLayout';
import { getApiBase } from '../../utils/api';
import styles from '../../styles/CorpsPanel.module.css';

interface Hero {
  id: number;
  name: string;
  level: number;
  hp: number;
  max_hp: number;
  attack: number;
  defense: number;
  quality: number;
  state: number;
}

interface Corps {
  id: number;
  name: string;
  city_id: number;
  state: number;
  stateText: string;
  heroCount: number;
  totalHp?: number;
  totalAttack?: number;
}

interface CorpsDetail extends Corps {
  heroes: Hero[];
}

interface CorpsPanelProps {
  walletAddress: string;
}

const CorpsPanel: React.FC<CorpsPanelProps> = memo(({ walletAddress }) => {
  const { language } = useLanguage();
  const [corpsList, setCorpsList] = useState<Corps[]>([]);
  const [availableHeroes, setAvailableHeroes] = useState<Hero[]>([]);
  const [selectedCorps, setSelectedCorps] = useState<CorpsDetail | null>(null);
  const [selectedHeroIds, setSelectedHeroIds] = useState<number[]>([]);
  const [createMode, setCreateMode] = useState(false);
  const [newCorpsName, setNewCorpsName] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);


  const i18n = {
    title: language === 'en' ? 'Corps' : '军团',
    createCorps: language === 'en' ? 'Create Corps' : '创建军团',
    corpsName: language === 'en' ? 'Corps Name' : '军团名称',
    selectHeroes: language === 'en' ? 'Select Heroes' : '选择英雄',
    create: language === 'en' ? 'Create' : '创建',
    cancel: language === 'en' ? 'Cancel' : '取消',
    myCorps: language === 'en' ? 'My Corps' : '我的军团',
    noCorps: language === 'en' ? 'No corps yet' : '暂无军团',
    createFirst: language === 'en' ? 'Create your first corps!' : '创建你的第一个军团！',
    disband: language === 'en' ? 'Disband' : '解散',
    march: language === 'en' ? 'March' : '出征',
    recall: language === 'en' ? 'Recall' : '召回',
    idle: language === 'en' ? 'Idle' : '驻守',
    marching: language === 'en' ? 'Marching' : '行军中',
    heroes: language === 'en' ? 'Heroes' : '英雄',
    totalHp: language === 'en' ? 'Total HP' : '总生命',
    totalAtk: language === 'en' ? 'Total ATK' : '总攻击',
    marchTarget: language === 'en' ? 'Target Position' : '目标位置',
    loading: language === 'en' ? 'Loading...' : '加载中...',
    success: language === 'en' ? 'Success!' : '成功！',
    error: language === 'en' ? 'Error' : '错误',
  };

  // 获取军团列表
  const fetchCorps = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/corps`, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        setCorpsList(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load corps:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取可用英雄
  const fetchAvailableHeroes = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/hero/list`, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        // 只获取闲置英雄 (state = 1)
        setAvailableHeroes(data.data.filter((h: Hero) => h.state === 1));
      }
    } catch (err) {
      console.error('Failed to load heroes:', err);
    }
  };

  useEffect(() => {
    fetchCorps();
    fetchAvailableHeroes();
  }, [walletAddress]);

  // 获取军团详情
  const fetchCorpsDetail = async (corpsId: number) => {
    try {
      const res = await fetch(`${getApiBase()}/api/corps/${corpsId}`, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        setSelectedCorps(data.data);
      }
    } catch (err) {
      console.error('Failed to load corps detail:', err);
    }
  };

  // 创建军团
  const handleCreateCorps = async () => {
    if (!newCorpsName.trim() || selectedHeroIds.length === 0) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/corps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': walletAddress || '',
        },
        body: JSON.stringify({
          cityId: 1, // 默认城市，后续改为选择
          name: newCorpsName,
          heroIds: selectedHeroIds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreateMode(false);
        setNewCorpsName('');
        setSelectedHeroIds([]);
        await fetchCorps();
        await fetchAvailableHeroes();
      }
    } catch (err) {
      console.error('Failed to create corps:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 解散军团
  const handleDisband = async (corpsId: number) => {
    if (!confirm(language === 'en' ? 'Disband this corps?' : '确定解散这个军团？')) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/corps/${corpsId}`, {
        method: 'DELETE',
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });

      const data = await res.json();
      if (data.success) {
        setSelectedCorps(null);
        await fetchCorps();
        await fetchAvailableHeroes();
      }
    } catch (err) {
      console.error('Failed to disband corps:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 行军
  const handleMarch = async (corpsId: number, targetPos: number) => {
    if (!targetPos) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/corps/${corpsId}/march`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': walletAddress || '',
        },
        body: JSON.stringify({ targetPosition: targetPos }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchCorps();
        await fetchCorpsDetail(corpsId);
      }
    } catch (err) {
      console.error('Failed to march:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 召回
  const handleRecall = async (corpsId: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/corps/${corpsId}/recall`, {
        method: 'POST',
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });

      const data = await res.json();
      if (data.success) {
        await fetchCorps();
        await fetchCorpsDetail(corpsId);
      }
    } catch (err) {
      console.error('Failed to recall:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 切换英雄选择
  const toggleHeroSelect = (heroId: number) => {
    setSelectedHeroIds(prev => 
      prev.includes(heroId) 
        ? prev.filter(id => id !== heroId)
        : [...prev, heroId]
    );
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
        {/* 创建军团按钮 */}
        {!createMode && (
          <button className={styles.createBtn} onClick={() => setCreateMode(true)}>
            ➕ {i18n.createCorps}
          </button>
        )}

        {/* 创建军团表单 */}
        {createMode && (
          <div className={styles.createForm}>
            <h3>{i18n.createCorps}</h3>
            
            <div className={styles.formGroup}>
              <label>{i18n.corpsName}</label>
              <input
                type="text"
                value={newCorpsName}
                onChange={(e) => setNewCorpsName(e.target.value)}
                placeholder={language === 'en' ? 'Enter corps name' : '输入军团名称'}
              />
            </div>

            <div className={styles.formGroup}>
              <label>{i18n.selectHeroes} ({selectedHeroIds.length})</label>
              <div className={styles.heroGrid}>
                {availableHeroes.map((hero) => (
                  <div
                    key={hero.id}
                    className={`${styles.heroCard} ${selectedHeroIds.includes(hero.id) ? styles.selected : ''}`}
                    onClick={() => toggleHeroSelect(hero.id)}
                  >
                    <div className={styles.heroName}>{hero.name}</div>
                    <div className={styles.heroStats}>
                      Lv.{hero.level} | {hero.hp}/{hero.max_hp} | ATK:{hero.attack}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.formActions}>
              <button 
                className={styles.cancelBtn} 
                onClick={() => {
                  setCreateMode(false);
                  setSelectedHeroIds([]);
                }}
              >
                {i18n.cancel}
              </button>
              <button 
                className={styles.confirmBtn}
                onClick={handleCreateCorps}
                disabled={!newCorpsName.trim() || selectedHeroIds.length === 0 || actionLoading}
              >
                {actionLoading ? i18n.loading : i18n.create}
              </button>
            </div>
          </div>
        )}

        {/* 军团列表 */}
        {!createMode && (
          <div className={styles.corpsSection}>
            <h3>{i18n.myCorps}</h3>
            
            {corpsList.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🏛️</div>
                <p>{i18n.noCorps}</p>
                <p className={styles.hint}>{i18n.createFirst}</p>
              </div>
            ) : (
              <div className={styles.corpsGrid}>
                {corpsList.map((corps) => (
                  <div
                    key={corps.id}
                    className={`${styles.corpsCard} ${selectedCorps?.id === corps.id ? styles.selected : ''}`}
                    onClick={() => fetchCorpsDetail(corps.id)}
                  >
                    <div className={styles.corpsName}>{corps.name}</div>
                    <div className={styles.corpsInfo}>
                      <span>👥 {corps.heroCount} {i18n.heroes}</span>
                      <span className={corps.state === 2 ? styles.marching : ''}>
                        {corps.stateText}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 军团详情 */}
        {selectedCorps && (
          <div className={styles.corpsDetail}>
            <h3>{selectedCorps.name}</h3>
            
            <div className={styles.detailStats}>
              <div className={styles.statItem}>
                <span>❤️ {i18n.totalHp}</span>
                <span>{selectedCorps.totalHp || 0}</span>
              </div>
              <div className={styles.statItem}>
                <span>⚔️ {i18n.totalAtk}</span>
                <span>{selectedCorps.totalAttack || 0}</span>
              </div>
            </div>

            {/* 英雄列表 */}
            <div className={styles.detailHeroes}>
              <h4>{i18n.heroes}</h4>
              <div className={styles.heroList}>
                {(selectedCorps.heroes || []).map((hero) => (
                  <div key={hero.id} className={styles.heroItem}>
                    <div className={styles.heroInfo}>
                      <span className={styles.heroName}>{hero.name}</span>
                      <span className={styles.heroQuality}>品质{hero.quality}</span>
                    </div>
                    <div className={styles.heroBattleStats}>
                      <span>HP:{hero.hp}/{hero.max_hp}</span>
                      <span>ATK:{hero.attack}</span>
                      <span>DEF:{hero.defense}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className={styles.detailActions}>
              {selectedCorps.state === 2 ? (
                <button 
                  className={styles.recallBtn}
                  onClick={() => handleRecall(selectedCorps.id)}
                  disabled={actionLoading}
                >
                  ↩️ {i18n.recall}
                </button>
              ) : (
                <>
                  <button 
                    className={styles.marchBtn}
                    onClick={() => {
                      const target = prompt(language === 'en' ? 'Enter target position:' : '输入目标位置:');
                      if (target) handleMarch(selectedCorps.id, parseInt(target));
                    }}
                    disabled={actionLoading}
                  >
                    🚀 {i18n.march}
                  </button>
                  <button 
                    className={styles.disbandBtn}
                    onClick={() => handleDisband(selectedCorps.id)}
                    disabled={actionLoading}
                  >
                    🗑️ {i18n.disband}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
});

CorpsPanel.displayName = 'CorpsPanel';

export default CorpsPanel;
