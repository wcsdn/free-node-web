/**
 * 消息面板组件
 * 邮件列表、查看邮件、删除邮件
 */
import React, { useState, useEffect, memo } from 'react';
import styles from '../styles/MailPanel.module.css';
import { getApiBase, getAuthHeaders } from '../utils/api';

// 邮件类型
const MAIL_TYPES = {
  0: { name: '新邮件', color: '#f44336' },
  1: { name: '系统', color: '#9D080D' },
  2: { name: '战报', color: '#35c235' },
  3: { name: '消息', color: '#666' },
  4: { name: '交易', color: '#f99608' },
};

interface Mail {
  id: number;
  mail_type: number;
  from_name: string;
  title: string;
  content: string;
  read_tag: number;
  has_attachment: number;
  attachment_data?: string;
  created_at: string;
}

interface MailListResponse {
  success: boolean;
  data: {
    mails: Mail[];
    unread_count: number;
    total: number;
  };
  error?: string;  // ✅ 添加 error 属性
}

interface MailDetailResponse {
  success: boolean;
  data: Mail;
}

interface MessagePanelProps {
  onClose: () => void;
}

const MessagePanel: React.FC<MessagePanelProps> = memo(({ onClose }) => {
  const [mails, setMails] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<number | undefined>(undefined);
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchMails = async (type?: number) => {
    setLoading(true);
    setMessage(null);
    setSelectedMail(null);
    
    try {
      const url = type !== undefined 
        ? `${getApiBase()}/api/mail/list?type=${type}`
        : `${getApiBase()}/api/mail/list`;
      
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data: MailListResponse = await res.json();
      
      if (data.success) {
        setMails(data.data.mails || []);
        setUnreadCount(data.data.unread_count || 0);
      } else {
        setMessage(data.error || '加载邮件失败');
      }
    } catch (err) {
      console.error('Failed to load mails:', err);
      setMessage('加载邮件失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMails(activeType);
  }, [activeType]);

  const handleSelectMail = async (mail: Mail) => {
    setSelectedMail(mail);
    
    // 如果未读，刷新列表
    if (mail.read_tag === 0) {
      fetchMails(activeType);
    }
  };

  const handleDelete = async (mailId: number) => {
    if (!confirm('确定要删除这封邮件吗？')) return;
    
    setMessage(null);
    try {
      const res = await fetch(`${getApiBase()}/api/mail/${mailId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage('删除成功');
        setSelectedMail(null);
        fetchMails(activeType);
      } else {
        setMessage(data.error || '删除失败');
      }
    } catch (err) {
      setMessage('删除失败');
    }
  };

  const handleClaimAttachment = async (mailId: number) => {
    setMessage(null);
    try {
      const res = await fetch(`${getApiBase()}/api/mail/${mailId}/claim`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      
      if (data.success) {
        const result = data.data || {};
        let msg = '领取成功！';
        if (result.gold) msg += ` ${result.gold}金币`;
        if (result.items) {
          result.items.forEach((item: any) => {
            msg += ` ${item.name}x${item.count}`;
          });
        }
        setMessage(msg);
        fetchMails(activeType);
      } else {
        setMessage(data.error || '领取失败');
      }
    } catch (err) {
      setMessage('领取失败');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return `今天 ${date.toLocaleTimeString()}`;
    } else if (days === 1) {
      return `昨天 ${date.toLocaleTimeString()}`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const mailTypes = [
    { id: undefined, name: '全部' },
    { id: 0, name: '新邮件' },
    { id: 1, name: '系统' },
    { id: 2, name: '战报' },
    { id: 3, name: '消息' },
    { id: 4, name: '交易' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📨 消息中心 {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount}</span>}</h2>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={styles.message}>
          {message}
        </div>
      )}

      {/* 邮件类型筛选 */}
      <div className={styles.typeFilter}>
        {mailTypes.map(type => (
          <button
            key={type.id ?? 99}
            className={`${styles.typeBtn} ${activeType === type.id ? styles.active : ''}`}
            onClick={() => setActiveType(type.id)}
          >
            {type.name}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {/* 邮件列表 */}
        <div className={styles.mailList}>
          {loading ? (
            <div className={styles.loading}>加载中...</div>
          ) : mails.length === 0 ? (
            <div className={styles.empty}>暂无邮件</div>
          ) : (
            mails.map(mail => (
              <div
                key={mail.id}
                className={`${styles.mailItem} ${mail.read_tag === 0 ? styles.unread : ''} ${selectedMail?.id === mail.id ? styles.selected : ''}`}
                onClick={() => handleSelectMail(mail)}
              >
                <div className={styles.mailInfo}>
                  <span 
                    className={styles.mailType}
                    style={{ color: MAIL_TYPES[mail.mail_type as keyof typeof MAIL_TYPES]?.color || '#666' }}
                  >
                    [{MAIL_TYPES[mail.mail_type as keyof typeof MAIL_TYPES]?.name || '未知'}]
                  </span>
                  <span className={styles.mailFrom}>{mail.from_name}</span>
                  <span className={styles.mailDate}>{formatDate(mail.created_at)}</span>
                </div>
                <div className={styles.mailTitle}>{mail.title}</div>
                {mail.has_attachment === 1 && <span className={styles.attachmentIcon}>📎</span>}
              </div>
            ))
          )}
        </div>

        {/* 邮件详情 */}
        <div className={styles.mailDetail}>
          {selectedMail ? (
            <>
              <div className={styles.detailHeader}>
                <span 
                  className={styles.mailType}
                  style={{ color: MAIL_TYPES[selectedMail.mail_type as keyof typeof MAIL_TYPES]?.color || '#666' }}
                >
                  [{MAIL_TYPES[selectedMail.mail_type as keyof typeof MAIL_TYPES]?.name || '未知'}]
                </span>
                <span className={styles.mailTitle}>{selectedMail.title}</span>
              </div>
              
              <div className={styles.detailInfo}>
                <span>来自: {selectedMail.from_name}</span>
                <span>{formatDate(selectedMail.created_at)}</span>
              </div>

              <div className={styles.detailContent}>
                {selectedMail.content}
              </div>

              {selectedMail.has_attachment === 1 && (
                <div className={styles.attachment}>
                  <span>📎 附件</span>
                  <button 
                    className={styles.claimBtn}
                    onClick={() => handleClaimAttachment(selectedMail.id)}
                  >
                    领取附件
                  </button>
                </div>
              )}

              <div className={styles.detailActions}>
                <button 
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(selectedMail.id)}
                >
                  删除
                </button>
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              选择一封邮件查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MessagePanel.displayName = 'MessagePanel';

export default MessagePanel;
