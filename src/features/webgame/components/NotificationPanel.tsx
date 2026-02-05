/**
 * 通知面板组件
 * 系统通知、活动通知
 */
import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../utils/api';

interface Notification {
  id: number;
  type: number;
  title: string;
  content: string;
  priority: number;
  image_url?: string;
  link_url?: string;
  is_read: number;
  created_at: string;
}

const NotificationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchNotifications();
  }, [selectedType, page]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let url = `/api/notification/list?page=${page}&limit=${limit}`;
      if (selectedType !== null) {
        url += `&type=${selectedType}`;
      }

      const res = await apiGet<{
        success: boolean;
        data: {
          notifications: Notification[];
          total: number;
        };
      }>(url);

      if (res.success) {
        setNotifications(res.data.notifications || []);
      }

      // 获取未读数量
      const unreadRes = await apiGet<{
        success: boolean;
        data: { count: number };
      }>('/api/notification/unread/count');

      if (unreadRes.success) {
        setTotalUnread(unreadRes.data.count);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiPost(`/api/notification/${id}/read`, {});
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiPost('/api/notification/read-all', {});
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDelete(`/api/notification/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    setSelectedNotification(notification);
    if (notification.is_read === 0) {
      await handleMarkAsRead(notification.id);
    }
  };

  const getTypeName = (type: number) => {
    switch (type) {
      case 1: return '系统';
      case 2: return '活动';
      case 3: return '个人';
      case 4: return '公告';
      default: return '通知';
    }
  };

  const getTypeColor = (type: number) => {
    switch (type) {
      case 1: return '#1976d2';
      case 2: return '#f57c00';
      case 3: return '#7b1fa2';
      case 4: return '#d32f2f';
      default: return '#666';
    }
  };

  const getPriorityName = (priority: number) => {
    switch (priority) {
      case 0: return '普通';
      case 1: return '重要';
      case 2: return '紧急';
      default: return '';
    }
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  const filteredNotifications = selectedType !== null
    ? notifications.filter(n => n.type === selectedType)
    : notifications;

  if (loading) {
    return (
      <div style={{ color: '#000', textAlign: 'center', padding: '40px' }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ color: '#000', minWidth: '400px', maxWidth: '500px' }}>
      {/* 标题栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '1px solid #ddd'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {selectedNotification && (
            <button
              onClick={() => setSelectedNotification(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '5px'
              }}
            >
              ←
            </button>
          )}
          <h3 style={{ margin: 0 }}>
            {selectedNotification ? '通知详情' : '消息通知'}
          </h3>
          {totalUnread > 0 && !selectedNotification && (
            <span style={{
              background: '#f44336',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px'
            }}>
              {totalUnread}
            </span>
          )}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>×</button>
      </div>

      {/* 通知详情 */}
      {selectedNotification ? (
        <div>
          <div style={{
            padding: '15px',
            background: '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
              {selectedNotification.title}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <span style={{
                padding: '2px 8px',
                background: getTypeColor(selectedNotification.type),
                color: '#fff',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {getTypeName(selectedNotification.type)}
              </span>
              {selectedNotification.priority > 0 && (
                <span style={{
                  padding: '2px 8px',
                  background: selectedNotification.priority === 2 ? '#d32f2f' : '#f57c00',
                  color: '#fff',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {getPriorityName(selectedNotification.priority)}
                </span>
              )}
              <span style={{ fontSize: '12px', color: '#666' }}>
                {formatTime(selectedNotification.created_at)}
              </span>
            </div>
          </div>

          <div style={{
            lineHeight: '1.8',
            whiteSpace: 'pre-wrap',
            padding: '15px',
            background: '#f9f9f9',
            borderRadius: '8px',
            minHeight: '150px'
          }}>
            {selectedNotification.content}
          </div>

          {selectedNotification.link_url && (
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <a
                href={selectedNotification.link_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '10px 30px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#fff',
                  borderRadius: '20px',
                  textDecoration: 'none'
                }}
              >
                点击查看详情
              </a>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 筛选和操作 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setSelectedType(null); setPage(1); }}
                style={{
                  padding: '6px 12px',
                  background: selectedType === null ? '#1976d2' : '#f0f0f0',
                  color: selectedType === null ? '#fff' : '#666',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                全部
              </button>
              <button
                onClick={() => { setSelectedType(1); setPage(1); }}
                style={{
                  padding: '6px 12px',
                  background: selectedType === 1 ? '#1976d2' : '#f0f0f0',
                  color: selectedType === 1 ? '#fff' : '#666',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                系统
              </button>
              <button
                onClick={() => { setSelectedType(2); setPage(1); }}
                style={{
                  padding: '6px 12px',
                  background: selectedType === 2 ? '#f57c00' : '#f0f0f0',
                  color: selectedType === 2 ? '#fff' : '#666',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                活动
              </button>
              <button
                onClick={() => { setSelectedType(4); setPage(1); }}
                style={{
                  padding: '6px 12px',
                  background: selectedType === 4 ? '#d32f2f' : '#f0f0f0',
                  color: selectedType === 4 ? '#fff' : '#666',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                公告
              </button>
            </div>

            {totalUnread > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  padding: '6px 12px',
                  background: '#4caf50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                全部已读
              </button>
            )}
          </div>

          {/* 通知列表 */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                暂无通知
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '12px',
                    marginBottom: '10px',
                    background: notification.is_read === 0 ? '#e3f2fd' : '#f9f9f9',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: '1px solid #eee',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {notification.is_read === 0 && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            background: '#1976d2',
                            borderRadius: '50%'
                          }} />
                        )}
                        <span style={{
                          padding: '2px 6px',
                          background: getTypeColor(notification.type),
                          color: '#fff',
                          borderRadius: '4px',
                          fontSize: '10px'
                        }}>
                          {getTypeName(notification.type)}
                        </span>
                        {notification.priority > 0 && (
                          <span style={{
                            padding: '2px 6px',
                            background: notification.priority === 2 ? '#d32f2f' : '#f57c00',
                            color: '#fff',
                            borderRadius: '4px',
                            fontSize: '10px'
                          }}>
                            {getPriorityName(notification.priority)}
                          </span>
                        )}
                        <span style={{ fontSize: '12px', color: '#999' }}>
                          {formatTime(notification.created_at)}
                        </span>
                      </div>

                      <div style={{
                        fontWeight: notification.is_read === 0 ? 'bold' : 'normal',
                        marginBottom: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {notification.title}
                      </div>

                      <div style={{
                        fontSize: '12px',
                        color: '#666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {notification.content}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        style={{
                          padding: '4px 8px',
                          background: '#f44336',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '10px'
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationPanel;
