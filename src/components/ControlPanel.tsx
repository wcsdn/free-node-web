import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSound } from '../contexts/SoundContext';
import { playClickSound } from '../utils/soundEffects';
import './ControlPanel.css';

const ControlPanel: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { soundEnabled, ambientEnabled, toggleSound, toggleAmbient } = useSound();

  const toggleLanguage = () => {
    if (soundEnabled) playClickSound();
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const handleSoundToggle = () => {
    if (soundEnabled) playClickSound();
    toggleSound();
  };

  const handleAmbientToggle = () => {
    if (soundEnabled) playClickSound();
    toggleAmbient();
  };

  return (
    <div className="control-panel">
      <button 
        className="control-btn"
        onClick={handleSoundToggle}
        title={soundEnabled ? 'Sound: ON' : 'Sound: OFF'}
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      <button 
        className="control-btn"
        onClick={handleAmbientToggle}
        title={ambientEnabled ? 'Ambient: ON' : 'Ambient: OFF'}
        disabled={!soundEnabled}
      >
        🎵
      </button>
      <button
        className="control-btn"
        onClick={toggleLanguage}
        title={language === 'en' ? 'Switch to Chinese' : '切换到英文'}
      >
        {language === 'en' ? 'EN' : '中'}
      </button>
    </div>
  );
};

export default ControlPanel;
