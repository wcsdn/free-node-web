import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './styles.css';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="language-switcher">
      <button
        className="lang-btn active"
        onClick={toggleLanguage}
        title={language === 'en' ? 'Switch to Chinese' : '切换到英文'}
      >
        {language === 'en' ? 'EN' : '中'}
      </button>
    </div>
  );
};

export default LanguageSwitcher;
