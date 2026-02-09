/**
 * 技能学习面板组件
 * 原则：移动端优先，简洁设计
 */
import React, { useState, useEffect, memo } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useToast } from '@/shared/components/Toast/ToastContext';
import { getApiBase } from '../utils/api';
import { GameButton, GameModal } from '@/shared/components/game';

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
  const [loading, setLoading] = useState(true);
  const [learning, setLearning] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillInfo | null>(null);

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-emerald-400">{i18n.title}</h2>
            <span className="text-sm text-slate-400">|</span>
            <span className="text-slate-300">{hero.name} (Lv.{hero.level})</span>
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* 已学技能 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
              {i18n.currentSkills} ({skills.length}/5)
            </h3>
            {loading ? (
              <div className="text-center py-8 text-slate-500">加载中...</div>
            ) : skills.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-800/30 rounded-lg">
                <div className="text-3xl mb-2">📖</div>
                <p>{i18n.noSkills}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-emerald-400">
                        {skill.name || `技能 #${skill.static_index}`}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-emerald-500/20 rounded text-emerald-400">
                        Lv.{skill.skillLevel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mb-3">
                      {i18n.effect}: {skill.effValue}
                    </div>
                    <GameButton
                      size="small"
                      fullWidth
                      onClick={() => handleUpgrade(skill.id)}
                      loading={learning}
                    >
                      {i18n.upgrade}
                    </GameButton>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 可学技能 */}
          {skills.length < 5 && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
                {i18n.availableSkills}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {availableSkills.map((skill) => (
                  <button
                    key={skill.id}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      hasSkill(skill.id)
                        ? 'bg-slate-800/30 border-slate-700/50 opacity-60'
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/30'
                    }`}
                    onClick={() => setSelectedSkill(skill)}
                    disabled={hasSkill(skill.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-semibold ${hasSkill(skill.id) ? 'text-slate-500' : 'text-emerald-400'}`}>
                        {skill.name}
                      </span>
                      {hasSkill(skill.id) ? (
                        <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-400">
                          {i18n.learned}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400">{skill.probability}%</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{skill.des}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{i18n.effect}: {skill.effValue}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {skills.length >= 5 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center text-amber-400">
              {i18n.maxSkills}
            </div>
          )}
        </div>
      </div>

      {/* 技能详情弹窗 */}
      <GameModal
        isOpen={!!selectedSkill && !hasSkill(selectedSkill.id)}
        onClose={() => setSelectedSkill(null)}
        title={selectedSkill?.name || ''}
        size="small"
      >
        {selectedSkill && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-slate-300">{selectedSkill.des}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <div className="text-slate-500 mb-1">{i18n.effect}</div>
                <div className="text-emerald-400 font-bold">{selectedSkill.effValue}</div>
              </div>
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <div className="text-slate-500 mb-1">{i18n.probability}</div>
                <div className="text-amber-400 font-bold">{selectedSkill.probability}%</div>
              </div>
            </div>
            <GameButton fullWidth onClick={handleLearn} loading={learning}>
              {i18n.learn}
            </GameButton>
          </div>
        )}
      </GameModal>
    </div>
  );
});

SkillLearnPanel.displayName = 'SkillLearnPanel';

export default SkillLearnPanel;
