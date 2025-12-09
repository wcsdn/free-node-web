/**
 * 路由配置
 * HomePage 始终挂载，其他页面作为覆盖层显示
 */
import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import App from '@/App';
import Loading from '@/shared/components/Loading';

// 懒加载页面组件（HomePage 不需要懒加载，因为始终挂载）
const NewsPage = lazy(() => import('@/features/news/NewsPage'));
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'));
const GhostMailPage = lazy(() => import('@/features/ghost-mail/GhostMailPage'));
const SettingsPage = lazy(() => import('@/features/settings'));

// 页面包装器 - 添加 Suspense
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<Loading />}>
    {children}
  </Suspense>
);

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'news',
        element: (
          <PageWrapper>
            <NewsPage />
          </PageWrapper>
        ),
      },
      {
        path: 'profile',
        element: (
          <PageWrapper>
            <ProfilePage />
          </PageWrapper>
        ),
      },
      {
        path: 'ghost-mail',
        element: (
          <PageWrapper>
            <GhostMailPage />
          </PageWrapper>
        ),
      },
      {
        path: 'settings',
        element: (
          <PageWrapper>
            <SettingsPage />
          </PageWrapper>
        ),
      },
    ],
  },
];
