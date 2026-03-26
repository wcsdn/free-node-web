/**
 * 事件面板 - EventPanel
 * 显示所有进行中的游戏事件（建造/升级/训练/征兵/移动等）
 * 对接后端 workers/ghost-game/src/routes/event.ts
 */
import React, { useState, useEffect, useCallback } from 'react';

// ==================== API 基础配置 ====================

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8788';
const DEV_TEST_WALLET = '0x1234567890123456789012345678901234567890';

const getWalletAuthHeader = (): Record<string, string> => {
  const isDev = import.meta.env.DEV;
  return {
    'Content-Type': 'application/json',
    'X-Wallet-Auth': isDev ? `${DEV_TEST_WALLET}:test_signature` : '',
  };
};

// ==================== 类型定义 ====================

/** 事件类型 */
export type GameEventType = 1 | 2 | 3 | 4 | 5 | 6;
const EVENT_TYPES = {
  BUILDING: 1,    // 内政建筑
  TECHNIC: 2,      // 科技
  DEFENCE: 3,      // 防御建筑
  HERO: 4,         // 英雄
  CORPS: 5,        // 军团/部队
  EXPLORE: 6,      // 探索
};

/** 动作类型 */
const ACTION_TYPES: Record<number, string> = {
  1: '建造',
  2: '升级',
  3: '研究',
  4: '训练',
  5: '降级',
  6: '拆除',
  7: '移动',
  8: '采集',
  9: '增援',
  10: '召回',
  11: '攻击',
  12: '防御',
  13: '支援',
  14: '探索',
  15: '收集任务',
  20: '建造防御',
  21: '部队移动',
  22: '殖民',
  23: '英雄自动经验',
  26: '竞技场战斗',
  27: '快速寻访',
};

/** 事件状态 */
const EVENT_STATES: Record<number, string> = {
  0: '未开始',
  1: '进行中',
  2: '等待中',
  3: '已完成',
  4: '已取消',
};

/** 事件项 */
export interface GameEvent {
  ID: number;
  EventType: number;
  ActionType: number;
  State: number;
  ObjType: number;
  ObjID: number;
  ObjLevel: number;
  BeginTime: string;
  OverTime: string;
  RemainTime: number;
  RemainSeconds: number;
  RemainTimeStr: string;
  EventPos: number;
  EventQueue: number;
  TargetCity: number;
  CityID: number;
  CityName: string;
  ObjName: string;
  ObjImg: string;
  FromCityName: string;
  // 额外字段
  object_type: number;
  object_id: number;
  object_level: number;
  city_id: number;
  city_name: string;
  target_id: number;
  event_queue: number;
  event_pos: number;
}

/** API 响应 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================== 事件类型图标映射 ====================

const EVENT_TYPE_ICONS: Record<number, string> = {
  [EVENT_TYPES.BUILDING]: '🏗️',   // 内政建筑
  [EVENT_TYPES.TECHNIC]: '🔬',     // 科技
  [EVENT_TYPES.DEFENCE]: '🛡️',    // 防御建筑
  [EVENT_TYPES.HERO]: '⚔️',       // 英雄
  [EVENT_TYPES.CORPS]: '👥',      // 军团/部队
  [EVENT_TYPES.EXPLORE]: '🔍',    // 探索
};

// ==================== 事件类型名称映射 ====================

const EVENT_TYPE_NAMES: Record<number, string> = {
  [EVENT_TYPES.BUILDING]: '建筑',
  [EVENT_TYPES.TECHNIC]: '科技',
  [EVENT_TYPES.DEFENCE]: '防御',
  [EVENT_TYPES.HERO]: '英雄',
  [EVENT_TYPES.CORPS]: '部队',
  [EVENT_TYPES.EXPLORE]: '探索',
};

// ==================== 工具函数 ====================

/** 格式化剩余时间为可读字符串 */
function formatRemainTime(seconds: number): string {
  if (seconds <= 0) return '已完成';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/** 格式化坐标 */
function formatPosition(pos: number): string {
  if (!pos) return '';
  const x = pos % 400 || 400;
  const y = Math.floor((pos - 1) / 400) + 1;
  return `(${x}, ${y})`;
}

/** 计算加速所需金条 */
function calcSpeedupCost(remainSeconds: number): number {
  const hours = Math.ceil(remainSeconds / 3600);
  return hours * 10; // 10 gold/hour
}

// ==================== API 函数 ====================

/** 获取有效事件列表 */
async function fetchValidEvents(): Promise<GameEvent[]> {
  try {
    const res = await fetch(`${API_BASE}/api/event/valid`, {
      headers: getWalletAuthHeader(),
    });
    const json: ApiResponse<GameEvent[]> = await res.json();
    if (json.success && json.data) {
      // 过滤掉 ID: -1 的空响应
      return json.data.filter(e => e.ID !== -1);
    }
    return [];
  } catch (err) {
    console.error('[EventPanel] fetchValidEvents error:', err);
    return [];
  }
}

/** 获取事件列表 */
async function fetchEventList(cityId?: number): Promise<GameEvent[]> {
  try {
    const url = cityId ? `${API_BASE}/api/event/list?city_id=${cityId}` : `${API_BASE}/api/event/list`;
    const res = await fetch(url, {
      headers: getWalletAuthHeader(),
    });
    const json: ApiResponse<{ events: GameEvent[] }> = await res.json();
    if (json.success && json.data?.events) {
      return json.data.events.filter(e => e.ID !== -1);
    }
    return [];
  } catch (err) {
    console.error('[EventPanel] fetchEventList error:', err);
    return [];
  }
}

/** 取消事件 */
async function cancelEvent(eventId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/event/${eventId}/cancel`, {
      method: 'POST',
      headers: getWalletAuthHeader(),
    });
    const json: ApiResponse<any> = await res.json();
    return { success: json.success, error: json.error };
  } catch (err) {
    console.error('[EventPanel] cancelEvent error:', err);
    return { success: false, error: String(err) };
  }
}

/** 加速完成事件 */
async function speedupEvent(eventId: number): Promise<{ success: boolean; error?: string; goldUsed?: number }> {
  try {
    const res = await fetch(`${API_BASE}/api/event/${eventId}/speedup`, {
      method: 'POST',
      headers: getWalletAuthHeader(),
      body: JSON.stringify({ use_gold: true }),
    });
    const json: ApiResponse<{ event_id: number; gold_used: number }> = await res.json();
    return { success: json.success, error: json.error, goldUsed: json.data?.gold_used };
  } catch (err) {
    console.error('[EventPanel] speedupEvent error:', err);
    return { success: false, error: String(err) };
  }
}

// ==================== 事件卡片组件 ====================

interface EventCardProps {
  event: GameEvent;
  onCancel: (eventId: number) => void;
  onSpeedup: (eventId: number) => void;
  onRefresh: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onCancel, onSpeedup, onRefresh }) => {
  const [remainTime, setRemainTime] = useState(event.RemainTime || event.RemainSeconds || 0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSpeeduping, setIsSpeeduping] = useState(false);

  // 倒计时更新
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainTime(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async () => {
    setIsCancelling(true);
    const result = await cancelEvent(event.ID);
    setIsCancelling(false);
    if (result.success) {
      onCancel(event.ID);
      onRefresh();
    } else {
      alert(`取消失败: ${result.error}`);
    }
  };

  const handleSpeedup = async () => {
    const cost = calcSpeedupCost(remainTime);
    if (!confirm(`确定消耗 ${cost} 💰 加速完成此事件？`)) return;
    
    setIsSpeeduping(true);
    const result = await speedupEvent(event.ID);
    setIsSpeeduping(false);
    if (result.success) {
      onSpeedup(event.ID);
      onRefresh();
    } else {
      alert(`加速失败: ${result.error}`);
    }
  };

  const eventTypeIcon = EVENT_TYPE_ICONS[event.ObjType] || EVENT_TYPE_ICONS[event.EventType] || '📋';
  const eventTypeName = EVENT_TYPE_NAMES[event.ObjType] || EVENT_TYPE_NAMES[event.EventType] || '事件';
  const actionName = ACTION_TYPES[event.ActionType] || `动作${event.ActionType}`;
  const stateName = EVENT_STATES[event.State] || '未知';
  const isCompleted = remainTime <= 0 || event.State === 3;
  const isWaiting = event.State === 2 || (event.BeginTime && new Date(event.BeginTime) > new Date());

  // 动作类型是否允许取消
  const canCancel = !isCompleted && 
    event.ActionType !== 11 && // 攻击不可取消
    event.ActionType !== 12 && // 防御不可取消
    event.ActionType !== 13;   // 支援不可取消

  // 动作类型是否允许加速
  const canSpeedup = !isCompleted && remainTime > 0;

  return (
    <div className={`event-card ${isCompleted ? 'event-card-completed' : ''} ${isWaiting ? 'event-card-waiting' : ''}`}>
      {/* 事件头部 */}
      <div className="event-card-header">
        <div className="event-card-icon">
          {eventTypeIcon}
        </div>
        <div className="event-card-title">
          <div className="event-card-type">
            <span className={`event-type-badge event-type-${event.ObjType || event.EventType}`}>
              {eventTypeName}
            </span>
            <span className="event-action-type">{actionName}</span>
          </div>
          <div className="event-card-name">
            {event.ObjName || `对象 Lv.${event.ObjLevel || event.object_level || 1}`}
          </div>
        </div>
        <div className={`event-state-badge event-state-${event.State}`}>
          {isWaiting ? '⏳ 等待中' : isCompleted ? '✅ 完成' : stateName}
        </div>
      </div>

      {/* 事件详情 */}
      <div className="event-card-body">
        {/* 位置信息 */}
        {event.TargetCity > 0 && (
          <div className="event-detail-row">
            <span className="event-detail-label">📍 目标:</span>
            <span className="event-detail-value">
              {formatPosition(event.TargetCity)}
              {event.FromCityName && ` (从 ${event.FromCityName})`}
            </span>
          </div>
        )}
        
        {/* 城市信息 */}
        {(event.CityName || event.city_name) && (
          <div className="event-detail-row">
            <span className="event-detail-label">🏰 城市:</span>
            <span className="event-detail-value">{event.CityName || event.city_name}</span>
          </div>
        )}

        {/* 等级信息 */}
        {(event.ObjLevel || event.object_level) > 0 && (
          <div className="event-detail-row">
            <span className="event-detail-label">⭐ 等级:</span>
            <span className="event-detail-value">Lv.{event.ObjLevel || event.object_level}</span>
          </div>
        )}

        {/* 队列位置 */}
        {event.EventQueue > 0 && (
          <div className="event-detail-row">
            <span className="event-detail-label">📥 队列:</span>
            <span className="event-detail-value">#{event.EventQueue}</span>
          </div>
        )}

        {/* 完成时间 */}
        {event.OverTime && (
          <div className="event-detail-row">
            <span className="event-detail-label">🕐 完成时间:</span>
            <span className="event-detail-value">{new Date(event.OverTime).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* 倒计时显示 */}
      <div className="event-card-timer">
        {isCompleted ? (
          <div className="event-timer-completed">🎉 事件已完成</div>
        ) : (
          <div className="event-timer-countdown">
            <span className="timer-label">剩余时间:</span>
            <span className="timer-value">{formatRemainTime(remainTime)}</span>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {!isCompleted && (
        <div className="event-card-actions">
          {canSpeedup && (
            <button
              className="event-action-btn event-action-speedup"
              onClick={handleSpeedup}
              disabled={isSpeeduping}
              title={`消耗 ${calcSpeedupCost(remainTime)} 💰 立即完成`}
            >
              ⚡ 加速
              <span className="action-cost">({calcSpeedupCost(remainTime)}💰)</span>
            </button>
          )}
          {canCancel && (
            <button
              className="event-action-btn event-action-cancel"
              onClick={handleCancel}
              disabled={isCancelling}
              title="取消事件并返还部分资源"
            >
              ❌ 取消
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== 事件地图组件 ====================

interface EventMapProps {
  events: GameEvent[];
}

const EventMap: React.FC<EventMapProps> = ({ events }) => {
  // 筛选有位置信息的事件
  const positionedEvents = events.filter(e => 
    e.TargetCity > 0 || e.EventPos > 0 || e.city_id > 0
  );

  if (positionedEvents.length === 0) {
    return (
      <div className="event-map-empty">
        <div className="empty-icon">🗺️</div>
        <div className="empty-text">暂无需要显示的事件位置</div>
      </div>
    );
  }

  return (
    <div className="event-map-container">
      <div className="event-map-header">
        <h3>📍 事件地图</h3>
        <span className="event-map-count">共 {positionedEvents.length} 个事件</span>
      </div>
      <div className="event-map-list">
        {positionedEvents.map(event => {
          const pos = event.TargetCity || event.EventPos || event.city_id;
          const coords = formatPosition(pos);
          const icon = EVENT_TYPE_ICONS[event.ObjType] || EVENT_TYPE_ICONS[event.EventType] || '📋';
          const action = ACTION_TYPES[event.ActionType] || '事件';
          
          return (
            <div key={event.ID} className="event-map-item">
              <div className="event-map-icon">{icon}</div>
              <div className="event-map-info">
                <div className="event-map-name">
                  {event.FromCityName || event.city_name || '城市'} 
                  <span className="event-map-action"> {action}</span>
                </div>
                <div className="event-map-coords">📍 {coords}</div>
              </div>
              <div className="event-map-remain">
                {formatRemainTime(event.RemainTime || event.RemainSeconds || 0)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== 事件统计组件 ====================

interface EventStatsProps {
  events: GameEvent[];
}

const EventStats: React.FC<EventStatsProps> = ({ events }) => {
  // 按类型统计
  const statsByType: Record<number, number> = {};
  events.forEach(e => {
    const type = e.ObjType || e.EventType || 0;
    statsByType[type] = (statsByType[type] || 0) + 1;
  });

  return (
    <div className="event-stats-container">
      <div className="event-stat-item">
        <span className="stat-icon">📋</span>
        <span className="stat-value">{events.length}</span>
        <span className="stat-label">进行中</span>
      </div>
      {Object.entries(statsByType).map(([type, count]) => {
        const typeNum = parseInt(type);
        return (
          <div key={type} className="event-stat-item">
            <span className="stat-icon">{EVENT_TYPE_ICONS[typeNum] || '📋'}</span>
            <span className="stat-value">{count}</span>
            <span className="stat-label">{EVENT_TYPE_NAMES[typeNum] || '其他'}</span>
          </div>
        );
      })}
    </div>
  );
};

// ==================== 主面板组件 ====================

interface EventPanelProps {
  cityId?: number;
}

export const EventPanel: React.FC<EventPanelProps> = ({ cityId }) => {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'map' | 'stats'>('list');
  const [filterType, setFilterType] = useState<number | null>(null);

  // 加载事件数据
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [validEvents, listEvents] = await Promise.all([
        fetchValidEvents(),
        fetchEventList(cityId),
      ]);
      // 合并有效事件（去重）
      const allEvents = [...validEvents];
      listEvents.forEach(e => {
        if (!allEvents.find(a => a.ID === e.ID)) {
          allEvents.push(e);
        }
      });
      setEvents(allEvents.filter(e => e.ID !== -1));
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [cityId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // 过滤后的事件
  const filteredEvents = filterType !== null
    ? events.filter(e => (e.ObjType || e.EventType) === filterType)
    : events;

  // 按剩余时间排序
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const aTime = a.RemainTime || a.RemainSeconds || 0;
    const bTime = b.RemainTime || b.RemainSeconds || 0;
    return aTime - bTime;
  });

  // 处理事件移除
  const handleEventCancel = (eventId: number) => {
    setEvents(prev => prev.filter(e => e.ID !== eventId));
  };

  const handleEventSpeedup = (eventId: number) => {
    setEvents(prev => prev.filter(e => e.ID !== eventId));
  };

  // 渲染内容
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="event-loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">加载事件中...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="event-error">
          <div className="error-icon">❌</div>
          <div className="error-message">{error}</div>
          <button className="event-action-btn" onClick={loadEvents}>
            🔄 重试
          </button>
        </div>
      );
    }

    if (sortedEvents.length === 0) {
      return (
        <div className="event-empty">
          <div className="empty-icon">📭</div>
          <div className="empty-title">暂无进行中的事件</div>
          <div className="empty-text">
            建造建筑、研究科技、训练部队等操作将在这里显示
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'map':
        return <EventMap events={sortedEvents} />;
      case 'stats':
        return <EventStats events={sortedEvents} />;
      default:
        return (
          <div className="event-list">
            {sortedEvents.map(event => (
              <EventCard
                key={event.ID}
                event={event}
                onCancel={handleEventCancel}
                onSpeedup={handleEventSpeedup}
                onRefresh={loadEvents}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="event-panel">
      {/* 面板头部 */}
      <div className="event-panel-header">
        <div className="event-panel-title">
          <h2>📋 事件队列</h2>
          <span className="event-count-badge">
            {events.length} 个事件
          </span>
        </div>
        <button 
          className="event-refresh-btn"
          onClick={loadEvents}
          disabled={isLoading}
        >
          🔄
        </button>
      </div>

      {/* 标签页切换 */}
      <div className="event-tabs">
        <button
          className={`event-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📋 列表
        </button>
        <button
          className={`event-tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          🗺️ 地图
        </button>
        <button
          className={`event-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 统计
        </button>
      </div>

      {/* 过滤器 */}
      {activeTab === 'list' && events.length > 0 && (
        <div className="event-filter">
          <button
            className={`filter-btn ${filterType === null ? 'active' : ''}`}
            onClick={() => setFilterType(null)}
          >
            全部
          </button>
          {Object.entries(EVENT_TYPE_NAMES).map(([type, name]) => (
            <button
              key={type}
              className={`filter-btn ${filterType === parseInt(type) ? 'active' : ''}`}
              onClick={() => setFilterType(parseInt(type))}
            >
              {EVENT_TYPE_ICONS[parseInt(type)]} {name}
            </button>
          ))}
        </div>
      )}

      {/* 内容区域 */}
      <div className="event-panel-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default EventPanel;
