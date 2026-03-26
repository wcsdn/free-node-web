/**
 * 战役面板 (WarfarePanel)
 * 名城战/竞技场战争系统
 * 
 * API 接口:
 * - GET /api/warfare/area - 获取战区列表
 * - GET /api/warfare/waiting - 获取等待中的名城战
 * - GET /api/warfare/user-battle - 获取用户当前参战状态
 * - GET /api/warfare/detail - 获取名城战详情
 * - POST /api/warfare/cancel - 取消名城战报名
 * - POST /api/warfare/select - 选择参加名城战
 * - GET /api/warfare/config - 获取战场配置
 * - GET /api/warfare/is-open - 检查战场是否开放
 * - GET /api/warfare/battle - 获取名城战战场信息
 * - GET /api/warfare/result - 获取名城战战斗结果
 * - POST /api/warfare/match - 手动触发匹配检查
 */
import React, { useState, useEffect, useCallback } from 'react';
import type {
  WarfareArea,
  WarfareDetail,
  UserBattleInfo,
  BattleInfo,
  BattleResult,
  WaitingListResponse,
  WarfareConfig,
  WarfareBattleState,
  AthleticsType,
} from '../../types';

// API 基础路径
const API_BASE = '/api/warfare';

// 竞技类型名称映射
const ATHLETICS_TYPE_NAMES: Record<AthleticsType, string> = {
  1: '个人竞技',
  2: '组队竞技',
  3: '帮派竞技',
};

// 竞技模式名称映射
const ATHLETICS_MODE_NAMES: Record<number, string> = {
  1: '死战模式',
  2: '夺旗模式',
  3: '竞速模式',
};

// 等级段名称
const LEVEL_SEGMENT_NAMES = [
  '1-9级', '10-19级', '20-29级', '30-39级', '40-49级',
  '50-59级', '60-69级', '70-79级', '80-89级', '90-99级',
];

// 战役状态显示
const BATTLE_STATE_NAMES: Record<WarfareBattleState, string> = {
  0: '未报名',
  1: '已报名等待',
  2: '战斗中',
};

interface WarfarePanelProps {
  cityId?: number;
  onBattleStart?: (battleId: number) => void;
}

export const WarfarePanel: React.FC<WarfarePanelProps> = ({ cityId, onBattleStart }) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'areas' | 'status' | 'result'>('areas');
  const [athleticsType, setAthleticsType] = useState<AthleticsType>(1);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  
  // 数据状态
  const [areas, setAreas] = useState<WarfareArea[]>([]);
  const [areaDetail, setAreaDetail] = useState<WarfareDetail | null>(null);
  const [userBattleInfo, setUserBattleInfo] = useState<UserBattleInfo | null>(null);
  const [battleInfo, setBattleInfo] = useState<BattleInfo | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [waitingList, setWaitingList] = useState<WaitingListResponse | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  
  // UI 状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // 获取战区列表
  const fetchAreas = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/area?type=${athleticsType}`);
      const data = await res.json();
      if (data.success) {
        setAreas(data.data || []);
      } else {
        setError(data.error || '获取战区列表失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误');
    } finally {
      setIsLoading(false);
    }
  }, [athleticsType]);

  // 获取战区详情
  const fetchAreaDetail = useCallback(async (areaId: number) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/detail?warfare_id=${areaId}`);
      const data = await res.json();
      if (data.success) {
        setAreaDetail(data.data);
      } else {
        setError(data.error || '获取战区详情失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取用户参战状态
  const fetchUserBattleInfo = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/user-battle`);
      const data = await res.json();
      if (data.success) {
        setUserBattleInfo(data.data);
      }
    } catch (err: any) {
      console.error('获取用户参战状态失败:', err);
    }
  }, []);

  // 获取战场信息
  const fetchBattleInfo = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/battle`);
      const data = await res.json();
      if (data.success) {
        setBattleInfo(data.data);
        if (data.data.matched && data.data.battleId) {
          onBattleStart?.(data.data.battleId);
        }
      }
    } catch (err: any) {
      console.error('获取战场信息失败:', err);
    }
  }, [onBattleStart]);

  // 获取战斗结果
  const fetchBattleResult = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/result`);
      const data = await res.json();
      if (data.success) {
        setBattleResult(data.data);
      }
    } catch (err: any) {
      console.error('获取战斗结果失败:', err);
    }
  }, []);

  // 获取等待列表
  const fetchWaitingList = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/waiting?athletics_type=${athleticsType}`);
      const data = await res.json();
      if (data.success) {
        setWaitingList(data.data);
      }
    } catch (err: any) {
      console.error('获取等待列表失败:', err);
    }
  }, [athleticsType]);

  // 检查战场是否开放
  const checkIsOpen = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/is-open`);
      const data = await res.json();
      if (data.success) {
        setIsOpen(data.data.isOpen);
      }
    } catch (err: any) {
      console.error('检查战场开放状态失败:', err);
    }
  }, []);

  // 报名参加战役
  const handleSignup = async (areaId: number, warfareType: number = 1) => {
    if (!cityId) {
      setError('请先选择城市');
      return;
    }
    
    try {
      setIsLoading(true);
      setActionMessage(null);
      const res = await fetch(`${API_BASE}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: areaId,
          warfare_type: warfareType,
          city_id: cityId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('报名成功！等待系统分配对手...');
        await fetchUserBattleInfo();
        await fetchWaitingList();
      } else {
        setError(data.error || '报名失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 取消报名
  const handleCancel = async () => {
    if (!cityId) {
      setError('请先选择城市');
      return;
    }
    
    try {
      setIsLoading(true);
      setActionMessage(null);
      const res = await fetch(`${API_BASE}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city_id: cityId }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('取消报名成功');
        await fetchUserBattleInfo();
        await fetchWaitingList();
      } else {
        setError(data.error || '取消报名失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 手动触发匹配
  const handleMatch = async () => {
    try {
      setIsLoading(true);
      setActionMessage(null);
      const res = await fetch(`${API_BASE}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.data.message);
        if (data.data.matched) {
          await fetchBattleInfo();
        }
      } else {
        setError(data.error || '匹配失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    checkIsOpen();
    fetchUserBattleInfo();
  }, [checkIsOpen, fetchUserBattleInfo]);

  // 切换竞技类型时获取战区
  useEffect(() => {
    if (activeTab === 'areas') {
      fetchAreas();
      fetchWaitingList();
    }
  }, [activeTab, athleticsType, fetchAreas, fetchWaitingList]);

  // 选择战区时获取详情
  useEffect(() => {
    if (selectedAreaId) {
      fetchAreaDetail(selectedAreaId);
    }
  }, [selectedAreaId, fetchAreaDetail]);

  // 刷新战场状态
  useEffect(() => {
    if (userBattleInfo?.battleState === 1) {
      const interval = setInterval(() => {
        fetchBattleInfo();
        fetchUserBattleInfo();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [userBattleInfo?.battleState, fetchBattleInfo, fetchUserBattleInfo]);

  // 渲染错误消息
  const renderError = () => {
    if (!error) return null;
    return (
      <div className="warfare-error" style={{
        padding: '10px',
        background: 'rgba(239, 68, 68, 0.2)',
        border: '1px solid #ef4444',
        borderRadius: '8px',
        marginBottom: '15px',
        color: '#ef4444',
      }}>
        {error}
        <button
          onClick={() => setError(null)}
          style={{
            float: 'right',
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
    );
  };

  // 渲染操作消息
  const renderActionMessage = () => {
    if (!actionMessage) return null;
    return (
      <div className="warfare-message" style={{
        padding: '10px',
        background: 'rgba(74, 222, 128, 0.2)',
        border: '1px solid #4ade80',
        borderRadius: '8px',
        marginBottom: '15px',
        color: '#4ade80',
      }}>
        {actionMessage}
      </div>
    );
  };

  // 渲染战区标签页
  const renderAreaTabs = () => (
    <div className="warfare-tabs" style={{
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
    }}>
      {([1, 2, 3] as AthleticsType[]).map((type) => (
        <button
          key={type}
          onClick={() => {
            setAthleticsType(type);
            setSelectedAreaId(null);
            setAreaDetail(null);
          }}
          className={`building-action ${athleticsType === type ? 'active' : ''}`}
          style={{
            background: athleticsType === type ? '#ffd700' : '#333',
            color: athleticsType === type ? '#000' : '#fff',
          }}
        >
          {ATHLETICS_TYPE_NAMES[type]}
        </button>
      ))}
    </div>
  );

  // 渲染战区列表
  const renderAreaList = () => (
    <div className="warfare-areas">
      <h3 style={{ color: '#ffd700', marginBottom: '15px' }}>选择战区</h3>
      {isLoading && areas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#aaa' }}>
          加载中...
        </div>
      ) : areas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          暂无可用战区
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {areas.map((area) => (
            <div
              key={area.ID}
              onClick={() => setSelectedAreaId(area.ID)}
              className={`dashboard-card ${selectedAreaId === area.ID ? 'selected' : ''}`}
              style={{
                cursor: 'pointer',
                border: selectedAreaId === area.ID ? '2px solid #ffd700' : '2px solid transparent',
              }}
            >
              <div className="dashboard-card-title">{area.Area}</div>
              <div className="dashboard-card-content" style={{ fontSize: '14px', color: '#aaa' }}>
                <div>模式: {ATHLETICS_MODE_NAMES[area.AthleticsMode] || '未知'}</div>
                <div>人数要求: {area.ManHow} 人</div>
                {area.Description && <div>{area.Description}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // 渲染战区详情
  const renderAreaDetail = () => {
    if (!areaDetail && !selectedAreaId) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          请选择一个战区查看详情
        </div>
      );
    }

    if (isLoading && !areaDetail) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
          加载中...
        </div>
      );
    }

    if (!areaDetail) return null;

    return (
      <div className="warfare-detail">
        <h3 style={{ color: '#ffd700', marginBottom: '15px' }}>{areaDetail.RoomName}</h3>
        <div className="dashboard-card">
          <div className="dashboard-card-title">战区介绍</div>
          <div className="dashboard-card-content">
            <p style={{ lineHeight: '1.6', color: '#ccc' }}>{areaDetail.RoomShow}</p>
          </div>
        </div>

        <div className="dashboard-card" style={{ marginTop: '15px' }}>
          <div className="dashboard-card-title">战区信息</div>
          <div className="dashboard-card-content">
            <div className="city-info-item">
              <span className="city-info-label">竞技类型</span>
              <span className="city-info-value">{ATHLETICS_TYPE_NAMES[areaDetail.AthleticsType]}</span>
            </div>
            <div className="city-info-item">
              <span className="city-info-label">竞技模式</span>
              <span className="city-info-value">{ATHLETICS_MODE_NAMES[areaDetail.AthleticsMode]}</span>
            </div>
            <div className="city-info-item">
              <span className="city-info-label">人数要求</span>
              <span className="city-info-value">{areaDetail.ManHow} 人</span>
            </div>
          </div>
        </div>

        {/* 报名操作 */}
        {!isOpen ? (
          <div style={{
            padding: '15px',
            background: 'rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#ef4444',
            marginTop: '15px',
          }}>
            战场未开放，请稍后再试
          </div>
        ) : userBattleInfo?.battleState === 0 ? (
          <button
            className="building-action"
            onClick={() => handleSignup(areaDetail.ID)}
            disabled={isLoading || !cityId}
            style={{
              width: '100%',
              marginTop: '15px',
              background: '#4ade80',
            }}
          >
            {isLoading ? '处理中...' : '报名参战'}
          </button>
        ) : userBattleInfo?.battleState === 1 ? (
          <div style={{
            padding: '15px',
            background: 'rgba(250, 204, 21, 0.2)',
            borderRadius: '8px',
            textAlign: 'center',
            marginTop: '15px',
          }}>
            <div style={{ color: '#facc15', marginBottom: '10px' }}>
              已报名等待分配
            </div>
            <button
              className="building-action"
              onClick={handleCancel}
              disabled={isLoading}
              style={{ background: '#ef4444', marginRight: '10px' }}
            >
              取消报名
            </button>
            <button
              className="building-action"
              onClick={handleMatch}
              disabled={isLoading}
              style={{ background: '#60a5fa' }}
            >
              刷新匹配
            </button>
          </div>
        ) : userBattleInfo?.battleState === 2 ? (
          <div style={{
            padding: '15px',
            background: 'rgba(74, 222, 128, 0.2)',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#4ade80',
            marginTop: '15px',
          }}>
            战斗中...
          </div>
        ) : null}
      </div>
    );
  };

  // 渲染等待列表
  const renderWaitingList = () => {
    if (!waitingList) return null;

    return (
      <div className="warfare-waiting" style={{ marginTop: '20px' }}>
        <h4 style={{ color: '#ffd700', marginBottom: '10px' }}>各等级段等待人数</h4>
        <div className="dashboard-card">
          <div className="dashboard-card-content">
            {waitingList.waitingByLevel.slice(1).map((count, index) => (
              <div key={index} className="city-info-item">
                <span className="city-info-label">{LEVEL_SEGMENT_NAMES[index]}</span>
                <span className="city-info-value" style={{ color: count > 0 ? '#4ade80' : '#666' }}>
                  {count} 人
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 渲染我的参战状态
  const renderMyStatus = () => (
    <div className="warfare-status">
      <h3 style={{ color: '#ffd700', marginBottom: '15px' }}>我的参战状态</h3>
      
      {userBattleInfo ? (
        <div className="dashboard-card">
          <div className="dashboard-card-title">当前状态</div>
          <div className="dashboard-card-content">
            <div className="city-info-item">
              <span className="city-info-label">战斗状态</span>
              <span className="city-info-value" style={{
                color: userBattleInfo.battleState === 2 ? '#4ade80' :
                       userBattleInfo.battleState === 1 ? '#facc15' : '#666',
              }}>
                {BATTLE_STATE_NAMES[userBattleInfo.battleState]}
              </span>
            </div>
            
            {userBattleInfo.battleState > 0 && (
              <>
                <div className="city-info-item">
                  <span className="city-info-label">竞技类型</span>
                  <span className="city-info-value">
                    {ATHLETICS_TYPE_NAMES[userBattleInfo.AthleticsType]}
                  </span>
                </div>
                <div className="city-info-item">
                  <span className="city-info-label">战斗模式</span>
                  <span className="city-info-value">
                    {ATHLETICS_MODE_NAMES[userBattleInfo.battleType] || '未知'}
                  </span>
                </div>
                <div className="city-info-item">
                  <span className="city-info-label">城市</span>
                  <span className="city-info-value">{userBattleInfo.cityName}</span>
                </div>
                {userBattleInfo.heroName && (
                  <div className="city-info-item">
                    <span className="city-info-label">参战武将</span>
                    <span className="city-info-value">
                      {userBattleInfo.heroName} (Lv.{userBattleInfo.heroLevel})
                    </span>
                  </div>
                )}
                <div className="city-info-item">
                  <span className="city-info-label">等级段</span>
                  <span className="city-info-value">
                    {LEVEL_SEGMENT_NAMES[userBattleInfo.levelSegment - 1] || `段${userBattleInfo.levelSegment}`}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          加载中...
        </div>
      )}

      {userBattleInfo?.battleState === 1 && (
        <div style={{ marginTop: '15px' }}>
          <button
            className="building-action"
            onClick={handleMatch}
            disabled={isLoading}
            style={{ width: '100%', background: '#60a5fa' }}
          >
            刷新匹配状态
          </button>
          <button
            className="building-action"
            onClick={handleCancel}
            disabled={isLoading}
            style={{ width: '100%', marginTop: '10px', background: '#ef4444' }}
          >
            取消报名
          </button>
        </div>
      )}
    </div>
  );

  // 渲染战斗结果
  const renderBattleResult = () => (
    <div className="warfare-result">
      <h3 style={{ color: '#ffd700', marginBottom: '15px' }}>战斗结果</h3>
      
      {battleResult ? (
        <div className="dashboard-card">
          <div className="dashboard-card-title" style={{
            color: battleResult.result === 1 ? '#4ade80' :
                   battleResult.result === 0 ? '#ef4444' : '#aaa',
          }}>
            {battleResult.result === 1 ? '🏆 胜利' :
             battleResult.result === 0 ? '💀 失败' : '暂无结果'}
          </div>
          
          {battleResult.result !== null && (
            <div className="dashboard-card-content">
              <div className="city-info-item">
                <span className="city-info-label">战区</span>
                <span className="city-info-value">{battleResult.roomName}</span>
              </div>
              
              {battleResult.rewards && (
                <>
                  <div className="city-info-item">
                    <span className="city-info-label">战斗评价</span>
                    <span className="city-info-value" style={{ color: '#ffd700' }}>
                      {battleResult.rewards.rating}
                    </span>
                  </div>
                  <div className="city-info-item">
                    <span className="city-info-label">胜利点数</span>
                    <span className="city-info-value">+{battleResult.rewards.victoryPoint}</span>
                  </div>
                  <div className="city-info-item">
                    <span className="city-info-label">战勋</span>
                    <span className="city-info-value" style={{ color: '#ffd700' }}>
                      +{battleResult.rewards.warExploit}
                    </span>
                  </div>
                  <div className="city-info-item">
                    <span className="city-info-label">经验</span>
                    <span className="city-info-value">+{battleResult.rewards.exp}</span>
                  </div>
                  <div className="city-info-item">
                    <span className="city-info-label">金币</span>
                    <span className="city-info-value" style={{ color: '#ffd700' }}>
                      +{battleResult.rewards.gold}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          暂无战斗结果
        </div>
      )}
      
      <button
        className="building-action"
        onClick={fetchBattleResult}
        disabled={isLoading}
        style={{ width: '100%', marginTop: '15px', background: '#60a5fa' }}
      >
        刷新结果
      </button>
    </div>
  );

  return (
    <div className="warfare-panel" style={{ padding: '15px' }}>
      {/* 标题 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <h2 style={{ color: '#ffd700' }}>⚔️ 名城战役</h2>
        <div style={{
          padding: '5px 10px',
          background: isOpen ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          borderRadius: '20px',
          color: isOpen ? '#4ade80' : '#ef4444',
          fontSize: '12px',
        }}>
          {isOpen ? '战场开放' : '战场关闭'}
        </div>
      </div>

      {/* 错误和消息提示 */}
      {renderError()}
      {renderActionMessage()}

      {/* 主标签页 */}
      <div className="warfare-main-tabs" style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '1px solid #333',
        paddingBottom: '10px',
      }}>
        {(['areas', 'status', 'result'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="building-action"
            style={{
              background: activeTab === tab ? '#ffd700' : 'transparent',
              color: activeTab === tab ? '#000' : '#ffd700',
              border: activeTab === tab ? 'none' : '1px solid #ffd700',
            }}
          >
            {tab === 'areas' ? '📋 战区' :
             tab === 'status' ? '⚔️ 我的状态' : '🏆 战果'}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="warfare-content">
        {activeTab === 'areas' && (
          <div className="warfare-areas-tab">
            {renderAreaTabs()}
            
            <div style={{ display: 'flex', gap: '20px' }}>
              {/* 左侧：战区列表 */}
              <div style={{ flex: 1 }}>
                {renderAreaList()}
                {renderWaitingList()}
              </div>
              
              {/* 右侧：战区详情 */}
              <div style={{ flex: 1 }}>
                {renderAreaDetail()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="warfare-status-tab">
            {renderMyStatus()}
          </div>
        )}

        {activeTab === 'result' && (
          <div className="warfare-result-tab">
            {renderBattleResult()}
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div style={{
        marginTop: '20px',
        paddingTop: '15px',
        borderTop: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <button
          className="building-action"
          onClick={() => {
            fetchUserBattleInfo();
            fetchWaitingList();
            fetchAreas();
          }}
          style={{ background: '#60a5fa' }}
        >
          🔄 刷新数据
        </button>
        
        {userBattleInfo?.battleState === 2 && (
          <button
            className="building-action"
            onClick={() => {
              fetchBattleInfo();
              fetchBattleResult();
              setActiveTab('result');
            }}
            style={{ background: '#4ade80' }}
          >
            进入战场 ⚔️
          </button>
        )}
      </div>
    </div>
  );
};

export default WarfarePanel;
