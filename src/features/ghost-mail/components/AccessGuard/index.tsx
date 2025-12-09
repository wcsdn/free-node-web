import React, { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useLanguage } from '../../../../shared/hooks/useLanguage';
import { useSoundEffect } from '../../../../shared/hooks/useSoundEffect';
import { UserStatus } from '../../../../types/ghost-mail';
import Backdrop from '../../../../shared/components/Backdrop';
import './styles.css';

interface AccessGuardProps {
  children: React.ReactNode;
  onAccessGranted: (status: UserStatus) => void;
}

import { TREASURY_ADDRESS, PAYMENT_AMOUNTS, API_ENDPOINTS } from '../../../../config/constants';

// 接收支付的地址
const PAYMENT_ADDRESS = TREASURY_ADDRESS;
const PAYMENT_AMOUNT = PAYMENT_AMOUNTS.GHOST_MAIL_VIP;

// GM 白名单（跳过支付验证）
const GM_WHITELIST = [
  TREASURY_ADDRESS.toLowerCase(), // GM 账号
];

const AccessGuard: React.FC<AccessGuardProps> = ({ children, onAccessGranted }) => {
  const { address, isConnected } = useAccount();
  const { language } = useLanguage();
  const { playClick, playSuccess, playError } = useSoundEffect();
  
  const [isChecking, setIsChecking] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);

  // 检查是否是 GM 白名单
  const isGMWhitelisted = address && GM_WHITELIST.includes(address.toLowerCase());

  // 发送交易
  const { data: hash, isPending, sendTransaction } = useSendTransaction();

  // 等待交易确认
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // 检查用户状态（只在地址变化时执行一次）
  useEffect(() => {
    if (!address) {
      setIsChecking(false);
      setHasPlayedSound(false);
      return;
    }

    checkUserStatus();
  }, [address]);

  // 交易确认后验证支付
  useEffect(() => {
    if (isConfirmed && hash && address) {
      verifyPayment(hash);
    }
  }, [isConfirmed, hash, address]);

  const checkUserStatus = async () => {
    if (!address) return;

    try {
      setIsChecking(true);
      
      // 所有用户（包括 GM）都从后端获取完整状态
      const response = await fetch(
        `${API_ENDPOINTS.GHOST_MAIL}/api/status?address=${address}`
      );
      const data = await response.json();

      if (data.success) {
        setUserStatus(data.data);
        
        // GM 白名单或 VIP 用户都放行
        if (isGMWhitelisted || data.data.isVIP) {
          onAccessGranted(data.data);
          // 只在首次授权时播放音效
          if (isGMWhitelisted && !hasPlayedSound) {
            playSuccess();
            setHasPlayedSound(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check status:', error);
      playError();
    } finally {
      setIsChecking(false);
    }
  };

  const verifyPayment = async (txHash: string) => {
    if (!address) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.GHOST_MAIL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, txHash }),
      });

      const data = await response.json();

      if (data.success) {
        playSuccess();
        await checkUserStatus();
        setShowPaymentModal(false);
      } else {
        playError();
        alert('Payment verification failed');
      }
    } catch (error) {
      console.error('Failed to verify payment:', error);
      playError();
    }
  };

  const handlePayment = () => {
    playClick();
    sendTransaction({
      to: PAYMENT_ADDRESS,
      value: parseEther(PAYMENT_AMOUNT),
    });
  };

  const [tasks, setTasks] = useState<any[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // 加载任务列表
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.GHOST_MAIL}/api/tasks`);
      const data = await response.json();
      if (data.success) {
        setTasks(data.data.tasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const handleCompleteTask = () => {
    playClick();
    setShowTaskModal(true);
  };

  const handleTaskClick = (task: any) => {
    playClick();
    // 打开任务链接
    window.open(task.url, '_blank');
    // TODO: 实际项目中需要验证任务完成
    // 目前简化：用户完成后手动点击确认
  };

  // 未连接钱包
  if (!isConnected) {
    return (
      <div className="access-guard-container">
        <div className="access-denied-panel">
          <div className="denied-icon">🔒</div>
          <h2 className="denied-title">ACCESS REQUIRED</h2>
          <p className="denied-message">
            {language === 'en'
              ? 'Please connect your wallet to access Ghost Mail'
              : '请连接钱包以访问幽灵信箱'}
          </p>
        </div>
      </div>
    );
  }

  // 检查中
  if (isChecking) {
    return (
      <div className="access-guard-container">
        <div className="checking-panel">
          <div className="loading-spinner"></div>
          <p>{language === 'en' ? 'Verifying access...' : '验证访问权限中...'}</p>
        </div>
      </div>
    );
  }

  // 已是 VIP，放行
  if (userStatus?.isVIP) {
    return <>{children}</>;
  }

  // 需要升级为 VIP
  return (
    <div className="access-guard-container">
      <div className="access-denied-panel">
        <div className="denied-icon">⚠️</div>
        <h2 className="denied-title">ACCESS DENIED</h2>
        <p className="denied-message">
          {language === 'en'
            ? 'VIP access required to use Ghost Mail'
            : '需要 VIP 权限才能使用幽灵信箱'}
        </p>

        <div className="access-options">
          <button
            className="access-option-btn payment-btn"
            onClick={() => {
              playClick();
              setShowPaymentModal(true);
            }}
          >
            <span className="btn-icon">💎</span>
            <span className="btn-text">
              {language === 'en' ? 'Pay 0.001 ETH' : '支付 0.001 ETH'}
            </span>
          </button>

          <button className="access-option-btn task-btn" onClick={handleCompleteTask}>
            <span className="btn-icon">🎯</span>
            <span className="btn-text">
              {language === 'en' ? 'Complete Task' : '完成任务'}
            </span>
          </button>
        </div>
      </div>

      {/* 支付弹窗 */}
      {showPaymentModal && (
        <>
          <Backdrop onClick={() => setShowPaymentModal(false)} />
          <div className="payment-modal">
            <div className="payment-modal-header">
              <h3>{language === 'en' ? 'Upgrade to VIP' : '升级为 VIP'}</h3>
              <button onClick={() => setShowPaymentModal(false)}>[ X ]</button>
            </div>
            <div className="payment-modal-content">
              <p className="payment-info">
                {language === 'en'
                  ? `Send ${PAYMENT_AMOUNT} ETH to unlock Ghost Mail`
                  : `发送 ${PAYMENT_AMOUNT} ETH 解锁幽灵信箱`}
              </p>
              <button
                className="payment-confirm-btn"
                onClick={handlePayment}
                disabled={isPending || isConfirming}
              >
                {isPending && (language === 'en' ? 'Waiting for signature...' : '等待签名...')}
                {isConfirming && !isPending && (language === 'en' ? 'Confirming...' : '确认中...')}
                {!isPending && !isConfirming && (language === 'en' ? 'Send Payment' : '发送支付')}
              </button>
              {hash && (
                <a
                  href={`https://etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-link"
                >
                  {language === 'en' ? 'View Transaction ↗' : '查看交易 ↗'}
                </a>
              )}
            </div>
          </div>
        </>
      )}

      {/* 任务弹窗 */}
      {showTaskModal && (
        <>
          <Backdrop onClick={() => setShowTaskModal(false)} />
          <div className="payment-modal task-modal">
            <div className="payment-modal-header">
              <h3>{language === 'en' ? 'Complete Tasks' : '完成任务'}</h3>
              <button onClick={() => setShowTaskModal(false)}>[ X ]</button>
            </div>
            <div className="payment-modal-content">
              <p className="payment-info">
                {language === 'en'
                  ? 'Complete any task below to unlock VIP access'
                  : '完成以下任意任务以解锁 VIP 权限'}
              </p>
              <div className="task-list">
                {tasks.map((task) => (
                  <div key={task.id} className="task-item" onClick={() => handleTaskClick(task)}>
                    <span className="task-icon">{task.icon}</span>
                    <div className="task-info">
                      <div className="task-title">
                        {language === 'en' ? task.title : task.titleZh}
                      </div>
                      <div className="task-reward">
                        {language === 'en' ? task.reward : task.rewardZh}
                      </div>
                    </div>
                    <span className="task-arrow">→</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AccessGuard;
