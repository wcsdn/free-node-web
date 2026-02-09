/**
 * 左面板组件
 * 原则：移动端优先，简洁设计
 */
import React, { memo } from 'react';
import { GameCard } from '@/shared/components/game';

interface LeftPanelProps {
  walletAddress?: string;
  onNavigate?: (module: string) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = memo(() => {
  return (
    <div id="leftpanel" className="space-y-4 p-4">
      {/* Logo */}
      <div className="text-center py-4">
        <div className="text-3xl font-bold text-emerald-400">剑侠情缘</div>
        <div className="text-sm text-slate-500 mt-1">Web 版</div>
      </div>

      {/* 用户信息 */}
      <GameCard title="玩家信息">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">玩家</span>
            <span className="font-bold text-emerald-400">玩家</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">官位:</span>
            <a href="#" className="text-emerald-400 hover:underline">0</a>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">帮派:</span>
            <span className="text-slate-300">无</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">战勋:</span>
            <span className="text-amber-400">0</span>
          </div>
        </div>
      </GameCard>

      {/* 服务器信息 */}
      <GameCard title="服务器">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">服务器:</span>
            <span className="text-slate-300">默认</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">在线:</span>
            <span className="text-emerald-400">0 人</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">时间:</span>
            <span className="text-slate-300 font-mono">00:00:00</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">经验:</span>
            <span className="text-amber-400">1倍</span>
          </div>
        </div>
      </GameCard>

      {/* 快捷链接 */}
      <GameCard>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <a href="#" className="p-2 text-center bg-slate-800/50 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-all">
            首页
          </a>
          <a href="#" className="p-2 text-center bg-slate-800/50 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-all">
            账户
          </a>
          <a href="#" className="p-2 text-center bg-slate-800/50 rounded text-green-400 hover:text-green-300 hover:bg-slate-800 transition-all">
            充值
          </a>
          <a href="#" className="p-2 text-center bg-slate-800/50 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-all">
            论坛
          </a>
        </div>
      </GameCard>
    </div>
  );
});

LeftPanel.displayName = 'LeftPanel';

export default LeftPanel;
