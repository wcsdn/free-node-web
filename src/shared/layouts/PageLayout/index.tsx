/**
 * 页面布局组件
 * 提供统一的页面背景和导航
 */
import React, { memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MatrixRain from '@/shared/components/MatrixRain';
import { useSoundEffect } from '@/shared/hooks/useSoundEffect';
import './styles.css';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = memo(({
  children,
  title,
  showBackButton = true,
}) => {
  const navigate = useNavigate();
  const { playClick } = useSoundEffect();

  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBack = () => {
    playClick();
    navigate('/');
  };

  return (
    <div className="page-layout">
      {/* 背景效果 */}
      <MatrixRain fontSize={16} />
      <div className="crt-scanline" />
      <div className="crt-noise" />

      {/* 页面内容 */}
      <div className="page-content">
        {/* 页面头部 - 标题在左，返回在右 */}
        <div className="page-header">
          {title && <h1 className="page-title">{title}</h1>}
          {showBackButton && (
            <button className="back-button" onClick={handleBack}>
              [ BACK ]
            </button>
          )}
        </div>

        {/* 页面主体 */}
        <div className="page-body">
          {children}
        </div>
      </div>
    </div>
  );
});

PageLayout.displayName = 'PageLayout';

export default PageLayout;
