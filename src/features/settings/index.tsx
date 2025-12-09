/**
 * 设置页面
 */
import React from 'react';
import PageLayout from '@/shared/layouts/PageLayout';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useAppStore } from '@/stores/useAppStore';
import { useSoundEffect } from '@/shared/hooks/useSoundEffect';
import './styles.css';

const SettingsPage: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const ambientEnabled = useAppStore((state) => state.ambientEnabled);
  const showPerformanceMonitor = useAppStore((state) => state.showPerformanceMonitor);
  const toggleSound = useAppStore((state) => state.toggleSound);
  const toggleAmbient = useAppStore((state) => state.toggleAmbient);
  const togglePerformanceMonitor = useAppStore((state) => state.togglePerformanceMonitor);
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

  return (
    <PageLayout title={language === 'en' ? '> SETTINGS' : '> 设置'}>
      <div className="settings-content">
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
          <button
            onClick={handleSoundToggle}
            className={`setting-toggle ${soundEnabled ? 'active' : ''}`}
          >
            {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="setting-item">
          <span className="setting-label">
            {language === 'en' ? 'Ambient Sound' : '环境音'}
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
            {language === 'en' ? 'FPS Monitor' : 'FPS 监控'}
          </span>
          <button
            onClick={handlePerfMonitorToggle}
            className={`setting-toggle ${showPerformanceMonitor ? 'active' : ''}`}
          >
            {showPerformanceMonitor ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default SettingsPage;
