/**
 * 趋势图表组件
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useLanguage } from '@/shared/hooks/useLanguage';
import type { IotDataPoint } from '../hooks/useIotWebSocket';

interface TrendChartProps {
  data: IotDataPoint[];
  isOverheat: boolean;
  isZh: boolean;
  currentTime?: number; // 添加当前时间参数，用于触发更新
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, isOverheat, isZh, currentTime }) => {
  const { t } = useLanguage();
  
  // 一次性提取翻译文本
  const i18n = {
    noDataAvailable: t('noDataAvailable') || '暂无数据',
    envTemperature: t('envTemperature') || '温度',
    relativeHumidity: t('relativeHumidity') || '湿度',
  };
  // 生成包含当前时间的完整时间轴数据
  const chartData = useMemo(() => {
    // 使用 currentTime 确保定时更新
    const now = currentTime || Date.now();
    if (data.length === 0) {
      // 如果没有任何数据，生成最近 30 分钟的空时间点
      return Array.from({ length: 30 }, (_, i) => {
        const timestamp = now - (29 - i) * 60 * 1000; // 每分钟一个点
        return {
          timestamp: new Date(timestamp).toISOString(),
          time: new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          temp: undefined,
          humidity: undefined,
          device_id: '',
        };
      });
    }

    // 反转数据（最新在后）
    const reversedData = [...data].reverse();
    
    // 获取最早和当前时间
    const oldestTime = new Date(reversedData[0].timestamp).getTime();
    
    // 计算时间跨度（分钟）
    const timeSpanMinutes = Math.ceil((now - oldestTime) / (60 * 1000));
    const maxPoints = 30; // 最多显示 30 个点
    
    // 如果时间跨度小于 30 分钟，补充到当前时间
    if (timeSpanMinutes < maxPoints) {
      const result: any[] = [...reversedData];
      const lastDataTime = new Date(reversedData[reversedData.length - 1].timestamp).getTime();
      
      // 从最后一个数据点到现在，每分钟补充一个空点
      const minutesToAdd = Math.ceil((now - lastDataTime) / (60 * 1000));
      for (let i = 1; i <= minutesToAdd; i++) {
        const timestamp = lastDataTime + i * 60 * 1000;
        if (timestamp <= now) {
          result.push({
            timestamp: new Date(timestamp).toISOString(),
            time: new Date(timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
            temp: undefined,
            humidity: undefined,
            device_id: '',
          });
        }
      }
      
      return result.map(item => ({
        ...item,
        time: new Date(item.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      }));
    }
    
    // 如果数据点太多，只取最近的 30 个
    return reversedData.slice(-maxPoints).map(item => ({
      ...item,
      time: new Date(item.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    }));
  }, [data, currentTime]);

  const tempColor = isOverheat ? '#ff0040' : '#00ff41';
  const humidityColor = '#00d4ff';

  if (chartData.length === 0) {
    return (
      <div className="chart-container">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '200px',
          color: 'rgba(0, 255, 0, 0.5)',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px'
        }}>
          {i18n.noDataAvailable}
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 65, 0.1)" />
          <XAxis
            dataKey="time"
            stroke="#00ff41"
            tick={{ fill: '#00ff41', fontSize: 10 }}
            tickLine={{ stroke: '#00ff41' }}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="temp"
            orientation="left"
            stroke={tempColor}
            tick={{ fill: tempColor, fontSize: 10 }}
            tickLine={{ stroke: tempColor }}
            domain={['auto', 'auto']}
          />
          <YAxis
            yAxisId="humidity"
            orientation="right"
            stroke={humidityColor}
            tick={{ fill: humidityColor, fontSize: 10 }}
            tickLine={{ stroke: humidityColor }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid #00ff41',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#00ff41' }}
          />
          <Legend
            wrapperStyle={{ color: '#00ff41', fontSize: 11 }}
            iconType="line"
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="temp"
            name={`${i18n.envTemperature} (°C)`}
            stroke={tempColor}
            strokeWidth={2}
            dot={{ fill: tempColor, strokeWidth: 0, r: 2 }}
            activeDot={{ r: 4, fill: tempColor }}
            connectNulls={false}
          />
          <Line
            yAxisId="humidity"
            type="monotone"
            dataKey="humidity"
            name={`${i18n.relativeHumidity} (%)`}
            stroke={humidityColor}
            strokeWidth={2}
            dot={{ fill: humidityColor, strokeWidth: 0, r: 2 }}
            activeDot={{ r: 4, fill: humidityColor }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
