/**
 * FPS 性能监控组件
 * 实时显示 FPS、内存使用、渲染时间等指标
 */
import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import './styles.css';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memory: number | null;
  jsHeapSize: number | null;
}

interface PerformanceHistory {
  fps: number[];
  frameTime: number[];
}

const MAX_HISTORY = 60;

export const PerformanceMonitor: React.FC = memo(() => {
  const showPerformanceMonitor = useAppStore((state) => state.showPerformanceMonitor);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memory: null,
    jsHeapSize: null,
  });
  const [history, setHistory] = useState<PerformanceHistory>({
    fps: [],
    frameTime: [],
  });
  const [expanded, setExpanded] = useState(false);

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef<number>(0);

  const updateMetrics = useCallback(() => {
    const now = performance.now();
    frameCountRef.current++;

    // 每秒更新一次
    if (now - lastTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
      const frameTime = Math.round((now - lastTimeRef.current) / frameCountRef.current * 100) / 100;

      // 获取内存信息（仅 Chrome 支持）
      let memory: number | null = null;
      let jsHeapSize: number | null = null;
      
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        memory = Math.round(memInfo.usedJSHeapSize / 1024 / 1024);
        jsHeapSize = Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024);
      }

      setMetrics({ fps, frameTime, memory, jsHeapSize });
      setHistory((prev) => ({
        fps: [...prev.fps.slice(-MAX_HISTORY + 1), fps],
        frameTime: [...prev.frameTime.slice(-MAX_HISTORY + 1), frameTime],
      }));

      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    rafIdRef.current = requestAnimationFrame(updateMetrics);
  }, []);

  useEffect(() => {
    if (showPerformanceMonitor) {
      rafIdRef.current = requestAnimationFrame(updateMetrics);
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [showPerformanceMonitor, updateMetrics]);

  if (!showPerformanceMonitor) return null;

  const avgFps = history.fps.length > 0
    ? Math.round(history.fps.reduce((a, b) => a + b, 0) / history.fps.length)
    : 0;

  const minFps = history.fps.length > 0 ? Math.min(...history.fps) : 0;
  const maxFps = history.fps.length > 0 ? Math.max(...history.fps) : 0;

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return '#00ff00';
    if (fps >= 30) return '#ffff00';
    return '#ff3333';
  };

  return (
    <div className={`perf-monitor ${expanded ? 'expanded' : ''}`}>
      <div className="perf-header" onClick={() => setExpanded(!expanded)}>
        <span className="perf-fps" style={{ color: getFpsColor(metrics.fps) }}>
          {metrics.fps} FPS
        </span>
        <span className="perf-toggle">{expanded ? '▼' : '▲'}</span>
      </div>

      {expanded && (
        <div className="perf-details">
          <div className="perf-row">
            <span className="perf-label">Frame Time:</span>
            <span className="perf-value">{metrics.frameTime}ms</span>
          </div>
          <div className="perf-row">
            <span className="perf-label">Avg FPS:</span>
            <span className="perf-value">{avgFps}</span>
          </div>
          <div className="perf-row">
            <span className="perf-label">Min/Max:</span>
            <span className="perf-value">{minFps}/{maxFps}</span>
          </div>
          {metrics.memory !== null && (
            <div className="perf-row">
              <span className="perf-label">Memory:</span>
              <span className="perf-value">{metrics.memory}MB / {metrics.jsHeapSize}MB</span>
            </div>
          )}

          {/* FPS 图表 */}
          <div className="perf-chart">
            <svg viewBox="0 0 120 40" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke={getFpsColor(avgFps)}
                strokeWidth="1"
                points={history.fps
                  .map((fps, i) => `${(i / MAX_HISTORY) * 120},${40 - (fps / 60) * 40}`)
                  .join(' ')}
              />
              {/* 60 FPS 参考线 */}
              <line x1="0" y1="0" x2="120" y2="0" stroke="rgba(0,255,0,0.3)" strokeDasharray="2" />
              {/* 30 FPS 参考线 */}
              <line x1="0" y1="20" x2="120" y2="20" stroke="rgba(255,255,0,0.3)" strokeDasharray="2" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

export default PerformanceMonitor;
