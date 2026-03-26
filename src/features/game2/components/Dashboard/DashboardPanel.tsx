/**
 * 仪表盘面板 - 增强版
 */
import React, { useMemo } from 'react';
import type { GameState, PanelType } from '../../types';
import type { GameTimerState } from '../../hooks/useGameTimer';

interface DashboardPanelProps {
  gameState: GameState;
  onPanelChange: (panel: PanelType) => void;
  /** useGameTimer 的定时器状态（可选） */
  timerState?: GameTimerState;
  /** 格式化后的服务器时间 */
  formattedServerTime?: string;
  /** 当前面板（来自 GamePage） */
  activePanel?: PanelType;
}

// 面板入口配置
const PANEL_ENTRIES: { type: PanelType; icon: string; label: string; color: string }[] = [
  { type: 'hero', icon: '⚔️', label: '武将', color: '#ef4444' },
  { type: 'city', icon: '🏰', label: '城市', color: '#f59e0b' },
  { type: 'building', icon: '🏗️', label: '建筑', color: '#3b82f6' },
  { type: 'defense', icon: '🛡️', label: '防御', color: '#8b5cf6' },
  { type: 'arena', icon: '🎮', label: '竞技场', color: '#ec4899' },
  { type: 'mail', icon: '📧', label: '邮件', color: '#06b6d4' },
  { type: 'rank', icon: '🏆', label: '排行榜', color: '#eab308' },
  { type: 'task', icon: '📋', label: '任务', color: '#22c55e' },
  { type: 'warfare', icon: '🎖️', label: '战役', color: '#f97316' },
  { type: 'battle', icon: '🎯', label: '战斗', color: '#dc2626' },
  { type: 'tech', icon: '🔬', label: '科技', color: '#7c3aed' },
  { type: 'map', icon: '🗺️', label: '地图', color: '#14b8a6' },
  { type: 'market', icon: '🏪', label: '市场', color: '#f43f5e' },
  { type: 'trade', icon: '💱', label: '交易', color: '#0ea5e9' },
  { type: 'signin', icon: '📝', label: '签到', color: '#f97316' },
  { type: 'giftcode', icon: '🎁', label: '礼包', color: '#ec4899' },
  { type: 'help', icon: '📖', label: '帮助', color: '#64748b' },
];

export const DashboardPanel: React.FC<DashboardPanelProps> = ({
  gameState,
  onPanelChange,
  timerState,
  formattedServerTime,
  activePanel = null,
}) => {
  const { city, heroes, buildings, resources } = gameState;

  // 检测手机屏幕
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // 如果没有传入 activePanel，内部自己维护（兼容旧用法）
  const [internalActivePanel, setInternalActivePanel] = React.useState<PanelType | null>(null);
  // 内部状态优先（用户点击的面板入口），传入的 activePanel 仅用于提示横幅
  const currentPanel = internalActivePanel;

  // ============ 计算数据 ============

  // 计算武将战斗力总和
  const totalHeroPower = useMemo(
    () => heroes.reduce((sum, hero) => sum + hero.attack + hero.defense, 0),
    [heroes]
  );

  // 计算建筑等级总和
  const totalBuildingLevel = useMemo(
    () => buildings.reduce((sum, b) => sum + b.level, 0),
    [buildings]
  );

  // 统计各状态武将数量
  const heroStatusCount = useMemo(() => {
    return heroes.reduce((acc, hero) => {
      acc[hero.status] = (acc[hero.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [heroes]);

  // 驻守武将数量（defense 面板相关）
  const garrisonedHeroes = useMemo(
    () => heroes.filter(h => h.status === 'resting' || h.status === 'idle').length,
    [heroes]
  );

  // 资源产量估算（基于城市等级，每小时）
  const resourceProduction = useMemo(() => {
    const cityLvl = city.level || 1;
    return {
      gold: Math.floor(cityLvl * 120),      // 金币产量/小时
      food: Math.floor(cityLvl * 80),       // 粮食产量/小时
      wood: Math.floor(cityLvl * 60),       // 木材产量/小时
      stone: Math.floor(cityLvl * 40),      // 石料产量/小时
      iron: Math.floor(cityLvl * 30),       // 铁矿产量/小时
    };
  }, [city.level]);

  // 正在升级的建筑
  const upgradingBuildings = useMemo(
    () => buildings.filter(b => b.status === 'upgrading'),
    [buildings]
  );

  // ============ 工具函数 ============

  // 打开面板（同时通知父组件切换）
  const openPanel = (panel: PanelType) => {
    if (activePanel !== null) {
      // 外部控制模式
      onPanelChange(panel);
    } else {
      // 内部控制模式
      setInternalActivePanel(panel);
      onPanelChange(panel);
    }
  };

  // 切换到面板
  const switchToPanel = (panel: PanelType) => {
    onPanelChange(panel);
  };

  // 关闭面板
  const closePanel = () => {
    if (activePanel !== null) {
      onPanelChange('dashboard');
    } else {
      setInternalActivePanel(null);
    }
  };

  // 渲染活跃面板提示
  const renderActivePanelHint = () => {
    const entry = PANEL_ENTRIES.find(p => p.type === currentPanel);
    if (!entry || currentPanel === 'dashboard') return null;
    return (
      <div className="panel-open-hint" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 15px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '12px',
        marginBottom: '15px',
        border: `1px solid ${entry.color}40`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{entry.icon}</span>
          <span style={{ color: '#e2e8f0', fontSize: '14px' }}>
            已打开 <span style={{ color: entry.color, fontWeight: 600 }}>{entry.label}</span> 面板
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => switchToPanel(entry.type)}
            style={{
              background: entry.color,
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            前往 →
          </button>
          <button
            onClick={closePanel}
            style={{
              background: '#334155',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#94a3b8',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            关闭
          </button>
        </div>
      </div>
    );
  };

  // 渲染倒计时
  const renderCountdown = (seconds: number) => {
    if (seconds <= 0) return <span style={{ color: '#94a3b8' }}>--:--:--</span>;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return (
      <span style={{ color: '#4ade80', fontFamily: 'monospace' }}>
        {h > 0 ? `${h}时` : ''}{m.toString().padStart(2, '0')}分{s.toString().padStart(2, '0')}秒
      </span>
    );
  };

  // ============ 卡片样式 ============
  const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  };

  // 移动端卡片样式（更紧凑）
  const cardStyleMobile: React.CSSProperties = {
    ...cardStyle,
    padding: '14px',
  };

  // 根据屏幕返回卡片样式（可合并额外样式）
  const getCardStyle = (extra?: React.CSSProperties): React.CSSProperties => {
    const base = isMobile ? cardStyleMobile : cardStyle;
    return extra ? { ...base, ...extra } : base;
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#87ceeb',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const infoItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  };

  const labelStyle: React.CSSProperties = {
    color: '#94a3b8',
    fontSize: '13px',
  };

  const valueStyle: React.CSSProperties = {
    color: '#e2e8f0',
    fontSize: '13px',
    fontWeight: 500,
  };

  return (
    <div className="dashboard-panel">
      {/* 面板打开提示 */}
      {renderActivePanelHint()}

      {/* 服务器时间 */}
      {formattedServerTime && (
        <div style={{
          gridColumn: '1 / -1',
          textAlign: 'center',
          padding: '8px 0',
          marginBottom: '4px',
        }}>
          <span style={{ color: '#64748b', fontSize: '12px' }}>
            🕐 服务器时间 {formattedServerTime}
          </span>
        </div>
      )}

      {/* 城市信息卡片 */}
      <div style={isMobile ? cardStyleMobile : cardStyle}>
        <div style={cardTitleStyle}>🏰 城市信息</div>
        <div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>城市名称</span>
            <span style={{ ...valueStyle, color: '#ffd700' }}>{city.name}</span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>城市等级</span>
            <span style={{ ...valueStyle, color: '#60a5fa' }}>Lv.{city.level}</span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>人口</span>
            <span style={valueStyle}>{city.population.toLocaleString()}</span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>建筑总数</span>
            <span style={valueStyle}>{buildings.length} 座</span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>建筑等级总和</span>
            <span style={valueStyle}>{totalBuildingLevel}</span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>驻守武将</span>
            <span style={{ ...valueStyle, color: '#4ade80' }}>{garrisonedHeroes} 名</span>
          </div>
        </div>
      </div>

      {/* 玩家信息卡片 */}
      <div style={getCardStyle()}>
        <div style={cardTitleStyle}>👤 玩家信息</div>
        <div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>玩家名称</span>
            <span style={{ ...valueStyle, color: '#e879f9' }}>{gameState.playerName}</span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>玩家等级</span>
            <span style={valueStyle}>Lv.{city.level}</span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>💰 元宝</span>
            <span style={{ ...valueStyle, color: '#ffd700' }}>
              {resources.gold.toLocaleString()}
            </span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>🌾 粮食</span>
            <span style={{ ...valueStyle, color: '#86efac' }}>
              {resources.food.toLocaleString()}
            </span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>📯 荣誉</span>
            <span style={valueStyle}>--</span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>🏠 帮派</span>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>未加入</span>
          </div>
        </div>
      </div>

      {/* 资源储备卡片 */}
      <div style={getCardStyle()}>
        <div style={cardTitleStyle}>💎 资源储备</div>
        <div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>💰 金币</span>
            <span style={{ ...valueStyle, color: '#ffd700' }}>
              {resources.gold.toLocaleString()}
            </span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>🌾 粮食</span>
            <span style={{ ...valueStyle, color: '#86efac' }}>
              {resources.food.toLocaleString()}
            </span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>🪵 木材</span>
            <span style={{ ...valueStyle, color: '#deb887' }}>
              {resources.wood.toLocaleString()}
            </span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>🪨 石料</span>
            <span style={{ ...valueStyle, color: '#c0c0c0' }}>
              {resources.stone.toLocaleString()}
            </span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>⚙️ 铁矿</span>
            <span style={{ ...valueStyle, color: '#b0c4de' }}>
              {resources.iron.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 资源产量卡片 */}
      <div style={getCardStyle({ background: 'rgba(74, 222, 128, 0.05)', borderColor: 'rgba(74, 222, 128, 0.2)' })}>
        <div style={{ ...cardTitleStyle, color: '#4ade80' }}>📈 资源产量 <span style={{ fontSize: '11px', color: '#64748b' }}>(每小时)</span></div>
        <div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>💰 金币</span>
            <span style={{ ...valueStyle, color: '#ffd700' }}>+{resourceProduction.gold}/时</span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>🌾 粮食</span>
            <span style={{ ...valueStyle, color: '#86efac' }}>+{resourceProduction.food}/时</span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>🪵 木材</span>
            <span style={{ ...valueStyle, color: '#deb887' }}>+{resourceProduction.wood}/时</span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>🪨 石料</span>
            <span style={{ ...valueStyle, color: '#c0c0c0' }}>+{resourceProduction.stone}/时</span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>⚙️ 铁矿</span>
            <span style={{ ...valueStyle, color: '#b0c4de' }}>+{resourceProduction.iron}/时</span>
          </div>
        </div>
      </div>

      {/* 武将信息卡片 */}
      <div style={getCardStyle()}>
        <div style={cardTitleStyle}>⚔️ 武将信息</div>
        <div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>武将总数</span>
            <span style={valueStyle}>{heroes.length} 名</span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>总战斗力</span>
            <span style={{ ...valueStyle, color: '#f97316' }}>{totalHeroPower.toLocaleString()}</span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>待命</span>
            <span style={{ ...valueStyle, color: '#4ade80' }}>
              {heroStatusCount.idle || 0} 名
            </span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>战斗中</span>
            <span style={{ ...valueStyle, color: '#ef4444' }}>
              {heroStatusCount.fighting || 0} 名
            </span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>休整中</span>
            <span style={{ ...valueStyle, color: '#facc15' }}>
              {heroStatusCount.resting || 0} 名
            </span>
          </div>
        </div>
      </div>

      {/* 进行中事件卡片 */}
      <div style={getCardStyle({ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.2)' })}>
        <div style={{ ...cardTitleStyle, color: '#818cf8' }}>⏱️ 进行中事件</div>
        <div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>事件队列</span>
            <span style={valueStyle}>
              {timerState?.eventQueueCount ?? 0} 个
            </span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>建筑升级</span>
            <span style={valueStyle}>
              {upgradingBuildings.length > 0
                ? upgradingBuildings.map(b => b.name).join('、')
                : '无'}
            </span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>升级队列</span>
            <span style={valueStyle}>
              {timerState?.buildingUpgrades.length ?? 0} 个
            </span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>研究队列</span>
            <span style={valueStyle}>
              {timerState?.researchQueue.length ?? 0} 个
            </span>
          </div>
          {timerState?.activeEvents.slice(0, 2).map((event, idx) => (
            <div key={idx} style={infoItemStyle}>
              <span style={labelStyle}>📍 {event.EventName}</span>
              {renderCountdown(event.RemainTime)}
            </div>
          ))}
        </div>
      </div>

      {/* 快捷操作卡片 */}
      <div style={{ ...getCardStyle(), gridColumn: '1 / -1' }}>
        <div style={cardTitleStyle}>⚡ 快捷操作</div>
        <div className="dashboard-quick-actions" style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
        }}>
          <button
            onClick={() => openPanel('signin')}
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)',
            }}
          >
            📝 每日签到
          </button>
          <button
            onClick={() => openPanel('giftcode')}
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)',
            }}
          >
            🎁 礼包兑换
          </button>
          <button
            onClick={() => openPanel('building')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            }}
          >
            🏗️ 建筑升级
          </button>
          <button
            onClick={() => openPanel('hero')}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
            }}
          >
            ⚔️ 武将招募
          </button>
          <button
            onClick={() => openPanel('market')}
            style={{
              background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(244, 63, 94, 0.3)',
            }}
          >
            🏪 市场交易
          </button>
          <button
            onClick={() => openPanel('tech')}
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
            }}
          >
            🔬 研究科技
          </button>
          <button
            onClick={() => openPanel('battle')}
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
            }}
          >
            🎯 发起进攻
          </button>
          <button
            onClick={() => openPanel('task')}
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
            }}
          >
            📋 领取任务
          </button>
        </div>
      </div>

      {/* 面板入口网格 */}
      <div style={getCardStyle({ gridColumn: '1 / -1' })}>
        <div style={cardTitleStyle}>📋 面板入口</div>
        <div className="panel-entry-grid">
          {PANEL_ENTRIES.map(entry => (
            <button
              key={entry.type}
              className={`panel-entry-btn ${currentPanel === entry.type ? 'active' : ''}`}
              onClick={() => openPanel(entry.type)}
              style={{ '--entry-color': entry.color } as React.CSSProperties}
            >
              <span className="panel-entry-icon">{entry.icon}</span>
              <span className="panel-entry-label">{entry.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPanel;
