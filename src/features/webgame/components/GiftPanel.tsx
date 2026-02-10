/**
 * 礼品领取面板
 * 礼包兑换、激活码兑换
 */
import React, { useState } from 'react';
import styles from '../styles/jxMain.module.css';

interface GiftCodeResult {
  success: boolean;
  reward?: {
    items: Array<{
      name: string;
      count: number;
    }>;
    gold?: number;
    exp?: number;
  };
  message: string;
}

const GiftPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GiftCodeResult | null>(null);
  const [history, setHistory] = useState<Array<{
    code: string;
    time: string;
    status: 'success' | 'used' | 'invalid';
  }>>([]);

  const handleRedeem = async () => {
    if (!code.trim()) {
      setResult({ success: false, message: '请输入激活码' });
      return;
    }

    if (code.length < 8) {
      setResult({ success: false, message: '激活码格式不正确' });
      return;
    }

    setLoading(true);
    setResult(null);

    // 模拟兑换结果（实际应调用 API）
    try {
      // 实际 API 调用：
      // const res = await fetch('/api/gift/redeem', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ code })
      // });

      // 模拟结果
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 随机结果演示
      if (code.toUpperCase() === 'TEST123') {
        const reward: GiftCodeResult = {
          success: true,
          reward: {
            items: [
              { name: '金币', count: 1000 },
              { name: '元宝', count: 50 },
            ],
            gold: 1000,
            exp: 500,
          },
          message: '兑换成功！',
        };
        setResult(reward);
        setHistory([
          {
            code: code.toUpperCase(),
            time: new Date().toLocaleString(),
            status: 'success',
          },
          ...history,
        ]);
      } else if (code.toUpperCase() === 'USED') {
        setResult({
          success: false,
          message: '该激活码已被使用',
        });
      } else {
        setResult({
          success: false,
          message: '激活码不存在或已过期',
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: '兑换失败，请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  };

  const getGiftCodeHint = () => {
    const hints = [
      '输入官方发放的激活码',
      '每个激活码只能使用一次',
      '兑换成功后将自动发放奖励',
      '大小写不敏感',
    ];
    return hints[Math.floor(Math.random() * hints.length)];
  };

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.giftPanel}>
        {/* 头部 */}
        <div className={styles.giftHeader}>
          <h2>🎁 礼品领取</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.giftContent}>
          {/* 兑换输入区 */}
          <div className={styles.giftRedeemSection}>
            <div className={styles.giftInputGroup}>
              <label>激活码兑换</label>
              <div className={styles.giftInputRow}>
                <input
                  type="text"
                  placeholder="请输入激活码"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
                  disabled={loading}
                  maxLength={20}
                />
                <button
                  onClick={handleRedeem}
                  disabled={loading || !code.trim()}
                >
                  {loading ? '兑换中...' : '兑换'}
                </button>
              </div>
              <p className={styles.giftHint}>{getGiftCodeHint()}</p>
            </div>

            {/* 兑换结果 */}
            {result && (
              <div className={`${styles.giftResult} ${result.success ? styles.success : styles.error}`}>
                <h4>{result.success ? '✅ 兑换成功' : '❌ 兑换失败'}</h4>
                <p>{result.message}</p>
                {result.success && result.reward && (
                  <div className={styles.giftRewards}>
                    <h5>获得奖励：</h5>
                    {result.reward.gold && <p>💰 金币 +{result.reward.gold}</p>}
                    {result.reward.exp && <p>✨ 经验 +{result.reward.exp}</p>}
                    {result.reward.items?.map((item, index) => (
                      <p key={index}>
                        🎁 {item.name} x{item.count}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 分割线 */}
          <div className={styles.giftDivider}>
            <span>或</span>
          </div>

          {/* 礼包码说明 */}
          <div className={styles.giftInfo}>
            <h4>📋 如何获取激活码？</h4>
            <ul>
              <li>🔹 关注官方社交媒体，参与活动获得</li>
              <li>🔹 完成特定任务或成就获得</li>
              <li>🔹 官方发放的奖励码</li>
              <li>🔹 合作伙伴渠道专属码</li>
            </ul>
          </div>

          {/* 兑换历史 */}
          {history.length > 0 && (
            <div className={styles.giftHistory}>
              <h4>📜 兑换记录</h4>
              <ul>
                {history.slice(0, 5).map((item, index) => (
                  <li key={index} className={styles.historyItem}>
                    <span className={styles.historyCode}>{item.code}</span>
                    <span className={styles.historyTime}>{item.time}</span>
                    <span className={`${styles.historyStatus} ${styles[item.status]}`}>
                      {item.status === 'success' ? '成功' : item.status === 'used' ? '已使用' : '无效'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 常见问题 */}
          <div className={styles.giftFAQ}>
            <h4>❓ 常见问题</h4>
            <details>
              <summary>激活码不生效怎么办？</summary>
              <p>请确认激活码是否正确输入，是否已过期或已被使用。如有问题请联系客服。</p>
            </details>
            <details>
              <summary>奖励没有发放？</summary>
              <p>兑换成功后奖励会自动发放到背包，请检查背包是否已满。如未收到请联系客服。</p>
            </details>
            <details>
              <summary>一个账号能用多次吗？</summary>
              <p>大部分激活码每个账号只能使用一次，部分特殊码可能有不同限制，请查看码说明。</p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftPanel;
