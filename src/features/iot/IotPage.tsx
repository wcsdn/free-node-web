/**
 * IoT 监控中心页面 - 赛博朋克风格
 */
import React, { useMemo, useState, useEffect } from 'react';
import PageLayout from '@/shared/layouts/PageLayout';
import { useIotWebSocket } from './hooks/useIotWebSocket';
import { useIotHistory } from './hooks/useIotHistory';
import { StatusTerminal } from './components/StatusTerminal';
import { TrendChart } from './components/TrendChart';
import { useLanguage } from '@/shared/hooks/useLanguage';
import './IotPage.css';

const IotPage: React.FC = () => {
  const { t } = useLanguage();
  
  // 一次性提取所有翻译文本，避免重复调用
  const i18n = {
    title: t('iotMonitor') || '>> 环境监控终端 GHOST-IOT-01',
    realTimeConnection: t('realTimeConnection') || '实时连接',
    connectionLost: t('connectionLost') || '连接断开',
    lastSync: t('lastSync') || '最后同步',
    loadingData: t('loadingData') || '加载中...',
    refreshData: t('refreshData') || '↻ 刷新数据',
    physicalNodeStatus: t('physicalNodeStatus') || '物理节点状态',
    online: t('online') || 'ONLINE',
    offline: t('offline') || 'OFFLINE',
    coreOverheatWarning: t('coreOverheatWarning') || '核心过热警告:',
    envTemperature: t('envTemperature') || '环境温度',
    overThreshold: t('overThreshold') || '⚠️ 超过安全阈值',
    normalRange: t('normalRange') || '正常范围',
    relativeHumidity: t('relativeHumidity') || '相对湿度',
    high: t('high') || '偏高',
    totalRecords: t('totalRecords') || '总记录数',
    avgHumidity: t('avgHumidity') || '平均湿度',
    avgTemperature: t('avgTemperature') || '平均温度',
    tempRange: t('tempRange') || '温度范围',
    tempWaveform: t('tempWaveform') || '📈 温度波动曲线',
    recentRecords: t('recentRecords') || '最近 30 条数据记录',
    realTimeDataStream: t('realTimeDataStream') || '💻 实时数据流',
    systemLogs: t('systemLogs') || '系统日志 · 最近 50 条',
    secondsAgo: t('secondsAgo') || '秒前',
    minutesAgo: t('minutesAgo') || '分钟前',
    hoursAgo: t('hoursAgo') || '小时前',
  };
  
  const { connected, latestData, logs, isOverheat } = useIotWebSocket();
  const { history, stats, loading, refresh } = useIotHistory();
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('--');
  const [currentTime, setCurrentTime] = useState(Date.now()); // 用于触发图表更新

  // 更新最后同步时间
  useEffect(() => {
    if (latestData) {
      setLastUpdateTime(new Date());
    }
  }, [latestData]);

  // 每分钟更新一次当前时间，让图表时间轴移动
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // 每分钟更新一次

    return () => clearInterval(timer);
  }, []);

  // 计算距离上次更新的时间
  useEffect(() => {
    if (!lastUpdateTime) return;

    const updateTimer = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastUpdateTime.getTime()) / 1000);
      
      if (diff < 60) {
        setTimeSinceUpdate(`${diff} ${i18n.secondsAgo}`);
      } else if (diff < 3600) {
        setTimeSinceUpdate(`${Math.floor(diff / 60)} ${i18n.minutesAgo}`);
      } else {
        setTimeSinceUpdate(`${Math.floor(diff / 3600)} ${i18n.hoursAgo}`);
      }
    }, 1000);

    return () => clearInterval(updateTimer);
  }, [lastUpdateTime]);

  // 合并实时数据到历史数据（添加 currentTime 作为依赖，确保定时更新）
  const chartData = useMemo(() => {
    // 使用 currentTime 确保每分钟重新计算
    console.log('Chart data updated at:', new Date(currentTime).toLocaleTimeString());
    
    if (!latestData) return history;
    const exists = history.some(
      (h) => h.timestamp === latestData.timestamp && h.device_id === latestData.device_id
    );
    if (exists) return history;
    return [latestData, ...history].slice(0, 30);
  }, [history, latestData, currentTime]);

  // 如果没有实时数据，使用最新的历史数据
  const displayData = latestData || (history.length > 0 ? history[0] : null);

  return (
    <PageLayout title={i18n.title}>
      <div className={`iot-container ${isOverheat ? 'overheat-mode' : ''}`}>
        {/* 过热警告 */}
        {isOverheat && displayData && (
          <div className="overheat-warning">
            <span className="warning-icon">⚠</span>
            <span className="warning-text">
              {i18n.coreOverheatWarning} {displayData.temp.toFixed(1)}°C
            </span>
          </div>
        )}

        {/* 状态栏 */}
        <div className="iot-status-bar">
          <div className="status-left">
            <span className={`connection-dot ${connected ? 'online' : 'offline'}`}>●</span>
            <span className="connection-text">
              {connected ? i18n.realTimeConnection : i18n.connectionLost}
            </span>
            <span className="status-divider">|</span>
            <span className="last-update">
              {i18n.lastSync}: {timeSinceUpdate}
            </span>
          </div>
          <button className="refresh-btn" onClick={refresh} disabled={loading}>
            {loading ? i18n.loadingData : i18n.refreshData}
          </button>
        </div>

        {/* 设备信息卡片 */}
        <div className="device-info-card">
          <div className="device-header">
            <span className="device-icon">📡</span>
            <div className="device-details">
              <div className="device-label">{i18n.physicalNodeStatus}</div>
              <div className="device-id">GHOST_ROOM_01</div>
            </div>
            <div className={`device-status ${connected ? 'online' : 'offline'}`}>
              {connected ? i18n.online : i18n.offline}
            </div>
          </div>
        </div>

        {/* 超大数字显示面板 */}
        <div className="data-panels-large">
          <div className={`data-panel-large ${isOverheat ? 'alert' : ''}`}>
            <div className="panel-label-large">{i18n.envTemperature}</div>
            <div className="panel-value-large">
              <span className="glow-number">{displayData?.temp.toFixed(1) ?? '--.-'}</span>
              <span className="panel-unit-large">°C</span>
            </div>
            <div className="panel-sublabel">
              {isOverheat ? i18n.overThreshold : i18n.normalRange}
            </div>
          </div>
          
          <div className="data-panel-large">
            <div className="panel-label-large">{i18n.relativeHumidity}</div>
            <div className="panel-value-large">
              <span className="glow-number">{displayData?.humidity.toFixed(1) ?? '--.-'}</span>
              <span className="panel-unit-large">%</span>
            </div>
            <div className="panel-sublabel">
              {displayData && displayData.humidity > 70 ? i18n.high : i18n.normalRange}
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-label">{i18n.totalRecords}</div>
                <div className="stat-value">{stats.total}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💧</div>
              <div className="stat-content">
                <div className="stat-label">{i18n.avgHumidity}</div>
                <div className="stat-value">{stats.avg_humidity?.toFixed(1)}%</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🌡️</div>
              <div className="stat-content">
                <div className="stat-label">{i18n.avgTemperature}</div>
                <div className="stat-value">{stats.avg_temp?.toFixed(1)}°C</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-label">{i18n.tempRange}</div>
                <div className="stat-value-small">
                  {stats.min_temp?.toFixed(1)}~{stats.max_temp?.toFixed(1)}°C
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 趋势波形图 */}
        <div className="chart-section">
          <div className="section-header">
            <span className="section-title">{i18n.tempWaveform}</span>
            <span className="section-subtitle">{i18n.recentRecords}</span>
          </div>
          <TrendChart data={chartData} isOverheat={isOverheat} isZh={true} currentTime={currentTime} />
        </div>

        {/* 实时日志终端 */}
        <div className="terminal-section">
          <div className="section-header">
            <span className="section-title">{i18n.realTimeDataStream}</span>
            <span className="section-subtitle">{i18n.systemLogs}</span>
          </div>
          <StatusTerminal logs={logs} connected={connected} isZh={true} />
        </div>

        {/* 页脚信息 */}
        <div className="iot-footer">
          <span>GHOST-IOT :: iot.free-node.xyz</span>
          <span>Cloudflare Workers + D1 + WebSocket</span>
          <span>ESP32-S3 + DHT22 + OLED</span>
        </div>
      </div>
    </PageLayout>
  );
};

export default IotPage;
