/**
 * IoT WebSocket Hook
 * 连接 ghost-live 接收实时 IoT 数据
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const LIVE_WS_URL = 'wss://live.free-node.xyz';

export interface IotDataPoint {
  temp: number;
  humidity: number;
  device_id: string;
  timestamp: string;
  location?: string; // 新增位置字段
  id?: number;
}

export interface IotLogEntry {
  type: 'data' | 'system' | 'alert';
  message: string;
  timestamp: Date;
}

interface IotState {
  connected: boolean;
  latestData: IotDataPoint | null;
  logs: IotLogEntry[];
  isOverheat: boolean;
}

export function useIotWebSocket() {
  const [state, setState] = useState<IotState>({
    connected: false,
    latestData: null,
    logs: [],
    isOverheat: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);

  const addLog = useCallback((type: IotLogEntry['type'], message: string) => {
    setState(prev => ({
      ...prev,
      logs: [
        { type, message, timestamp: new Date() },
        ...prev.logs.slice(0, 49), // 保留最近50条
      ],
    }));
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(LIVE_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setState(prev => ({ ...prev, connected: true }));
        addLog('system', 'WebSocket connection established');

        pingIntervalRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // 处理安全传感器数据广播 (从 ghost-iot 发送)
          if (data.type === 'security_alert' && data.data) {
            const { temp, humidity, timestamp, location } = data.data;
            const iotData: IotDataPoint = {
              temp,
              humidity,
              device_id: 'GHOST_ROOM_01',
              timestamp: new Date(timestamp * 1000).toISOString(),
              location: location || undefined,
            };
            const isOverheat = temp > 30;

            setState(prev => ({
              ...prev,
              latestData: iotData,
              isOverheat,
            }));

            const locationStr = location ? ` @ ${location}` : '';
            addLog(
              isOverheat ? 'alert' : 'data',
              `接收到来自节点 01 的数据包${locationStr}: ${temp.toFixed(1)}°C / ${humidity.toFixed(1)}%`
            );

            if (isOverheat) {
              addLog('alert', `⚠️ 核心过热警告: ${temp.toFixed(1)}°C 超过阈值!`);
            }
          }

          // 兼容旧的 iot_update 消息
          if (data.type === 'iot_update' && data.data) {
            const iotData = data.data as IotDataPoint;
            const isOverheat = iotData.temp > 30;

            setState(prev => ({
              ...prev,
              latestData: iotData,
              isOverheat,
            }));

            const locationStr = iotData.location ? ` @ ${iotData.location}` : '';
            addLog(
              isOverheat ? 'alert' : 'data',
              `[${iotData.device_id}]${locationStr} Temp: ${iotData.temp}°C, Humidity: ${iotData.humidity}%`
            );
          }
        } catch {
          // 忽略解析错误
        }
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, connected: false }));
        addLog('system', 'Connection lost. Reconnecting...');
        cleanup();
        reconnectTimeoutRef.current = window.setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      reconnectTimeoutRef.current = window.setTimeout(connect, 5000);
    }
  }, [addLog]);

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
