/**
 * 路由配置
 * HomePage 始终挂载，其他页面作为覆盖层显示
 */
import React, { lazy, Suspense, useEffect } from 'react';
import { RouteObject, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import App from '@/App';
import Loading from '@/shared/components/Loading';

// 懒加载页面组件（HomePage 不需要懒加载，因为始终挂载）
const NewsPage = lazy(() => import('@/features/news/NewsPage'));
// const ProfilePage = lazy(() => import('@/features/profile/ProfilePage')); // 暂时下架，改用 UserPanel 弹窗
const GhostMailPage = lazy(() => import('@/features/ghost-mail/GhostMailPage'));
const QuestsPage = lazy(() => import('@/features/quests/QuestsPage'));
// const SettingsPage = lazy(() => import('@/features/settings')); // 改为弹窗模式
const ExchangesPage = lazy(() => import('@/features/exchanges/ExchangesPage'));

// 页面包装器 - 添加 Suspense
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<Loading />}>
    {children}
  </Suspense>
);

// 受保护路由 - 需要登录
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected) {
      openConnectModal?.();
      navigate('/');
    }
  }, [isConnected, openConnectModal, navigate]);

  if (!isConnected) return null;
  return <>{children}</>;
};

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
      // {
      //   path: 'profile',
      //   element: (
      //     <PageWrapper>
      //       <ProfilePage />
      //     </PageWrapper>
      //   ),
      // },
      {
        path: 'ghost-mail',
        element: (
          <PageWrapper>
            <GhostMailPage />
          </PageWrapper>
        ),
      },
      {
        path: 'quests',
        element: (
          <PageWrapper>
            <ProtectedRoute>
              <QuestsPage />
            </ProtectedRoute>
          </PageWrapper>
        ),
      },
      // settings 改为弹窗模式，不再需要路由
      {
        path: 'exchanges',
        element: (
          <PageWrapper>
            <ExchangesPage />
          </PageWrapper>
        ),
      },
    ],
  },
];
