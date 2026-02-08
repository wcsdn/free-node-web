/**
 * CityView 测试页面
 * 路径: /jxweb/city
 */
import React from 'react';
import { CityView } from '@/features/webgame/components';

const TestWallet = '0x1234567890abcdef1234567890abcdef12345678';

const CityTestPage: React.FC = () => {
  return (
    <div style={{ 
      background: '#000', 
      minHeight: '100vh',
      padding: '20px' 
    }}>
      <CityView walletAddress={TestWallet} cityId={1} />
    </div>
  );
};

export default CityTestPage;
