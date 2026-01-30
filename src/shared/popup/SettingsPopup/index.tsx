/**
 * SettingsPopup - 设置弹窗
 * 使用 Portal + Backdrop 模式
 */
import React from 'react';
import { createPortal } from 'react-dom';
import Backdrop from '@/shared/components/Backdrop';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useAppStore } from '@/stores/useAppStore';
import { useSoundEffect } from '@/shared/hooks/useSoundEffect';
import './styles.css';

interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPopup: React.FC<SettingsPopupProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage } = useLanguage();
  const isZh = language === 'zh';
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const ambientEnabled = useAppStore((state) => state.ambientEnabled);
  const showPerformanceMonitor = useAppStore((state) => state.showPerformanceMonitor);
  const globeStyle = useAppStore((state) => state.globeStyle);
  const matrixRainEnabled = useAppStore((state) => state.matrixRainEnabled);
  const toggleSound = useAppStore((state) => state.toggleSound);
  const toggleAmbient = useAppStore((state) => state.toggleAmbient);
  const togglePerformanceMonitor = useAppStore((state) => state.togglePerformanceMonitor);
  const toggleGlobeStyle = useAppStore((state) => state.toggleGlobeStyle);
  const toggleMatrixRain = useAppStore((state) => state.toggleMatrixRain);
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

  const handlePerfMonitorToggle = () => {
    playClick();
    togglePerformanceMonitor();
  };

  const handleGlobeStyleToggle = () => {
    playClick();
    toggleGlobeStyle();
  };

  const handleMatrixRainToggle = () => {
    playClick();
    toggleMatrixRain();
  };

  return isOpen ? createPortal(
    <>
      <Backdrop onClick={onClose} zIndex={799} />
      <div className="settings-popup" onClick={e => e.stopPropagation()}>
        <div className="settings-popup-header">
          <span className="settings-popup-title">⚙️ {isZh ? '设置' : 'Settings'}</span>
          <button className="settings-popup-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-popup-content">
          <div className="setting-item">
            <span className="setting-label">
              {isZh ? '语言' : 'Language'}
            </span>
            <button onClick={handleLanguageToggle} className="setting-toggle">
              {language === 'en' ? 'EN' : '中文'}
            </button>
          </div>

          <div className="setting-item">
            <span className="setting-label">
              {isZh ? '音效' : 'Sound Effects'}
            </span>
            <button
              onClick={handleSoundToggle}
              className={`setting-toggle ${soundEnabled ? 'active' : ''}`}
            >
              {soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="setting-item">
            <span className="setting-label">
              {isZh ? '环境音' : 'Ambient Sound'}
            </span>
            <button
              onClick={handleAmbientToggle}
              className={`setting-toggle ${ambientEnabled ? 'active' : ''}`}
            >
              {ambientEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="setting-item">
            <span className="setting-label">
              {isZh ? 'FPS 监控' : 'FPS Monitor'}
            </span>
            <button
              onClick={handlePerfMonitorToggle}
              className={`setting-toggle ${showPerformanceMonitor ? 'active' : ''}`}
            >
              {showPerformanceMonitor ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="setting-item">
            <span className="setting-label">
              {isZh ? '地球样式' : 'Globe Style'}
            </span>
            <button
              onClick={handleGlobeStyleToggle}
              className={`setting-toggle ${globeStyle === 'realistic' ? 'active' : ''}`}
            >
              {globeStyle === 'realistic' ? (isZh ? '真实' : 'Real') : (isZh ? '暗黑' : 'Dark')}
            </button>
          </div>

          <div className="setting-item">
            <span className="setting-label">
              {isZh ? '字母雨' : 'Matrix Rain'}
            </span>
            <button
              onClick={handleMatrixRainToggle}
              className={`setting-toggle ${matrixRainEnabled ? 'active' : ''}`}
            >
              {matrixRainEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  ) : null;
};

export default SettingsPopup;
