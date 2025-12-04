import React from 'react';
import { useSound } from '../contexts/SoundContext';
import { playClickSound } from '../utils/soundEffects';
import './SoundControl.css';

const SoundControl: React.FC = () => {
  const { soundEnabled, ambientEnabled, toggleSound, toggleAmbient } = useSound();

  const handleSoundToggle = () => {
    if (soundEnabled) {
      playClickSound();
    }
    toggleSound();
  };

  const handleAmbientToggle = () => {
    if (soundEnabled) {
      playClickSound();
    }
    toggleAmbient();
  };

  return (
    <div className="sound-control">
      <button 
        className={`sound-btn ${soundEnabled ? 'active' : ''}`}
        onClick={handleSoundToggle}
        title={soundEnabled ? 'Sound: ON' : 'Sound: OFF'}
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      <button 
        className={`sound-btn ambient-btn ${ambientEnabled ? 'active' : ''}`}
        onClick={handleAmbientToggle}
        title={ambientEnabled ? 'Ambient: ON' : 'Ambient: OFF'}
        disabled={!soundEnabled}
      >
        {ambientEnabled ? '🎵' : '🎵'}
      </button>
    </div>
  );
};

export default SoundControl;
