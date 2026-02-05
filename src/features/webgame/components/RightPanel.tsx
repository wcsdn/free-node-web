/**
 * 右面板组件
 * 从 Main.aspx rightpanel 部分迁移
 */
import React, { memo, useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../utils/api';
import styles from '../styles/jxMain.module.css';
import Popup from './Popup';
import HelpPanel from './HelpPanel';
import SigninPanel from './SigninPanel';
import DailyPanel from './DailyPanel';
import NotificationPanel from './NotificationPanel';

interface RightPanelProps {
  gameNotice?: string;
  walletAddress?: string;
}

const RightPanel: React.FC<RightPanelProps> = memo(({ gameNotice, walletAddress }) => {
  const [showPanel, setShowPanel] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasSignedToday, setHasSignedToday] = useState(false);

  useEffect(() => {
    // 加载未读通知数量
    const fetchUnreadCount = async () => {
      try {
        const res = await apiGet<{ success: boolean; data: { count: number } }>('/api/notification/unread/count');
        if (res.success) {
          setUnreadCount(res.data.count);
        }
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    // 加载签到状态
    const fetchSigninStatus = async () => {
      try {
        const res = await apiGet<{ success: boolean; data: { has_signed_today: boolean } }>('/api/signin/info');
        if (res.success) {
          setHasSignedToday(res.data.has_signed_today);
        }
      } catch (err) {
        console.error('Failed to fetch signin status:', err);
      }
    };

    if (walletAddress) {
      fetchUnreadCount();
      fetchSigninStatus();
    }
  }, [walletAddress]);

  const handleOpenPanel = (panel: string) => {
    setShowPanel(panel);
  };

  const handleClosePanel = () => {
    setShowPanel(null);
    // 刷新状态
    if (walletAddress) {
      apiGet<{ success: boolean; data: { has_signed_today: boolean } }>('/api/signin/info').then(res => {
        if (res.success) setHasSignedToday(res.data.has_signed_today);
      });
      apiGet<{ success: boolean; data: { count: number } }>('/api/notification/unread/count').then(res => {
        if (res.success) setUnreadCount(res.data.count);
      });
    }
  };

  const renderPanel = () => {
    switch (showPanel) {
      case 'help':
        return <HelpPanel onClose={handleClosePanel} />;
      case 'signin':
        return <SigninPanel onClose={handleClosePanel} />;
      case 'daily':
        return <DailyPanel onClose={handleClosePanel} />;
      case 'notification':
        return <NotificationPanel onClose={handleClosePanel} />;
      default:
        return null;
    }
  };

  return (
    <div id="rightpanel" className={styles.rightPanel}>
      {/* 功能入口按钮 */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '10px',
        background: 'rgba(0,0,0,0.3)',
        marginBottom: '10px',
        borderRadius: '8px'
      }}>
        {/* 帮助按钮 */}
        <button
          onClick={() => handleOpenPanel('help')}
          style={{
            padding: '8px 12px',
            background: 'linear-gradient(135deg, #4CAF50, #8BC34A)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📖 帮助
        </button>

        {/* 签到按钮 */}
        <button
          onClick={() => handleOpenPanel('signin')}
          style={{
            padding: '8px 12px',
            background: hasSignedToday ? '#9e9e9e' : 'linear-gradient(135deg, #FF9800, #FFC107)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {hasSignedToday ? '✓ 已签到' : '📅 签到'}
        </button>

        {/* 每日任务按钮 */}
        <button
          onClick={() => handleOpenPanel('daily')}
          style={{
            padding: '8px 12px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ✅ 每日
        </button>

        {/* 通知按钮 */}
        <button
          onClick={() => handleOpenPanel('notification')}
          style={{
            padding: '8px 12px',
            background: 'linear-gradient(135deg, #f44336, #e91e63)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            position: 'relative'
          }}
        >
          🔔 通知
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: '#fff',
              color: '#f44336',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 弹出的面板 */}
      {showPanel && (
        <Popup
          type="custom"
          title=""
          onClose={handleClosePanel}
        >
          {renderPanel()}
        </Popup>
      )}

      <div id="sidebav" className={styles.sideNav}>
        <ul id="chalink">
          <li><a id="p_12" className="nav_a_12" href="#">竞技</a></li>
          <li><a className="nav_a_13" href="#">商城</a></li>
          <li><a id="p_8" className="nav_a_8" href="#">消息</a></li>
          <li><a id="p_9" className="nav_a_9" href="#">市场</a></li>
          <li><a id="p_10" className="nav_a_10" href="#">任务</a></li>
          <li><a id="p_11" className="nav_a_11" href="#">排行</a></li>
          <li><a href="#" onClick={() => window.open('/jx/Web/tyro_help_CN.html', '_blank')}>帮助</a></li>
        </ul>
        <div id="gamenews" className={styles.gameNews}>
          <span className={styles.gonggao}>{gameNotice || '欢迎来到剑侠情缘！'}</span>
        </div>
      </div>

      <div id="eventinfo"></div>
      
      <div id="trees">
        {/* 排行榜等树形结构 */}
      </div>

      {/* 聊天窗口 */}
      <div id="main" className={styles.chatWindow}>
        <div id="ChatHead">
          <span style={{ float: 'left', fontSize: '12px', color: '#000' }}>世界聊天</span>
          <a href="#" onClick={() => {}}><img src="/jx/Web/img/o/22.gif" alt="关闭" /></a>
        </div>
        <div id="ChatBody" className={styles.chatBody}>
          <div id="ChatContent" className={styles.chatContent}>
            <div id="ChatMessageList"></div>
          </div>
          <div className={styles.chatSend}>
            <input 
              className={styles.input_message2} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // 发送消息逻辑
                }
              }}
              type="text" 
              id="input_line_wor" 
              placeholder="输入消息..."
            />
          </div>
        </div>
        <div className={styles.sendchatmessage2}>
          <a href="#" onClick={() => {}}>
            <img src="/jx/Web/img/o/49.GIF" alt="发送" />
          </a>
        </div>
      </div>
    </div>
  );
});

RightPanel.displayName = 'RightPanel';

export default RightPanel;
