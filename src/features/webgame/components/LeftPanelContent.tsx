/**
 * 左面板内容组件（移动端专用）- 清新古风水墨风格
 * 只包含内容部分，不包含外层容器
 */
import React, { memo } from 'react';

interface LeftPanelContentProps {
  walletAddress: string;
  currentTime?: string;
}

const LeftPanelContent: React.FC<LeftPanelContentProps> = memo(({ walletAddress, currentTime = '00:00:00' }) => {
  return (
    <div style={{ 
      padding: '15px', 
      color: '#5d4037',
      background: '#faf8f5'
    }}>
      {/* Logo 区域 - 清新风格 */}
      <div style={{ 
        textAlign: 'center', 
        padding: '20px 0',
        borderBottom: '2px solid rgba(139, 69, 19, 0.15)',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, rgba(245, 222, 179, 0.2) 0%, rgba(255, 248, 220, 0.2) 100%)',
        borderRadius: '12px'
      }}>
        <div style={{
          fontSize: '32px',
          marginBottom: '8px'
        }}>⚔️</div>
        <h2 style={{ 
          color: '#8b4513', 
          margin: 0,
          fontSize: '22px',
          fontWeight: 'bold',
          letterSpacing: '3px'
        }}>剑侠情缘</h2>
        <p style={{
          margin: '5px 0 0 0',
          fontSize: '12px',
          color: 'rgba(139, 69, 19, 0.6)',
          letterSpacing: '2px'
        }}>Web Edition</p>
      </div>

      {/* 用户信息 - 清新卡片 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          color: '#8b4513', 
          borderBottom: '1px solid rgba(139, 69, 19, 0.15)',
          paddingBottom: '10px',
          marginBottom: '12px',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>👤 玩家信息</h3>
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(250, 248, 245, 0.8) 100%)', 
          padding: '14px', 
          borderRadius: '10px',
          marginBottom: '12px',
          border: '1.5px solid rgba(139, 69, 19, 0.15)',
          boxShadow: '0 2px 8px rgba(139, 69, 19, 0.08)'
        }}>
          <p style={{ margin: '8px 0', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(93, 64, 55, 0.7)' }}>账号:</span>
            <strong style={{ color: '#cd853f' }}>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</strong>
          </p>
          <p style={{ margin: '8px 0', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(93, 64, 55, 0.7)' }}>官位:</span>
            <strong style={{ color: '#cd853f' }}>0</strong>
          </p>
          <p style={{ margin: '8px 0', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(93, 64, 55, 0.7)' }}>帮派:</span>
            <strong>无</strong>
          </p>
          <p style={{ margin: '8px 0', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(93, 64, 55, 0.7)' }}>战勋:</span>
            <strong>0</strong>
          </p>
        </div>
      </div>

      {/* 快捷功能 - 清新按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          color: '#8b4513', 
          borderBottom: '1px solid rgba(139, 69, 19, 0.15)',
          paddingBottom: '10px',
          marginBottom: '12px',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>⚡ 快捷功能</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { icon: '🏠', text: '首页', action: () => window.location.reload() },
            { icon: '⚙️', text: '账户设置' },
            { icon: '💎', text: '充值元宝', special: true },
            { icon: '🎁', text: '礼品领取' },
            { icon: '📦', text: '没资源点我' },
            { icon: '💬', text: '论坛' }
          ].map((item, index) => (
            <button key={index} style={{
              padding: '12px 14px',
              background: item.special 
                ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(245, 222, 179, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(250, 248, 245, 0.8) 100%)',
              border: `1.5px solid ${item.special ? 'rgba(218, 165, 32, 0.3)' : 'rgba(139, 69, 19, 0.15)'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              color: item.special ? '#b8860b' : '#5d4037',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: item.special ? 'bold' : 'normal',
              transition: 'all 0.3s',
              boxShadow: '0 2px 6px rgba(139, 69, 19, 0.08)'
            }} onClick={item.action}>
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 服务器信息 - 清新卡片 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          color: '#8b4513', 
          borderBottom: '1px solid rgba(139, 69, 19, 0.15)',
          paddingBottom: '10px',
          marginBottom: '12px',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>🖥️ 服务器信息</h3>
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(250, 248, 245, 0.8) 100%)', 
          padding: '14px', 
          borderRadius: '10px',
          border: '1.5px solid rgba(139, 69, 19, 0.15)',
          boxShadow: '0 2px 8px rgba(139, 69, 19, 0.08)'
        }}>
          <p style={{ margin: '8px 0', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(93, 64, 55, 0.7)' }}>服务器:</span>
            <strong>测试服</strong>
          </p>
          <p style={{ margin: '8px 0', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(93, 64, 55, 0.7)' }}>在线玩家:</span>
            <strong style={{ color: '#4ade80' }}>1</strong>
          </p>
          <p style={{ margin: '8px 0', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(93, 64, 55, 0.7)' }}>服务器时间:</span>
            <strong style={{ color: '#60a5fa' }}>{currentTime}</strong>
          </p>
          <p style={{ margin: '8px 0', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(93, 64, 55, 0.7)' }}>服务器速度:</span>
            <strong>10</strong>
          </p>
          <p style={{ margin: '8px 0', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(93, 64, 55, 0.7)' }}>经验倍率:</span>
            <strong style={{ color: '#fbbf24' }}>1倍</strong>
          </p>
        </div>
      </div>

      {/* 退出按钮 - 清新风格 */}
      <button style={{
        width: '100%',
        padding: '14px',
        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(185, 28, 28, 0.15) 100%)',
        border: '1.5px solid rgba(220, 38, 38, 0.3)',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '15px',
        color: '#dc2626',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.3s',
        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)'
      }}>
        <span style={{ fontSize: '18px' }}>🚪</span>
        <span>退出游戏</span>
      </button>
    </div>
  );
});

LeftPanelContent.displayName = 'LeftPanelContent';

export default LeftPanelContent;
