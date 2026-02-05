/**
 * 技能学习面板组件
 */
import React, { useState, useEffect, memo } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useToast } from '@/shared/components/Toast/ToastContext';
import styles from '../styles/SkillLearnPanel.module.css';
import { apiGet, apiPost, apiDelete, getApiBase, getAuthHeaders } from '../utils/api';

interface Skill {
  id: number;
  static_index: number;
  skillLevel: number;
  exp: number;
  name: string;
  des: string;
  type: number;
  effID: number;
  effRange: number;
  effValue: number;
  probability: number;
  needItemType: number;
}

interface Hero {
  id: number;
  name: string;
  level: number;
  union: number;
}

interface SkillInfo {
  id: number;
  name: string;
  des: string;
  type: number;
  effID: number;
  effRange: number;
  effValue: number;
  probability: number;
  needItemType: number;
  upProbability: number;
}

interface SkillLearnPanelProps {
  walletAddress: string;
  hero: Hero;
  onClose: () => void;
  onSkillLearn?: (skill: Skill) => void;
}

const SkillLearnPanel: React.FC<SkillLearnPanelProps> = memo(({ walletAddress, hero, onClose, onSkillLearn }) => {
  const { language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [availableSkills, setAvailableSkills] = useState<SkillInfo[]>([]);
  const [, setLoading] = useState(true);
  const [learning, setLearning] = useState(false);


  // 获取现有技能
  const fetchSkills = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/skill/hero/${hero.id}`, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success && data.data && data.data.skills) {
        setSkills(data.data.skills);
      }
    } catch (err) {
      console.error('Failed to load skills:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取可学习的技能列表
  const fetchAvailableSkills = () => {
    // 从配置中获取该门派可学的技能
    // 这里简化处理，返回一些示例技能
    const mockSkills: SkillInfo[] = [
      { id: 1, name: '普通攻击', des: '基础攻击技能', type: 1, effID: 1, effRange: 1, effValue: 100, probability: 100, needItemType: 0, upProbability: 5 },
      { id: 2, name: '强力攻击', des: '造成150%伤害', type: 1, effID: 2, effRange: 1, effValue: 150, probability: 70, needItemType: 0, upProbability: 3 },
      { id: 3, name: '防御姿态', des: '提升防御力', type: 2, effID: 3, effRange: 0, effValue: 20, probability: 100, needItemType: 0, upProbability: 5 },
      { id: 4, name: '必杀技', des: '造成200%伤害', type: 1, effID: 4, effRange: 1, effValue: 200, probability: 30, needItemType: 2, upProbability: 2 },
      { id: 5, name: '群体攻击', des: '攻击范围内所有敌人', type: 1, effID: 5, effRange: 3, effValue: 80, probability: 50, needItemType: 3, upProbability: 2 },
    ];
    setAvailableSkills(mockSkills);
  };

  useEffect(() => {
    fetchSkills();
    fetchAvailableSkills();
  }, [hero.id]);

  // 学习新技能
  const handleLearn = async () => {
    setLearning(true);
    try {
      const res = await fetch(`${getApiBase()}/api/skill/learn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': walletAddress || '',
        },
        body: JSON.stringify({
          heroId: hero.id,
          union: hero.union,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(language === 'en' ? `Learned ${data.data.skill?.name || 'new skill'}!` : `学会了新技能！`);
        await fetchSkills();
        if (data.data.skill && onSkillLearn) {
          onSkillLearn(data.data.skill);
        }
      } else {
        showError(data.message || (language === 'en' ? 'Learn failed' : '学习失败'));
      }
    } catch (err) {
      showError(language === 'en' ? 'Learn failed' : '学习失败');
    } finally {
      setLearning(false);
    }
  };

  // 升级技能
  const handleUpgrade = async (skillId: number) => {
    setLearning(true);
    try {
      const res = await fetch(`${getApiBase()}/api/skill/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': walletAddress || '',
        },
        body: JSON.stringify({
          heroId: hero.id,
          skillId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(language === 'en' ? 'Skill upgraded!' : '技能升级成功！');
        await fetchSkills();
      } else {
        showError(data.message || (language === 'en' ? 'Upgrade failed' : '升级失败'));
      }
    } catch (err) {
      showError(language === 'en' ? 'Upgrade failed' : '升级失败');
    } finally {
      setLearning(false);
    }
  };

  // 检查是否已拥有该技能
  const hasSkill = (staticIndex: number) => skills.some(s => s.static_index === staticIndex);

  const i18n = {
    title: language === 'en' ? 'Skills' : '技能',
    hero: language === 'en' ? 'Hero' : '英雄',
    currentSkills: language === 'en' ? 'Current Skills' : '已学技能',
    availableSkills: language === 'en' ? 'Available Skills' : '可学技能',
    learn: language === 'en' ? 'Learn' : '学习',
    upgrade: language === 'en' ? 'Upgrade' : '升级',
    upgrading: language === 'en' ? 'Upgrading...' : '升级中...',
    level: language === 'en' ? 'Level' : '等级',
    effect: language === 'en' ? 'Effect' : '效果',
    probability: language === 'en' ? 'Probability' : '概率',
    noSkills: language === 'en' ? 'No skills learned yet' : '暂未学习任何技能',
    maxSkills: language === 'en' ? 'Max skills reached (5)' : '已达技能上限(5)',
    learned: language === 'en' ? 'Learned' : '已学',
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{i18n.title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.heroInfo}>
          <span>{i18n.hero}: {hero.name}</span>
          <span>{i18n.level}: {hero.level}</span>
        </div>

        <div className={styles.content}>
          {/* 已学技能 */}
          <div className={styles.section}>
            <h3>{i18n.currentSkills} ({skills.length}/5)</h3>
            {skills.length === 0 ? (
              <div className={styles.empty}>{i18n.noSkills}</div>
            ) : (
              <div className={styles.skillGrid}>
                {skills.map((skill) => (
                  <div key={skill.id} className={styles.skillCard}>
                    <div className={styles.skillName}>{skill.name || `技能 #${skill.static_index}`}</div>
                    <div className={styles.skillLevel}>{i18n.level}: {skill.skillLevel}</div>
                    <div className={styles.skillEffect}>{i18n.effect}: {skill.effValue}</div>
                    <button
                      className={styles.upgradeBtn}
                      onClick={() => handleUpgrade(skill.id)}
                      disabled={learning}
                    >
                      {i18n.upgrade}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 可学技能 */}
          {skills.length < 5 && (
            <div className={styles.section}>
              <h3>{i18n.availableSkills}</h3>
              <div className={styles.skillGrid}>
                {availableSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className={`${styles.skillCard} ${hasSkill(skill.id) ? styles.learned : ''}`}
                  >
                    <div className={styles.skillName}>{skill.name}</div>
                    <div className={styles.skillDesc}>{skill.des}</div>
                    <div className={styles.skillStats}>
                      <span>{i18n.effect}: {skill.effValue}</span>
                      <span>{i18n.probability}: {skill.probability}%</span>
                    </div>
                    {hasSkill(skill.id) ? (
                      <div className={styles.learnedBadge}>{i18n.learned}</div>
                    ) : (
                      <button
                        className={styles.learnBtn}
                        onClick={() => handleLearn()}
                        disabled={learning}
                      >
                        {i18n.learn}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {skills.length >= 5 && (
            <div className={styles.maxWarning}>{i18n.maxSkills}</div>
          )}
        </div>
      </div>
    </div>
  );
});

SkillLearnPanel.displayName = 'SkillLearnPanel';

export default SkillLearnPanel;
