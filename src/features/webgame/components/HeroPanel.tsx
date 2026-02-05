/**
 * 武将面板组件
 */
import React, { useEffect, useState } from 'react';
import { gameApi, type Hero } from '../services/gameApi';
import styles from '../styles/jxMain.module.css';

interface HeroPanelProps {
  cityId: number;
  onClose: () => void;
}

const HeroPanel: React.FC<HeroPanelProps> = ({ cityId, onClose }) => {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);
  const [recruiting, setRecruiting] = useState(false);
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadHeroes();
  }, [cityId]);

  const loadHeroes = async () => {
    setLoading(true);
    try {
      const res = await gameApi.getHeroList();
      if (res.success) {
        setHeroes(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load heroes:', err);
    }
    setLoading(false);
  };

  const handleRecruit = async (type: 'normal' | 'advanced') => {
    setRecruiting(true);
    setMessage('');
    try {
      const count = type === 'advanced' ? 10 : 1;
      const res = await gameApi.recruitHero(cityId, count);
      if (res.success) {
        setMessage(`获得武将: ${res.data?.name} (品质${res.data?.quality})`);
        loadHeroes();
      } else {
        setMessage(res.error || '招募失败');
      }
    } catch (err) {
      setMessage('招募失败');
    }
    setRecruiting(false);
  };

  const handleTrain = async (hero: Hero) => {
    try {
      const res = await gameApi.trainHero(hero.id);
      if (res.success) {
        setMessage(`训练成功! 经验增加`);
        loadHeroes();
      } else {
        setMessage(res.error || '训练失败');
      }
    } catch (err) {
      setMessage('训练失败');
    }
  };

  const handleUpgrade = async (hero: Hero) => {
    try {
      const res = await gameApi.upgradeHero(hero.id);
      if (res.success) {
        setMessage(`突破成功! 等级${hero.level} → ${res.data?.level}`);
        loadHeroes();
      } else {
        setMessage(res.error || '突破失败');
      }
    } catch (err) {
      setMessage('突破失败');
    }
  };

  const getQualityColor = (quality: number) => {
    switch (quality) {
      case 4: return '#ff6b6b'; // 传说 - 红色
      case 3: return '#9c27b0'; // 史诗 - 紫色
      case 2: return '#2196f3'; // 稀有 - 蓝色
      default: return '#4caf50'; // 普通 - 绿色
    }
  };

  const getQualityName = (quality: number) => {
    switch (quality) {
      case 4: return '传说';
      case 3: return '史诗';
      case 2: return '稀有';
      default: return '普通';
    }
  };

  return (
    <div className={styles.popupPanel}>
      <div className={styles.popupHeader}>
        <span>武将系统</span>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>
      
      <div className={styles.popupContent}>
        {/* 招募区域 */}
        <div className={styles.recruitArea}>
          <h4>招募武将</h4>
          <div className={styles.recruitBtns}>
            <button 
              onClick={() => handleRecruit('normal')}
              disabled={recruiting}
              className={styles.recruitBtn}
            >
              普通招募 (免费)
            </button>
            <button 
              onClick={() => handleRecruit('advanced')}
              disabled={recruiting}
              className={styles.recruitBtnAdvanced}
            >
              高级招募 (消耗金币)
            </button>
          </div>
          {message && <div className={styles.message}>{message}</div>}
        </div>

        {/* 武将列表 */}
        <div className={styles.heroList}>
          <h4>我的武将 ({heroes.length})</h4>
          {loading ? (
            <div className={styles.loading}>加载中...</div>
          ) : heroes.length === 0 ? (
            <div className={styles.empty}>暂无武将</div>
          ) : (
            <div className={styles.heroGrid}>
              {heroes.map(hero => (
                <div 
                  key={hero.id} 
                  className={`${styles.heroCard} ${selectedHero?.id === hero.id ? styles.selected : ''}`}
                  onClick={() => setSelectedHero(hero)}
                >
                  <div 
                    className={styles.heroQuality}
                    style={{ backgroundColor: getQualityColor(hero.quality) }}
                  >
                    {getQualityName(hero.quality)}
                  </div>
                  <div className={styles.heroName}>{hero.name}</div>
                  <div className={styles.heroStats}>
                    <div>等级: {hero.level}</div>
                    <div>攻: {hero.attack}</div>
                    <div>防: {hero.defense}</div>
                    <div>血: {hero.hp}/{hero.max_hp}</div>
                  </div>
                  <div className={styles.heroState}>
                    {hero.state === 0 ? '空闲' : hero.state === 1 ? '守城' : '训练中'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 武将详情 */}
        {selectedHero && (
          <div className={styles.heroDetail}>
            <h4>{selectedHero.name} - 详情</h4>
            <div className={styles.heroDetailStats}>
              <div>等级: {selectedHero.level}</div>
              <div>经验: {selectedHero.exp}/{selectedHero.level * 500}</div>
              <div>攻击力: {selectedHero.attack}</div>
              <div>防御力: {selectedHero.defense}</div>
              <div>生命值: {selectedHero.hp}/{selectedHero.max_hp}</div>
              <div>突破次数: {selectedHero.level - 1}</div>
            </div>
            <div className={styles.heroActions}>
              <button 
                onClick={() => handleTrain(selectedHero)}
                className={styles.actionBtn}
              >
                训练 (+经验)
              </button>
              <button 
                onClick={() => handleUpgrade(selectedHero)}
                className={styles.actionBtn}
              >
                突破 (消耗{selectedHero.level * 100}金币)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroPanel;
