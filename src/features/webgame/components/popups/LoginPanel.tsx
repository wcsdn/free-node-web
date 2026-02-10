/**
 * 登录面板
 * 替代原来的 Default.aspx (平台登录)
 */
import React, { useState } from 'react';
import gufengStyles from '../../styles/gufeng.module.css';

import styles from '../../styles/jxMain.module.css';

interface LoginPanelProps {
  onLogin: (username: string, serverId: string) => void;
  onClose?: () => void;
}

const LoginPanel: React.FC<LoginPanelProps> = ({ onLogin, onClose }) => {
  const [username, setUsername] = useState('');
  const [serverId, setServerId] = useState('1');
  const [extendAccount, setExtendAccount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const servers = [
    { id: '1', name: '服务器一' },
    { id: '2', name: '服务器二' },
    { id: '3', name: '服务器三' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setMessage('请输入账号');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // 模拟登录
      await new Promise(resolve => setTimeout(resolve, 1000));
      onLogin(username, serverId);
    } catch (error: any) {
      setMessage('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={gufengStyles.popupOverlay}>
      <div className={gufengStyles.loginPanel}>
        {/* 头部 */}
        <div className={gufengStyles.loginHeader}>
          <h2>剑侠情缘 Web</h2>
          <button className={gufengStyles.closeButton} onClick={onClose}>×</button>
        </div>

        {/* 登录表单 */}
        <div className={gufengStyles.loginContent}>
          <form onSubmit={handleSubmit}>
            <div className={gufengStyles.formGroup}>
              <label>账号</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入账号"
                maxLength={50}
              />
            </div>

            <div className={gufengStyles.formGroup}>
              <label>服务器</label>
              <select
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
              >
                {servers.map(server => (
                  <option key={server.id} value={server.id}>
                    {server.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={gufengStyles.formGroup}>
              <label>推广账号</label>
              <input
                type="text"
                value={extendAccount}
                onChange={(e) => setExtendAccount(e.target.value)}
                placeholder="选填"
                maxLength={50}
              />
            </div>

            {message && (
              <div className={gufengStyles.loginMessage}>{message}</div>
            )}

            <button
              type="submit"
              className={gufengStyles.loginButton}
              disabled={loading}
            >
              {loading ? '登录中...' : '进入游戏'}
            </button>
          </form>

          {/* 分割线 */}
          <div className={gufengStyles.loginDivider}>
            <span>其他方式</span>
          </div>

          {/* 钱包登录 */}
          <button
            className={gufengStyles.walletLoginButton}
            onClick={() => {
              // 钱包登录逻辑
              onLogin('wallet', serverId);
            }}
          >
            🔗 钱包登录
          </button>

          {/* 充值入口 */}
          <div className={gufengStyles.rechargeSection}>
            <div className={gufengStyles.rechargeInput}>
              <label>充值账号</label>
              <input
                type="text"
                placeholder="请输入充值账号"
                maxLength={50}
              />
            </div>
            <div className={gufengStyles.rechargeInput}>
              <label>充值金额 (RMB)</label>
              <input
                type="number"
                placeholder="1:6 比例"
                min={1}
              />
            </div>
            <button className={gufengStyles.rechargeButton}>
              充值
            </button>
          </div>
        </div>

        {/* 底部信息 */}
        <div className={gufengStyles.loginFooter}>
          <p>健康游戏公告：抵制不良游戏，拒绝盗版游戏。</p>
          <p>注意自我保护，谨防受骗上当。</p>
          <p>适度游戏益脑，沉迷游戏伤身。</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPanel;
