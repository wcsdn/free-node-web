import React, { useState } from 'react';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import './DonateButton.css';

// 接收打赏的地址（你的以太坊地址）
const DONATION_ADDRESS = '0xb6a227d01b06be808aec2041694f85f43ba1b028' as const;

// 打赏金额
const DONATION_AMOUNT = '0.001';

const DonateButton: React.FC = () => {
  const [rabbitStyle] = useState<'hacker'>('hacker');

  // 发送交易
  const { data: hash, isPending, error, sendTransaction } = useSendTransaction();

  // 等待交易确认
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // 处理打赏
  const handleDonate = () => {
    sendTransaction({
      to: DONATION_ADDRESS,
      value: parseEther(DONATION_AMOUNT),
    });
  };

  // 获取区块链浏览器链接
  const getExplorerLink = (txHash: string) => {
    return `https://etherscan.io/tx/${txHash}`;
  };

  // 渲染黑客风格兔子（缩小版）
  const renderMiniRabbit = () => (
    <svg width="60" height="60" viewBox="0 0 200 200" fill="none" className="mini-rabbit">
      <defs>
        <filter id="glow-mini">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path d="M 75 65 L 70 15 L 65 15 L 70 65 Z" stroke="#00ff00" strokeWidth="1" fill="rgba(0, 255, 0, 0.1)" filter="url(#glow-mini)">
        <animateTransform attributeName="transform" type="rotate" values="0 70 65; -5 70 65; 0 70 65; 5 70 65; 0 70 65" dur="3s" repeatCount="indefinite"/>
      </path>
      <path d="M 125 65 L 130 15 L 135 15 L 130 65 Z" stroke="#00ff00" strokeWidth="1" fill="rgba(0, 255, 0, 0.1)" filter="url(#glow-mini)">
        <animateTransform attributeName="transform" type="rotate" values="0 130 65; 5 130 65; 0 130 65; -5 130 65; 0 130 65" dur="3s" repeatCount="indefinite"/>
      </path>
      <rect x="70" y="65" width="60" height="50" rx="5" stroke="#00ff00" strokeWidth="2" fill="rgba(0, 255, 0, 0.05)" filter="url(#glow-mini)"/>
      <text x="85" y="90" fill="#00ff00" fontSize="20" fontFamily="monospace" filter="url(#glow-mini)" className="rabbit-eye-left">
        <animate attributeName="opacity" values="1;1;0;1;1;1;1;1;1;1" dur="4s" repeatCount="indefinite"/>
        &gt;
      </text>
      <text x="105" y="90" fill="#00ff00" fontSize="20" fontFamily="monospace" filter="url(#glow-mini)" className="rabbit-eye-right">
        <animate attributeName="opacity" values="1;1;0;1;1;1;1;1;1;1" dur="4s" repeatCount="indefinite"/>
        _
      </text>
      <line x1="90" y1="100" x2="110" y2="100" stroke="#00ff00" strokeWidth="2" filter="url(#glow-mini)"/>
      <rect x="65" y="115" width="70" height="70" rx="5" stroke="#00ff00" strokeWidth="2" fill="rgba(0, 255, 0, 0.03)" filter="url(#glow-mini)"/>
      
      {/* 红色爱心在胸口 - 往右移，呼吸幅度减小 */}
      <path d="M 108 132 L 105 129 Q 102 126 99 129 Q 96 132 99 135 L 108 144 L 117 135 Q 120 132 117 129 Q 114 126 111 129 Z" 
            fill="#ff0000" 
            stroke="#ff3333" 
            strokeWidth="0.8"
            opacity="0.8">
        <animate attributeName="opacity" values="0.6;0.85;0.6" dur="1.8s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" 
                          type="scale" 
                          values="1;1.04;1" 
                          dur="1.8s" 
                          repeatCount="indefinite"
                          additive="sum"/>
      </path>
      
      <line x1="65" y1="135" x2="40" y2="160" stroke="#00ff00" strokeWidth="3" strokeDasharray="5,5" filter="url(#glow-mini)">
        <animate attributeName="x2" values="40;35;40;45;40" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="160;155;160;155;160" dur="2s" repeatCount="indefinite"/>
      </line>
      <line x1="135" y1="135" x2="160" y2="160" stroke="#00ff00" strokeWidth="3" strokeDasharray="5,5" filter="url(#glow-mini)">
        <animate attributeName="x2" values="160;165;160;155;160" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="160;155;160;155;160" dur="2s" repeatCount="indefinite"/>
      </line>
      <rect x="95" y="185" width="10" height="10" stroke="#00ff00" strokeWidth="2" fill="rgba(0, 255, 0, 0.1)" filter="url(#glow-mini)"/>
      <text x="75" y="145" fill="#00ff00" fontSize="8" fontFamily="monospace" opacity="0.7">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.5s" repeatCount="indefinite"/>
        I LOVE
      </text>
      <text x="75" y="160" fill="#00ff00" fontSize="8" fontFamily="monospace" opacity="0.7">
        <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="fill" values="#00ff00;#00ffff;#00ff00" dur="2s" repeatCount="indefinite"/>
        YOU ♥
      </text>
      <text x="75" y="175" fill="#00ff00" fontSize="6" fontFamily="monospace" opacity="0.4">
        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite"/>
        01001001 01001100 01001111 01010110 01000101
      </text>
    </svg>
  );

  return (
    <div className="donate-container">
      <div className="donate-header-with-rabbit">
        {renderMiniRabbit()}
        <div className="donate-info-line">
          🥕 Feed the Rabbit
        </div>
      </div>

      {/* 打赏按钮 */}
      <button
        className={`donate-button ${isPending || isConfirming ? 'processing' : ''} ${
          isConfirmed ? 'success' : ''
        }`}
        onClick={handleDonate}
        disabled={isPending || isConfirming}
      >
        {isPending && '等待签名...'}
        {isConfirming && !isPending && '确认中...'}
        {!isPending && !isConfirming && !isConfirmed && `Donate ${DONATION_AMOUNT} ETH`}
        {isConfirmed && '交易成功 ✓'}
      </button>

      {/* 交易哈希 */}
      {hash && (
        <a
          href={getExplorerLink(hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="tx-link"
        >
          查看交易 ↗
        </a>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="error-msg">
          {error.message.includes('User rejected') || error.message.includes('User denied')
            ? '用户取消了交易'
            : error.message.includes('insufficient')
            ? '余额不足'
            : '交易失败'}
        </div>
      )}
    </div>
  );
};

export default DonateButton;
