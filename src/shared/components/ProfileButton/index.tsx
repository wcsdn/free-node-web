import React from 'react';
import { useSoundEffect } from '../../hooks/useSoundEffect';
import '../common-button.css';
import './styles.css';

interface ProfileButtonProps {
  onClick: () => void;
}

const ProfileButton: React.FC<ProfileButtonProps> = ({ onClick }) => {
  const { playHover, playClick } = useSoundEffect();

  const handleClick = () => {
    playClick();
    onClick();
  };

  return (
    <div className="profile-button-container">
      <button
        className="cyber-button profile-btn"
        onClick={handleClick}
        onMouseEnter={playHover}
        title="Profile"
      >
        👤
      </button>
    </div>
  );
};

export default ProfileButton;
