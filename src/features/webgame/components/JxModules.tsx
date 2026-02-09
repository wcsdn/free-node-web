/**
 * 剑侠情缘功能面板组件
 * 原则：移动端优先，简洁设计
 */
import React, { memo } from 'react';

interface JxModulesProps {
  walletAddress: string;
  onNavigate: (module: string) => void;
}

const JxModules: React.FC<JxModulesProps> = memo(({ onNavigate }) => {
  const modules = [
    { id: 'market', name: '市场', icon: '🏪', desc: '买卖资源道具' },
    { id: 'mall', name: '商城', icon: '🛒', desc: '购买珍稀物品' },
    { id: 'mail', name: '消息', icon: '📨', desc: '收发邮件' },
    { id: 'task', name: '任务', icon: '📋', desc: '日常任务' },
    { id: 'ranking', name: '排行', icon: '🏆', desc: '玩家排名' },
    { id: 'union', name: '帮派', icon: '🏛️', desc: '帮会管理' },
    { id: 'arena', name: '竞技', icon: '⚔️', desc: 'PK竞技场' },
    { id: 'skill', name: '技能', icon: '✨', desc: '技能学习' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* 标题栏 */}
      <div className="flex items-center gap-4 mb-6">
        <button
          className="px-4 py-2 bg-slate-800/50 text-slate-400 rounded-lg hover:text-white hover:bg-slate-800 transition-all"
          onClick={() => onNavigate('main')}
        >
          ← 返回
        </button>
        <h1 className="text-2xl font-bold text-emerald-400">功能模块</h1>
      </div>

      {/* 功能卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {modules.map((module) => (
          <button
            key={module.id}
            className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-800 transition-all flex flex-col items-center gap-3"
            onClick={() => {
              console.log('Navigate to:', module.id);
              onNavigate(module.id);
            }}
          >
            <span className="text-4xl">{module.icon}</span>
            <div className="text-center">
              <div className="font-semibold text-emerald-400">{module.name}</div>
              <div className="text-xs text-slate-500 mt-1">{module.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

JxModules.displayName = 'JxModules';

export default JxModules;
