import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSound } from '../contexts/SoundContext';
import { playClickSound } from '../utils/soundEffects';
import './SettingsPanel.css';

const SettingsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { soundEnabled, ambientEnabled, toggleSound, toggleAmbient } = useSound();

  const togglePanel = () => {
    if (soundEnabled) playClickSound();
    setIsOpen(!isOpen);
  };

  const handleLanguageToggle = () => {
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
    <div className="settings-panel">
      <button 
        className="settings-btn"
        onClick={togglePanel}
        title="Settings"
      >
        ⚙
      </button>
      
      {isOpen && (
        <>
          <div className="settings-backdrop" onClick={togglePanel} />
          <div className="settings-menu">
            <div className="settings-header">
              <span className="settings-title">SYSTEM CONFIG</span>
              <button className="settings-close" onClick={togglePanel}>[ X ]</button>
            </div>
            
            <div className="settings-content">
              <div className="setting-item">
                <span className="setting-label">LANG / 语言</span>
                <button 
                  className={`setting-toggle ${language === 'en' ? 'active' : ''}`}
                  onClick={handleLanguageToggle}
                >
                  {language === 'en' ? 'EN' : 'ZH'}
                </button>
              </div>
              
              <div className="setting-item">
                <span className="setting-label">SFX / 音效</span>
                <button 
                  className={`setting-toggle ${soundEnabled ? 'active' : ''}`}
                  onClick={handleSoundToggle}
                >
                  {soundEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              
              <div className="setting-item">
                <span className="setting-label">AMB / 背景音</span>
                <button 
                  className={`setting-toggle ${ambientEnabled ? 'active' : ''}`}
                  onClick={handleAmbientToggle}
                  disabled={!soundEnabled}
                >
                  {ambientEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsPanel;
