/**
 * 礼包码兑换面板
 * 
 * 功能：
 * - 兑换码输入
 * - 兑换结果展示
 * - 兑换记录
 * 
 * 注意：后端尚未实现兑换码 API，当前显示"即将开放"
 */
import React, { useState, useCallback } from 'react';
import { redeemGiftCode, type GiftCodeResult } from '../../services/gameApi';

export const GiftCodePanel: React.FC = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GiftCodeResult | null>(null);
  const [history, setHistory] = useState<{ code: string; time: string; status: 'success' | 'error' }[]>([]);

  // 兑换码
  const handleRedeem = useCallback(async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    
    setLoading(true);
    setResult(null);
    
    const res = await redeemGiftCode(trimmed);
    setResult(res);
    
    setHistory(prev => [{
      code: trimmed,
      time: new Date().toLocaleString('zh-CN'),
      status: res.success ? 'success' : 'error',
    }, ...prev.slice(0, 9)]);
    
    setLoading(false);
  }, [code]);

  // 按下回车提交
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRedeem();
  };

  return (
    <div className="giftcode-panel">
      <div className="giftcode-header">
        <h2 className="giftcode-title">🎁 礼包码兑换</h2>
      </div>

      {/* 即将开放提示 */}
      <div className="giftcode-coming-soon">
        <div className="giftcode-coming-icon">🔒</div>
        <div className="giftcode-coming-text">礼包码功能即将开放</div>
        <div className="giftcode-coming-sub">敬请期待...</div>
      </div>

      {/* 兑换输入区 */}
      <div className="giftcode-input-area">
        <div className="giftcode-section-title">📥 输入礼包码</div>
        <div className="giftcode-input-row">
          <input
            type="text"
            className="giftcode-input"
            placeholder="请输入礼包码"
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={20}
            disabled={loading}
          />
          <button
            className="giftcode-btn"
            onClick={handleRedeem}
            disabled={loading || !code.trim()}
          >
            {loading ? '兑换中...' : '兑换'}
          </button>
        </div>
      </div>

      {/* 兑换结果 */}
      {result && (
        <div className={`giftcode-result ${result.success ? 'success' : 'error'}`}>
          {result.success ? (
            <>
              <div className="giftcode-result-title">🎉 兑换成功！</div>
              {result.reward?.gold && (
                <div className="giftcode-result-item">💰 金币 +{result.reward.gold}</div>
              )}
              {result.reward?.items?.map((item, i) => (
                <div key={i} className="giftcode-result-item">
                  📦 {item.name} x{item.count}
                </div>
              ))}
              {result.message && (
                <div className="giftcode-result-msg">{result.message}</div>
              )}
            </>
          ) : (
            <>
              <div className="giftcode-result-title">❌ 兑换失败</div>
              <div className="giftcode-result-msg">{result.error}</div>
            </>
          )}
        </div>
      )}

      {/* 兑换记录 */}
      {history.length > 0 && (
        <div className="giftcode-history">
          <div className="giftcode-section-title">📋 兑换记录</div>
          <div className="giftcode-history-list">
            {history.map((h, i) => (
              <div key={i} className={`giftcode-history-item ${h.status}`}>
                <span className="giftcode-history-code">{h.code}</span>
                <span className="giftcode-history-time">{h.time}</span>
                <span className="giftcode-history-status">
                  {h.status === 'success' ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 常见问题 */}
      <div className="giftcode-faq">
        <div className="giftcode-section-title">❓ 常见问题</div>
        <div className="giftcode-faq-list">
          <div className="giftcode-faq-item">
            <div className="giftcode-faq-q">Q: 在哪里可以获得礼包码？</div>
            <div className="giftcode-faq-a">A: 关注官方社区、节日活动、攻略征集等渠道获取。</div>
          </div>
          <div className="giftcode-faq-item">
            <div className="giftcode-faq-q">Q: 礼包码有有效期吗？</div>
            <div className="giftcode-faq-a">A: 每个礼包码都有独立的有效期，请尽快兑换。</div>
          </div>
          <div className="giftcode-faq-item">
            <div className="giftcode-faq-q">Q: 同一个码可以重复使用吗？</div>
            <div className="giftcode-faq-a">A: 每个礼包码只能使用一次，每个角色限用一次。</div>
          </div>
        </div>
      </div>

      <style>{`
        .giftcode-panel {
          padding: 15px;
          color: #e2e8f0;
        }
        .giftcode-header {
          margin-bottom: 20px;
        }
        .giftcode-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: #f1f5f9;
        }
        .giftcode-coming-soon {
          text-align: center;
          padding: 40px 20px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 16px;
          margin-bottom: 20px;
          border: 1px solid #334155;
        }
        .giftcode-coming-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }
        .giftcode-coming-text {
          font-size: 18px;
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 8px;
        }
        .giftcode-coming-sub {
          font-size: 14px;
          color: #64748b;
        }
        .giftcode-input-area {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid #334155;
        }
        .giftcode-section-title {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 12px;
        }
        .giftcode-input-row {
          display: flex;
          gap: 10px;
        }
        .giftcode-input {
          flex: 1;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 12px 14px;
          color: #e2e8f0;
          font-size: 14px;
          outline: none;
        }
        .giftcode-input:focus {
          border-color: #3b82f6;
        }
        .giftcode-input::placeholder {
          color: #475569;
        }
        .giftcode-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .giftcode-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .giftcode-btn:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        .giftcode-btn:disabled {
          background: #334155;
          color: #64748b;
          cursor: not-allowed;
        }
        .giftcode-result {
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          text-align: center;
        }
        .giftcode-result.success {
          background: #052e16;
          border: 1px solid #166534;
        }
        .giftcode-result.error {
          background: #450a0a;
          border: 1px solid #991b1b;
        }
        .giftcode-result-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #f1f5f9;
        }
        .giftcode-result-item {
          font-size: 14px;
          color: #e2e8f0;
          margin-bottom: 4px;
        }
        .giftcode-result-msg {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 8px;
        }
        .giftcode-history {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 20px;
          border: 1px solid #334155;
        }
        .giftcode-history-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .giftcode-history-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: #0f172a;
          border-radius: 8px;
          font-size: 12px;
        }
        .giftcode-history-code {
          font-family: monospace;
          color: #60a5fa;
          flex: 1;
        }
        .giftcode-history-time {
          color: #64748b;
        }
        .giftcode-history-status {
          font-weight: 600;
        }
        .giftcode-history-item.success .giftcode-history-status {
          color: #4ade80;
        }
        .giftcode-history-item.error .giftcode-history-status {
          color: #ef4444;
        }
        .giftcode-faq {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 12px;
          padding: 15px;
          border: 1px solid #334155;
        }
        .giftcode-faq-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .giftcode-faq-item {
          padding: 10px;
          background: #0f172a;
          border-radius: 8px;
        }
        .giftcode-faq-q {
          font-size: 13px;
          font-weight: 500;
          color: #60a5fa;
          margin-bottom: 4px;
        }
        .giftcode-faq-a {
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.5;
        }

        /* ==================== 礼包码面板移动端适配 ==================== */
        @media (max-width: 768px) {
          .giftcode-panel {
            padding: 12px 8px;
          }

          .giftcode-title {
            font-size: 16px;
          }

          .giftcode-coming-soon {
            padding: 30px 16px;
            margin-bottom: 14px;
            border-radius: 12px;
          }

          .giftcode-coming-icon {
            font-size: 40px;
          }

          .giftcode-coming-text {
            font-size: 16px;
          }

          .giftcode-input-area {
            padding: 14px 12px;
            margin-bottom: 14px;
            border-radius: 10px;
          }

          .giftcode-section-title {
            font-size: 13px;
            margin-bottom: 10px;
          }

          .giftcode-input-row {
            flex-direction: column;
            gap: 8px;
          }

          .giftcode-input {
            font-size: 14px;
            padding: 12px;
            min-height: 48px;
          }

          .giftcode-btn {
            width: 100%;
            padding: 12px;
            font-size: 14px;
            min-height: 48px;
          }

          .giftcode-result {
            padding: 14px 12px;
            margin-bottom: 14px;
            border-radius: 10px;
          }

          .giftcode-result-title {
            font-size: 15px;
          }

          .giftcode-history {
            padding: 12px 10px;
            margin-bottom: 14px;
            border-radius: 10px;
          }

          .giftcode-history-item {
            padding: 8px 10px;
            font-size: 11px;
            gap: 8px;
          }

          .giftcode-history-code {
            font-size: 12px;
          }

          .giftcode-faq {
            padding: 12px 10px;
            border-radius: 10px;
          }

          .giftcode-faq-item {
            padding: 8px;
          }

          .giftcode-faq-q {
            font-size: 12px;
          }

          .giftcode-faq-a {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export default GiftCodePanel;
