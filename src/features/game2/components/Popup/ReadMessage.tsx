/**
 * ReadMessage - 查看消息弹框内容组件
 * 
 * 功能：查看邮件详情，支持回复和删除
 */
import React from 'react';
import { Modal } from '../common/Modal';

interface ReadMessageProps {
  open: boolean;
  onClose: () => void;
  onReply: (to: string) => void;
  onDelete: (mailId: number) => void;
  /** 邮件数据 */
  mail: {
    id: number;
    title: string;
    from: string;
    content: string;
  } | null;
}

export const PopUpReadMessage: React.FC<ReadMessageProps> = ({
  open,
  onClose,
  onReply,
  onDelete,
  mail,
}) => {
  if (!mail) return null;

  const handleReply = () => {
    // 从 "玩家名[服务器]" 格式中提取玩家名
    const name = mail.from.split('[')[0];
    onReply(name.trim());
  };

  const handleDelete = () => {
    onDelete(mail.id);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="查看消息"
      width={426}
      footer={
        <div className="popup_button">
          <button className="btn-primary" onClick={handleReply}>
            回复
          </button>
          <button
            className="btn-danger"
            onClick={handleDelete}
            style={{ marginLeft: 100 }}
          >
            删除
          </button>
          <button
            className="btn-default"
            onClick={onClose}
            style={{ marginLeft: 100 }}
          >
            关闭
          </button>
        </div>
      }
    >
      <div className="read-message-content">
        <ul style={{ marginLeft: 15, marginTop: 10, listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: 10 }}>
            <label style={{ marginRight: 8 }}>标题：</label>
            <input
              type="text"
              className="input_mtitle"
              value={mail.title}
              readOnly
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </li>
          <li style={{ marginBottom: 10 }}>
            <label style={{ marginRight: 8 }}>发件人：</label>
            <input
              type="text"
              className="input_mname"
              value={mail.from}
              readOnly
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </li>
          <li>
            <div
              className="readbox"
              style={{
                minHeight: 120,
                padding: 8,
                border: '1px solid #ccc',
                borderRadius: 4,
                backgroundColor: '#f9f9f9',
              }}
            >
              {mail.content}
            </div>
          </li>
        </ul>
      </div>
    </Modal>
  );
};

export default PopUpReadMessage;
