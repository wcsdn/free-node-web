/**
 * 实时在线人数 Hook
 * 连接 ghost-live WebSocket
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// 统一使用线上地址（本地开发也连线上）
const LIVE_WS_URL = 'wss://live.free-node.xyz';

interface LiveState {
  count: number;
  connected: boolean;
  announcement: string | null;
}

export function useLivePresence() {
  const [state, setState] = useState<LiveState>({
    count: 0,
    connected: false,
    announcement: null,
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(LIVE_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setState(prev => ({ ...prev, connected: true }));
        
        // 心跳保活
        pingIntervalRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'welcome':
            case 'count':
              setState(prev => ({ ...prev, count: data.count }));
              break;
            case 'announcement':
              setState(prev => ({ ...prev, announcement: data.message }));
              // 5秒后清除公告
              setTimeout(() => {
                setState(prev => ({ ...prev, announcement: null }));
              }, 5000);
              break;
          }
        } catch {
          // 忽略解析错误
        }
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, connected: false }));
        cleanup();
        // 5秒后重连
        reconnectTimeoutRef.current = window.setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // 连接失败，稍后重试
      reconnectTimeoutRef.current = window.setTimeout(connect, 5000);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [cleanup]);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return state;
}
