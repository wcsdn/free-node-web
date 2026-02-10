/**
 * 等待面板
 * 替代原来的 EnterWaiting.aspx (排队等待页面)
 */
import React, { useEffect, useState } from 'react';
import gufengStyles from '../../styles/gufeng.module.css';

import styles from '../../styles/jxMain.module.css';

interface WaitingPanelProps {
  message?: string;
  estimatedTime?: number; // 预计等待秒数
  onCancel?: () => void;
  onComplete?: () => void;
}

const WaitingPanel: React.FC<WaitingPanelProps> = ({
  message = '官道上车水马龙，前方道路暂时受阻，请耐心等待疏通……',
  estimatedTime = 30,
  onCancel,
  onComplete
}) => {
  const [countdown, setCountdown] = useState(estimatedTime);

  useEffect(() => {
    if (countdown <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}分${secs}秒`;
    }
    return `${secs}秒`;
  };

  return (
    <div className={gufengStyles.popupOverlay}>
      <div className={gufengStyles.waitingPanel}>
        {/* 头部 */}
        <div className={gufengStyles.waitingHeader}>
          <h2>请稍候</h2>
        </div>

        {/* 等待内容 */}
        <div className={gufengStyles.waitingContent}>
          {/* 等待动画 */}
          <div className={gufengStyles.waitingAnimation}>
            <div className={gufengStyles.waitingSpinner}></div>
          </div>

          {/* 消息 */}
          <div className={gufengStyles.waitingMessage}>
            <p>{message}</p>
          </div>

          {/* 倒计时 */}
          <div className={gufengStyles.waitingTimer}>
            <span>剩余时间：</span>
            <span className={gufengStyles.timerValue}>{formatTime(countdown)}</span>
          </div>

          {/* 取消按钮 */}
          {onCancel && (
            <button
              className={gufengStyles.waitingCancelButton}
              onClick={onCancel}
            >
              取消
            </button>
          )}
        </div>

        {/* 提示 */}
        <div className={gufengStyles.waitingTips}>
          <p>💡 建议：高峰期可能出现排队，请耐心等待</p>
        </div>
      </div>
    </div>
  );
};

export default WaitingPanel;
