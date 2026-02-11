/**
 * 剑侠情缘 Web 游戏页面
 * 使用 iframe 加载原始 HTML/jQuery 游戏
 */
import React, { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useWalletAuth } from '@/shared/hooks/useWalletAuth';

const JxWebGame: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { address } = useAccount();
  const { authHeader } = useWalletAuth();

  useEffect(() => {
    // 当 iframe 加载完成后，传递认证信息
    const handleIframeLoad = () => {
      if (iframeRef.current?.contentWindow) {
        // 向 iframe 传递钱包地址和认证信息
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'AUTH_INFO',
            walletAddress: address,
            authHeader: authHeader,
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
