/**
 * 主页内容组件
 */
import React, { memo, lazy, Suspense } from 'react';
import { useAccount } from 'wagmi';
import Loading from '@/shared/components/Loading';

// 懒加载组件
const VipContent = lazy(() => import('@/features/web3/components/VipContent'));
const DonateButton = lazy(() => import('@/features/donation/components/DonateButton'));
const Guestbook = lazy(() => import('@/features/guestbook/components/Guestbook'));

export const HomeContent: React.FC = memo(() => {
  const { isConnected } = useAccount();

  return (
    <Suspense fallback={<Loading />}>
      {/* VIP 内容（仅连接钱包后显示） */}
      {isConnected && <VipContent />}

      {/* 捐赠按钮（仅连接钱包后显示） */}
      {isConnected && <DonateButton />}

      {/* 留言板 */}
      <Guestbook />
    </Suspense>
  );
});

HomeContent.displayName = 'HomeContent';
