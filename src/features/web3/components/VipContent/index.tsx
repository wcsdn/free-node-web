import React from 'react';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { formatUnits, parseAbi } from 'viem';
import { mainnet } from 'wagmi/chains';
import { useLanguage } from '../../../../shared/contexts/LanguageContext';
import { getTranslation } from '../../../../i18n/translations';
import './styles.css';

// USDT 合约地址（以太坊主网）
const USDT_CONTRACT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7' as const;

// 只定义需要的 ABI
const usdtAbi = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
]);

const VipContent: React.FC = () => {
  const { language } = useLanguage();
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
        <div className="vip-title">{getTranslation(language, 'permissionVerification')}</div>
        <div className="balance-info">
          <div className={`vip-balance ${!hasVipAccess ? 'insufficient' : ''}`}>
            {getTranslation(language, 'ethBalance')} {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
            {!hasVipAccess && <span className="requirement-hint"> {getTranslation(language, 'requirementHint')}</span>}
          </div>
          <div className="usdt-balance">
            {getTranslation(language, 'usdtAssets')}{' '}
            {chain?.id === mainnet.id ? (
              formattedUsdtBalance !== null ? (
                <span className="usdt-amount">{parseFloat(formattedUsdtBalance).toFixed(2)}</span>
              ) : (
                <span className="loading">{getTranslation(language, 'loadingBalance')}</span>
              )
            ) : (
              <span className="na">{getTranslation(language, 'switchToMainnet')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VipContent;
