/**
 * 游戏控制面板组件
 */

import React, { memo } from 'react';
import gufengStyles from '../styles/gufeng.module.css';

import { useWebGameStore, UnitType } from '../stores/useWebGameStore';
import { GAME_CONFIG } from '../config';
import { useSoundEffect } from '@/shared/hooks/useSoundEffect';
import { useLanguage } from '@/shared/hooks/useLanguage';
import styles from '../styles/game.module.css';

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

  // 一次性提取所有翻译文本
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

  // 处理购买单位
  const handleBuyUnit = (type: UnitType) => {
    const unitConfig = GAME_CONFIG.UNIT_TYPES[type];
    
    if (gold < unitConfig.cost) {
      setError(i18n.notEnoughGold);
      return;
    }
    
    const unitName = language === 'en' ? unitConfig.name : unitConfig.name;
    setError(`${i18n.selectPosition} ${unitName}`);
    // 实际放置逻辑在 GameCanvas 的 onCellClick 中处理
  };

  return (
    <div className={gufengStyles.gameControl}>
      {/* 游戏状态 */}
      <div className={gufengStyles.statusPanel}>
        <div className={gufengStyles.statusItem}>
          <span className={gufengStyles.statusLabel}>{i18n.turn}:</span>
          <span className={gufengStyles.statusValue}>{turn}/{GAME_CONFIG.MAX_TURNS}</span>
        </div>
        <div className={gufengStyles.statusItem}>
          <span className={gufengStyles.statusLabel}>{i18n.gold}:</span>
          <span className={gufengStyles.statusValue}>💰 {gold}</span>
        </div>
        <div className={gufengStyles.statusItem}>
          <span className={gufengStyles.statusLabel}>{i18n.status}:</span>
          <span className={gufengStyles.statusValue}>
            {gameStatus === 'idle' && i18n.idle}
            {gameStatus === 'playing' && i18n.playing}
            {gameStatus === 'victory' && i18n.victory}
            {gameStatus === 'defeat' && i18n.defeat}
          </span>
        </div>
      </div>

      {/* 单位商店 */}
      {gameStatus === 'playing' && (
        <div className={gufengStyles.shopPanel}>
          <div className={gufengStyles.shopTitle}>{i18n.shop}</div>
          <div className={gufengStyles.shopGrid}>
            {Object.entries(GAME_CONFIG.UNIT_TYPES).map(([key, unit]) => (
              <button
                key={key}
                className={gufengStyles.shopItem}
                onClick={() => { playClick(); handleBuyUnit(key as UnitType); }}
                onMouseEnter={playHover}
                disabled={gold < unit.cost}
              >
                <div className={gufengStyles.shopIcon}>{unit.icon}</div>
                <div className={gufengStyles.shopName}>{unit.name}</div>
                <div className={gufengStyles.shopStats}>
                  <span>❤️ {unit.hp}</span>
                  <span>⚔️ {unit.attack}</span>
                  <span>🛡️ {unit.defense}</span>
                </div>
                <div className={gufengStyles.shopCost}>💰 {unit.cost}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className={gufengStyles.actionPanel}>
        {gameStatus === 'playing' && (
          <button
            className={gufengStyles.actionBtn}
            onClick={() => { playClick(); endTurn(); }}
            onMouseEnter={playHover}
          >
            {i18n.endTurn}
          </button>
        )}
        
        {(gameStatus === 'victory' || gameStatus === 'defeat') && (
          <button
            className={gufengStyles.actionBtn}
            onClick={() => { playClick(); resetGame(); }}
            onMouseEnter={playHover}
          >
            {i18n.restart}
          </button>
        )}
      </div>

      {/* 选中单位信息 */}
      {selectedUnit && (
        <div className={gufengStyles.unitInfo}>
          <div className={gufengStyles.unitInfoTitle}>{i18n.selectedUnit}</div>
          {/* TODO: 显示选中单位的详细信息 */}
        </div>
      )}
    </div>
  );
});

GameControl.displayName = 'GameControl';

export default GameControl;
