/**
 * 等待面板
 * 替代原来的 EnterWaiting.aspx (排队等待页面)
 */
import React, { useEffect, useState } from 'react';
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
    <div className={styles.popupOverlay}>
      <div className={styles.waitingPanel}>
        {/* 头部 */}
        <div className={styles.waitingHeader}>
          <h2>请稍候</h2>
        </div>

        {/* 等待内容 */}
        <div className={styles.waitingContent}>
          {/* 等待动画 */}
          <div className={styles.waitingAnimation}>
            <div className={styles.waitingSpinner}></div>
          </div>

          {/* 消息 */}
          <div className={styles.waitingMessage}>
            <p>{message}</p>
          </div>

          {/* 倒计时 */}
          <div className={styles.waitingTimer}>
            <span>剩余时间：</span>
            <span className={styles.timerValue}>{formatTime(countdown)}</span>
          </div>

          {/* 取消按钮 */}
          {onCancel && (
            <button
              className={styles.waitingCancelButton}
              onClick={onCancel}
            >
              取消
            </button>
          )}
        </div>

        {/* 提示 */}
        <div className={styles.waitingTips}>
          <p>💡 建议：高峰期可能出现排队，请耐心等待</p>
        </div>
      </div>
    </div>
  );
};

export default WaitingPanel;
