import React from 'react';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { useSound } from '../../shared/contexts/SoundContext';
import { useSoundEffect } from '../../shared/hooks/useSoundEffect';
import './styles.css';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { language, setLanguage } = useLanguage();
  const { soundEnabled, ambientEnabled, toggleSound, toggleAmbient } = useSound();
  const { playClick } = useSoundEffect();

  const handleLanguageToggle = () => {
    playClick();
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const handleSoundToggle = () => {
    playClick();
    toggleSound();
  };

  const handleAmbientToggle = () => {
    playClick();
    toggleAmbient();
  };

  return (
    <div className="settings-modal">
      <div className="settings-modal-header">
        <h2 className="settings-modal-title">
          {language === 'en' ? '> SETTINGS' : '> 设置'}
        </h2>
        <button onClick={onClose} className="settings-modal-close">
          [ X ]
        </button>
      </div>
      <div className="settings-modal-content">
        <div className="setting-item">
          <span className="setting-label">
            {language === 'en' ? 'Language' : '语言'}
          </span>
          <button onClick={handleLanguageToggle} className="setting-toggle">
            {language === 'en' ? 'EN' : '中文'}
          </button>
        </div>
        <div className="setting-item">
          <span className="setting-label">
            {language === 'en' ? 'Sound Effects' : '音效'}
          </span>
          <button onClick={handleSoundToggle} className={`setting-toggle ${soundEnabled ? 'active' : ''}`}>
            {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="setting-item">
          <span className="setting-label">
            {language === 'en' ? 'Ambient Sound' : '环境音'}
          </span>
          <button onClick={handleAmbientToggle} className={`setting-toggle ${ambientEnabled ? 'active' : ''}`}>
            {ambientEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
