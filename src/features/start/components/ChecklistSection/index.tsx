/**
 * 模块E: 新手操作清单
 */

import React, { useState } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import './styles.css';

interface CheckItem {
  id: string;
  text: string;
  text_en: string;
}

const ChecklistSection: React.FC = () => {
  const { language } = useLanguage();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    const newChecked = new Set(checked);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setChecked(newChecked);
  };

  const prepareItems: CheckItem[] = [
    { id: 'email', text: '准备好邮箱/手机号', text_en: 'Prepare email/phone' },
    { id: 'password', text: '使用密码管理器生成强密码', text_en: 'Use password manager' },
    { id: 'auth', text: '下载 Authenticator App', text_en: 'Download Authenticator App' },
  ];

  const securityItems: CheckItem[] = [
    { id: '2fa', text: '开启 Authenticator / Passkey', text_en: 'Enable Authenticator / Passkey' },
    { id: 'antiphish', text: '设置防钓鱼码', text_en: 'Set anti-phishing code' },
    { id: 'whitelist', text: '开启提现白名单（如支持）', text_en: 'Enable withdrawal whitelist' },
    { id: 'test', text: '只做小额入金测试', text_en: 'Test with small amount only' },
  ];

  const pitfalls = [
    { icon: '🚫', text: '假客服私聊', text_en: 'Fake support DMs' },
    { icon: '🚫', text: '假 APP 下载链接', text_en: 'Fake app download links' },
    { icon: '🚫', text: '授权钓鱼网站', text_en: 'Phishing authorization' },
    { icon: '🚫', text: '合约高杠杆', text_en: 'High leverage trading' },
  ];

  const renderCheckItem = (item: CheckItem) => (
    <div
      key={item.id}
      className={`check-item ${checked.has(item.id) ? 'checked' : ''}`}
      onClick={() => toggleCheck(item.id)}
    >
      <span className="check-box">{checked.has(item.id) ? '☑' : '☐'}</span>
      <span className="check-text">{language === 'zh' ? item.text : item.text_en}</span>
    </div>
  );

  return (
    <section className="checklist-section start-section">
      <h2 className="start-section-title">
        {language === 'zh' ? '🔒 新手安全清单' : '🔒 Security Checklist'}
      </h2>

      <div className="checklist-grid">
        <div className="checklist-group">
          <h3 className="checklist-group-title">
            {language === 'zh' ? '📝 注册前准备' : '📝 Before Registration'}
          </h3>
          {prepareItems.map(renderCheckItem)}
        </div>

        <div className="checklist-group">
          <h3 className="checklist-group-title">
            {language === 'zh' ? '✅ 注册后必做' : '✅ After Registration'}
          </h3>
          {securityItems.map(renderCheckItem)}
        </div>

        <div className="checklist-group pitfalls">
          <h3 className="checklist-group-title">
            {language === 'zh' ? '⚠️ 常见坑' : '⚠️ Common Pitfalls'}
          </h3>
          {pitfalls.map((p, i) => (
            <div key={i} className="pitfall-item">
              <span className="pitfall-icon">{p.icon}</span>
              <span className="pitfall-text">{language === 'zh' ? p.text : p.text_en}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ChecklistSection;
