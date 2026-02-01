/**
 * 游戏控制面板组件
 */

import React, { memo } from 'react';
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
    
    const unitName = language === 'en' ? unitConfig.nameEn : unitConfig.name;
    setError(`${i18n.selectPosition} ${unitName}`);
    // 实际放置逻辑在 GameCanvas 的 onCellClick 中处理
  };

  return (
    <div className={styles.gameControl}>
      {/* 游戏状态 */}
      <div className={styles.statusPanel}>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>{i18n.turn}:</span>
          <span className={styles.statusValue}>{turn}/{GAME_CONFIG.MAX_TURNS}</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>{i18n.gold}:</span>
          <span className={styles.statusValue}>💰 {gold}</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>{i18n.status}:</span>
          <span className={styles.statusValue}>
            {gameStatus === 'idle' && i18n.idle}
            {gameStatus === 'playing' && i18n.playing}
            {gameStatus === 'victory' && i18n.victory}
            {gameStatus === 'defeat' && i18n.defeat}
          </span>
        </div>
      </div>

      {/* 单位商店 */}
      {gameStatus === 'playing' && (
        <div className={styles.shopPanel}>
          <div className={styles.shopTitle}>{i18n.shop}</div>
          <div className={styles.shopGrid}>
            {Object.entries(GAME_CONFIG.UNIT_TYPES).map(([key, unit]) => (
              <button
                key={key}
                className={styles.shopItem}
                onClick={() => { playClick(); handleBuyUnit(key as UnitType); }}
                onMouseEnter={playHover}
                disabled={gold < unit.cost}
              >
                <div className={styles.shopIcon}>{unit.icon}</div>
                <div className={styles.shopName}>{language === 'en' ? unit.nameEn : unit.name}</div>
                <div className={styles.shopStats}>
                  <span>❤️ {unit.hp}</span>
                  <span>⚔️ {unit.attack}</span>
                  <span>🛡️ {unit.defense}</span>
                </div>
                <div className={styles.shopCost}>💰 {unit.cost}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className={styles.actionPanel}>
        {gameStatus === 'playing' && (
          <button
            className={styles.actionBtn}
            onClick={() => { playClick(); endTurn(); }}
            onMouseEnter={playHover}
          >
            {i18n.endTurn}
          </button>
        )}
        
        {(gameStatus === 'victory' || gameStatus === 'defeat') && (
          <button
            className={styles.actionBtn}
            onClick={() => { playClick(); resetGame(); }}
            onMouseEnter={playHover}
          >
            {i18n.restart}
          </button>
        )}
      </div>

      {/* 选中单位信息 */}
      {selectedUnit && (
        <div className={styles.unitInfo}>
          <div className={styles.unitInfoTitle}>{i18n.selectedUnit}</div>
          {/* TODO: 显示选中单位的详细信息 */}
        </div>
      )}
    </div>
  );
});

GameControl.displayName = 'GameControl';

export default GameControl;
