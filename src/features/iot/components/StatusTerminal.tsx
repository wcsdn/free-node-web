/**
 * 状态终端 - 显示滚动日志
 */

import React, { useRef, useEffect } from 'react';
import type { IotLogEntry } from '../hooks/useIotWebSocket';

interface StatusTerminalProps {
  logs: IotLogEntry[];
  connected: boolean;
  isZh: boolean;
}

export const StatusTerminal: React.FC<StatusTerminalProps> = ({ logs }) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = 0;
    }
  }, [logs]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const getLogColor = (type: IotLogEntry['type']) => {
    switch (type) {
      case 'alert':
        return '#ff0040';
      case 'system':
        return '#00d4ff';
      default:
        return '#00ff41';
    }
  };

  const getLogPrefix = (type: IotLogEntry['type']) => {
    switch (type) {
      case 'alert':
        return '警告';
      case 'system':
        return '系统';
      default:
        return '数据';
    }
  };

  return (
    <div className="terminal-body" ref={terminalRef}>
      {logs.length === 0 ? (
        <div className="terminal-empty">
          等待数据流...
        </div>
      ) : (
        logs.map((log, index) => (
          <div key={index} className="log-entry" style={{ color: getLogColor(log.type) }}>
            <span className="log-time">[{formatTime(log.timestamp)}]</span>
            <span className="log-prefix">[{getLogPrefix(log.type)}]</span>
            <span className="log-message">{log.message}</span>
          </div>
        ))
      )}
    </div>
  );
};
