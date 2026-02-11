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
const JxWebGame = lazy(() => import('@/features/jx-web/JxWebGame'));

// 页面包装器 - 添加 Suspense
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<Loading />}>
    {children}
  </Suspense>
);

// 开发模式配置
const DEV_MODE = import.meta.env.DEV; // Vite 开发模式
const DEV_TEST_ADDRESS = '0x1234567890123456789012345678901234567890';
const DEV_TEST_AUTH = `${DEV_TEST_ADDRESS}:dev_signature`;

// 受保护路由 - 需要登录和签名
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { authHeader, authenticate, isSigning } = useWalletAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = React.useState(true);
  const [authFailed, setAuthFailed] = React.useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // 开发模式：跳过认证检查
      if (DEV_MODE) {
        console.log('🔧 开发模式：跳过钱包认证');
        setChecking(false);
        setAuthFailed(false);
        return;
      }

      // 1. 检查是否连接钱包
      if (!isConnected) {
        openConnectModal?.();
        navigate('/');
        return;
      }

      // 2. 如果已有 authHeader，直接通过
      if (authHeader) {
        setChecking(false);
        setAuthFailed(false);
        return;
      }

      // 3. 未认证，触发签名
      const success = await authenticate();
      if (!success) {
        setAuthFailed(true);
        setChecking(false);
        return;
      }

      setChecking(false);
      setAuthFailed(false);
    };

    if (checking) {
      checkAuth();
    }
  }, [isConnected, authHeader, checking, openConnectModal, authenticate, navigate]);

  // 开发模式：直接通过
  if (DEV_MODE && !checking) {
    return <>{children}</>;
  }

  // 显示加载状态
  if (!isConnected || (checking && !authFailed)) {
    return null;
  }

  // 认证失败，显示重试按钮
  if (authFailed && !authHeader) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        color: '#fff',
        zIndex: 9999,
      }}>
        <h2 style={{ marginBottom: '20px' }}>需要签名认证</h2>
        <p style={{ marginBottom: '30px', opacity: 0.7 }}>
          请签名以验证您的钱包地址
        </p>
        <button
          onClick={async () => {
            setChecking(true);
            setAuthFailed(false);
          }}
          disabled={isSigning}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: isSigning ? 'not-allowed' : 'pointer',
            opacity: isSigning ? 0.6 : 1,
          }}
        >
          {isSigning ? '签名中...' : '重新签名'}
        </button>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '15px',
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: 'transparent',
            color: '#999',
            border: '1px solid #666',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          返回首页
        </button>
      </div>
    );
  }

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
      {
        path: 'jxweb',
        element: (
          <PageWrapper>
            <ProtectedRoute>
              <JxWebGame />
            </ProtectedRoute>
          </PageWrapper>
        ),
      },
    ],
  },
];
