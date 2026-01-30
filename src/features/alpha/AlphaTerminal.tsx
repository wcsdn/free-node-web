/**
 * Alpha Terminal - GAP 情报终端
 * 赛博朋克风格的商业情报大屏
 */

import React, { useState, useEffect } from 'react';
import PageLayout from '@/shared/layouts/PageLayout';
import { useLanguage } from '@/shared/hooks/useLanguage';
import './AlphaTerminal.css';

interface AlphaPulse {
  id: number;
  source: string;
  category: string;
  title: string;
  url: string;
  raw_summary: string;
  ai_score: number;
  monetization_strategy: string;
  created_at: string;
}

interface AlphaStats {
  total: number;
  avg_score: number;
  max_score: number;
  ultra_count: number;
}

type TabType = 'github' | 'product_hunt' | 'hackernews' | 'tech_news';

const AlphaTerminal: React.FC = () => {
  const { t, language } = useLanguage();
  const [pulses, setPulses] = useState<AlphaPulse[]>([]);
  const [stats, setStats] = useState<AlphaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPulse, setSelectedPulse] = useState<AlphaPulse | null>(null);
  const [typewriterText, setTypewriterText] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('github');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 每分钟刷新
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedPulse) {
      let index = 0;
      const text = selectedPulse.monetization_strategy;
      setTypewriterText('');
      
      const timer = setInterval(() => {
        if (index < text.length) {
          setTypewriterText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(timer);
        }
      }, 30);
      
      return () => clearInterval(timer);
    }
  }, [selectedPulse]);

  const fetchData = async () => {
    try {
      const [pulsesRes, statsRes] = await Promise.all([
        fetch('https://free-node-news.unlocks.workers.dev/api/alpha/latest?limit=20'),
        fetch('https://free-node-news.unlocks.workers.dev/api/alpha/stats'),
      ]);

      if (pulsesRes.ok && statsRes.ok) {
        const pulsesData = await pulsesRes.json();
        const statsData = await statsRes.json();
        
        setPulses(pulsesData.data || []);
        setStats(statsData.data || null);
      }
    } catch (error) {
      console.error('Failed to fetch alpha data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'ultra';
    if (score >= 8) return 'high';
    return 'medium';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'github': return 'github';
      case 'product_hunt': return 'product-hunt';
      case 'tech_news': return 'tech-news';
      default: return 'hackernews';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'github': return '🐙 GitHub';
      case 'product_hunt': return '🚀 Product Hunt';
      case 'tech_news': return '🧠 Tech News';
      default: return '🔶 Hacker News';
    }
  };

  const filteredPulses = pulses.filter(p => p.category === activeTab);

  return (
    <PageLayout title={t('alphaTerminal')}>
      <div className="alpha-terminal">
        {/* CRT 扫描线效果 */}
        <div className="crt-scanline"></div>
        
        {/* 顶部状态栏 */}
        <div className="alpha-header">
          <div className="alpha-meter">
            <div className="meter-label">{t('totalNodes')}</div>
            <div className="meter-value">{stats?.total || 0}</div>
          </div>
          
          <div className="alpha-stats">
            <div className="stat-item">
              <span className="stat-label">{t('avgScore')}</span>
              <span className="stat-value">{stats?.avg_score?.toFixed(1) || '--'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{t('highScoreProjects')}</span>
              <span className="stat-value ultra-glow">{stats?.ultra_count || 0}</span>
            </div>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="alpha-tabs">
          <button 
            className={`tab-btn ${activeTab === 'github' ? 'active' : ''}`}
            onClick={() => setActiveTab('github')}
          >
            {t('githubTrends')} ({pulses.filter(p => p.category === 'github').length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'product_hunt' ? 'active' : ''}`}
            onClick={() => setActiveTab('product_hunt')}
          >
            {t('freshProducts')} ({pulses.filter(p => p.category === 'product_hunt').length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'hackernews' ? 'active' : ''}`}
            onClick={() => setActiveTab('hackernews')}
          >
            {t('hnHotList')} ({pulses.filter(p => p.category === 'hackernews').length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tech_news' ? 'active' : ''}`}
            onClick={() => setActiveTab('tech_news')}
          >
            {t('aiNews')} ({pulses.filter(p => p.category === 'tech_news').length})
          </button>
        </div>

        {/* 情报流 */}
        <div className="pulse-stream">
          {loading ? (
            <div className="loading-terminal">
              <div className="loading-text">{t('scanningNetwork')}</div>
              <div className="loading-bar"></div>
            </div>
          ) : pulses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📡</div>
              <div className="empty-text">{t('noIntelligenceData')}</div>
              <div className="empty-hint">{t('runCrawlHint')}</div>
            </div>
          ) : filteredPulses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📡</div>
              <div className="empty-text">{t('noDataYet')}</div>
              <div className="empty-hint">{t('waitForCrawl')}</div>
            </div>
          ) : (
            filteredPulses.map((pulse) => (
              <div
                key={pulse.id}
                className={`pulse-card ${getScoreColor(pulse.ai_score)} ${getCategoryColor(pulse.category)} ${pulse.ai_score >= 8 ? 'glow-border' : ''}`}
                onClick={() => setSelectedPulse(pulse)}
              >
                <div className="pulse-header">
                  <span className="pulse-source">
                    {getCategoryLabel(pulse.category)}
                  </span>
                  <span className={`pulse-score score-${getScoreColor(pulse.ai_score)}`}>
                    {pulse.ai_score >= 8 && <span className="urgent-badge">🔥 </span>}
                    {t('score')}: {pulse.ai_score}/10
                  </span>
                </div>
                
                <div className="pulse-title">{pulse.title}</div>
                
                <div className="pulse-summary">{pulse.raw_summary}</div>
                
                <div className="pulse-footer">
                  <a
                    href={pulse.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pulse-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('viewProject')}
                  </a>
                  <span className="pulse-time">
                    {new Date(pulse.created_at).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 策略模态框 */}
        {selectedPulse && (
          <div className="strategy-modal" onClick={() => setSelectedPulse(null)}>
            <div className="strategy-content" onClick={(e) => e.stopPropagation()}>
              <div className="strategy-header">
                <span className="strategy-title">{t('monetizationStrategy')}</span>
                <button className="strategy-close" onClick={() => setSelectedPulse(null)}>
                  ✕
                </button>
              </div>
              
              <div className="strategy-project">
                <div className="strategy-label">{t('projectName')}</div>
                <div className="strategy-value">{selectedPulse.title}</div>
              </div>
              
              <div className="strategy-score-display">
                <div className="strategy-label">{t('businessPotential')}</div>
                <div className={`strategy-score-big score-${getScoreColor(selectedPulse.ai_score)}`}>
                  {selectedPulse.ai_score}/10
                </div>
              </div>
              
              <div className="strategy-body">
                <div className="strategy-label">{t('aiAnalysis')}</div>
                <div className="typewriter-text">{typewriterText}<span className="cursor-blink">_</span></div>
              </div>
              
              <div className="strategy-actions">
                <a
                  href={selectedPulse.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="strategy-btn"
                >
                  {t('viewProject')}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AlphaTerminal;
