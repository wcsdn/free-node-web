/**
 * 英雄列表组件
 */
import React, { useState, useEffect, memo } from 'react';
import gufengStyles from '../styles/gufeng.module.css';

import styles from '../styles/HeroList.module.css';
import { getApiBase } from '../utils/api';

interface Skill {
  id: number;
  static_index: number;
  exp: number;
  skill_level: number;
}

interface Hero {
  id: number;
  name: string;
  level: number;
  exp: number;
  quality: number;
  training: number;
  hp: number;
  max_hp: number;
  attack: number;
  defense: number;
  state: number;
  skills?: Skill[];
}

interface HeroListProps {
  walletAddress: string;
}

const HeroList: React.FC<HeroListProps> = memo(({ walletAddress }) => {
  const { language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);
  const [recruiting, setRecruiting] = useState(false);
  const [training, setTraining] = useState<number | null>(null);
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);


  // 获取英雄列表
  const fetchHeroes = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/hero/list`, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        setHeroes(data.data);
      }
    } catch (err) {
      showError(language === 'en' ? 'Failed to load heroes' : '加载英雄失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroes();
  }, [walletAddress]);

  // 招募英雄
  const recruitHero = async (type: 'normal' | 'advanced') => {
    setRecruiting(true);
    try {
      const res = await fetch(`${getApiBase()}/api/hero/recruit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': walletAddress || '',
        },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(language === 'en' ? `Recruited ${data.data.name}!` : `招募了 ${data.data.name}！`);
        await fetchHeroes();
      } else {
        showError(data.message || (language === 'en' ? 'Recruit failed' : '招募失败'));
      }
    } catch (err) {
      showError(language === 'en' ? 'Recruit failed' : '招募失败');
    } finally {
      setRecruiting(false);
    }
  };

  // 训练英雄
  const handleTrain = async (heroId: number, type: 'normal' | 'advanced') => {
    setTraining(heroId);
    try {
      const res = await fetch(`${getApiBase()}/api/hero/${heroId}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': walletAddress || '',
        },
        body: JSON.stringify({ type, hours: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(language === 'en' ? 'Training started!' : '开始训练！');
        await fetchHeroes();
      } else {
        showError(data.message || (language === 'en' ? 'Training failed' : '训练失败'));
      }
    } catch (err) {
      showError(language === 'en' ? 'Training failed' : '训练失败');
    } finally {
      setTraining(null);
    }
  };

  // 升级英雄
  const handleLevelUp = async (heroId: number) => {
    try {
      const res = await fetch(`${getApiBase()}/api/hero/${heroId}/levelup`, {
        method: 'POST',
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(language === 'en' ? `Leveled up to ${data.data.newLevel}!` : `升到 ${data.data.newLevel} 级！`);
        await fetchHeroes();
      } else {
        showError(data.message || (language === 'en' ? 'Level up failed' : '升级失败'));
      }
    } catch (err) {
      showError(language === 'en' ? 'Level up failed' : '升级失败');
    }
  };

  // 品质颜色
  const qualityColors = ['#999', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];
  const qualityNames = [language === 'en' ? 'Common' : '普通', 
                        language === 'en' ? 'Fine' : '精良',
                        language === 'en' ? 'Rare' : '稀有',
                        language === 'en' ? 'Epic' : '史诗',
                        language === 'en' ? 'Legendary' : '传说'];

  const i18n = {
    title: language === 'en' ? 'Heroes' : '英雄',
    recruit: language === 'en' ? 'Recruit' : '招募',
    normal: language === 'en' ? 'Normal (Free)' : '普通招募 (免费)',
    advanced: language === 'en' ? 'Advanced' : '高级招募',
    level: language === 'en' ? 'Level' : '等级',
    attack: language === 'en' ? 'Attack' : '攻击',
    defense: language === 'en' ? 'Defense' : '防御',
    training: language === 'en' ? 'Training' : '训练度',
    hp: language === 'en' ? 'HP' : '生命',
    loading: language === 'en' ? 'Loading...' : '加载中...',
    noHeroes: language === 'en' ? 'No heroes yet. Recruit your first hero!' : '暂无英雄，快去招募吧！',
    quality: language === 'en' ? 'Quality' : '品质',
    train: language === 'en' ? 'Train' : '训练',
    levelUp: language === 'en' ? 'Level Up' : '升级',
    skills: language === 'en' ? 'Skills' : '技能',
    exp: language === 'en' ? 'EXP' : '经验',
    selectHero: language === 'en' ? 'Select Hero' : '选择英雄',
  };

  if (loading) {
    return (
      <PageLayout title={i18n.title}>
        <div className={gufengStyles.loading}>{i18n.loading}</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={i18n.title}>
      <div className={gufengStyles.container}>
        {/* 招募按钮 */}
        <div className={gufengStyles.recruitSection}>
          <button
            className={gufengStyles.recruitBtn}
            onClick={() => recruitHero('normal')}
            disabled={recruiting}
          >
            {i18n.normal}
          </button>
          <button
            className={`${gufengStyles.recruitBtn} ${gufengStyles.advanced}`}
            onClick={() => recruitHero('advanced')}
            disabled={recruiting}
          >
            {i18n.advanced}
          </button>
        </div>

        {/* 英雄列表 */}
        {heroes.length === 0 ? (
          <div className={gufengStyles.empty}>{i18n.noHeroes}</div>
        ) : (
          <div className={gufengStyles.heroGrid}>
            {heroes.map((hero) => (
              <div
                key={hero.id}
                className={`${gufengStyles.heroCard} ${selectedHero?.id === hero.id ? gufengStyles.selected : ''}`}
                style={{ borderColor: qualityColors[hero.quality - 1] }}
                onClick={() => setSelectedHero(selectedHero?.id === hero.id ? null : hero)}
              >
                <div className={gufengStyles.heroHeader}>
                  <h3>{hero.name}</h3>
                  <span
                    className={gufengStyles.quality}
                    style={{ backgroundColor: qualityColors[hero.quality - 1] }}
                  >
                    {qualityNames[hero.quality - 1]}
                  </span>
                </div>

                <div className={gufengStyles.heroStats}>
                  <div className={gufengStyles.statRow}>
                    <span>{i18n.level}:</span>
                    <span>{hero.level}</span>
                  </div>
                  <div className={gufengStyles.statRow}>
                    <span>{i18n.hp}:</span>
                    <span>{hero.hp}/{hero.max_hp}</span>
                  </div>
                  <div className={gufengStyles.statRow}>
                    <span>{i18n.attack}:</span>
                    <span>{hero.attack}</span>
                  </div>
                  <div className={gufengStyles.statRow}>
                    <span>{i18n.defense}:</span>
                    <span>{hero.defense}</span>
                  </div>
                  <div className={gufengStyles.statRow}>
                    <span>{i18n.training}:</span>
                    <div className={gufengStyles.trainingBar}>
                      <div
                        className={gufengStyles.trainingProgress}
                        style={{ width: `${hero.training}%` }}
                      />
                    </div>
                    <span>{hero.training}%</span>
                  </div>
                </div>

                {/* 经验条 */}
                <div className={gufengStyles.expBar}>
                  <div
                    className={gufengStyles.expProgress}
                    style={{ width: `${Math.min(100, (hero.exp % 100))}%` }}
                  />
                </div>
                <div className={gufengStyles.expText}>{hero.exp}/{hero.level * 100} EXP</div>

                {/* 操作按钮 */}
                <div className={gufengStyles.heroActions}>
                  <button
                    className={gufengStyles.actionBtn}
                    onClick={(e) => { e.stopPropagation(); handleTrain(hero.id, 'normal'); }}
                    disabled={training === hero.id || hero.state === 2}
                  >
                    {i18n.train}
                  </button>
                  <button
                    className={`${gufengStyles.actionBtn} ${gufengStyles.levelUpBtn}`}
                    onClick={(e) => { e.stopPropagation(); handleLevelUp(hero.id); }}
                  >
                    {i18n.levelUp}
                  </button>
                </div>

                {/* 选中显示技能 */}
                {selectedHero?.id === hero.id && (
                  <div className={gufengStyles.skillsSection}>
                    <div className={gufengStyles.skillsTitle}>{i18n.skills}</div>
                    <div className={gufengStyles.skillsList}>
                      {hero.skills && hero.skills.length > 0 ? (
                        hero.skills.map((skill) => (
                          <div key={skill.id} className={gufengStyles.skillItem}>
                            <span>技能 #{skill.static_index}</span>
                            <span>Lv.{skill.skill_level}</span>
                          </div>
                        ))
                      ) : (
                        <div className={gufengStyles.noSkills}>
                          {language === 'en' ? 'No skills' : '暂无技能'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
});

HeroList.displayName = 'HeroList';

export default HeroList;
