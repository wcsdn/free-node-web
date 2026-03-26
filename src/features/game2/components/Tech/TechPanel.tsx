/**
 * 科技面板 (TechPanel)
 * 
 * 功能：
 * - 展示所有科技及其当前等级
 * - 科技分类切换（军事、经济、发展、城防）
 * - 科技升级操作
 * - 研究队列展示
 * 
 * API 对接：
 * - GET /api/tech/list - 获取玩家科技列表
 * - GET /api/tech/research - 获取研究中科技
 * - POST /api/tech/research - 开始研究科技
 * - GET /api/tech/configs - 获取科技配置
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  getTechList, 
  getTechResearching, 
  researchTech,
  getTechConfigs,
  transformTechData 
} from '../../services/gameApi';
import type { TechData, TechCategory, TechResearching } from '../../types';
import { toast } from '../common/Toast';
import './TechPanel.css';

// 科技分类配置
const TECH_CATEGORIES: { key: TechCategory; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '📚' },
  { key: 'military', label: '军事', icon: '⚔️' },
  { key: 'defense', label: '城防', icon: '🏰' },
  { key: 'economy', label: '经济', icon: '💰' },
  { key: 'development', label: '发展', icon: '📈' },
];

// 科技效果类型名称
const EFFECT_TYPE_NAMES: Record<number, string> = {
  1: '区域面积',
  2: '建筑等级',
  3: '训练速度',
  4: '建造速度',
  5: '城墙强度',
  6: '箭塔威力',
  7: '陷阱威力',
  8: '滚木威力',
  9: '礌石威力',
  10: '训练加成',
  11: '士气加成',
  12: '驻守加成',
  13: '仓库容量',
  14: '器械威力',
  15: '行军速度',
};

// 科技图标
const TECH_ICONS: Record<number, string> = {
  1: '🏔️',
  2: '🏗️',
  3: '👥',
  4: '📏',
  5: '🧱',
  6: '🏹',
  7: '⚡',
  8: '🪨',
  9: '💎',
  10: '⚔️',
  11: '🎖️',
  12: '🛡️',
  13: '📦',
  14: '⚙️',
  15: '🏃',
};

interface TechPanelProps {
  cityId?: number;
  onClose?: () => void;
}

export const TechPanel: React.FC<TechPanelProps> = ({ cityId, onClose }) => {
  // 状态
  const [techs, setTechs] = useState<TechData[]>([]);
  const [researchingTechs, setResearchingTechs] = useState<TechResearching[]>([]);
  const [activeCategory, setActiveCategory] = useState<TechCategory>('all');
  const [selectedTech, setSelectedTech] = useState<TechData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResearching, setIsResearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 过滤科技
  const filteredTechs = techs.filter(tech => {
    if (activeCategory === 'all') return true;
    return tech.category === activeCategory;
  });

  // 加载科技数据
  const loadTechData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 并行加载科技列表和研究中的科技
      const [techResult, researchResult] = await Promise.all([
        getTechList(),
        getTechResearching(),
      ]);

      if (techResult.success && techResult.data) {
        const transformedTechs = transformTechData(techResult.data.techs || []);
        setTechs(transformedTechs);
      } else {
        setError(techResult.error || '获取科技列表失败');
      }

      if (researchResult.success && researchResult.data) {
        setResearchingTechs(researchResult.data.techs || []);
      }
    } catch (err: any) {
      setError(err.message || '加载科技数据失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadTechData();
  }, [loadTechData]);

  // 定时更新研究进度
  useEffect(() => {
    if (researchingTechs.length === 0) return;

    const interval = setInterval(() => {
      setResearchingTechs(prev => 
        prev.map(tech => {
          if (tech.remain_seconds <= 0) return tech;
          return { ...tech, remain_seconds: tech.remain_seconds - 1 };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [researchingTechs.length]);

  // 处理科技研究
  const handleResearch = async (tech: TechData) => {
    if (!tech.canUpgrade) return;

    setIsResearching(true);
    setError(null);

    try {
      const result = await researchTech(tech.staticIndex);
      
      if (result.success && result.data) {
        toast.success(result.data.message || `${tech.name} 研究成功！`);
        showNotification('success', result.data.message || `${tech.name} 研究成功！`);
        
        // 重新加载科技数据
        await loadTechData();
      } else {
        toast.error(result.error || '研究失败');
        showNotification('error', result.error || '研究失败');
      }
    } catch (err: any) {
      toast.error(err.message || '研究失败');
      showNotification('error', err.message || '研究失败');
    } finally {
      setIsResearching(false);
    }
  };

  // 显示通知
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // 格式化时间
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '完成';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}时${minutes}分${secs}秒`;
    }
    if (minutes > 0) {
      return `${minutes}分${secs}秒`;
    }
    return `${secs}秒`;
  };

  // 格式化数字
  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  // 获取科技效果描述
  const getEffectDescription = (tech: TechData): string => {
    const effectName = EFFECT_TYPE_NAMES[tech.effectType] || '效果';
    if (tech.currentLevel === 0) {
      return `研究后可获得 ${effectName} +${tech.nextEffect}`;
    }
    if (tech.currentLevel >= tech.maxLevel) {
      return `${effectName} +${tech.currentEffect} (已满级)`;
    }
    return `${effectName} +${tech.currentEffect} → +${tech.nextEffect}`;
  };

  return (
    <div className="tech-panel">
      {/* 通知提示 */}
      {notification && (
        <div className={`tech-notification tech-notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* 头部 */}
      <div className="tech-header">
        <div className="tech-title">
          <span className="tech-title-icon">🔬</span>
          <h2>科技研究</h2>
          <span className="tech-count">共 {techs.length} 项科技</span>
        </div>
        <div className="tech-header-actions">
          <button 
            className="tech-refresh-btn"
            onClick={loadTechData}
            disabled={isLoading}
          >
            🔄 刷新
          </button>
          {onClose && (
            <button className="tech-close-btn" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 研究队列 */}
      {researchingTechs.length > 0 && (
        <div className="tech-research-queue">
          <div className="tech-queue-title">
            <span>📡 研究中</span>
            <span className="tech-queue-count">{researchingTechs.length}</span>
          </div>
          <div className="tech-queue-list">
            {researchingTechs.map(tech => (
              <div key={tech.id} className="tech-queue-item">
                <span className="tech-queue-icon">{TECH_ICONS[tech.static_index] || '🔬'}</span>
                <div className="tech-queue-info">
                  <div className="tech-queue-name">{tech.name}</div>
                  <div className="tech-queue-progress">
                    <div 
                      className="tech-queue-progress-bar"
                      style={{ 
                        width: `${Math.max(0, 100 - (tech.remain_seconds / 60) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="tech-queue-time">
                  {formatTime(tech.remain_seconds)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 分类标签 */}
      <div className="tech-tabs">
        {TECH_CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`tech-tab ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="tech-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* 内容区域 */}
      <div className="tech-content">
        {/* 科技列表 */}
        <div className="tech-list-container">
          {isLoading ? (
            <div className="tech-loading">
              <div className="tech-loading-spinner" />
              <div>加载中...</div>
            </div>
          ) : filteredTechs.length === 0 ? (
            <div className="tech-empty">
              <div className="tech-empty-icon">📭</div>
              <div className="tech-empty-text">暂无科技</div>
              <div className="tech-empty-hint">当前分类下没有科技</div>
            </div>
          ) : (
            <div className="tech-list">
              {filteredTechs.map(tech => (
                <div
                  key={tech.id}
                  className={`tech-item ${selectedTech?.id === tech.id ? 'selected' : ''} ${tech.currentLevel >= tech.maxLevel ? 'maxed' : ''}`}
                  onClick={() => setSelectedTech(tech)}
                >
                  <div className="tech-item-icon">
                    {tech.icon ? (
                      <img src={tech.icon} alt={tech.name} />
                    ) : (
                      <span>{TECH_ICONS[tech.id] || '🔬'}</span>
                    )}
                  </div>
                  <div className="tech-item-info">
                    <div className="tech-item-header">
                      <span className="tech-item-name">{tech.name}</span>
                      <span className="tech-item-level">
                        Lv.{tech.currentLevel}/{tech.maxLevel}
                      </span>
                    </div>
                    <div className="tech-item-effect">
                      {getEffectDescription(tech)}
                    </div>
                    <div className="tech-item-progress">
                      <div 
                        className="tech-item-progress-bar"
                        style={{ width: `${(tech.currentLevel / tech.maxLevel) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="tech-item-action">
                    {tech.currentLevel >= tech.maxLevel ? (
                      <span className="tech-action-max">已满级</span>
                    ) : (
                      <button
                        className="tech-action-btn"
                        disabled={isResearching}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResearch(tech);
                        }}
                      >
                        研究
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 科技详情 */}
        <div className="tech-detail-container">
          {selectedTech ? (
            <div className="tech-detail">
              <div className="tech-detail-header">
                <div className="tech-detail-icon">
                  {selectedTech.icon ? (
                    <img src={selectedTech.icon} alt={selectedTech.name} />
                  ) : (
                    <span>{TECH_ICONS[selectedTech.id] || '🔬'}</span>
                  )}
                </div>
                <div className="tech-detail-title">
                  <h3>{selectedTech.name}</h3>
                  <span className="tech-detail-level">
                    Lv.{selectedTech.currentLevel} / Lv.{selectedTech.maxLevel}
                  </span>
                </div>
              </div>

              <div className="tech-detail-section">
                <div className="tech-detail-label">📜 科技描述</div>
                <div className="tech-detail-content">
                  {selectedTech.description || '暂无描述'}
                </div>
              </div>

              <div className="tech-detail-section">
                <div className="tech-detail-label">📊 当前效果</div>
                <div className="tech-detail-effect">
                  {selectedTech.currentLevel > 0 ? (
                    <div className="tech-effect-current">
                      <span className="tech-effect-value">+{selectedTech.currentEffect}</span>
                      <span className="tech-effect-name">
                        {EFFECT_TYPE_NAMES[selectedTech.effectType] || '效果'}
                      </span>
                    </div>
                  ) : (
                    <div className="tech-effect-none">尚未研究</div>
                  )}
                </div>
              </div>

              {selectedTech.currentLevel < selectedTech.maxLevel && (
                <>
                  <div className="tech-detail-section">
                    <div className="tech-detail-label">⬆️ 升级效果</div>
                    <div className="tech-effect-next">
                      <span className="tech-effect-arrow">→</span>
                      <span className="tech-effect-value-next">+{selectedTech.nextEffect}</span>
                      <span className="tech-effect-name">
                        {EFFECT_TYPE_NAMES[selectedTech.effectType] || '效果'}
                      </span>
                    </div>
                  </div>

                  <div className="tech-detail-section">
                    <div className="tech-detail-label">💰 升级消耗</div>
                    <div className="tech-cost-list">
                      {selectedTech.upgradeCost && (
                        <>
                          <div className="tech-cost-item">
                            <span className="tech-cost-icon">💵</span>
                            <span className="tech-cost-name">铜钱</span>
                            <span className="tech-cost-value">{formatNumber(selectedTech.upgradeCost.money)}</span>
                          </div>
                          <div className="tech-cost-item">
                            <span className="tech-cost-icon">🌾</span>
                            <span className="tech-cost-name">粮食</span>
                            <span className="tech-cost-value">{formatNumber(selectedTech.upgradeCost.food)}</span>
                          </div>
                          {selectedTech.upgradeCost.gold > 0 && (
                            <div className="tech-cost-item">
                              <span className="tech-cost-icon">🪙</span>
                              <span className="tech-cost-name">元宝</span>
                              <span className="tech-cost-value">{selectedTech.upgradeCost.gold}</span>
                            </div>
                          )}
                          {selectedTech.upgradeCost.time > 0 && (
                            <div className="tech-cost-item">
                              <span className="tech-cost-icon">⏱️</span>
                              <span className="tech-cost-name">时间</span>
                              <span className="tech-cost-value">{formatTime(selectedTech.upgradeCost.time)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {selectedTech.upgradeRequirements && (
                    <div className="tech-detail-section">
                      <div className="tech-detail-label">📋 升级条件</div>
                      <div className="tech-requirements">
                        {selectedTech.upgradeRequirements.buildingId > 0 && (
                          <div className="tech-req-item">
                            <span>需要建筑等级: {selectedTech.upgradeRequirements.buildingLevel}</span>
                          </div>
                        )}
                        {selectedTech.upgradeRequirements.technicId > 0 && (
                          <div className="tech-req-item">
                            <span>需要前置科技等级: {selectedTech.upgradeRequirements.technicLevel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="tech-detail-actions">
                    <button
                      className="tech-research-btn"
                      disabled={isResearching || !selectedTech.canUpgrade}
                      onClick={() => handleResearch(selectedTech)}
                    >
                      {isResearching ? '研究中...' : `开始研究 (${formatTime(selectedTech.upgradeCost?.time || 0)})`}
                    </button>
                  </div>
                </>
              )}

              {selectedTech.currentLevel >= selectedTech.maxLevel && (
                <div className="tech-detail-actions">
                  <div className="tech-maxed-notice">
                    🎉 此科技已达满级
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="tech-detail-empty">
              <div className="tech-detail-empty-icon">👈</div>
              <div className="tech-detail-empty-text">选择一项科技查看详情</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechPanel;
