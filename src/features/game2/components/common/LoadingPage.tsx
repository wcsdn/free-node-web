/**
 * 剑侠风格加载页面
 */
import React from 'react';

const GAME_VERSION = '1.0.0';

export const LoadingPage: React.FC = () => {
  return (
    <div className="loading-page">
      <div className="loading-content">
        {/* 剑侠风格 Logo */}
        <div className="loading-logo">
          <div className="sword-icon">⚔️</div>
          <div className="sword-glow" />
        </div>

        {/* 主标题 */}
        <h1 className="loading-title">剑侠情缘</h1>
        <p className="loading-subtitle">区块链版</p>

        {/* 加载动画区域 */}
        <div className="loading-animation">
          {/* 剑形加载指示器 */}
          <div className="sword-loader">
            <div className="sword-blade" />
            <div className="sword-handle" />
          </div>

          {/* 装饰性圆环 */}
          <div className="loading-ring loading-ring-1" />
          <div className="loading-ring loading-ring-2" />
          <div className="loading-ring loading-ring-3" />
        </div>

        {/* 加载文字 */}
        <p className="loading-text">正在加载游戏数据...</p>

        {/* 版本信息 */}
        <p className="loading-version">v{GAME_VERSION}</p>
      </div>

      <style>{`
        .loading-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a1628 100%);
          z-index: 9999;
          animation: loadingFadeIn 0.5s ease-out;
        }

        @keyframes loadingFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        /* Logo 区域 */
        .loading-logo {
          position: relative;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sword-icon {
          font-size: 60px;
          z-index: 2;
          animation: swordFloat 2s ease-in-out infinite;
        }

        @keyframes swordFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .sword-glow {
          position: absolute;
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          animation: glowPulse 2s ease-in-out infinite;
        }

        @keyframes glowPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0.8; }
        }

        /* 标题 */
        .loading-title {
          font-size: 36px;
          font-weight: bold;
          color: #ffd700;
          text-shadow: 0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3);
          margin: 0;
          letter-spacing: 8px;
        }

        .loading-subtitle {
          font-size: 14px;
          color: #87ceeb;
          margin: -10px 0 0 0;
          letter-spacing: 4px;
        }

        /* 加载动画区域 */
        .loading-animation {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
        }

        /* 剑形加载器 */
        .sword-loader {
          position: relative;
          width: 60px;
          height: 20px;
          animation: swordRotate 2s linear infinite;
        }

        @keyframes swordRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .sword-blade {
          position: absolute;
          left: 30px;
          top: 7px;
          width: 40px;
          height: 6px;
          background: linear-gradient(90deg, #c0c0c0 0%, #ffffff 50%, #c0c0c0 100%);
          border-radius: 2px 4px 4px 2px;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        .sword-handle {
          position: absolute;
          left: 10px;
          top: 5px;
          width: 25px;
          height: 10px;
          background: linear-gradient(90deg, #8b4513 0%, #a0522d 50%, #8b4513 100%);
          border-radius: 2px;
        }

        /* 装饰圆环 */
        .loading-ring {
          position: absolute;
          border: 2px solid transparent;
          border-radius: 50%;
        }

        .loading-ring-1 {
          width: 100px;
          height: 100px;
          border-top-color: rgba(255, 215, 0, 0.5);
          border-right-color: rgba(255, 215, 0, 0.3);
          animation: ringSpin 3s linear infinite;
        }

        .loading-ring-2 {
          width: 80px;
          height: 80px;
          border-top-color: rgba(135, 206, 235, 0.5);
          border-bottom-color: rgba(135, 206, 235, 0.3);
          animation: ringSpin 2s linear infinite reverse;
        }

        .loading-ring-3 {
          width: 60px;
          height: 60px;
          border-top-color: rgba(255, 255, 255, 0.4);
          animation: ringSpin 1.5s linear infinite;
        }

        @keyframes ringSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* 加载文字 */
        .loading-text {
          font-size: 16px;
          color: #94a3b8;
          margin: 0;
          animation: textPulse 1.5s ease-in-out infinite;
        }

        @keyframes textPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        /* 版本信息 */
        .loading-version {
          font-size: 12px;
          color: #475569;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default LoadingPage;
