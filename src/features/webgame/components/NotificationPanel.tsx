/**
 * NotificationPanel - 消息通知面板 (简化版)
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';
import { getApiBase, getAuthHeaders } from '../utils/api';

interface Notification {
  id: number;
  title: string;
  content: string;
  time: string;
  read: boolean;
}

interface NotificationPanelProps {
  onClose?: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiBase()}/api/notification`, {
      headers: getAuthHeaders(),
    }).then(res => res.json()).then(data => {
      if (data.success) setNotifications(data.data || []);
      setLoading(false);
    });
  }, []);

  const handleRead = async (id: number) => {
    await fetch(`${getApiBase()}/api/notification/${id}/read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <GameCard title="消息通知">
      {loading ? <p>加载中...</p> : (
        <>
          {notifications.length === 0 ? (
            <p style={{ color: '#888' }}>暂无消息</p>
          ) : (
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleRead(n.id)}
                  style={{
                    padding: 10,
                    marginBottom: 10,
                    background: n.read ? 'transparent' : 'rgba(0, 255, 0, 0.1)',
                    border: '1px solid #333',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#00FF00' }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{n.content}</div>
                  <div style={{ fontSize: 10, color: '#666' }}>{n.time}</div>
                </div>
              ))}
            </div>
          )}
          <GameButton onClick={onClose} style={{ marginTop: 10 }}>关闭</GameButton>
        </>
      )}
    </GameCard>
  );
};

export default NotificationPanel;
