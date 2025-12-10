/**
 * UserPanel - 用户信息面板
 * 
 * 显示用户等级、配额、邀请码等信息
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useWalletAuth } from '@/shared/hooks/useWalletAuth';
import { useToast } from '@/shared/components/Toast/ToastContext';
import Backdrop from '@/shared/components/Backdrop';
import './styles.css';

interface UserInfo {
  address: string | null;
  level: number;
  levelName: string;
  inviteCode: string | null;
  invitedBy: string | null;
  mailQuota: number;
  xp: number;
  xp_level: number;
  usage: {
    ai: { today: number; limit: number | 'unlimited' };
  };
}

// XP 等级阈值 (与后端保持一致)
const XP_LEVELS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

function getXpProgress(xp: number, level: number) {
  const currentThreshold = XP_LEVELS[level - 1] || 0;
  const nextThreshold = XP_LEVELS[level] || XP_LEVELS[XP_LEVELS.length - 1];
  if (level >= XP_LEVELS.length) return { next: nextThreshold, percent: 100 };
  const progress = xp - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  return { next: nextThreshold, percent: Math.min(100, Math.floor((progress / needed) * 100)) };
}

const LEVEL_NAMES = {
  zh: ['游客', '觉醒者', 'VIP'],
  en: ['Guest', 'Awakened', 'VIP'],
};

interface UserPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { authHeader, isAuthenticated, isSigning, authenticate } = useWalletAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // 跳转到任务页面
  const goToQuests = () => {
    onClose();
    navigate('/quests');
  };

  // 获取用户信息
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('https://core.free-node.xyz/api/user', {
          headers: authHeader ? { 'X-Wallet-Auth': authHeader } : {},
        });
        if (response.ok) {
          const data = await response.json();
          setUserInfo(data);
        }
      } catch (err) {
        console.error('Failed to fetch user info:', err);
      }
    };
    fetchUserInfo();
  }, [isOpen, authHeader]);

  // 复制邀请码 (兼容 HTTP 环境)
  const copyInviteCode = async () => {
    if (!userInfo?.inviteCode) return;
    const link = `${window.location.origin}?ref=${userInfo.inviteCode}`;
    
    try {
      // 优先使用 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        // 降级方案：创建临时 textarea
        const textarea = document.createElement('textarea');
        textarea.value = link;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showSuccess(language === 'zh' ? '邀请链接已复制' : 'Invite link copied');
    } catch {
      showError(language === 'zh' ? '复制失败' : 'Copy failed');
    }
  };



  const levelName = userInfo 
    ? (language === 'zh' ? LEVEL_NAMES.zh : LEVEL_NAMES.en)[userInfo.level]
    : '--';
  const remaining = userInfo?.usage?.ai
    ? userInfo.usage.ai.limit === 'unlimited' 
      ? '∞' 
      : Math.max(0, (userInfo.usage.ai.limit as number) - userInfo.usage.ai.today)
    : '--';

  return isOpen ? createPortal(
    <>
      <Backdrop onClick={onClose} zIndex={9998} />
      <div className="user-panel" onClick={(e) => e.stopPropagation()}>
        <div className="user-panel-header">
          <span className="user-panel-title">
            {language === 'zh' ? '用户信息' : 'User Info'}
          </span>
          <button className="user-panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="user-panel-body">
          {/* 身份信息 */}
          <div className="user-section">
            <div className="user-level-badge" data-level={userInfo?.level ?? 0}>
              {levelName}
            </div>
            {isConnected && address && (
              <div className="user-address">
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            )}
          </div>

          {/* XP 进度条 */}
          {userInfo && userInfo.xp !== undefined && (
            <div className="user-section">
              <div className="user-xp-bar">
                <div className="xp-bar-header">
                  <span>⚡ Lv.{userInfo.xp_level || 1}</span>
                  <span>{userInfo.xp} / {getXpProgress(userInfo.xp, userInfo.xp_level || 1).next}</span>
                </div>
                <div className="xp-bar-track">
                  <div 
                    className="xp-bar-fill" 
                    style={{ width: `${getXpProgress(userInfo.xp, userInfo.xp_level || 1).percent}%` }} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* 配额信息 */}
          <div className="user-section">
            <div className="user-stat">
              <span className="stat-label">🎯 {language === 'zh' ? '今日剩余' : 'Remaining'}</span>
              <span className="stat-value">{remaining}</span>
            </div>
            <div className="user-stat">
              <span className="stat-label">📧 {language === 'zh' ? '邮箱额度' : 'Mail Quota'}</span>
              <span className="stat-value">{userInfo?.mailQuota ?? 0}</span>
            </div>
          </div>

          {/* 任务中心入口 */}
          <div className="user-section">
            <button className="user-btn quests-btn" onClick={goToQuests}>
              📋 {language === 'zh' ? '任务中心' : 'Quest Center'}
            </button>
          </div>

          {/* 未连接钱包 */}
          {!isConnected && (
            <div className="user-section user-action">
              <p className="action-hint">
                {language === 'zh' ? '连接钱包解锁更多功能' : 'Connect wallet for more features'}
              </p>
              <button className="user-btn primary" onClick={openConnectModal}>
                🔗 {language === 'zh' ? '连接钱包' : 'Connect Wallet'}
              </button>
            </div>
          )}

          {/* 已连接但未认证 */}
          {isConnected && !isAuthenticated && (
            <div className="user-section user-action">
              <p className="action-hint">
                {language === 'zh' ? '签名认证升级为觉醒者' : 'Verify to become Awakened'}
              </p>
              <button 
                className="user-btn primary" 
                onClick={authenticate}
                disabled={isSigning}
              >
                🔐 {isSigning ? '...' : (language === 'zh' ? '签名认证' : 'Verify')}
              </button>
            </div>
          )}

          {/* 已认证 - 显示邀请码 */}
          {isAuthenticated && userInfo?.inviteCode && (
            <div className="user-section">
              <div className="invite-section">
                <span className="invite-label">
                  🎫 {language === 'zh' ? '我的邀请码' : 'My Invite Code'}
                </span>
                <div className="invite-code-row">
                  <code className="invite-code">{userInfo.inviteCode}</code>
                  <button className="copy-btn" onClick={copyInviteCode}>
                    📋
                  </button>
                </div>
                <p className="invite-hint">
                  {language === 'zh' 
                    ? '邀请好友注册，双方各得 +2 邮箱额度' 
                    : 'Invite friends, both get +2 mail quota'}
                </p>
              </div>
            </div>
          )}

          {/* 已绑定邀请人 (静默自动绑定) */}
          {userInfo?.invitedBy && (
            <div className="user-section">
              <div className="invited-by">
                ✅ {language === 'zh' ? '已绑定邀请人' : 'Invited by'}: {userInfo.invitedBy}
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  ) : null;
};

export default UserPanel;
