/**
 * HelpPanel - 帮助面板 (简化版)
 */
import React, { useState } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';

const HELP_CATEGORIES = [
  { id: 1, name: '新手引导', icon: '📖' },
  { id: 2, name: '游戏玩法', icon: '🎮' },
  { id: 3, name: '武将系统', icon: '⚔️' },
  { id: 4, name: '建筑系统', icon: '🏗️' },
  { id: 5, name: '战斗系统', icon: '⚡' },
  { id: 6, name: '军团系统', icon: '🏰' },
];

const HELP_ARTICLES: Record<number, Array<{ id: number; title: string; content: string }>> = {
  1: [
    { id: 1, title: '如何创建角色', content: '首次登录会自动创建角色...' },
    { id: 2, title: '如何招募武将', content: '在武将界面消耗金币即可招募...' },
    { id: 3, title: '如何建造建筑', content: '在城市界面选择建造功能...' },
  ],
};

export const HelpPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [category, setCategory] = useState<number | null>(null);

  return (
    <GameCard title="游戏帮助">
      {!category ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {HELP_CATEGORIES.map(cat => (
            <div
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                padding: 20,
                textAlign: 'center',
                border: '1px solid #333',
                cursor: 'pointer',
                background: 'rgba(0, 255, 0, 0.05)',
              }}
            >
              <div style={{ fontSize: 32 }}>{cat.icon}</div>
              <div style={{ marginTop: 10, color: '#00FF00' }}>{cat.name}</div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 15 }}>
            <GameButton onClick={() => setCategory(null)}>← 返回</GameButton>
          </div>
          {(HELP_ARTICLES[category] || []).map(article => (
            <div key={article.id} style={{ padding: 15, marginBottom: 10, border: '1px solid #333' }}>
              <div style={{ color: '#00FF00', fontWeight: 'bold' }}>{article.title}</div>
              <div style={{ marginTop: 10, color: '#888' }}>{article.content}</div>
            </div>
          ))}
        </>
      )}
      <GameButton onClick={onClose} style={{ marginTop: 20 }}>关闭</GameButton>
    </GameCard>
  );
};

export default HelpPanel;
