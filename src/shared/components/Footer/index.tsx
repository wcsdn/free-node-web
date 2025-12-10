import React from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import './styles.css';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  // 根据屏幕宽度调整分隔线长度
  const [dividerLength, setDividerLength] = React.useState(50);

  React.useEffect(() => {
    const updateDividerLength = () => {
      const width = window.innerWidth;
      if (width <= 480) {
        setDividerLength(20);
      } else if (width <= 768) {
        setDividerLength(35);
      } else {
        setDividerLength(50);
      }
    };

    updateDividerLength();
    window.addEventListener('resize', updateDividerLength);
    return () => window.removeEventListener('resize', updateDividerLength);
  }, []);

  return (
    <footer className="site-footer">
      <div className="footer-divider">
        <span>{'═'.repeat(dividerLength)}</span>
      </div>
      <div className="footer-content">
        {/* 网站信息 */}
        <div className="footer-section">
          <h3 className="footer-title">
            {t('freeNode')}
          </h3>
          <p className="footer-description">
            {t('footerDescription')}
          </p>
        </div>

        {/* 快速链接 - 移动端隐藏 */}
        <div className="footer-section footer-hide-mobile">
          <h4 className="footer-subtitle">
            {t('quickLinks')}
          </h4>
          <ul className="footer-links">
            <li>
              <a href="https://github.com/wcsdn/free-node-web" target="_blank" rel="noopener noreferrer">
                {t('github')}
              </a>
            </li>
            <li>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                {t('twitter')}
              </a>
            </li>
            <li>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer">
                {t('discord')}
              </a>
            </li>
          </ul>
        </div>

        {/* 法律信息 - 移动端隐藏 */}
        <div className="footer-section footer-hide-mobile">
          <h4 className="footer-subtitle">
            {t('legal')}
          </h4>
          <ul className="footer-links">
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); alert(t('termsOfService')); }}>
                {t('termsOfService')}
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); alert(t('privacyPolicy')); }}>
                {t('privacyPolicy')}
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); alert(t('disclaimer')); }}>
                {t('disclaimer')}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* 免责声明 - 移动端简化 */}
      <div className="footer-disclaimer">
        <p className="footer-disclaimer-full">
          {t('disclaimerFull')}
        </p>
        <p className="footer-disclaimer-short">
          {t('disclaimerShort')}
        </p>
      </div>

      {/* 版权信息 */}
      <div className="footer-bottom">
        <p className="footer-copyright">
          © {currentYear} Free Node. {t('allRightsReserved')}
        </p>
        <p className="footer-tech">
          {t('builtWith')}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
