/**
 * SendMessage - 发送消息弹框内容组件
 * 
 * 功能：发送邮件给其他玩家
 */
import React, { useState } from 'react';
import { Modal } from '../common/Modal';

interface SendMessageProps {
  open: boolean;
  onClose: () => void;
  onSend: (to: string, title: string, content: string) => void;
  onValidateName: (name: string) => Promise<boolean>;
}

export const PopUpSendMessage: React.FC<SendMessageProps> = ({
  open,
  onClose,
  onSend,
  onValidateName,
}) => {
  const [to, setTo] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errorTo, setErrorTo] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setErrorTo('');
    setErrorTitle('');

    // 验证输入
    if (!title.trim()) {
      setErrorTitle('请输入标题');
      return;
    }
    if (!to.trim()) {
      setErrorTo('请输入收件人');
      return;
    }

    // 验证收件人是否存在
    setLoading(true);
    try {
      const isValid = await onValidateName(to.trim());
      if (isValid) {
        onSend(to.trim(), title.trim(), content.trim());
      } else {
        setErrorTo('收件人不存在');
      }
    } catch {
      setErrorTo('收件人不存在');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTo('');
    setTitle('');
    setContent('');
    setErrorTo('');
    setErrorTitle('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="发送消息"
      width={426}
      footer={
        <div className="popup_button">
          <button
            className="btn-primary"
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? '发送中...' : '发送'}
          </button>
          <button
            className="btn-default"
            onClick={handleClose}
            style={{ marginLeft: 100 }}
          >
            取消
          </button>
        </div>
      }
    >
      <div className="send-message-content">
        <ul style={{ marginLeft: 15, listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: 10 }}>
            <label style={{ marginRight: 8 }}>标题：</label>
            <input
              type="text"
              className="input_mtitle"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={40}
              placeholder="请输入标题"
            />
            <span className="font_red">{errorTitle}</span>
          </li>
          <li style={{ marginBottom: 10 }}>
            <label style={{ marginRight: 8 }}>收件人：</label>
            <input
              type="text"
              className="input_mname"
              value={to}
              onChange={e => setTo(e.target.value)}
              maxLength={14}
              placeholder="请输入收件人名称"
            />
            <span className="font_red">{errorTo}</span>
          </li>
          <li>
            <textarea
              className="textbox_content"
              value={content}
              onChange={e => setContent(e.target.value)}
              maxLength={400}
              placeholder="请输入内容"
              rows={6}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </li>
        </ul>
      </div>
    </Modal>
  );
};

export default PopUpSendMessage;
