import React from 'react';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { formatUnits, parseAbi } from 'viem';
import { mainnet } from 'wagmi/chains';
import './VipContent.css';

// USDT 合约地址（以太坊主网）
const USDT_CONTRACT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7' as const;

// 只定义需要的 ABI
const usdtAbi = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
]);

const VipContent: React.FC = () => {
  const { address, chain } = useAccount();
  const { data: balance } = useBalance({ address });

  // 读取 USDT 余额
  const { data: usdtBalance } = useReadContract({
    address: USDT_CONTRACT_ADDRESS,
    abi: usdtAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: mainnet.id,
    query: {
      enabled: !!address && chain?.id === mainnet.id, // 只在以太坊主网上读取
    },
  });

  // 检查是否有 VIP 权限
  const hasVipAccess = balance && parseFloat(balance.formatted) >= 0.01;

  // 格式化 USDT 余额（6 位精度）
  const formattedUsdtBalance =
    usdtBalance !== undefined ? formatUnits(usdtBalance, 6) : null;

  if (!address || !balance) {
    return null;
  }

  return (
    <div className="vip-content-container">
      <div className="vip-header">
        <div className="vip-title">🔒 权限验证</div>
        <div className="balance-info">
          <div className={`vip-balance ${!hasVipAccess ? 'insufficient' : ''}`}>
            ETH: {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
            {!hasVipAccess && <span className="requirement-hint"> (需要 ≥ 0.01 ETH)</span>}
          </div>
          <div className="usdt-balance">
            USDT Assets:{' '}
            {chain?.id === mainnet.id ? (
              formattedUsdtBalance !== null ? (
                <span className="usdt-amount">{parseFloat(formattedUsdtBalance).toFixed(2)}</span>
              ) : (
                <span className="loading">加载中...</span>
              )
            ) : (
              <span className="na">N/A (请切换到以太坊主网)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VipContent;
