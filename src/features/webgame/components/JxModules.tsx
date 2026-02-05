/**
 * 剑侠情缘功能面板组件
 * 从 Main.aspx 功能入口迁移
 */
import React, { memo } from 'react';
import styles from '../styles/jxModules.module.css';

interface JxModulesProps {
  walletAddress: string;
  onNavigate: (module: string) => void;
}

const JxModules: React.FC<JxModulesProps> = memo(({ onNavigate }) => {
  const modules = [
    { id: 'market', name: '市场', icon: '/jx/Web/img/o/21.gif', desc: '买卖资源道具' },
    { id: 'mall', name: '商城', icon: '/jx/Web/img/o/21.gif', desc: '购买珍稀物品' },
    { id: 'mail', name: '消息', icon: '/jx/Web/img/o/33.gif', desc: '收发邮件' },
    { id: 'task', name: '任务', icon: '/jx/Web/img/o/10.gif', desc: '日常任务' },
    { id: 'ranking', name: '排行', icon: '/jx/Web/img/o/11.gif', desc: '玩家排名' },
    { id: 'union', name: '帮派', icon: '/jx/Web/img/o/21.gif', desc: '帮会管理' },
    { id: 'arena', name: '竞技', icon: '/jx/Web/img/o/12.gif', desc: 'PK竞技场' },
    { id: 'skill', name: '技能', icon: '/jx/Web/img/o/21.gif', desc: '技能学习' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => onNavigate('main')}>← 返回</button>
        <h2>功能模块</h2>
      </div>
      <div className={styles.grid}>
        {modules.map((module) => (
          <div
            key={module.id}
            className={styles.card}
            onClick={() => {
              console.log('Navigate to:', module.id);
              onNavigate(module.id);
            }}
          >
            <img src={module.icon} alt={module.name} className={styles.icon} />
            <div className={styles.info}>
              <span className={styles.name}>{module.name}</span>
              <span className={styles.desc}>{module.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

JxModules.displayName = 'JxModules';

export default JxModules;
