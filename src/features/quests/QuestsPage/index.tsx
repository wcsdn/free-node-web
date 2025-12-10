/**
 * 任务与成就页面
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useWalletAuth } from '@/shared/hooks/useWalletAuth';
import { useToast } from '@/shared/components/Toast/ToastContext';
import PageLayout from '@/shared/layouts/PageLayout';
import './styles.css';

interface Quest {
  id: string;
  type: string;
  name_zh: string;
  name_en: string;
  desc_zh: string;
  desc_en: string;
  icon: string;
  target: number;
  reward_type: string;
  reward_value: number;
  progress: number;
  completed: number;
  claimed: number;
}

interface Achievement {
  id: string;
  name_zh: string;
  name_en: string;
  desc_zh: string;
  desc_en: string;
  icon: string;
  badge: string;
  rarity: string;
  condition_value: number;
  progress: number;
  unlocked: boolean;
}

const CORE_API = 'https://core.free-node.xyz';

// XP 等级阈值 (与后端保持一致)
const XP_LEVELS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

// 计算当前等级进度百分比
function getXpProgress(xp: number, level: number): { current: number; next: number; percent: number } {
  const currentThreshold = XP_LEVELS[level - 1] || 0;
  const nextThreshold = XP_LEVELS[level] || XP_LEVELS[XP_LEVELS.length - 1];
  
  if (level >= XP_LEVELS.length) {
    return { current: xp, next: nextThreshold, percent: 100 }; // 满级
  }
  
  const progress = xp - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  const percent = Math.min(100, Math.floor((progress / needed) * 100));
  
  return { current: xp, next: nextThreshold, percent };
}

const QuestsPage: React.FC = () => {
  const { language } = useLanguage();
  const { authHeader } = useWalletAuth();
  const { showSuccess, showError } = useToast();
  const [tab, setTab] = useState<'quests' | 'achievements'>('quests');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState({ xp: 0, xp_level: 1, referral_count: 0 });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  // 获取任务和成就列表 (只请求一次)
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
    const fetchData = async () => {
      const headers: HeadersInit = authHeader ? { 'X-Wallet-Auth': authHeader } : {};
      
      try {
        const [questsRes, achievementsRes] = await Promise.all([
          fetch(`${CORE_API}/api/quests`, { headers }),
          fetch(`${CORE_API}/api/achievements`, { headers }),
        ]);
        
        if (questsRes.ok) {
          const data = await questsRes.json();
          setQuests(data.quests || []);
          setStats(data.stats || stats);
        }
        
        if (achievementsRes.ok) {
          const data = await achievementsRes.json();
          setAchievements(data.achievements || []);
        }
        
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // 只在挂载时请求一次

  // 每日签到
  const doCheckin = async () => {
    if (!authHeader) {
      showError(language === 'zh' ? '请先连接钱包' : 'Please connect wallet first');
      return;
    }
    
    try {
      const res = await fetch(`${CORE_API}/api/quests/checkin`, {
        method: 'POST',
        headers: { 'X-Wallet-Auth': authHeader },
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(language === 'zh' ? '签到成功！' : 'Checked in!');
        // 更新签到任务状态
        setQuests(quests.map(q => 
          q.id === 'daily_checkin' ? { ...q, progress: 1, completed: 1 } : q
        ));
      } else {
        showError(data.message || 'Already checked in');
      }
    } catch {
      showError(language === 'zh' ? '签到失败' : 'Check-in failed');
    }
  };

  // 领取奖励
  const claimReward = async (questId: string) => {
    if (!authHeader) {
      showError(language === 'zh' ? '请先连接钱包' : 'Please connect wallet first');
      return;
    }
    
    setClaiming(questId);
    try {
      const res = await fetch(`${CORE_API}/api/quests/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': authHeader,
        },
        body: JSON.stringify({ questId }),
      });
      
      const data = await res.json();
      if (res.ok) {
        let msg = language === 'zh' 
          ? `领取成功！+${data.reward.value} ${data.reward.type === 'xp' ? 'XP' : '邮箱额度'}`
          : `Claimed! +${data.reward.value} ${data.reward.type}`;
        
        // 升级提示
        if (data.newXpLevel) {
          msg += language === 'zh' ? ` 🎉 升级到 Lv.${data.newXpLevel}！` : ` 🎉 Level up to Lv.${data.newXpLevel}!`;
          setStats(prev => ({ ...prev, xp_level: data.newXpLevel }));
        }
        
        showSuccess(msg);
        // 更新任务状态
        setQuests(quests.map(q => 
          q.id === questId ? { ...q, claimed: 1 } : q
        ));
      } else {
        showError(data.error || 'Claim failed');
      }
    } catch {
      showError(language === 'zh' ? '领取失败' : 'Claim failed');
    } finally {
      setClaiming(null);
    }
  };

  const dailyQuests = quests.filter(q => q.type === 'daily');
  const growthQuests = quests.filter(q => q.type === 'growth');

  return (
    <PageLayout title={language === 'zh' ? '> 任务中心' : '> QUEST CENTER'}>
      <div className="quests-page">
        {/* 用户状态栏 + XP 进度条 */}
        <div className="quests-stats">
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">📊 {language === 'zh' ? '等级' : 'Level'}</span>
              <span className="stat-value">Lv.{stats.xp_level}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">👥 {language === 'zh' ? '推荐' : 'Referrals'}</span>
              <span className="stat-value">{stats.referral_count}</span>
            </div>
          </div>
          
          {/* XP 进度条 */}
          <div className="xp-progress-section">
            <div className="xp-progress-header">
              <span className="xp-label">⚡ XP</span>
              <span className="xp-value">
                {stats.xp} / {getXpProgress(stats.xp, stats.xp_level).next}
              </span>
            </div>
            <div className="xp-progress-bar">
              <div 
                className="xp-progress-fill" 
                style={{ width: `${getXpProgress(stats.xp, stats.xp_level).percent}%` }}
              />
              <div className="xp-progress-glow" />
            </div>
            <div className="xp-progress-footer">
              <span>Lv.{stats.xp_level}</span>
              <span>{getXpProgress(stats.xp, stats.xp_level).percent}%</span>
              <span>Lv.{Math.min(stats.xp_level + 1, XP_LEVELS.length)}</span>
            </div>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="quests-tabs">
          <button 
            className={`tab-btn ${tab === 'quests' ? 'active' : ''}`}
            onClick={() => setTab('quests')}
          >
            📋 {language === 'zh' ? '任务' : 'Quests'}
          </button>
          <button 
            className={`tab-btn ${tab === 'achievements' ? 'active' : ''}`}
            onClick={() => setTab('achievements')}
          >
            🏆 {language === 'zh' ? '成就' : 'Achievements'}
          </button>
        </div>

        {loading ? (
          <div className="quests-loading">Loading...</div>
        ) : tab === 'quests' ? (
          <div className="quests-content">
            {/* 每日任务 */}
            <div className="quest-section">
              <h3 className="section-title">
                📅 {language === 'zh' ? '每日任务' : 'Daily Quests'}
              </h3>
              <div className="quest-list">
                {dailyQuests.map(quest => (
                  <QuestCard 
                    key={quest.id} 
                    quest={quest} 
                    language={language}
                    claiming={claiming === quest.id}
                    onClaim={() => claimReward(quest.id)}
                    onCheckin={quest.id === 'daily_checkin' ? doCheckin : undefined}
                  />
                ))}
              </div>
            </div>

            {/* 成长任务 */}
            <div className="quest-section">
              <h3 className="section-title">
                🌱 {language === 'zh' ? '成长任务' : 'Growth Quests'}
              </h3>
              <div className="quest-list">
                {growthQuests.map(quest => (
                  <QuestCard 
                    key={quest.id} 
                    quest={quest} 
                    language={language}
                    claiming={claiming === quest.id}
                    onClaim={() => claimReward(quest.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="achievements-content">
            <div className="achievement-grid">
              {achievements.map(ach => (
                <AchievementCard key={ach.id} achievement={ach} language={language} />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

// 任务跳转配置
const QUEST_LINKS: Record<string, string> = {
  daily_chat_3: '/', // 首页聊天
  daily_chat_10: '/',
  growth_connect_wallet: '/', // 首页连接钱包
  growth_verify: '/',
  growth_invite_1: '/', // 首页分享
  growth_invite_5: '/',
  growth_invite_10: '/',
};

// 任务卡片组件
const QuestCard: React.FC<{
  quest: Quest;
  language: string;
  claiming: boolean;
  onClaim: () => void;
  onCheckin?: () => void;
}> = ({ quest, language, claiming, onClaim, onCheckin }) => {
  const navigate = useNavigate();
  const name = language === 'zh' ? quest.name_zh : quest.name_en;
  const desc = language === 'zh' ? quest.desc_zh : quest.desc_en;
  const isCompleted = quest.progress >= quest.target;
  const isClaimed = quest.claimed === 1;
  const progress = Math.min(quest.progress, quest.target);
  const progressPct = (progress / quest.target) * 100;
  const hasLink = QUEST_LINKS[quest.id];

  const handleGoTask = () => {
    if (hasLink) {
      navigate(hasLink);
    }
  };

  return (
    <div className={`quest-card ${isCompleted ? 'completed' : ''} ${isClaimed ? 'claimed' : ''}`}>
      <div className="quest-icon">{quest.icon}</div>
      <div className="quest-info">
        <div className="quest-name">{name}</div>
        <div className="quest-desc">{desc}</div>
        <div className="quest-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="progress-text">{progress}/{quest.target}</span>
        </div>
      </div>
      <div className="quest-reward">
        <span className="reward-value">+{quest.reward_value}</span>
        <span className="reward-type">{quest.reward_type === 'xp' ? 'XP' : '📧'}</span>
      </div>
      {/* 签到任务 -> 未完成显示「签到」，已完成显示「已签到」置灰 */}
      {onCheckin && !isCompleted && (
        <button className="claim-btn checkin-btn" onClick={onCheckin}>
          {language === 'zh' ? '签到' : 'Check in'}
        </button>
      )}
      {onCheckin && isCompleted && !isClaimed && (
        <button className="claim-btn checked-in" disabled>
          {language === 'zh' ? '已签到' : 'Checked'}
        </button>
      )}
      {/* 未完成且有跳转链接 -> 显示「去完成」 */}
      {!isCompleted && !onCheckin && hasLink && (
        <button className="claim-btn go-btn" onClick={handleGoTask}>
          {language === 'zh' ? '去完成' : 'Go'}
        </button>
      )}
      {/* 未完成且无跳转 -> 显示锁定 */}
      {!isCompleted && !onCheckin && !hasLink && (
        <button className="claim-btn locked" disabled>🔒</button>
      )}
      {/* 已完成未领取 -> 显示「领取」 */}
      {isCompleted && !isClaimed && (
        <button 
          className="claim-btn ready"
          onClick={onClaim}
          disabled={claiming}
        >
          {claiming ? '...' : (language === 'zh' ? '领取' : 'Claim')}
        </button>
      )}
      {/* 已领取 -> 显示勾 */}
      {isClaimed && (
        <button className="claim-btn claimed" disabled>✓</button>
      )}
    </div>
  );
};

// 成就卡片组件 (带解锁动画)
const AchievementCard: React.FC<{
  achievement: Achievement;
  language: string;
}> = ({ achievement, language }) => {
  const [showUnlockAnim, setShowUnlockAnim] = useState(false);
  const name = language === 'zh' ? achievement.name_zh : achievement.name_en;
  const desc = language === 'zh' ? achievement.desc_zh : achievement.desc_en;

  // 点击已解锁成就播放动画
  const handleClick = () => {
    if (achievement.unlocked) {
      setShowUnlockAnim(true);
      setTimeout(() => setShowUnlockAnim(false), 1500);
    }
  };

  return (
    <div 
      className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'} rarity-${achievement.rarity} ${showUnlockAnim ? 'anim-unlock' : ''}`}
      onClick={handleClick}
    >
      {/* 解锁光效 */}
      {showUnlockAnim && <div className="unlock-burst" />}
      
      <div className="achievement-badge">
        {achievement.unlocked ? achievement.badge : '🔒'}
      </div>
      <div className="achievement-info">
        <div className="achievement-name">{name}</div>
        <div className="achievement-desc">{desc}</div>
      </div>
      {!achievement.unlocked && (
        <div className="achievement-progress">
          {achievement.progress}/{achievement.condition_value}
        </div>
      )}
      {achievement.unlocked && (
        <div className="achievement-rarity-tag">{achievement.rarity.toUpperCase()}</div>
      )}
    </div>
  );
};

export default QuestsPage;
