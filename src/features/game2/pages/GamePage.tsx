/**
 * 游戏2 - 主游戏页面
 * React 重构版本的剑侠情缘游戏界面
 * 
 * 手机优先响应式布局：
 * - 桌面端：左侧面板导航
 * - 手机端：底部 TabBar 导航
 */
import React, { useState, useEffect } from 'react';
import { useGameData } from '../hooks/useGameData';
import { useGameTimer } from '../hooks/useGameTimer';
import { DashboardPanel, CityPanel, HeroPanel, BuildingPanel, DefensePanel, BattlePanel, MapPanel, TradePanel, HelpPage, MailPanel, RankPanel, TaskPanel, ArenaPanel, MarketPanel, WarfarePanel, TechPanel, ItemPanel, SigninPanel, GiftCodePanel, EventPanel, SettingsPanel, LoadingPage } from '../components';
import { ToastProvider } from '../components/common';
import { ErrorBoundary } from '../components/common';
import { PopupProvider } from '../components/Popup/PopupManager';
import type { PanelType } from '../types';

import '../styles/index.css';

// 面板导航配置
const panelNavItems: { type: PanelType; icon: string; label: string }[] = [
  { type: 'dashboard', icon: '📊', label: '仪表盘' },
  { type: 'city', icon: '🏰', label: '城市' },
  { type: 'hero', icon: '⚔️', label: '武将' },
  { type: 'building', icon: '🏗️', label: '建筑' },
  { type: 'defense', icon: '🛡️', label: '防御' },
  { type: 'arena', icon: '⚔️', label: '竞技场' },
  { type: 'mail', icon: '📧', label: '邮件' },
  { type: 'rank', icon: '🏆', label: '排行榜' },
  { type: 'task', icon: '📋', label: '任务' },
  { type: 'warfare', icon: '🎖️', label: '战役' },
  { type: 'battle', icon: '🎯', label: '战斗' },
  { type: 'tech', icon: '🔬', label: '科技' },
  { type: 'map', icon: '🗺️', label: '地图' },
  { type: 'market', icon: '🏪', label: '市场' },
  { type: 'trade', icon: '💱', label: '交易' },
  { type: 'item', icon: '🎒', label: '背包' },
  { type: 'signin', icon: '📝', label: '签到' },
  { type: 'giftcode', icon: '🎁', label: '礼包' },
  { type: 'event', icon: '📋', label: '事件' },
  { type: 'help', icon: '📖', label: '帮助' },
];

// 移动端常用导航项（精简版，底部 TabBar 显示）
const mobileNavItems: { type: PanelType; icon: string; label: string }[] = [
  { type: 'dashboard', icon: '📊', label: '首页' },
  { type: 'city', icon: '🏰', label: '城市' },
  { type: 'hero', icon: '⚔️', label: '武将' },
  { type: 'building', icon: '🏗️', label: '建筑' },
  { type: 'battle', icon: '🎯', label: '战斗' },
  { type: 'signin', icon: '📝', label: '签到' },
  { type: 'market', icon: '🏪', label: '市场' },
  { type: 'giftcode', icon: '🎁', label: '礼包' },
  { type: 'item', icon: '🎒', label: '背包' },
  { type: 'event', icon: '📋', label: '事件' },
];

// 响应式导航组件
interface ResponsiveNavProps {
  activePanel: PanelType;
  onPanelChange: (panel: PanelType) => void;
  isMobile: boolean;
}

const ResponsiveNav: React.FC<ResponsiveNavProps> = ({ activePanel, onPanelChange, isMobile }) => {
  const navItems = isMobile ? mobileNavItems : panelNavItems;
  
  if (isMobile) {
    // 手机端：底部 TabBar
    return (
      <div className="panel-nav">
        {navItems.map(item => (
          <div
            key={item.type}
            className={`panel-nav-item ${activePanel === item.type ? 'active' : ''}`}
            onClick={() => onPanelChange(item.type)}
            title={item.label}
          >
            <span className="panel-nav-icon">{item.icon}</span>
            <span className="panel-nav-label">{item.label}</span>
          </div>
        ))}
      </div>
    );
  }
  
  // 桌面端：左侧面板
  return (
    <div className="panel-nav">
      {navItems.map(item => (
        <div
          key={item.type}
          className={`panel-nav-item ${activePanel === item.type ? 'active' : ''}`}
          onClick={() => onPanelChange(item.type)}
          title={item.label}
        >
          {item.icon}
        </div>
      ))}
    </div>
  );
};

// 渲染当前面板
const renderPanel = (
  activePanel: PanelType,
  gameState: any,
  upgradeBuilding: any,
  setActivePanel: (panel: PanelType) => void,
  timerState?: any,
  formattedServerTime?: string,
  settingsProps?: any,
  refreshData?: () => Promise<void>
) => {
  switch (activePanel) {
    case 'dashboard':
      return <DashboardPanel gameState={gameState} onPanelChange={setActivePanel} timerState={timerState} formattedServerTime={formattedServerTime} />;
    case 'city':
      return <CityPanel city={gameState.city} />;
    case 'hero':
      return <HeroPanel heroes={gameState.heroes} />;
    case 'building':
      return <BuildingPanel 
        buildings={gameState.buildings} 
        onUpgrade={upgradeBuilding}
      />;
    case 'defense':
      return <DefensePanel cityId={gameState.city?.id ?? 1} />;
    case 'arena':
      return <ArenaPanel />;
    case 'mail':
      return <MailPanel />;
    case 'rank':
      return <RankPanel />;
    case 'task':
      return <TaskPanel cityId={gameState.city?.id ?? 0} />;
    case 'warfare':
      return <WarfarePanel cityId={gameState.city?.id} />;
    case 'battle':
      return <BattlePanel />;
    case 'tech':
      return <TechPanel cityId={gameState.city?.id} />;
    case 'map':
      return <MapPanel cityId={gameState.city?.id} />;
    case 'market':
      return <MarketPanel cityId={gameState.city?.id} />;
    case 'trade':
      return <TradePanel cityId={gameState.city?.id} />;
    case 'item':
      return <ItemPanel cityId={gameState.city?.id} />;
    case 'signin':
      return <SigninPanel onRefresh={refreshData} />;
    case 'giftcode':
      return <GiftCodePanel />;
    case 'event':
      return <EventPanel cityId={gameState.city?.id} />;
    case 'settings':
      return <SettingsPanel {...settingsProps} />;
    case 'help':
      return <HelpPage />;
    default:
      return <DashboardPanel gameState={gameState} onPanelChange={setActivePanel} timerState={timerState} formattedServerTime={formattedServerTime} activePanel={activePanel} />;
  }
};

// 游戏页面主体（需要 useToast）
const GamePageContent: React.FC = () => {
  const { gameState, isLoading, error, upgradeBuilding, refreshData, cityId } = useGameData();
  const { timerState, formattedServerTime, activeEventCount, eventQueueCount } = useGameTimer(cityId);
  const [activePanel, setActivePanel] = useState<PanelType>('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);

  // 如果正在加载，显示加载页面
  if (isLoading) {
    return <LoadingPage />;
  }

  // 退出登录处理
  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  // 设置面板参数
  const settingsProps = {
    walletAddress: '',
    playerName: gameState.playerName || '游客',
    cityLevel: gameState.city?.level || 1,
    serverName: '测试服务器',
    onlineCount: 1000,
    soundEnabled,
    musicEnabled,
    onSoundChange: setSoundEnabled,
    onMusicChange: setMusicEnabled,
    onLogout: handleLogout,
    onGoToSignin: () => setActivePanel('signin'),
    onGoToGiftCode: () => setActivePanel('giftcode'),
    onClose: () => setActivePanel('dashboard'),
  };

  // 检测是否是手机屏幕
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // 初始检测
    checkMobile();
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (error) {
    return (
      <div className="game2-container">
        <div className="game2-error">
          <div className="error-icon">❌</div>
          <div className="error-message">{error}</div>
          <button 
            className="building-action"
            onClick={refreshData}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="game2-container">
        {/* 顶部栏 */}
        <div className="game2-header">
          <div className="game2-header-left">
            <div className="game2-logo">🗡️ 剑侠情缘</div>
            <div className="game2-player-info">
              <span className="game2-player-name">{gameState.playerName}</span>
            </div>
          </div>

          <div className="game2-header-right">
            {/* 服务器时间 & 事件状态 */}
            <div className="game-timer-bar">
              <span className="server-time">
                <span className="timer-icon">🕐</span>
                <span className="timer-value">{formattedServerTime}</span>
              </span>
              <span className="timer-divider">|</span>
              <span className="event-badge" title="进行中的事件">
                <span className="event-icon">📋</span>
                <span className="event-count">{activeEventCount}</span>
                <span className="event-label">事件</span>
              </span>
              <span className="queue-badge" title="可用事件队列">
                <span className="queue-icon">📥</span>
                <span className="queue-count">{eventQueueCount}</span>
                <span className="queue-label">队列</span>
              </span>
            </div>

            {/* 资源栏 */}
            <div className="resource-bar">
              <div className="resource-item resource-gold">
                <span className="resource-icon">💰</span>
                <span className="resource-value">{gameState.resources.gold.toLocaleString()}</span>
              </div>
              <div className="resource-item resource-food">
                <span className="resource-icon">🌾</span>
                <span className="resource-value">{gameState.resources.food.toLocaleString()}</span>
              </div>
              <div className="resource-item resource-wood">
                <span className="resource-icon">🪵</span>
                <span className="resource-value">{gameState.resources.wood.toLocaleString()}</span>
              </div>
              <div className="resource-item resource-stone">
                <span className="resource-icon">🪨</span>
                <span className="resource-value">{gameState.resources.stone.toLocaleString()}</span>
              </div>
              <div className="resource-item resource-iron">
                <span className="resource-icon">⚙️</span>
                <span className="resource-value">{gameState.resources.iron.toLocaleString()}</span>
              </div>
            </div>

            {/* 刷新按钮 */}
            <button 
              className="building-action"
              onClick={refreshData}
              style={{ background: '#60a5fa' }}
            >
              🔄 刷新
            </button>

            {/* 设置按钮 */}
            <button 
              className="settings-btn"
              onClick={() => setActivePanel('settings')}
              title="设置"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="game2-main">
          {/* 响应式导航 */}
          <ResponsiveNav 
            activePanel={activePanel} 
            onPanelChange={setActivePanel}
            isMobile={isMobile}
          />

          {/* 内容区域 */}
          <div className="game2-content">
            <ErrorBoundary fallback={
              <div className="error-boundary">
                <div className="error-boundary-content">
                  <div className="error-boundary-icon">⚠️</div>
                  <h2 className="error-boundary-title">面板加载失败</h2>
                  <p className="error-boundary-message">该面板发生了错误，请尝试切换其他面板</p>
                  <button className="error-boundary-reset" onClick={() => setActivePanel('dashboard')}>
                    返回首页
                  </button>
                </div>
              </div>
            }>
              {renderPanel(activePanel, gameState, upgradeBuilding, setActivePanel, timerState, formattedServerTime, settingsProps, refreshData)}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

// 带 ToastProvider 和 PopupProvider 的包装组件
const GamePage: React.FC = () => {
  return (
    <ToastProvider>
      <PopupProvider>
        <GamePageContent />
      </PopupProvider>
    </ToastProvider>
  );
};

export default GamePage;
