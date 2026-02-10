/**
 * 技能面板组件
 */
import React, { useState, useEffect, memo } from 'react';
import gufengStyles from '../../styles/gufeng.module.css';

import styles from '../../styles/SkillPanel.module.css';
import { apiGet, apiPost, apiDelete, getApiBase, getAuthHeaders } from '../../utils/api';

interface Skill {
  id: number;
  name: string;
  desc: string;
  level: number;
  maxLevel: number;
  icon: string;
  effect: string;
  category: number;
  requires?: string;
  learnCost?: { gold: number; items?: Array<{name: string; count: number}> };
}

interface SkillPanelProps {
  walletAddress: string;
  onClose: () => void;
}

const SkillPanel: React.FC<SkillPanelProps> = memo(({ walletAddress, onClose }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [gold, setGold] = useState(0);
  const [loading, setLoading] = useState(true);


  const skillCategories = [
    { id: 0, name: '全部' },
    { id: 1, name: '攻击' },
    { id: 2, name: '防御' },
    { id: 3, name: '辅助' },
  ];
  const [currentCategory, setCurrentCategory] = useState(0);

  const fetchSkillData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/skill/list`, {
        headers: { 'X-Wallet-Auth': walletAddress },
      });
      const data = await res.json();
      if (data.success) {
        setSkills(data.skills || []);
        setGold(data.gold || 0);
      }
    } catch (err) {
      console.error('Failed to load skills:', err);
      setGold(10000);
      setSkills([
        { id: 1, name: '破天剑诀', desc: '群体攻击技能，对敌方全体造成伤害', level: 5, maxLevel: 10, icon: '⚔️', effect: '攻击+50', category: 1 },
        { id: 2, name: '金钟罩', desc: '提升自身防御力，减少受到的伤害', level: 3, maxLevel: 10, icon: '🛡️', effect: '防御+30', category: 2 },
        { id: 3, name: '回春术', desc: '恢复自身生命值', level: 2, maxLevel: 10, icon: '💚', effect: '生命+100', category: 3 },
        { id: 4, name: '疾风步', desc: '提升移动速度和闪避率', level: 4, maxLevel: 10, icon: '💨', effect: '速度+20', category: 3 },
        { id: 5, name: '灭世一刀', desc: '终极单体攻击，造成巨额伤害', level: 1, maxLevel: 5, icon: '🔪', effect: '攻击+100', category: 1, requires: '破天剑诀满级' },
        { id: 6, name: '不灭体', desc: '死亡时有概率原地复活', level: 0, maxLevel: 5, icon: '✨', effect: '复活30%', category: 2, requires: '金钟罩5级' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillData();
  }, [walletAddress]);

  const handleLearnSkill = async (skillId: number) => {
    try {
      const res = await fetch(`${getApiBase()}/api/skill/learn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Wallet-Auth': walletAddress },
        body: JSON.stringify({ skillId }),
      });
      const data = await res.json();
      if (data.success) {
        setSkills(skills.map(s => s.id === skillId ? { ...s, level: s.level + 1 } : s));
        setGold(gold - (data.cost || 0));
        alert(`技能升级成功！`);
      } else {
        alert('升级失败：' + data.message);
      }
    } catch (err) {
      alert('升级失败');
    }
  };

  const filteredSkills = currentCategory === 0 
    ? skills 
    : skills.filter(s => s.category === currentCategory);

  return (
    <div className={gufengStyles.container}>
      <div className={gufengStyles.header}>
        <h2>技能</h2>
        <span className={gufengStyles.goldDisplay}>💰 {gold.toLocaleString()}</span>
        <button className={gufengStyles.closeBtn} onClick={onClose}>×</button>
      </div>

      <div className={gufengStyles.mainContent}>
        {/* 左侧技能列表 */}
        <div className={gufengStyles.skillListPanel}>
          {/* 技能分类 */}
          <div className={gufengStyles.categoryNav}>
            {skillCategories.map((cat) => (
              <button
                key={cat.id}
                className={`${gufengStyles.catBtn} ${currentCategory === cat.id ? gufengStyles.active : ''}`}
                onClick={() => setCurrentCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* 技能列表 */}
          <div className={gufengStyles.skillList}>
            {loading ? (
              <div className={gufengStyles.loading}>加载中...</div>
            ) : filteredSkills.length === 0 ? (
              <div className={gufengStyles.empty}>暂无技能</div>
            ) : (
              filteredSkills.map((skill) => (
                <div
                  key={skill.id}
                  className={`${gufengStyles.skillItem} ${selectedSkill?.id === skill.id ? gufengStyles.selected : ''}`}
                  onClick={() => setSelectedSkill(skill)}
                >
                  <div className={gufengStyles.skillIcon}>{skill.icon}</div>
                  <div className={gufengStyles.skillInfo}>
                    <span className={gufengStyles.skillName}>{skill.name}</span>
                    <span className={gufengStyles.skillLevel}>等级 {skill.level}/{skill.maxLevel}</span>
                  </div>
                  <div className={gufengStyles.skillProgress}>
                    <div className={gufengStyles.progressBar}>
                      <div 
                        className={gufengStyles.progressFill}
                        style={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右侧技能详情 */}
        <div className={gufengStyles.skillDetailPanel}>
          {selectedSkill ? (
            <>
              <div className={gufengStyles.detailHeader}>
                <div className={gufengStyles.detailIcon}>{selectedSkill.icon}</div>
                <div className={gufengStyles.detailTitle}>
                  <h3>{selectedSkill.name}</h3>
                  <span className={gufengStyles.detailLevel}>等级 {selectedSkill.level} / {selectedSkill.maxLevel}</span>
                </div>
              </div>

              <div className={gufengStyles.detailContent}>
                <div className={gufengStyles.detailSection}>
                  <h4>技能效果</h4>
                  <p className={gufengStyles.effectText}>{selectedSkill.effect}</p>
                </div>

                <div className={gufengStyles.detailSection}>
                  <h4>技能描述</h4>
                  <p>{selectedSkill.desc}</p>
                </div>

                {selectedSkill.requires && (
                  <div className={gufengStyles.detailSection}>
                    <h4>学习要求</h4>
                    <p className={gufengStyles.requiresText}>{selectedSkill.requires}</p>
                  </div>
                )}

                <div className={gufengStyles.detailSection}>
                  <h4>升级进度</h4>
                  <div className={gufengStyles.bigProgressBar}>
                    <div 
                      className={gufengStyles.progressFill}
                      style={{ width: `${(selectedSkill.level / selectedSkill.maxLevel) * 100}%` }}
                    />
                  </div>
                  <p>{selectedSkill.level} / {selectedSkill.maxLevel}</p>
                </div>
              </div>

              <div className={gufengStyles.detailActions}>
                {selectedSkill.level >= selectedSkill.maxLevel ? (
                  <button className={gufengStyles.maxLevelBtn} disabled>
                    已满级
                  </button>
                ) : (
                  <button 
                    className={gufengStyles.learnBtn}
                    onClick={() => handleLearnSkill(selectedSkill.id)}
                  >
                    升级技能
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className={gufengStyles.noSkillSelected}>
              <p>请选择技能查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SkillPanel.displayName = 'SkillPanel';

export default SkillPanel;
