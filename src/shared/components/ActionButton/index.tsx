import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useSoundEffect } from '@/shared/hooks/useSoundEffect';
import UserPopup from '@/shared/popup/UserPopup';
import SettingsPopup from '@/shared/popup/SettingsPopup';
import '@/styles/common-button.css';
import './styles.css';

export type ActionButtonType = 'profile' | 'news' | 'ghost-mail' | 'settings' | 'exchanges' | 'debug' | 'start' | 'iot' | 'alpha' | 'situation-monitor' | 'webgame';

interface ActionButtonProps {
  type: ActionButtonType;
  position: number;
}

const BUTTON_CONFIG = {
  profile: {
    icon: '👤',
    title: 'User',
    path: null, // 不跳转，打开弹窗
  },
  news: {
    icon: '📰',
    title: 'News',
    path: '/news',
  },
  'ghost-mail': {
    icon: '📧',
    title: 'Ghost Mail',
    path: '/ghost-mail',
  },
  settings: {
    icon: '⚙️',
    title: 'Settings',
    path: null, // 不跳转，打开弹窗
  },
  exchanges: {
    icon: '🏦',
    title: 'Exchanges',
    path: '/exchanges',
  },
  debug: {
    icon: '🔍',
    title: 'Debug Auth',
    path: '/debug',
  },
  start: {
    icon: '🔥',
    title: 'Start',
    path: '/start',
  },
  iot: {
    icon: '📡',
    title: 'IoT Monitor',
    path: '/iot-monitor',
  },
  alpha: {
    icon: '🔮',
    title: 'Alpha Pulse',
    path: '/alpha',
  },
  'situation-monitor': {
    icon: '🌐',
    title: 'Ghost Intel',
    titleCn: '幽灵情报站',
    path: '/situation-monitor',
  },
  webgame: {
    icon: '🎮',
    title: 'Strategy Game',
    titleCn: '策略游戏',
    path: '/jxweb',
  },
};

// 需要登录才能访问的按钮类型
const REQUIRE_LOGIN: ActionButtonType[] = ['exchanges'];

const ActionButton: React.FC<ActionButtonProps> = ({ type, position }) => {
  const navigate = useNavigate();
  const { playHover, playClick } = useSoundEffect();
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const config = BUTTON_CONFIG[type];
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleClick = () => {
    playClick();
    
    // 检查是否需要登录
    if (REQUIRE_LOGIN.includes(type) && !isConnected) {
      openConnectModal?.();
      return;
    }
    
    if (type === 'profile') {
      setShowUserPanel(true);
    } else if (type === 'settings') {
      setShowSettings(true);
    } else if (config.path) {
      navigate(config.path);
    }
  };

  return (
    <>
      <div 
        className="action-button-container"
        data-type={type}
        style={{ '--btn-index': position } as React.CSSProperties}
      >
        <button
          className="cyber-button action-btn"
          onClick={handleClick}
          onMouseEnter={playHover}
          title={config.title}
        >
          {config.icon}
        </button>
      </div>
      
      {type === 'profile' && (
        <UserPopup isOpen={showUserPanel} onClose={() => setShowUserPanel(false)} />
      )}
      {type === 'settings' && (
        <SettingsPopup isOpen={showSettings} onClose={() => setShowSettings(false)} />
      )}
    </>
  );
};

export default ActionButton;
