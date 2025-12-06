import React from 'react';
import { useSoundEffect } from '../../hooks/useSoundEffect';
import '../common-button.css';
import './styles.css';

interface GhostMailButtonProps {
  onClick: () => void;
}

const GhostMailButton: React.FC<GhostMailButtonProps> = ({ onClick }) => {
  const { playHover, playClick } = useSoundEffect();

  const handleClick = () => {
    playClick();
    onClick();
  };

  return (
    <div className="ghost-mail-button-container">
      <button
        className="cyber-button ghost-mail-btn"
        onClick={handleClick}
        onMouseEnter={playHover}
        title="Ghost Mail"
      >
        📧
      </button>
    </div>
  );
};

export default GhostMailButton;
