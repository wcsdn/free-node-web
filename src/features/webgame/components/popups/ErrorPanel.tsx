/**
 * 错误面板
 * 替代原来的 Error.aspx (错误页面)
 */
import React from 'react';
import gufengStyles from '../../styles/gufeng.module.css';

import styles from '../../styles/jxMain.module.css';

interface ErrorPanelProps {
  error?: string;
  errorCode?: string;
  onRetry?: () => void;
  onBack?: () => void;
  onHome?: () => void;
}

const ErrorPanel: React.FC<ErrorPanelProps> = ({
  error = '发生了未知错误',
  errorCode,
  onRetry,
  onBack,
  onHome
}) => {
  const errorMessages: Record<string, string> = {
    'SESSION_TIMEOUT': '会话已过期，请重新登录',
    'NETWORK_ERROR': '网络连接失败，请检查网络',
    'SERVER_ERROR': '服务器错误，请稍后重试',
    'AUTH_FAILED': '认证失败，请重新登录',
    'PERMISSION_DENIED': '权限不足，无法执行此操作',
    'NOT_FOUND': '请求的资源不存在',
    'UNKNOWN': '发生了未知错误',
  };

  const getErrorMessage = (err: string) => {
    return errorMessages[err] || errorMessages['UNKNOWN'];
  };

  return (
    <div className={gufengStyles.popupOverlay}>
      <div className={gufengStyles.errorPanel}>
        {/* 错误图标 */}
        <div className={gufengStyles.errorIcon}>❌</div>

        {/* 错误标题 */}
        <h2 className={gufengStyles.errorTitle}>出错了</h2>

        {/* 错误信息 */}
        <div className={gufengStyles.errorContent}>
          {errorCode && (
            <p className={gufengStyles.errorCode}>错误代码: {errorCode}</p>
          )}
          <p className={gufengStyles.errorMessage}>{getErrorMessage(error)}</p>
          {error !== errorCode && (
            <p className={gufengStyles.errorDetail}>{error}</p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className={gufengStyles.errorActions}>
          {onRetry && (
            <button className={gufengStyles.errorButton} onClick={onRetry}>
              🔄 重试
            </button>
          )}
          {onBack && (
            <button className={gufengStyles.errorButton} onClick={onBack}>
              ← 返回
            </button>
          )}
          {onHome && (
            <button className={gufengStyles.errorButton} onClick={onHome}>
              🏠 首页
            </button>
          )}
        </div>

        {/* 联系客服 */}
        <div className={gufengStyles.errorSupport}>
          <p>如问题持续存在，请联系客服</p>
          <p className={gufengStyles.supportInfo}>
            工作时间：周一至周五 9:00-18:00
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPanel;
