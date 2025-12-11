import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSoundEffect } from '@/shared/hooks/useSoundEffect';
import UserPopup from '@/shared/popup/UserPopup';
import '@/styles/common-button.css';
import './styles.css';

export type ActionButtonType = 'profile' | 'news' | 'ghost-mail' | 'settings' | 'exchanges';

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
    path: '/settings',
  },
  exchanges: {
    icon: '🏦',
    title: 'Exchanges',
    path: '/exchanges',
  },
};

const ActionButton: React.FC<ActionButtonProps> = ({ type, position }) => {
  const navigate = useNavigate();
  const { playHover, playClick } = useSoundEffect();
  const config = BUTTON_CONFIG[type];
  const [showUserPanel, setShowUserPanel] = useState(false);

  const handleClick = () => {
    playClick();
    if (type === 'profile') {
      setShowUserPanel(true);
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
    </>
  );
};

export default ActionButton;
