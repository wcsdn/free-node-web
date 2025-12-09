import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSoundEffect } from '../../hooks/useSoundEffect';
import '../../../styles/common-button.css';
import './styles.css';

export type ActionButtonType = 'profile' | 'news' | 'ghost-mail' | 'settings';

interface ActionButtonProps {
  type: ActionButtonType;
  position: number;
}

const BUTTON_CONFIG = {
  profile: {
    icon: '👤',
    title: 'Profile',
    path: '/profile',
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
};

const ActionButton: React.FC<ActionButtonProps> = ({ type, position }) => {
  const navigate = useNavigate();
  const { playHover, playClick } = useSoundEffect();
  const config = BUTTON_CONFIG[type];

  const handleClick = () => {
    playClick();
    navigate(config.path);
  };

  return (
    <div 
      className={`action-button-container action-button-pos-${position}`}
      data-type={type}
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
  );
};

export default ActionButton;
