/**
 * 游戏控制面板组件
 * 原则：移动端优先，简洁设计
 */
import React, { memo } from 'react';
import { useWebGameStore, UnitType } from '../stores/useWebGameStore';
import { GAME_CONFIG } from '../config';
import { useSoundEffect } from '@/shared/hooks/useSoundEffect';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { GameCard, GameButton } from '@/shared/components/game';

const GameControl: React.FC = memo(() => {
  const { 
    gold, 
    turn, 
    gameStatus, 
    selectedUnit,
    endTurn, 
    resetGame,
    setError,
  } = useWebGameStore();
  
  const { playClick, playHover } = useSoundEffect();
  const { language } = useLanguage();

  const i18n = {
    turn: language === 'en' ? 'Turn' : '回合',
    gold: language === 'en' ? 'Gold' : '金币',
    status: language === 'en' ? 'Status' : '状态',
    idle: language === 'en' ? 'Idle' : '待开始',
    playing: language === 'en' ? 'Playing' : '进行中',
    victory: language === 'en' ? '🎉 Victory' : '🎉 胜利',
    defeat: language === 'en' ? '💀 Defeat' : '💀 失败',
    shop: language === 'en' ? 'Unit Shop' : '单位商店',
    endTurn: language === 'en' ? 'End Turn' : '结束回合',
    restart: language === 'en' ? 'Restart' : '重新开始',
    selectedUnit: language === 'en' ? 'Selected Unit' : '选中单位',
    notEnoughGold: language === 'en' ? 'Not enough gold' : '金币不足',
    selectPosition: language === 'en' ? 'Select position to place' : '选择位置放置',
  };

  const handleBuyUnit = (type: UnitType) => {
    const unitConfig = GAME_CONFIG.UNIT_TYPES[type];
    
    if (gold < unitConfig.cost) {
      setError(i18n.notEnoughGold);
      return;
    }
    
    const unitName = language === 'en' ? unitConfig.name : unitConfig.name;
    setError(`${i18n.selectPosition} ${unitName}`);
  };

  return (
    <div className="space-y-4">
      {/* 游戏状态 */}
      <GameCard>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">{i18n.turn}</div>
            <div className="text-lg font-bold text-emerald-400">
              {turn}/{GAME_CONFIG.MAX_TURNS}
            </div>
          </div>
          <div className="text-center p-2 bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">{i18n.gold}</div>
            <div className="text-lg font-bold text-amber-400">💰 {gold}</div>
          </div>
          <div className="text-center p-2 bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">{i18n.status}</div>
            <div className={`text-sm font-medium ${
              gameStatus === 'victory' ? 'text-emerald-400' :
              gameStatus === 'defeat' ? 'text-red-400' :
              'text-slate-300'
            }`}>
              {gameStatus === 'idle' && i18n.idle}
              {gameStatus === 'playing' && i18n.playing}
              {gameStatus === 'victory' && i18n.victory}
              {gameStatus === 'defeat' && i18n.defeat}
            </div>
          </div>
        </div>
      </GameCard>

      {/* 单位商店 */}
      {gameStatus === 'playing' && (
        <GameCard title={i18n.shop}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(GAME_CONFIG.UNIT_TYPES).map(([key, unit]) => (
              <button
                key={key}
                className={`
                  p-3 rounded-lg border transition-all text-left
                  ${gold < unit.cost 
                    ? 'bg-slate-800/30 border-slate-700/50 opacity-50 cursor-not-allowed' 
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-800'
                  }
                `}
                onClick={() => { playClick(); handleBuyUnit(key as UnitType); }}
                onMouseEnter={playHover}
                disabled={gold < unit.cost}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{unit.icon}</span>
                  <span className="font-medium text-slate-200">{unit.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span>❤️ {unit.hp}</span>
                  <span>⚔️ {unit.attack}</span>
                  <span>🛡️ {unit.defense}</span>
                </div>
                <div className={`text-sm font-bold ${gold >= unit.cost ? 'text-amber-400' : 'text-slate-500'}`}>
                  💰 {unit.cost}
                </div>
              </button>
            ))}
          </div>
        </GameCard>
      )}

      {/* 操作按钮 */}
      <GameCard>
        <div className="flex gap-2">
          {gameStatus === 'playing' && (
            <GameButton
              fullWidth
              onClick={() => { playClick(); endTurn(); }}
              onMouseEnter={playHover}
            >
              {i18n.endTurn}
            </GameButton>
          )}
          
          {(gameStatus === 'victory' || gameStatus === 'defeat') && (
            <GameButton
              fullWidth
              variant="emerald"
              onClick={() => { playClick(); resetGame(); }}
              onMouseEnter={playHover}
            >
              {i18n.restart}
            </GameButton>
          )}
        </div>
      </GameCard>

      {/* 选中单位信息 */}
      {selectedUnit && (
        <GameCard title={i18n.selectedUnit}>
          <div className="text-center text-slate-500 py-2">
            单位 ID: {selectedUnit}
          </div>
        </GameCard>
      )}
    </div>
  );
});

GameControl.displayName = 'GameControl';

export default GameControl;
