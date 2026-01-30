/**
 * 路由配置
 * HomePage 始终挂载，其他页面作为覆盖层显示
 */
import React, { lazy, Suspense, useEffect } from 'react';
import { RouteObject, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useWalletAuth } from '@/shared/hooks/useWalletAuth';
import App from '@/App';
import Loading from '@/shared/components/Loading';

// 懒加载页面组件（HomePage 不需要懒加载，因为始终挂载）
const NewsPage = lazy(() => import('@/features/news/NewsPage'));
const GhostMailPage = lazy(() => import('@/features/ghost-mail/GhostMailPage'));
const QuestsPage = lazy(() => import('@/features/quests/QuestsPage'));
const ExchangesPage = lazy(() => import('@/features/exchanges/ExchangesPage'));
const StartPage = lazy(() => import('@/features/start/StartPage'));
const GoRedirect = lazy(() => import('@/features/start/GoRedirect'));
const DebugPage = lazy(() => import('@/features/debug/DebugPage'));
const IotPage = lazy(() => import('@/features/iot/IotPage'));
const AlphaTerminal = lazy(() => import('@/features/alpha/AlphaTerminal'));
const SituationMonitorPage = lazy(() => import('@/features/situation-monitor/SituationMonitorPage'));

// 页面包装器 - 添加 Suspense
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<Loading />}>
    {children}
  </Suspense>
);

// 受保护路由 - 需要登录和签名
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { authHeader, authenticate } = useWalletAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = React.useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // 1. 检查是否连接钱包
      if (!isConnected) {
        openConnectModal?.();
        navigate('/');
        return;
      }

      // 2. 如果已有 authHeader，直接通过
      if (authHeader) {
        setChecking(false);
        return;
      }

      // 3. 未认证，触发签名
      const success = await authenticate();
      if (!success) {
        navigate('/');
        return;
      }

      setChecking(false);
    };

    if (checking) {
      checkAuth();
    }
  }, [isConnected, authHeader, checking, openConnectModal, authenticate, navigate]);

  if (!isConnected || checking) return null;
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
      {
        path: 'start',
        element: (
          <PageWrapper>
            <StartPage />
          </PageWrapper>
        ),
      },
      {
        path: 'go/:exchange',
        element: (
          <PageWrapper>
            <GoRedirect />
          </PageWrapper>
        ),
      },
      {
        path: 'debug',
        element: (
          <PageWrapper>
            <DebugPage />
          </PageWrapper>
        ),
      },
      {
        path: 'iot-monitor',
        element: (
          <PageWrapper>
            <IotPage />
          </PageWrapper>
        ),
      },
      {
        path: 'alpha',
        element: (
          <PageWrapper>
            <AlphaTerminal />
          </PageWrapper>
        ),
      },
      {
        path: 'situation-monitor',
        element: (
          <PageWrapper>
            <SituationMonitorPage />
          </PageWrapper>
        ),
      },
    ],
  },
];
