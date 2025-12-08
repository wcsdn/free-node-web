import React from 'react';
import { useSoundEffect } from '../../hooks/useSoundEffect';
import { useModal } from '../../contexts/ModalContext';
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
    action: 'profile' as const,
  },
  news: {
    icon: '📰',
    title: 'News',
    action: 'news' as const,
  },
  'ghost-mail': {
    icon: '📧',
    title: 'Ghost Mail',
    action: 'ghost-mail' as const,
  },
  settings: {
    icon: '⚙️',
    title: 'Settings',
    action: 'settings' as const,
  },
};

const ActionButton: React.FC<ActionButtonProps> = ({ type, position }) => {
  const { playHover, playClick } = useSoundEffect();
  const { openModal } = useModal();
  const config = BUTTON_CONFIG[type];

  const handleClick = () => {
    playClick();
    openModal(config.action);
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
