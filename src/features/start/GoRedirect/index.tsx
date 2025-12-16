/**
 * /go/:exchange 跳转页面
 * 直接跳转到后端 API，由后端记录埋点并 302 到交易所
 */

import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

const GoRedirect: React.FC = () => {
  const { exchange } = useParams<{ exchange: string }>();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!exchange) {
      window.location.href = '/start';
      return;
    }

    // 构建后端跳转 URL，带上 UTM 参数
    const params = new URLSearchParams();
    const utm_source = searchParams.get('utm_source');
    const utm_medium = searchParams.get('utm_medium');
    const utm_campaign = searchParams.get('utm_campaign');
    const utm_content = searchParams.get('utm_content');
    const utm_term = searchParams.get('utm_term');

    if (utm_source) params.set('utm_source', utm_source);
    if (utm_medium) params.set('utm_medium', utm_medium);
    if (utm_campaign) params.set('utm_campaign', utm_campaign);
    if (utm_content) params.set('utm_content', utm_content);
    if (utm_term) params.set('utm_term', utm_term);

    const queryString = params.toString();
    const redirectUrl = `https://core.free-node.xyz/go/${exchange}${queryString ? '?' + queryString : ''}`;

    // 直接跳转到后端
    window.location.href = redirectUrl;
  }, [exchange, searchParams]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#000',
        color: '#00ff41',
        fontFamily: 'Courier New, monospace',
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '20px' }}>🚀</div>
      <div>正在跳转到 {exchange?.toUpperCase()}...</div>
      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>
        Redirecting...
      </div>
    </div>
  );
};

export default GoRedirect;
