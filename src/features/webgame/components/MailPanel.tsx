/**
 * MailPanel - 新版邮件面板
 * 赛博朋克风格
 */
import React, { useState } from 'react';
import { GameCard, GameButton, GameModal } from '@/shared/components/game';
import styles from './MailPanel.module.css';

interface Mail {
  id: number;
  sender: string;
  title: string;
  content: string;
  time: string;
  read: boolean;
  hasAttachment: boolean;
}

interface MailPanelProps {
  walletAddress: string;
}

export const MailPanel: React.FC<MailPanelProps> = ({ walletAddress }) => {
  const [mails, setMails] = useState<Mail[]>([
    { id: 1, sender: '系统', title: '欢迎加入', content: '欢迎来到剑侠情缘！', time: '2026-02-08', read: false, hasAttachment: true },
    { id: 2, sender: '系统', title: '每日奖励', content: '您的每日登录奖励已发放。', time: '2026-02-07', read: true, hasAttachment: false },
  ]);
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const markAsRead = (id: number) => {
    setMails(mails.map(m => m.id === id ? { ...m, read: true } : m));
  };

  const openMail = (mail: Mail) => {
    setSelectedMail(mail);
    setShowDetail(true);
    markAsRead(mail.id);
  };

  const deleteMail = (id: number) => {
    setMails(mails.filter(m => m.id !== id));
    setShowDetail(false);
    setSelectedMail(null);
  };

  const receiveAttachment = (id: number) => {
    alert('领取附件成功！');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <span className={styles.glitch} data-text="MAIL">MAIL</span>
      </h1>

      {/* 邮件统计 */}
      <GameCard title="邮件箱" className={styles.statsCard}>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{mails.length}</span>
            <span className={styles.statLabel}>总数</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{mails.filter(m => !m.read).length}</span>
            <span className={styles.statLabel}>未读</span>
          </div>
        </div>
      </GameCard>

      {/* 邮件列表 */}
      <div className={styles.mailList}>
        {mails.map((mail) => (
          <div
            key={mail.id}
            className={[styles.mailItem, mail.read ? styles.read : '', mail.hasAttachment ? styles.hasAttachment : ''].join(' ')}
            onClick={() => openMail(mail)}
          >
            <div className={styles.mailIcon}>
              {mail.hasAttachment ? '📎' : '📧'}
            </div>
            <div className={styles.mailInfo}>
              <div className={styles.mailHeader}>
                <span className={styles.sender}>{mail.sender}</span>
                <span className={styles.time}>{mail.time}</span>
              </div>
              <div className={styles.mailTitle}>{mail.title}</div>
            </div>
            {!mail.read && <div className={styles.unreadDot}></div>}
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {mails.length === 0 && (
        <div className={styles.empty}>
          <p>暂无邮件</p>
        </div>
      )}

      {/* 邮件详情弹窗 */}
      <GameModal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="邮件详情"
        size="small"
      >
        {selectedMail && (
          <div className={styles.detailContent}>
            <div className={styles.detailHeader}>
              <span className={styles.detailIcon}>📧</span>
              <div className={styles.detailInfo}>
                <h3>{selectedMail.title}</h3>
                <p>来自: {selectedMail.sender} · {selectedMail.time}</p>
              </div>
            </div>
            <div className={styles.detailBody}>
              {selectedMail.content}
            </div>
            {selectedMail.hasAttachment && (
              <div className={styles.attachment}>
                <span>📎 附件</span>
                <GameButton size="small" onClick={() => receiveAttachment(selectedMail.id)}>
                  领取
                </GameButton>
              </div>
            )}
            <div className={styles.detailActions}>
              <GameButton variant="danger" fullWidth onClick={() => deleteMail(selectedMail.id)}>
                删除邮件
              </GameButton>
            </div>
          </div>
        )}
      </GameModal>
    </div>
  );
};

export default MailPanel;
