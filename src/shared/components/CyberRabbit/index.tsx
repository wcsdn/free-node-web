import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { getTranslation } from '@/config/i18n/translations';
import './styles.css';

type RabbitStyle = 'classic' | 'geometric' | 'minimal' | 'hacker';

const CyberRabbit: React.FC = React.memo(() => {
  const { language } = useLanguage();
  const [currentStyle, setCurrentStyle] = useState<RabbitStyle>('hacker');
  const hasAnimated = useRef(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // 只在首次挂载时触发动画
  useEffect(() => {
    if (!hasAnimated.current) {
      setShouldAnimate(true);
      hasAnimated.current = true;
    }
  }, []);

  const nextStyle = () => {
    const styles: RabbitStyle[] = ['classic', 'geometric', 'minimal', 'hacker'];
    const currentIndex = styles.indexOf(currentStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    setCurrentStyle(styles[nextIndex]);
  };

  const renderRabbit = () => {
    switch (currentStyle) {
      case 'classic':
        return renderClassicRabbit();
      case 'geometric':
        return renderGeometricRabbit();
      case 'minimal':
        return renderMinimalRabbit();
      case 'hacker':
        return renderHackerRabbit();
      default:
        return renderClassicRabbit();
    }
  };

  // 经典风格 - 圆润可爱
  const renderClassicRabbit = () => (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" className="cyber-rabbit-svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <path d="M 70 60 Q 65 20, 60 10 Q 58 5, 62 8 Q 68 25, 72 55" stroke="#00ff00" strokeWidth="2" fill="none" className="rabbit-ear left-ear" filter="url(#glow)"/>
      <path d="M 130 60 Q 135 20, 140 10 Q 142 5, 138 8 Q 132 25, 128 55" stroke="#00ff00" strokeWidth="2" fill="none" className="rabbit-ear right-ear" filter="url(#glow)"/>
      <ellipse cx="100" cy="80" rx="35" ry="40" stroke="#00ff00" strokeWidth="2" fill="rgba(0, 255, 0, 0.05)" className="rabbit-head" filter="url(#glow)"/>
      <circle cx="88" cy="75" r="4" fill="#00ff00" className="rabbit-eye" filter="url(#glow)">
        <animate attributeName="opacity" values="1;0.3;1" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="112" cy="75" r="4" fill="#00ff00" className="rabbit-eye" filter="url(#glow)">
        <animate attributeName="opacity" values="1;0.3;1" dur="3s" repeatCount="indefinite"/>
      </circle>
      <path d="M 100 85 L 97 90 L 103 90 Z" fill="#00ff00" filter="url(#glow)"/>
      <path d="M 97 92 Q 100 95, 103 92" stroke="#00ff00" strokeWidth="1.5" fill="none" filter="url(#glow)"/>
      <ellipse cx="100" cy="140" rx="40" ry="50" stroke="#00ff00" strokeWidth="2" fill="rgba(0, 255, 0, 0.03)" className="rabbit-body" filter="url(#glow)"/>
      <path d="M 70 130 Q 50 140, 45 155" stroke="#00ff00" strokeWidth="2" fill="none" className="rabbit-arm left-arm" filter="url(#glow)"/>
      <path d="M 130 130 Q 150 140, 155 155" stroke="#00ff00" strokeWidth="2" fill="none" className="rabbit-arm right-arm" filter="url(#glow)"/>
      <circle cx="100" cy="185" r="8" stroke="#00ff00" strokeWidth="2" fill="rgba(0, 255, 0, 0.1)" className="rabbit-tail" filter="url(#glow)"/>
    </svg>
  );

  // 几何风格 - 棱角分明
  const renderGeometricRabbit = () => (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" className="cyber-rabbit-svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <polygon points="70,60 65,10 75,10" stroke="#00ff00" strokeWidth="2" fill="rgba(0, 255, 0, 0.05)" className="rabbit-ear left-ear" filter="url(#glow)"/>
      <polygon points="130,60 125,10 135,10" stroke="#00ff00" strokeWidth="2" fill="rgba(0, 255, 0, 0.05)" className="rabbit-ear right-ear" filter="url(#glow)"/>
      <polygon points="70,60 130,60 135,100 65,100" stroke="#00ff00" strokeWidth="2" fill="rgba(0, 255, 0, 0.05)" className="rabbit-head" filter="url(#glow)"/>
      <rect x="85" y="72" width="6" height="6" fill="#00ff00" className="rabbit-eye" filter="url(#glow)">
        <animate attributeName="opacity" values="1;0.3;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="109" y="72" width="6" height="6" fill="#00ff00" className="rabbit-eye" filter="url(#glow)">
        <animate attributeName="opacity" values="1;0.3;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <polygon points="100,88 95,93 105,93" fill="#00ff00" filter="url(#glow)"/>
      <polygon points="65,100 135,100 125,180 75,180" stroke="#00ff00" strokeWidth="2" fill="rgba(0, 255, 0, 0.03)" className="rabbit-body" filter="url(#glow)"/>
      <line x1="65" y1="120" x2="45" y2="150" stroke="#00ff00" strokeWidth="3" className="rabbit-arm left-arm" filter="url(#glow)"/>
      <line x1="135" y1="120" x2="155" y2="150" stroke="#00ff00" strokeWidth="3" className="rabbit-arm right-arm" filter="url(#glow)"/>
      <polygon points="100,180 95,190 105,190" stroke="#00ff00" strokeWidth="2" fill="rgba(0, 255, 0, 0.1)" className="rabbit-tail" filter="url(#glow)"/>
      <line x1="40" y1="100" x2="160" y2="100" stroke="#00ff00" strokeWidth="0.5" opacity="0.3">
        <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2s" repeatCount="indefinite"/>
      </line>
    </svg>
  );

  // 极简风格 - 线条艺术
  const renderMinimalRabbit = () => (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" className="cyber-rabbit-svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <path d="M 75 70 L 70 20 M 70 20 L 65 70" stroke="#00ff00" strokeWidth="2" className="rabbit-ear left-ear" filter="url(#glow)"/>
      <path d="M 125 70 L 130 20 M 130 20 L 135 70" stroke="#00ff00" strokeWidth="2" className="rabbit-ear right-ear" filter="url(#glow)"/>
      <circle cx="100" cy="90" r="30" stroke="#00ff00" strokeWidth="2" fill="none" className="rabbit-head" filter="url(#glow)"/>
      <circle cx="90" cy="85" r="3" fill="#00ff00" className="rabbit-eye" filter="url(#glow)">
        <animate attributeName="r" values="3;1;3" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="110" cy="85" r="3" fill="#00ff00" className="rabbit-eye" filter="url(#glow)">
        <animate attributeName="r" values="3;1;3" dur="3s" repeatCount="indefinite"/>
      </circle>
      <line x1="100" y1="95" x2="100" y2="100" stroke="#00ff00" strokeWidth="2" filter="url(#glow)"/>
      <path d="M 95 102 Q 100 105, 105 102" stroke="#00ff00" strokeWidth="1.5" fill="none" filter="url(#glow)"/>
      <ellipse cx="100" cy="150" rx="35" ry="45" stroke="#00ff00" strokeWidth="2" fill="none" className="rabbit-body" filter="url(#glow)"/>
      <path d="M 75 135 L 50 155" stroke="#00ff00" strokeWidth="2" className="rabbit-arm left-arm" filter="url(#glow)"/>
      <path d="M 125 135 L 150 155" stroke="#00ff00" strokeWidth="2" className="rabbit-arm right-arm" filter="url(#glow)"/>
      <circle cx="100" cy="190" r="5" stroke="#00ff00" strokeWidth="2" fill="none" className="rabbit-tail" filter="url(#glow)"/>
    </svg>
  );

  // 黑客风格 - 代码感
  const renderHackerRabbit = () => (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" className="cyber-rabbit-svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <path d="M 75 65 L 70 15 L 65 15 L 70 65 Z" stroke="#00ff00" strokeWidth="1" fill="rgba(0, 255, 0, 0.1)" filter="url(#glow)">
        <animateTransform attributeName="transform" type="rotate" values="0 70 65; -5 70 65; 0 70 65; 5 70 65; 0 70 65" dur="3s" repeatCount="indefinite"/>
      </path>
      <path d="M 125 65 L 130 15 L 135 15 L 130 65 Z" stroke="#00ff00" strokeWidth="1" fill="rgba(0, 255, 0, 0.1)" filter="url(#glow)">
        <animateTransform attributeName="transform" type="rotate" values="0 130 65; 5 130 65; 0 130 65; -5 130 65; 0 130 65" dur="3s" repeatCount="indefinite"/>
      </path>
      <rect x="70" y="65" width="60" height="50" rx="5" stroke="#00ff00" strokeWidth="2" fill="rgba(0, 255, 0, 0.05)" filter="url(#glow)"/>
      <text x="85" y="90" fill="#00ff00" fontSize="20" fontFamily="monospace" filter="url(#glow)">
        <animate attributeName="opacity" values="1;0.3;1" dur="3s" repeatCount="indefinite"/>
        &gt;
      </text>
      <text x="105" y="90" fill="#00ff00" fontSize="20" fontFamily="monospace" filter="url(#glow)">
        <animate attributeName="opacity" values="1;0.3;1" dur="3s" repeatCount="indefinite"/>
        _
      </text>
      <line x1="90" y1="100" x2="110" y2="100" stroke="#00ff00" strokeWidth="2" filter="url(#glow)"/>
      <rect x="65" y="115" width="70" height="70" rx="5" stroke="#00ff00" strokeWidth="2" fill="rgba(0, 255, 0, 0.03)" filter="url(#glow)"/>
      
      {/* 红色爱心在胸口 - 往右移 */}
      <path d="M 112 132 L 109 129 Q 106 126 103 129 Q 100 132 103 135 L 112 144 L 121 135 Q 124 132 121 129 Q 118 126 115 129 Z" 
            fill="#ff0000" 
            stroke="#ff3333" 
            strokeWidth="0.8"
            opacity="0.8">
        <animate attributeName="opacity" values="0.6;0.85;0.6" dur="1.8s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" 
                          type="scale" 
                          values="1;1.04;1" 
                          dur="1.8s" 
                          repeatCount="indefinite"
                          additive="sum"/>
      </path>
      
      <line x1="65" y1="135" x2="40" y2="160" stroke="#00ff00" strokeWidth="3" strokeDasharray="5,5" filter="url(#glow)">
        <animate attributeName="x2" values="40;35;40;45;40" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="160;155;160;155;160" dur="2s" repeatCount="indefinite"/>
      </line>
      <line x1="135" y1="135" x2="160" y2="160" stroke="#00ff00" strokeWidth="3" strokeDasharray="5,5" filter="url(#glow)">
        <animate attributeName="x2" values="160;165;160;155;160" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="160;155;160;155;160" dur="2s" repeatCount="indefinite"/>
      </line>
      <rect x="95" y="185" width="10" height="10" stroke="#00ff00" strokeWidth="2" fill="rgba(0, 255, 0, 0.1)" filter="url(#glow)"/>
      <text x="75" y="145" fill="#00ff00" fontSize="8" fontFamily="monospace" opacity="0.5">01010</text>
      <text x="75" y="160" fill="#00ff00" fontSize="8" fontFamily="monospace" opacity="0.5">11001</text>
      <text x="75" y="175" fill="#00ff00" fontSize="8" fontFamily="monospace" opacity="0.5">10110</text>
    </svg>
  );

  const getStyleName = () => {
    switch (currentStyle) {
      case 'classic': return getTranslation(language, 'classic');
      case 'geometric': return getTranslation(language, 'geometric');
      case 'minimal': return getTranslation(language, 'minimal');
      case 'hacker': return getTranslation(language, 'hacker');
      default: return '';
    }
  };

  return (
    <div className={`cyber-rabbit-container${shouldAnimate ? ' animate-in' : ''}`}>
      {renderRabbit()}
      
      <div className="rabbit-text">
        <span className="glitch-text" data-text="Follow me...">Follow me...</span>
      </div>

      <button className="rabbit-switch-btn" onClick={nextStyle}>
        [ {getTranslation(language, 'switchStyle')} {getStyleName()} ]
      </button>
    </div>
  );
});

export default CyberRabbit;
