/**
 * 邮件面板组件
 */
import React, { useEffect, useState } from 'react';
import gufengStyles from '../../styles/gufeng.module.css';

import { gameApi } from '../../services/gameApi';
import styles from '../../styles/jxMain.module.css';

interface Mail {
  id: number;
  mail_type: number;
  from_name: string;
  title: string;
  content: string;
  read_tag: number;
  has_attachment: number;
  created_at: string;
}

interface MailPanelProps {
  walletAddress: string;
  onClose: () => void;
}

const MAIL_TYPES = [
  { id: undefined, name: '全部' },
  { id: 0, name: '新邮件' },
  { id: 1, name: '系统' },
  { id: 2, name: '战报' },
  { id: 3, name: '消息' },
  { id: 4, name: '交易' },
];

const MailPanel: React.FC<MailPanelProps> = ({ onClose }) => {
  const [mails, setMails] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<number | undefined>(undefined);
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [message, setMessage] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeTitle, setComposeTitle] = useState('');
  const [composeContent, setComposeContent] = useState('');

  useEffect(() => {
    loadMails();
  }, [selectedType]);

  const loadMails = async () => {
    setLoading(true);
    try {
      const res = await gameApi.getMailList(selectedType);
      if (res.success && res.data) {
        setMails(res.data);
        // Count unread mails
        const unread = res.data.filter((m: Mail) => m.read_tag === 0).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to load mails:', err);
    }
    setLoading(false);
  };

  const handleClaim = async (mail: Mail) => {
    setMessage('');
    try {
      const res = await gameApi.claimMailAttachment(mail.id);
      if (res.success) {
        setMessage(`领取成功! ${res.data?.gold ? `获得 ${res.data.gold} 金币` : ''}`);
        loadMails();
        if (selectedMail?.id === mail.id) {
          setSelectedMail({ ...mail, has_attachment: 0 });
        }
      } else {
        setMessage(res.error || '领取失败');
      }
    } catch (err) {
      setMessage('领取失败');
    }
  };

  const handleDelete = async (mailId: number) => {
    setMessage('');
    try {
      const res = await gameApi.deleteMail(mailId);
      if (res.success) {
        setMessage('删除成功');
        setSelectedMail(null);
        loadMails();
      } else {
        setMessage(res.error || '删除失败');
      }
    } catch (err) {
      setMessage('删除失败');
    }
  };

  const handleSend = async () => {
    if (!composeTo || !composeTitle || !composeContent) {
      setMessage('请填写完整信息');
      return;
    }
    setMessage('');
    try {
      const res = await gameApi.sendMail(composeTo, composeTitle, composeContent, undefined);
      if (res.success) {
        setMessage('发送成功');
        setShowCompose(false);
        setComposeTo('');
        setComposeTitle('');
        setComposeContent('');
      } else {
        setMessage(res.error || '发送失败');
      }
    } catch (err) {
      setMessage('发送失败');
    }
  };

  const getMailTypeName = (type: number) => {
    const names: Record<number, string> = { 0: '新邮件', 1: '系统', 2: '战报', 3: '消息', 4: '交易' };
    return names[type] || '未知';
  };

  const getMailTypeColor = (type: number) => {
    const colors: Record<number, string> = { 0: '#f44336', 1: '#9c27b0', 2: '#ff9800', 3: '#2196f3', 4: '#4caf50' };
    return colors[type] || '#666';
  };

  return (
    <div className={gufengStyles.popupPanel}>
      <div className={gufengStyles.popupHeader}>
        <span>邮件 {unreadCount > 0 && `(${unreadCount}封未读)`}</span>
        <button className={gufengStyles.closeBtn} onClick={onClose}>×</button>
      </div>
      
      <div className={gufengStyles.popupContent}>
        {message && <div className={gufengStyles.message}>{message}</div>}

        {/* 筛选和发送 */}
        <div className={gufengStyles.mailToolbar}>
          <div className={gufengStyles.mailFilters}>
            {MAIL_TYPES.map(type => (
              <button
                key={type.id ?? 99}
                className={`${gufengStyles.filterBtn} ${selectedType === type.id ? gufengStyles.active : ''}`}
                onClick={() => setSelectedType(type.id)}
              >
                {type.name}
              </button>
            ))}
          </div>
          <button 
            className={gufengStyles.composeBtn}
            onClick={() => setShowCompose(!showCompose)}
          >
            {showCompose ? '取消' : '写邮件'}
          </button>
        </div>

        {/* 写信界面 */}
        {showCompose && (
          <div className={gufengStyles.composeArea}>
            <div className={gufengStyles.composeField}>
              <label>收件人地址:</label>
              <input 
                type="text" 
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder="0x..."
                className={gufengStyles.composeInput}
              />
            </div>
            <div className={gufengStyles.composeField}>
              <label>标题:</label>
              <input 
                type="text" 
                value={composeTitle}
                onChange={(e) => setComposeTitle(e.target.value)}
                placeholder="邮件标题"
                className={gufengStyles.composeInput}
              />
            </div>
            <div className={gufengStyles.composeField}>
              <label>内容:</label>
              <textarea 
                value={composeContent}
                onChange={(e) => setComposeContent(e.target.value)}
                placeholder="邮件内容"
                className={gufengStyles.composeTextarea}
                rows={4}
              />
            </div>
            <button onClick={handleSend} className={gufengStyles.sendBtn}>
              发送邮件
            </button>
          </div>
        )}

        {/* 邮件列表 */}
        <div className={gufengStyles.mailContainer}>
          <div className={gufengStyles.mailList}>
            {loading ? (
              <div className={gufengStyles.loading}>加载中...</div>
            ) : mails.length === 0 ? (
              <div className={gufengStyles.empty}>暂无邮件</div>
            ) : (
              mails.map(mail => (
                <div 
                  key={mail.id}
                  className={`${gufengStyles.mailItem} ${mail.read_tag === 0 ? gufengStyles.unread : ''} ${selectedMail?.id === mail.id ? gufengStyles.selected : ''}`}
                  onClick={() => setSelectedMail(mail)}
                >
                  <div className={gufengStyles.mailItemHeader}>
                    <span 
                      className={gufengStyles.mailType}
                      style={{ backgroundColor: getMailTypeColor(mail.mail_type) }}
                    >
                      {getMailTypeName(mail.mail_type)}
                    </span>
                    <span className={gufengStyles.mailTime}>
                      {new Date(mail.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={gufengStyles.mailSender}>{mail.from_name}</div>
                  <div className={gufengStyles.mailTitle}>{mail.title}</div>
                  {mail.has_attachment === 1 && (
                    <span className={gufengStyles.hasAttachment}>📎 有附件</span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 邮件详情 */}
          {selectedMail && (
            <div className={gufengStyles.mailDetail}>
              <div className={gufengStyles.mailDetailHeader}>
                <h4>{selectedMail.title}</h4>
                <div className={gufengStyles.mailMeta}>
                  <span>来自: {selectedMail.from_name}</span>
                  <span>{new Date(selectedMail.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className={gufengStyles.mailContent}>
                {selectedMail.content}
              </div>
              <div className={gufengStyles.mailActions}>
                {selectedMail.has_attachment === 1 && (
                  <button 
                    onClick={() => handleClaim(selectedMail)}
                    className={gufengStyles.claimBtn}
                  >
                    领取附件
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (confirm('确定删除这封邮件?')) handleDelete(selectedMail.id);
                  }}
                  className={gufengStyles.deleteBtn}
                >
                  删除
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MailPanel;
