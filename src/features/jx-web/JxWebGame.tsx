/**
 * 剑侠情缘 Web 游戏页面
 * 使用 iframe 加载原始 HTML/jQuery 游戏
 */
import React, { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useWalletAuth } from '@/shared/hooks/useWalletAuth';

// 开发模式配置
const DEV_MODE = import.meta.env.DEV;
// 强制开发模式 - 用于测试（生产环境也使用测试钱包）
const FORCE_DEV_MODE = true;

const DEV_TEST_ADDRESS = '0x1234567890123456789012345678901234567890';
const DEV_TEST_AUTH = `${DEV_TEST_ADDRESS}:test_signature`;

const JxWebGame: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { address } = useAccount();
  const { authHeader } = useWalletAuth();

  useEffect(() => {
    // 当 iframe 加载完成后，传递认证信息
    const handleIframeLoad = () => {
      if (iframeRef.current?.contentWindow) {
        // 强制开发模式：始终使用测试账号
        const walletAddress = (DEV_MODE || FORCE_DEV_MODE) ? DEV_TEST_ADDRESS : address;
        const auth = (DEV_MODE || FORCE_DEV_MODE) ? DEV_TEST_AUTH : authHeader;

        if (DEV_MODE || FORCE_DEV_MODE) {
          console.log('🔧 开发模式：使用测试账号', walletAddress);
        }

        // 向 iframe 传递钱包地址和认证信息
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'AUTH_INFO',
            walletAddress: walletAddress,
            authHeader: auth,
          },
          window.location.origin
        );
      }
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
      return () => iframe.removeEventListener('load', handleIframeLoad);
    }
  }, [address, authHeader]);

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      backgroundColor: '#000'
    }}>
      <iframe
        ref={iframeRef}
        src="/jx-web/index.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="剑侠情缘Web"
      />
    </div>
  );
};

export default JxWebGame;
