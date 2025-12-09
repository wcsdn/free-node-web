/**
 * App 根组件
 * HomePage 始终挂载，其他页面作为覆盖层显示
 */
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import HomePage from './features/home/HomePage';
import GlobalModals from './shared/layouts/GlobalModals';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import PerformanceMonitor from './shared/components/PerformanceMonitor';
import './App.css';

const App: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <ErrorBoundary>
      {/* HomePage 始终挂载 */}
      <div className={`home-wrapper ${isHomePage ? 'active' : 'hidden'}`}>
        <HomePage />
      </div>

      {/* 其他页面作为覆盖层 */}
      {!isHomePage && <Outlet />}

      {/* 全局模态框 */}
      <GlobalModals />

      {/* 性能监控 */}
      <PerformanceMonitor />
    </ErrorBoundary>
  );
};

export default App;
