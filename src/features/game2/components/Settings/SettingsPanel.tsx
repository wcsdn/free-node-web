/**
 * 设置面板
 */
import React, { useState } from 'react';

const GAME_VERSION = '1.0.0';
const GAME_INTRO = '剑侠情缘区块链版是一款基于区块链技术的SLG策略游戏，玩家可以建设城池、招募武将、与其他玩家进行战斗。';

interface SettingsPanelProps {
  walletAddress: string;
  playerName: string;
  cityLevel: number;
  serverName: string;
  onlineCount: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onSoundChange: (enabled: boolean) => void;
  onMusicChange: (enabled: boolean) => void;
  onLogout: () => void;
  onGoToSignin: () => void;
  onGoToGiftCode: () => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  walletAddress,
  playerName,
  cityLevel,
  serverName,
  onlineCount,
  soundEnabled,
  musicEnabled,
  onSoundChange,
  onMusicChange,
  onLogout,
  onGoToSignin,
  onGoToGiftCode,
  onClose,
}) => {
  const [confirmLogout, setConfirmLogout] = useState(false);

  // 格式化钱包地址为短格式
  const formatWalletAddress = (address: string): string => {
    if (!address) return '未连接';
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleLogout = () => {
    if (confirmLogout) {
      onLogout();
      setConfirmLogout(false);
    } else {
      setConfirmLogout(true);
      setTimeout(() => setConfirmLogout(false), 3000);
    }
  };

  return (
    <div className="settings-panel">
      {/* 头部 */}
      <div className="settings-header">
        <h2 className="settings-title">⚙️ 设置</h2>
        <button className="settings-close" onClick={onClose}>✕</button>
      </div>

      {/* 账号信息 */}
      <div className="settings-section">
        <div className="settings-section-title">👤 账号信息</div>
        <div className="settings-card">
          <div className="settings-row">
            <span className="settings-label">钱包地址</span>
            <span className="settings-value wallet-address">{formatWalletAddress(walletAddress)}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">玩家名称</span>
            <span className="settings-value">{playerName || '未登录'}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">城池等级</span>
            <span className="settings-value level-badge">Lv.{cityLevel}</span>
          </div>
        </div>
      </div>

      {/* 游戏设置 */}
      <div className="settings-section">
        <div className="settings-section-title">🎮 游戏设置</div>
        <div className="settings-card">
          <div className="settings-row settings-toggle">
            <span className="settings-label">🔊 音效</span>
            <button
              className={`toggle-btn ${soundEnabled ? 'active' : ''}`}
              onClick={() => onSoundChange(!soundEnabled)}
            >
              <span className="toggle-knob" />
            </button>
          </div>
          <div className="settings-row settings-toggle">
            <span className="settings-label">🎵 音乐</span>
            <button
              className={`toggle-btn ${musicEnabled ? 'active' : ''}`}
              onClick={() => onMusicChange(!musicEnabled)}
            >
              <span className="toggle-knob" />
            </button>
          </div>
        </div>
      </div>

      {/* 服务器信息 */}
      <div className="settings-section">
        <div className="settings-section-title">🖥️ 服务器信息</div>
        <div className="settings-card">
          <div className="settings-row">
            <span className="settings-label">服务器</span>
            <span className="settings-value server-name">{serverName}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">在线人数</span>
            <span className="settings-value online-count">
              <span className="online-dot" />
              {onlineCount.toLocaleString()} 人
            </span>
          </div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="settings-section">
        <div className="settings-section-title">📌 快捷入口</div>
        <div className="settings-card">
          <button className="settings-entry-btn" onClick={onGoToSignin}>
            <span className="entry-icon">📝</span>
            <span className="entry-label">每日签到</span>
            <span className="entry-arrow">›</span>
          </button>
          <button className="settings-entry-btn" onClick={onGoToGiftCode}>
            <span className="entry-icon">🎁</span>
            <span className="entry-label">礼包码兑换</span>
            <span className="entry-arrow">›</span>
          </button>
        </div>
      </div>

      {/* 关于 */}
      <div className="settings-section">
        <div className="settings-section-title">ℹ️ 关于</div>
        <div className="settings-card">
          <div className="settings-row">
            <span className="settings-label">版本号</span>
            <span className="settings-value version">v{GAME_VERSION}</span>
          </div>
          <div className="settings-intro">{GAME_INTRO}</div>
        </div>
      </div>

      {/* 退出登录 */}
      <div className="settings-section settings-footer">
        <button
          className={`logout-btn ${confirmLogout ? 'confirm' : ''}`}
          onClick={handleLogout}
        >
          {confirmLogout ? '⚠️ 确定退出登录？' : '🚪 退出登录'}
        </button>
      </div>

      <style>{`
        .settings-panel {
          padding: 15px;
          max-width: 500px;
          margin: 0 auto;
          color: #e2e8f0;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .settings-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          color: #f1f5f9;
        }

        .settings-close {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #94a3b8;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .settings-close:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .settings-section {
          margin-bottom: 20px;
        }

        .settings-section-title {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }

        .settings-card {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 12px;
          padding: 4px 0;
          border: 1px solid #334155;
        }

        .settings-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .settings-row:last-child {
          border-bottom: none;
        }

        .settings-label {
          font-size: 14px;
          color: #94a3b8;
        }

        .settings-value {
          font-size: 14px;
          font-weight: 500;
          color: #f1f5f9;
        }

        .wallet-address {
          font-family: 'Courier New', monospace;
          color: #87ceeb;
          background: rgba(135, 206, 235, 0.1);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 13px;
        }

        .level-badge {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: #fff;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }

        .server-name {
          color: #4ade80;
        }

        .online-count {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #4ade80;
        }

        .online-dot {
          width: 8px;
          height: 8px;
          background: #4ade80;
          border-radius: 50%;
          animation: onlinePulse 2s ease-in-out infinite;
        }

        @keyframes onlinePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .version {
          color: #94a3b8;
          font-size: 13px;
        }

        /* 开关按钮 */
        .settings-toggle {
          padding: 14px 16px;
        }

        .toggle-btn {
          width: 48px;
          height: 26px;
          border-radius: 13px;
          background: #334155;
          border: none;
          cursor: pointer;
          position: relative;
          transition: background 0.3s;
          padding: 0;
        }

        .toggle-btn.active {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        }

        .toggle-knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.3s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .toggle-btn.active .toggle-knob {
          transform: translateX(22px);
        }

        /* 快捷入口按钮 */
        .settings-entry-btn {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 14px 16px;
          background: none;
          border: none;
          color: #e2e8f0;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .settings-entry-btn:last-child {
          border-bottom: none;
        }

        .settings-entry-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .entry-icon {
          font-size: 18px;
          margin-right: 12px;
        }

        .entry-label {
          flex: 1;
        }

        .entry-arrow {
          font-size: 18px;
          color: #64748b;
        }

        /* 游戏介绍 */
        .settings-intro {
          padding: 12px 16px;
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        /* 退出登录按钮 */
        .settings-footer {
          margin-top: 30px;
        }

        .logout-btn {
          width: 100%;
          padding: 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .logout-btn.confirm {
          background: #ef4444;
          color: #fff;
          border-color: #ef4444;
          animation: confirmPulse 0.5s ease-in-out;
        }

        @keyframes confirmPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }

        /* ==================== 设置面板移动端适配 ==================== */
        @media (max-width: 768px) {
          .settings-panel {
            padding: 12px 8px;
            max-width: 100%;
          }

          .settings-title {
            font-size: 18px;
          }

          .settings-section {
            margin-bottom: 14px;
          }

          .settings-section-title {
            font-size: 12px;
            margin-bottom: 8px;
          }

          .settings-card {
            border-radius: 10px;
          }

          .settings-row {
            padding: 12px 14px;
          }

          .settings-label {
            font-size: 13px;
          }

          .settings-value {
            font-size: 13px;
          }

          .wallet-address {
            font-size: 11px;
            padding: 3px 8px;
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .settings-toggle {
            padding: 14px 14px;
          }

          .toggle-btn {
            width: 44px;
            height: 24px;
          }

          .toggle-knob {
            width: 18px;
            height: 18px;
          }

          .toggle-btn.active .toggle-knob {
            transform: translateX(20px);
          }

          .settings-entry-btn {
            padding: 14px 14px;
            font-size: 13px;
          }

          .entry-icon {
            font-size: 16px;
            margin-right: 10px;
          }

          .logout-btn {
            min-height: 48px;
            font-size: 14px;
            padding: 12px;
          }

          .settings-footer {
            margin-top: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default SettingsPanel;
