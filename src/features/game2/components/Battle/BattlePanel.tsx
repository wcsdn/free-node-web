/**
 * 战斗面板 - BattlePanel
 * 战斗系统前端组件
 * 对接后端 workers/ghost-game/src/routes/battle.ts
 */
import React, { useState, useEffect, useCallback } from 'react';
import type {
  BattleStats,
  BattleRecord,
  BattleLog,
  ChessboardData,
  BattleReport,
  ChessRankItem,
  ApiResponse,
} from '../../types';

// ==================== API 基础配置 ====================

const API_BASE = '/api';
const DEV_TEST_WALLET = '0x1234567890123456789012345678901234567890';

const getWalletAuthHeader = (): Record<string, string> => {
  const isDev = import.meta.env.DEV;
  return {
    'Content-Type': 'application/json',
    'X-Wallet-Auth': isDev ? `${DEV_TEST_WALLET}:test_signature` : '',
  };
};

// ==================== API 函数 ====================

/** 获取战斗状态 (是否开启、剩余次数) */
async function fetchBattleStatus(): Promise<{
  isOpen: boolean;
  remainingBattles: number;
  maxBattles: number;
  serverTime: number;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/battle/chess/status`, {
      headers: getWalletAuthHeader(),
    });
    const json: ApiResponse<any> = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.error('[Battle] fetchBattleStatus error:', err);
    return null;
  }
}

/** 获取战斗统计 (今日胜负次数) */
async function fetchBattleStats(): Promise<BattleStats | null> {
  try {
    const res = await fetch(`${API_BASE}/battle/chess/num`, {
      headers: getWalletAuthHeader(),
    });
    const json: ApiResponse<BattleStats> = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.error('[Battle] fetchBattleStats error:', err);
    return null;
  }
}

/** 获取战斗事件和历史记录 */
async function fetchBattleEvents(
  lastEventId: number = 0
): Promise<{
  battleLog: BattleLog[];
  animations: any[];
  lastAction: BattleLog | null;
  currentRound: number;
  hasActiveBattle: boolean;
} | null> {
  try {
    const res = await fetch(
      `${API_BASE}/battle/chess/event?lastEventId=${lastEventId}`,
      { headers: getWalletAuthHeader() }
    );
    const json: ApiResponse<any> = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.error('[Battle] fetchBattleEvents error:', err);
    return null;
  }
}

/** 获取棋盘信息 */
async function _fetchChessboard(pos: number = 1): Promise<ChessboardData | null> {
  try {
    const res = await fetch(`${API_BASE}/battle/chess/board?pos=${pos}`, {
      headers: getWalletAuthHeader(),
    });
    const json: ApiResponse<ChessboardData> = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.error('[Battle] fetchChessboard error:', err);
    return null;
  }
}

/** 获取战报详情 */
async function fetchBattleReport(battleId: number): Promise<BattleReport | null> {
  try {
    const res = await fetch(`${API_BASE}/battle/report?battleId=${battleId}`, {
      headers: getWalletAuthHeader(),
    });
    const json: ApiResponse<BattleReport> = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.error('[Battle] fetchBattleReport error:', err);
    return null;
  }
}

/** 获取战斗排行榜 */
async function fetchBattleRank(
  page: number = 1,
  pageSize: number = 20
): Promise<{
  ranks: ChessRankItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  myRank: number | null;
} | null> {
  try {
    const res = await fetch(
      `${API_BASE}/battle/chess/rank?page=${page}&pageSize=${pageSize}`,
      { headers: getWalletAuthHeader() }
    );
    const json: ApiResponse<any> = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.error('[Battle] fetchBattleRank error:', err);
    return null;
  }
}

/** 移动棋子 */
async function _moveChess(
  pos: number,
  chessIndex: number,
  targetX: number,
  targetY: number
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/battle/chess/move`, {
      method: 'POST',
      headers: getWalletAuthHeader(),
      body: JSON.stringify({
        pos: String(pos),
        playerID: DEV_TEST_WALLET,
        chessIndex,
        targetX,
        targetY,
      }),
    });
    const json: ApiResponse<any> = await res.json();
    return { success: json.success, message: json.error || json.data?.reason };
  } catch (err) {
    console.error('[Battle] moveChess error:', err);
    return { success: false, message: '网络错误' };
  }
}

/** 攻击操作 */
async function _attackChess(
  pos: number,
  chessIndex: number,
  targetID: number,
  type: number = 1
): Promise<{
  success: boolean;
  damage?: number;
  isCritical?: boolean;
  kill?: boolean;
  message?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/battle/chess/attack`, {
      method: 'POST',
      headers: getWalletAuthHeader(),
      body: JSON.stringify({
        pos: String(pos),
        playerID: DEV_TEST_WALLET,
        chessIndex,
        targetID,
        type,
      }),
    });
    const json: ApiResponse<any> = await res.json();
    if (json.success && json.data) {
      return {
        success: true,
        damage: json.data.damage,
        isCritical: json.data.isCritical,
        kill: json.data.kill,
      };
    }
    return { success: false, message: json.error };
  } catch (err) {
    console.error('[Battle] attackChess error:', err);
    return { success: false, message: '网络错误' };
  }
}

// ==================== 辅助函数 ====================

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ==================== 子组件 ====================

/** 战斗统计卡片 */
const BattleStatsCard: React.FC<{ stats: BattleStats; status: any }> = ({ stats, status }) => {
  const winRate =
    stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : '0.0';

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-title">⚔️ 今日战斗统计</div>
      <div className="dashboard-card-content">
        <div className="city-info-item">
          <span className="city-info-label">剩余次数</span>
          <span className="city-info-value" style={{ color: stats.remaining > 0 ? '#4ade80' : '#ef4444' }}>
            {stats.remaining} / {stats.max}
          </span>
        </div>
        <div className="city-info-item">
          <span className="city-info-label">胜</span>
          <span className="city-info-value" style={{ color: '#4ade80' }}>{stats.wins}</span>
        </div>
        <div className="city-info-item">
          <span className="city-info-label">负</span>
          <span className="city-info-value" style={{ color: '#ef4444' }}>{stats.losses}</span>
        </div>
        <div className="city-info-item">
          <span className="city-info-label">胜率</span>
          <span className="city-info-value">{winRate}%</span>
        </div>
        {status && (
          <div className="city-info-item">
            <span className="city-info-label">服务器时间</span>
            <span className="city-info-value" style={{ fontSize: '12px' }}>
              {new Date(status.serverTime).toLocaleTimeString('zh-CN')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/** 战斗记录列表项 */
const BattleRecordItem: React.FC<{
  record: BattleRecord;
  onReplay: (id: number) => void;
}> = ({ record, onReplay }) => {
  const isWin = record.result === 'win';
  const isDraw = record.result === 'draw';

  return (
    <div className="rank-item" style={{ cursor: 'pointer' }} onClick={() => onReplay(record.id)}>
      <div className="rank-cell-rank">
        <span
          style={{
            fontSize: '18px',
            color: isWin ? '#ffd700' : isDraw ? '#aaa' : '#ef4444',
          }}
        >
          {isWin ? '🏆' : isDraw ? '⚔️' : '💀'}
        </span>
      </div>
      <div className="rank-cell-player">
        <div className="rank-player-info">
          <span className="rank-player-name">
            {isWin ? '胜利' : isDraw ? '平局' : '失败'}
          </span>
          <span className="rank-player-wallet" style={{ fontSize: '12px' }}>
            {record.myRole === 'attacker' ? '进攻方' : '防守方'}
          </span>
        </div>
      </div>
      <div className="rank-cell-level" style={{ color: '#aaa', fontSize: '12px' }}>
        {formatTime(record.timestamp)}
      </div>
      <div className="rank-cell-value">
        <button
          className="building-action"
          style={{ fontSize: '12px', padding: '8px 14px', background: '#3b82f6' }}
        >
          战报
        </button>
      </div>
    </div>
  );
};

/** 战报回放面板 */
const BattleReplayPanel: React.FC<{
  report: BattleReport | null;
  loading: boolean;
  onClose: () => void;
}> = ({ report, loading, onClose }) => {
  if (loading) {
    return (
      <div className="rank-loading">
        <div className="rank-loading-spinner" />
        <p>加载战报数据...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rank-empty">
        <p>暂无战报数据</p>
        <p style={{ fontSize: '12px', color: '#666' }}>
          选择一条战斗记录查看详细战报
        </p>
      </div>
    );
  }

  const summary = report.report || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#ffd700', margin: 0 }}>
          📜 战报详情 #{report.battleId}
        </h3>
        <button
          className="building-action"
          style={{ background: '#ef4444', padding: '6px 12px' }}
          onClick={onClose}
        >
          关闭
        </button>
      </div>

      {/* 战报基本信息 */}
      <div className="dashboard-card">
        <div className="dashboard-card-title">📊 战斗结果</div>
        <div className="dashboard-card-content">
          <div className="city-info-item">
            <span className="city-info-label">战斗结果</span>
            <span
              className="city-info-value"
              style={{
                color: report.result === 'win' ? '#4ade80' : report.result === 'lose' ? '#ef4444' : '#aaa',
              }}
            >
              {report.result === 'win' ? '胜利' : report.result === 'lose' ? '失败' : '平局'}
            </span>
          </div>
          <div className="city-info-item">
            <span className="city-info-label">战斗时间</span>
            <span className="city-info-value">{formatDateTime(report.createdAt)}</span>
          </div>
          {summary.FightWinName && (
            <div className="city-info-item">
              <span className="city-info-label">胜利方</span>
              <span className="city-info-value" style={{ color: '#87ceeb' }}>
                {summary.FightWinName.slice(0, 10)}...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 战功统计 */}
      {((summary.AttackPoint ?? 0) > 0 || (summary.DefencePoint ?? 0) > 0) && (
        <div className="dashboard-card">
          <div className="dashboard-card-title">⚔️ 战功统计</div>
          <div className="dashboard-card-content">
            <div className="city-info-item">
              <span className="city-info-label">攻击积分</span>
              <span className="city-info-value" style={{ color: '#ef4444' }}>
                {summary.AttackPoint ?? 0}
              </span>
            </div>
            <div className="city-info-item">
              <span className="city-info-label">防御积分</span>
              <span className="city-info-value" style={{ color: '#3b82f6' }}>
                {summary.DefencePoint ?? 0}
              </span>
            </div>
            {summary.AttackInsignia != null && summary.AttackInsignia > 0 && (
              <div className="city-info-item">
                <span className="city-info-label">攻击方勋章</span>
                <span className="city-info-value">{summary.AttackInsignia}</span>
              </div>
            )}
            {summary.DefInsignia != null && summary.DefInsignia > 0 && (
              <div className="city-info-item">
                <span className="city-info-label">防御方勋章</span>
                <span className="city-info-value">{summary.DefInsignia}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 损失统计 */}
      {((summary.NoLossAttack ?? 0) > 0 || (summary.NoLossDefence ?? 0) > 0) && (
        <div className="dashboard-card">
          <div className="dashboard-card-title">💔 损失统计</div>
          <div className="dashboard-card-content">
            <div className="city-info-item">
              <span className="city-info-label">攻击方无损失</span>
              <span className="city-info-value">
                {(summary.NoLossAttack ?? 0) > 0 ? '✅ 是' : '❌ 否'}
              </span>
            </div>
            <div className="city-info-item">
              <span className="city-info-label">防御方无损失</span>
              <span className="city-info-value">
                {(summary.NoLossDefence ?? 0) > 0 ? '✅ 是' : '❌ 否'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/** 排行榜面板 */
const BattleRankList: React.FC<{
  ranks: ChessRankItem[];
  myRank: number | null;
  page: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}> = ({ ranks, myRank, page, hasMore, onPageChange }) => {
  if (ranks.length === 0) {
    return (
      <div className="rank-empty">
        <p>暂无排行数据</p>
      </div>
    );
  }

  return (
    <>
      <div className="rank-list">
        {ranks.map((item) => (
          <div
            key={item.walletAddress}
            className={`rank-item ${item.isMe ? 'rank-item-me' : ''}`}
          >
            <div className="rank-cell-rank">
              <span
                style={{
                  color:
                    item.rank === 1
                      ? '#ffd700'
                      : item.rank === 2
                      ? '#c0c0c0'
                      : item.rank === 3
                      ? '#cd7f32'
                      : '#aaa',
                  fontWeight: 'bold',
                }}
              >
                {item.title || `#${item.rank}`}
              </span>
            </div>
            <div className="rank-cell-player">
              <div
                className="rank-avatar"
                style={{
                  background: item.isMe
                    ? 'linear-gradient(135deg, #ffd700, #ff8c00)'
                    : 'linear-gradient(135deg, #667eea, #764ba2)',
                }}
              >
                {item.name.charAt(0)}
              </div>
              <div className="rank-player-info">
                <span className="rank-player-name">
                  {item.name}
                  {item.isMe && (
                    <span style={{ color: '#ffd700', marginLeft: '6px', fontSize: '11px' }}>我</span>
                  )}
                </span>
                <span className="rank-player-wallet">Lv.{item.level}</span>
              </div>
            </div>
            <div className="rank-cell-level" style={{ color: '#aaa' }}>
              {item.winCount != null && (
                <span style={{ color: '#4ade80' }}>{item.winCount}胜</span>
              )}
            </div>
            <div className="rank-cell-value" style={{ color: '#ffd700', fontWeight: 'bold' }}>
              {item.power?.toLocaleString() || item.value?.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* 分页 */}
      <div className="rank-pagination">
        <button
          className="rank-page-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          上一页
        </button>
        <span className="rank-page-info">第 {page} 页</span>
        <button
          className="rank-page-btn"
          disabled={!hasMore}
          onClick={() => onPageChange(page + 1)}
        >
          下一页
        </button>
      </div>

      {myRank && (
        <div
          style={{
            textAlign: 'center',
            padding: '10px',
            background: 'rgba(255, 215, 0, 0.1)',
            borderRadius: '8px',
            marginTop: '10px',
            fontSize: '14px',
            color: '#ffd700',
          }}
        >
          我的排名: #{myRank}
        </div>
      )}
    </>
  );
};

// ==================== 主组件 ====================

export type BattleTab = 'stats' | 'records' | 'rank';

export interface BattlePanelProps {
  walletAddress?: string;
}

export const BattlePanel: React.FC<BattlePanelProps> = ({ walletAddress: _walletAddress }) => {
  // 状态
  const [activeTab, setActiveTab] = useState<BattleTab>('stats');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 数据状态
  const [battleStatus, setBattleStatus] = useState<any>(null);
  const [battleStats, setBattleStats] = useState<BattleStats | null>(null);
  const [battleRecords, setBattleRecords] = useState<BattleRecord[]>([]);
  const [battleEvents, setBattleEvents] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<BattleReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [rankData, setRankData] = useState<{
    ranks: ChessRankItem[];
    total: number;
    page: number;
    hasMore: boolean;
    myRank: number | null;
  } | null>(null);
  const [rankPage, setRankPage] = useState(1);

  // 加载战斗数据
  const loadBattleData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [status, stats] = await Promise.all([
        fetchBattleStatus(),
        fetchBattleStats(),
      ]);

      setBattleStatus(status);
      setBattleStats(stats);

      // 同时获取战斗事件（包含历史记录）
      const events = await fetchBattleEvents();
      setBattleEvents(events);

      // 提取历史记录
      if (events?.battleLog) {
        const records: BattleRecord[] = events.battleLog
          .filter((log: any) => log.type === 'battle_record')
          .map((log: any) => ({
            id: log.id,
            result: log.result as 'win' | 'lose' | 'draw',
            myRole: log.myRole as 'attacker' | 'defender',
            timestamp: log.timestamp,
          }));
        setBattleRecords(records);
      }
    } catch (err) {
      setError('加载战斗数据失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载排行榜
  const loadBattleRank = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const data = await fetchBattleRank(page, 20);
        if (data) {
          setRankData(data);
        }
      } catch (err) {
        console.error('[Battle] loadBattleRank error:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 加载战报详情
  const loadBattleReport = useCallback(async (battleId: number) => {
    setReportLoading(true);
    try {
      const report = await fetchBattleReport(battleId);
      setSelectedReport(report);
    } catch (err) {
      console.error('[Battle] loadBattleReport error:', err);
    } finally {
      setReportLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    loadBattleData();
  }, [loadBattleData]);

  // 切换标签页时加载对应数据
  useEffect(() => {
    if (activeTab === 'rank' && !rankData) {
      loadBattleRank(1);
    }
  }, [activeTab, rankData, loadBattleRank]);

  // 处理排行榜分页
  const handleRankPageChange = (page: number) => {
    setRankPage(page);
    loadBattleRank(page);
  };

  // 渲染内容区
  const renderContent = () => {
    if (loading && !battleStats) {
      return (
        <div className="rank-loading">
          <div className="rank-loading-spinner" />
          <p>加载中...</p>
        </div>
      );
    }

    if (error && !battleStats) {
      return (
        <div className="rank-error">
          <p>❌ {error}</p>
          <button
            className="building-action"
            style={{ background: '#3b82f6', marginTop: '10px' }}
            onClick={loadBattleData}
          >
            重试
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'stats':
        return renderStatsTab();
      case 'records':
        return renderRecordsTab();
      case 'rank':
        return renderRankTab();
      default:
        return null;
    }
  };

  // 统计标签页
  const renderStatsTab = () => {
    if (!battleStats) {
      return (
        <div className="rank-empty">
          <p>暂无统计数据</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 统计卡片 */}
        <BattleStatsCard stats={battleStats} status={battleStatus} />

        {/* 进行中战斗 */}
        {battleEvents?.hasActiveBattle && battleEvents.battleLog?.length > 0 && (
          <div className="dashboard-card">
            <div className="dashboard-card-title">⚡ 进行中战斗</div>
            <div className="dashboard-card-content">
              {battleEvents.battleLog
                .filter((log: any) => log.type !== 'battle_record')
                .slice(0, 5)
                .map((log: any, idx: number) => (
                  <div
                    key={idx}
                    className="city-info-item"
                    style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}
                  >
                    <span style={{ color: '#87ceeb', fontSize: '13px' }}>
                      {log.type === 'battle_start' && `⚔️ ${log.message}`}
                      {log.type === 'battle_end' && `🏁 ${log.message}`}
                      {log.type === 'hero_damaged' && `💥 ${log.heroName} 受伤 (${log.hp}/${log.maxHp})`}
                      {log.type === 'round_update' && `🔄 第${log.round}回合`}
                    </span>
                    <span style={{ color: '#666', fontSize: '11px' }}>
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 当前回合信息 */}
        {battleEvents?.currentRound && (
          <div className="dashboard-card">
            <div className="dashboard-card-title">📍 当前状态</div>
            <div className="dashboard-card-content">
              <div className="city-info-item">
                <span className="city-info-label">当前回合</span>
                <span className="city-info-value">第 {battleEvents.currentRound} 回合</span>
              </div>
              <div className="city-info-item">
                <span className="city-info-label">战斗状态</span>
                <span
                  className="city-info-value"
                  style={{ color: battleEvents.hasActiveBattle ? '#4ade80' : '#aaa' }}
                >
                  {battleEvents.hasActiveBattle ? '⚔️ 进行中' : '⏸️ 无进行中战斗'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 战斗记录标签页
  const renderRecordsTab = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {selectedReport !== undefined && (
          <BattleReplayPanel
            report={selectedReport}
            loading={reportLoading}
            onClose={() => setSelectedReport(null)}
          />
        )}

        <div className="rank-content">
          <div className="rank-header">
            <div className="rank-header-cell">结果</div>
            <div className="rank-header-cell">战斗信息</div>
            <div className="rank-header-cell">时间</div>
            <div className="rank-header-cell">操作</div>
          </div>

          {battleRecords.length === 0 ? (
            <div className="rank-empty">
              <p>暂无战斗记录</p>
              <p style={{ fontSize: '12px', color: '#666' }}>
                参与战斗后将在此处显示记录
              </p>
            </div>
          ) : (
            <div className="rank-list">
              {battleRecords.map((record) => (
                <BattleRecordItem
                  key={record.id}
                  record={record}
                  onReplay={(id) => loadBattleReport(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 排行榜标签页
  const renderRankTab = () => {
    if (loading && !rankData) {
      return (
        <div className="rank-loading">
          <div className="rank-loading-spinner" />
          <p>加载排行榜...</p>
        </div>
      );
    }

    return (
      <div className="rank-content">
        <BattleRankList
          ranks={rankData?.ranks || []}
          myRank={rankData?.myRank || null}
          page={rankPage}
          hasMore={rankData?.hasMore || false}
          onPageChange={handleRankPageChange}
        />
      </div>
    );
  };

  return (
    <div className="battle-panel">
      {/* 面板头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#ffd700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚔️ 战斗系统
        </h2>
        <button
          className="building-action"
          style={{ background: '#3b82f6', fontSize: '12px' }}
          onClick={loadBattleData}
          disabled={loading}
        >
          {loading ? '刷新中...' : '🔄 刷新'}
        </button>
      </div>

      {/* 错误提示 */}
      {error && battleStats && (
        <div className="task-error" style={{ marginTop: '10px' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* 标签页 */}
      <div className="rank-tabs" style={{ marginTop: '15px' }}>
        <button
          className={`rank-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 今日统计
        </button>
        <button
          className={`rank-tab ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          📜 战斗记录
          {battleRecords.length > 0 && (
            <span className="mail-badge">{battleRecords.length}</span>
          )}
        </button>
        <button
          className={`rank-tab ${activeTab === 'rank' ? 'active' : ''}`}
          onClick={() => setActiveTab('rank')}
        >
          🏆 战斗排行
        </button>
      </div>

      {/* 内容区域 */}
      <div style={{ marginTop: '15px' }}>{renderContent()}</div>
    </div>
  );
};

export default BattlePanel;
