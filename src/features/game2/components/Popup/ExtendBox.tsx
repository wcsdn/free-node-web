/**
 * ExtendBox - 推广链接弹框内容组件
 * 
 * 功能：显示推广链接，支持复制
 */
import React, { useState } from 'react';
import { Modal } from '../common/Modal';

interface ExtendBoxProps {
  open: boolean;
  onClose: () => void;
  /** 推广链接 */
  url: string;
  /** 推广码/名称 */
  code: string;
  /** 复制成功回调 */
  onCopy?: (text: string) => void;
}

export const PopUpExtendBox: React.FC<ExtendBoxProps> = ({
  open,
  onClose,
  url,
  code,
  onCopy,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onCopy?.(url);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // 兼容旧浏览器
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      onCopy?.(url);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="推广链接"
      width={760}
      footer={
        <div className="popup_button">
          <button
            className={copied ? 'btn-success' : 'btn-primary'}
            onClick={handleCopy}
            style={{ marginRight: 20 }}
          >
            {copied ? '已复制！' : '复制链接'}
          </button>
          <button className="btn-default" onClick={onClose}>
            关闭
          </button>
        </div>
      }
    >
      <div className="extend-box-content">
        <div style={{ textAlign: 'center', marginTop: 5 }}>
          <span>
            <strong>{code}</strong>
          </span>
          <span> 的推广链接</span>
        </div>

        <div style={{ textAlign: 'center', marginTop: 5, marginBottom: 5 }}>
          <span
            id="extendurl"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#f5f5f5',
              borderRadius: 4,
              wordBreak: 'break-all',
              maxWidth: '100%',
            }}
          >
            {url}
          </span>
        </div>

        <div
          style={{
            textAlign: 'left',
            paddingLeft: 5,
            textIndent: 22,
            color: '#666',
          }}
        >
          复制上述链接发送给好友，好友注册时填写此链接，双方均可获得丰厚奖励！
        </div>
      </div>
    </Modal>
  );
};

export default PopUpExtendBox;
