import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../../../shared/hooks/useLanguage';
import { useSoundEffect } from '../../../../shared/hooks/useSoundEffect';
import { useToast } from '../../../../shared/contexts/ToastContext';
import { UserStatus, Mail } from '../../../../types/ghost-mail';
import { API_ENDPOINTS } from '../../../../config/constants';
import Backdrop from '../../../../shared/components/Backdrop';
import './styles.css';

interface MailTerminalProps {
  userStatus: UserStatus;
  onStatusUpdate: () => void;
}

const MailTerminal: React.FC<MailTerminalProps> = ({ userStatus, onStatusUpdate }) => {
  const { address } = useAccount();
  const { language } = useLanguage();
  const { playClick, playSuccess, playError, playHover } = useSoundEffect();
  const { showSuccess, showError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mails, setMails] = useState<Mail[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isLoadingMails, setIsLoadingMails] = useState(false);

  // 从 URL 获取选中的邮件 ID
  const mailParam = searchParams.get('mail');
  const selectedMailId = mailParam ? parseInt(mailParam, 10) : null;
  const selectedMail = mails.find((m) => m.id === selectedMailId) || null;

  // 打开邮件
  const openMail = useCallback(
    (mailId: number) => {
      setSearchParams({ mail: mailId.toString() });
    },
    [setSearchParams]
  );

  // 关闭邮件
  const closeMail = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  // 加载邮件
  useEffect(() => {
    if (address && userStatus.aliases.length > 0) {
      loadMails();
    }
  }, [address, userStatus.aliases.length]);

  // 自动刷新邮件（每30秒）
  useEffect(() => {
    const interval = setInterval(() => {
      if (address && userStatus.aliases.length > 0) {
        loadMails();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [address, userStatus.aliases.length]);

  const loadMails = async () => {
    if (!address) return;

    try {
      setIsLoadingMails(true);
      const response = await fetch(
        `${API_ENDPOINTS.GHOST_MAIL}/api/inbox?address=${address}`
      );
      const data = await response.json();

      if (data.success) {
        setMails(data.data.mails);
      }
    } catch (error) {
      console.error('Failed to load mails:', error);
    } finally {
      setIsLoadingMails(false);
    }
  };

  const handleGenerateAlias = async () => {
    if (!address) return;

    playClick();
    setIsGenerating(true);

    try {
      const response = await fetch(`${API_ENDPOINTS.GHOST_MAIL}/api/alias/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (data.success) {
        playSuccess();
        onStatusUpdate();
      } else {
        playError();
        alert(data.error || 'Failed to generate alias');
      }
    } catch (error) {
      console.error('Failed to generate alias:', error);
      playError();
      alert('Network error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteAlias = async (aliasName: string) => {
    if (!address) return;

    playClick();
    setIsDeleting(aliasName);

    try {
      const response = await fetch(
        `${API_ENDPOINTS.GHOST_MAIL}/api/alias/${aliasName}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        }
      );

      const data = await response.json();

      if (data.success) {
        playSuccess();
        showSuccess(
          language === 'en'
            ? `Deleted ${aliasName}@free-node.xyz`
            : `已删除 ${aliasName}@free-node.xyz`
        );
        onStatusUpdate();
        // 清除相关邮件
        setMails((prev) => prev.filter((m) => m.alias_name !== aliasName));
        if (selectedMail?.alias_name === aliasName) {
          closeMail();
        }
      } else {
        playError();
        showError(data.error || (language === 'en' ? 'Failed to delete' : '删除失败'));
      }
    } catch (error) {
      console.error('Failed to delete alias:', error);
      playError();
      showError(language === 'en' ? 'Network error' : '网络错误');
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canGenerate = userStatus.activeSlots < userStatus.maxSlots;

  return (
    <div className="mail-terminal-container">
      {/* 左侧：仪表盘 */}
      <div className="mail-dashboard">
        <div className="dashboard-header">
          <div className="header-top">
            <h2 className="dashboard-title">
              {language === 'en' ? '> MY MAILBOXES' : '> 我的邮箱'}
            </h2>
            <div className="quota-badge">
              {userStatus.activeSlots} / {userStatus.maxSlots}
            </div>
          </div>
        </div>

        {/* 生成按钮 */}
        <button
          className="generate-btn"
          onClick={handleGenerateAlias}
          disabled={!canGenerate || isGenerating}
          onMouseEnter={playHover}
        >
          {isGenerating
            ? language === 'en'
              ? '[ GENERATING... ]'
              : '[ 生成中... ]'
            : language === 'en'
            ? '[ GENERATE NEW ID ]'
            : '[ 生成新邮箱 ]'}
        </button>

        {!canGenerate && (
          <div className="quota-warning">
            {language === 'en'
              ? '⚠️ Max limit reached. Delete old emails to create new ones.'
              : '⚠️ 已达上限，删除旧邮箱以创建新邮箱。'}
          </div>
        )}

        {/* 邮箱列表 */}
        <div className="alias-list">
          {userStatus.aliases.length === 0 ? (
            <div className="no-aliases">
              {language === 'en' ? 'No mailboxes yet' : '暂无邮箱'}
            </div>
          ) : (
            userStatus.aliases.map((alias) => (
              <div key={alias.alias_name} className="alias-item">
                <div className="alias-info">
                  <div className="alias-name">{alias.alias_name}@free-node.xyz</div>
                  <div className="alias-date">{formatDate(alias.created_at)}</div>
                </div>
                <button
                  className="delete-alias-btn"
                  onClick={() => handleDeleteAlias(alias.alias_name)}
                  disabled={isDeleting === alias.alias_name}
                  onMouseEnter={playHover}
                >
                  {isDeleting === alias.alias_name ? '...' : '🗑️'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧：邮件流 */}
      <div className="mail-stream">
        <div className="stream-header">
          <h3 className="stream-title">
            {language === 'en' ? '> INBOX' : '> 收件箱'}
          </h3>
          <button
            className="refresh-btn"
            onClick={() => {
              playClick();
              loadMails();
            }}
            disabled={isLoadingMails}
            onMouseEnter={playHover}
          >
            <svg
              className="refresh-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </button>
        </div>

        {/* 邮件列表 */}
        <div className="mail-list">
          {mails.length === 0 ? (
            <div className="no-mails">
              <div className="no-mails-icon">📭</div>
              <div className="no-mails-text">
                {language === 'en' ? 'No messages yet' : '暂无邮件'}
              </div>
            </div>
          ) : (
            mails.map((mail) => (
              <div
                key={mail.id}
                className={`mail-item ${selectedMail?.id === mail.id ? 'selected' : ''} ${
                  mail.is_read ? 'read' : 'unread'
                }`}
                onClick={() => {
                  playClick();
                  openMail(mail.id);
                }}
                onMouseEnter={playHover}
              >
                <div className="mail-item-header">
                  <span className="mail-to">→ {mail.alias_name}@free-node.xyz</span>
                  <span className="mail-date">{formatDate(mail.created_at)}</span>
                </div>
                <div className="mail-from">From: {mail.sender}</div>
                <div className="mail-subject">{mail.subject}</div>
                <div className="mail-preview">{mail.preview}</div>
              </div>
            ))
          )}
        </div>

        {/* 邮件详情 */}
        {selectedMail && (
          <>
            <Backdrop 
              onClick={() => {
                playClick();
                closeMail();
              }}
              zIndex={9}
            />
            <div className="mail-detail">
              <div className="mail-detail-header">
                <button
                  className="close-detail-btn"
                  onClick={() => {
                    playClick();
                    closeMail();
                  }}
                >
                  [ X ]
                </button>
              </div>
              <div className="mail-detail-content">
                <div className="detail-row">
                  <span className="detail-label">To:</span>
                  <span className="detail-value">{selectedMail.alias_name}@free-node.xyz</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">From:</span>
                  <span className="detail-value">{selectedMail.sender}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Subject:</span>
                  <span className="detail-value">{selectedMail.subject}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{formatDate(selectedMail.created_at)}</span>
                </div>
                <div className="detail-divider"></div>
                <div 
                  className="detail-body"
                  dangerouslySetInnerHTML={{ __html: selectedMail.body }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MailTerminal;
