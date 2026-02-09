import React, { useState } from 'react';
import { CityView } from '@/features/webgame/components';

const TestWallet = '0x1234567890abcdef1234567890abcdef12345678';

const GameUIPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState('city');
  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '80px 20px 20px' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#000', borderBottom: '1px solid #0f0', padding: '10px 20px', display: 'flex', gap: '8px', zIndex: 1000 }}>
        <button onClick={() => setActiveTab('city')} style={{ padding: '8px 16px', background: activeTab === 'city' ? '#0f0' : '#333', border: '1px solid #0f0', color: activeTab === 'city' ? '#000' : '#0f0' }}>City</button>
      </div>
      {activeTab === 'city' && <CityView walletAddress={TestWallet} />}
    </div>
  );
};

export default GameUIPreview;
