/**
 * HeroPanel - 新版武将面板
 * 赛博朋克风格
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton, GameModal } from '@/shared/components/game';
import styles from './HeroPanel.module.css';

interface Hero {
  id: number;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  quality: number;
  skill?: string;
}

interface HeroPanelProps {
  walletAddress: string;
}

export const HeroPanel: React.FC<HeroPanelProps> = ({ walletAddress }) => {
  const [loading, setLoading] = useState(true);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [showHeroModal, setShowHeroModal] = useState(false);

  // 加载武将数据
  useEffect(() => {
    const loadHeroes = async () => {
      try {
        const res = await fetch('http://localhost:8788/api/hero/list', {
          method: 'POST',
          headers: { 'X-Wallet-Auth': walletAddress || '' },
        });
        const data = await res.json();
        
        if (data.success && data.data) {
          setHeroes(data.data);
        }
      } catch (err) {
        console.error('Failed to load heroes:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadHeroes();
  }, [walletAddress]);

  // 获取品质颜色
  const getQualityColor = (quality: number): string => {
    const colors: Record<number, string> = {
      1: '#888888', // 白色
      2: '#00FF00', // 绿色
      3: '#00AAFF', // 蓝色
      4: '#FF00FF', // 紫色
      5: '#FFD700', // 金色
    };
    return colors[quality] || '#888888';
  };

  // 获取品质名称
  const getQualityName = (quality: number): string => {
    const names: Record<number, string> = {
      1: '普通',
      2: '精良',
      3: '优秀',
      4: '史诗',
      5: '传说',
    };
    return names[quality] || '未知';
  };

  // 点击武将
  const handleHeroClick = (hero: Hero) => {
    setSelectedHero(hero);
    setShowHeroModal(true);
  };

  if (loading) {
    return <div className={styles.loading}>LOADING...</div>;
  }

  return (
    <div className={styles.container}>
      {/* 标题 */}
      <h1 className={styles.title}>
        <span className={styles.glitch} data-text="HEROES">HEROES</span>
      </h1>

      {/* 武将列表 */}
      <div className={styles.heroGrid}>
        {heroes.map((hero) => (
          <div
            key={hero.id}
            className={styles.heroCard}
            onClick={() => handleHeroClick(hero)}
            style={{ borderColor: getQualityColor(hero.quality) }}
          >
            <div className={styles.heroAvatar}>
              <div 
                className={styles.avatarBg}
                style={{ background: `linear-gradient(135deg, ${getQualityColor(hero.quality)}33, transparent)` }}
              />
              <span className={styles.heroIcon}>⚔️</span>
            </div>
            
            <div className={styles.heroInfo}>
              <div 
                className={styles.heroName}
                style={{ color: getQualityColor(hero.quality) }}
              >
                {hero.name}
              </div>
              <div className={styles.heroQuality}>
                <span 
                  className={styles.qualityBadge}
                  style={{ 
                    background: getQualityColor(hero.quality),
                    boxShadow: `0 0 10px ${getQualityColor(hero.quality)}`
                  }}
                >
                  {getQualityName(hero.quality)}
                </span>
                <span className={styles.heroLevel}>Lv.{hero.level}</span>
              </div>
              
              <div className={styles.heroStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>HP</span>
                  <div className={styles.statBar}>
                    <div 
                      className={styles.statFill}
                      style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
                    />
                  </div>
                  <span className={styles.statValue}>{hero.hp}/{hero.maxHp}</span>
                </div>
              </div>
              
              <div className={styles.heroAttrs}>
                <span>⚔️{hero.atk}</span>
                <span>🛡️{hero.def}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {heroes.length === 0 && (
        <div className={styles.empty}>
          <p>暂无武将</p>
          <GameButton>招募武将</GameButton>
        </div>
      )}

      {/* 武将详情弹窗 */}
      <GameModal
        isOpen={showHeroModal}
        onClose={() => setShowHeroModal(false)}
        title={selectedHero?.name || '武将详情'}
        size="medium"
      >
        {selectedHero && (
          <div className={styles.heroDetail}>
            <div className={styles.detailHeader}>
              <div className={styles.detailAvatar}>
                ⚔️
              </div>
              <div className={styles.detailInfo}>
                <h3 style={{ color: getQualityColor(selectedHero.quality) }}>
                  {selectedHero.name}
                </h3>
                <p>{getQualityName(selectedHero.quality)} · Lv.{selectedHero.level}</p>
              </div>
            </div>
            
            <div className={styles.detailStats}>
              <div className={styles.detailRow}>
                <span>生命值</span>
                <span>{selectedHero.hp} / {selectedHero.maxHp}</span>
              </div>
              <div className={styles.detailRow}>
                <span>攻击力</span>
                <span>{selectedHero.atk}</span>
              </div>
              <div className={styles.detailRow}>
                <span>防御力</span>
                <span>{selectedHero.def}</span>
              </div>
              {selectedHero.skill && (
                <div className={styles.detailRow}>
                  <span>技能</span>
                  <span>{selectedHero.skill}</span>
                </div>
              )}
            </div>
            
            <div className={styles.detailActions}>
              <GameButton fullWidth>升级</GameButton>
              <GameButton variant="secondary" fullWidth>委任</GameButton>
            </div>
          </div>
        )}
      </GameModal>
    </div>
  );
};

export default HeroPanel;
