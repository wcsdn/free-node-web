import React, { useState, useEffect } from 'react';
import gameApi from '../../services/gameApi';
import styles from './MailPanel.module.css';

interface MailPanelProps {
  onClose: () => void;
}

interface Mail {
  id: number;
  title: string;
  sender: string;
  content: string;
  has_attachment: boolean;
  attachments?: Array<{ type: string; amount: number }>;
  is_read: boolean;
  created_at: string;
}

export const MailPanel: React.FC<MailPanelProps> = ({ onClose }) => {
  const [mails, setMails] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);

  useEffect(() => {
    loadMails();
  }, []);

  const loadMails = async () => {
    try {
      setLoading(true);
      const res = await gameApi.getMailList();
      if (res.success && res.data?.mails) {
        setMails(res.data.mails);
      }
    } catch (error) {
      console.error('加载邮件失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReadMail = async (mail: Mail) => {
    setSelectedMail(mail);
    if (!mail.is_read) {
      // 标记为已读
      await gameApi.readMail(mail.id);
      setMails(prev => prev.map(m => 
        m.id === mail.id ? { ...m, is_read: true } : m
      ));
    }
  };

  const handleReceiveAttachment = async (mailId: number) => {
    try {
      const res = await gameApi.receiveMailAttachment(mailId);
      if (res.success) {
        alert('附件领取成功！');
        loadMails();
      } else {
        alert(res.error || '领取失败');
      }
    } catch (error) {
      alert('领取失败，请稍后重试');
    }
  };

  const handleDeleteMail = async (mailId: number) => {
    try {
      const res = await gameApi.deleteMail(mailId);
      if (res.success) {
        setMails(prev => prev.filter(m => m.id !== mailId));
        if (selectedMail?.id === mailId) {
          setSelectedMail(null);
        }
      } else {
        alert(res.error || '删除失败');
      }
    } catch (error) {
      alert('删除失败，请稍后重试');
    }
  };

  const getMailIcon = (mail: Mail) => {
    if (mail.has_attachment) {
      return mail.is_read ? '📬' : '📩';
    }
    return mail.is_read ? '📨' : '✉️';
  };

  const unreadCount = mails.filter(m => !m.is_read).length;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>📬 邮件 {unreadCount > 0 && `(${unreadCount})`}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>加载中...</div>
          ) : (
            <div className={styles.mailContainer}>
              {/* 邮件列表 */}
              <div className={styles.mailList}>
                {mails.map(mail => (
                  <div 
                    key={mail.id}
                    className={`${styles.mailItem} ${selectedMail?.id === mail.id ? styles.selected : ''} ${!mail.is_read ? styles.unread : ''}`}
                    onClick={() => handleReadMail(mail)}
                  >
                    <span className={styles.mailIcon}>{getMailIcon(mail)}</span>
                    <div className={styles.mailInfo}>
                      <h4>{mail.title}</h4>
                      <p>{mail.sender}</p>
                    </div>
                    <span className={styles.mailTime}>
                      {new Date(mail.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {mails.length === 0 && (
                  <div className={styles.empty}>暂无邮件</div>
                )}
              </div>

              {/* 邮件详情 */}
              {selectedMail ? (
                <div className={styles.mailDetail}>
                  <div className={styles.detailHeader}>
                    <h3>{selectedMail.title}</h3>
                    <div className={styles.detailMeta}>
                      <span>发件人: {selectedMail.sender}</span>
                      <span>{new Date(selectedMail.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className={styles.detailContent}>
                    {selectedMail.content}
                  </div>
                  {selectedMail.has_attachment && (
                    <div className={styles.attachment}>
                      <span>📦 附件:</span>
                      {selectedMail.attachments?.map((att, idx) => (
                        <span key={idx} className={styles.attachmentItem}>
                          {att.type} x{att.amount}
                        </span>
                      ))}
                      <button 
                        className={styles.receiveBtn}
                        onClick={() => handleReceiveAttachment(selectedMail.id)}
                      >
                        领取附件
                      </button>
                    </div>
                  )}
                  <div className={styles.detailActions}>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteMail(selectedMail.id)}
                    >
                      删除邮件
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.noSelection}>
                  选择一封邮件查看详情
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MailPanel;
