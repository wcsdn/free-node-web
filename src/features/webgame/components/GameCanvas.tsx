/**
 * 游戏主画布组件
 */

import React, { memo } from 'react';
import { useWebGameStore } from '../stores/useWebGameStore';
import { GAME_CONFIG } from '../config';
import styles from '../styles/game.module.css';

interface GameCanvasProps {
  onCellClick: (x: number, y: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = memo(({ onCellClick }) => {
  const { units, selectedUnit } = useWebGameStore();

  // 渲染地图格子
  const renderGrid = () => {
    const cells = [];
    
    for (let y = 0; y < GAME_CONFIG.MAP_HEIGHT; y++) {
      for (let x = 0; x < GAME_CONFIG.MAP_WIDTH; x++) {
        const unit = units.find(u => u.x === x && u.y === y);
        const isSelected = unit && unit.id === selectedUnit;
        
        cells.push(
          <div
            key={`${x}-${y}`}
            className={`${styles.cell} ${isSelected ? styles.selected : ''} ${unit ? styles.occupied : ''}`}
            onClick={() => onCellClick(x, y)}
            data-x={x}
            data-y={y}
          >
            {unit && (
              <div className={`${styles.unit} ${styles[unit.owner]}`}>
                <div className={styles.unitIcon}>
                  {GAME_CONFIG.UNIT_TYPES[unit.type].icon}
                </div>
                <div className={styles.unitHp}>
                  {unit.hp}
                </div>
              </div>
            )}
          </div>
        );
      }
    }
    
    return cells;
  };

  return (
    <div className={styles.gameCanvas}>
      <div 
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${GAME_CONFIG.MAP_WIDTH}, 1fr)`,
          gridTemplateRows: `repeat(${GAME_CONFIG.MAP_HEIGHT}, 1fr)`,
        }}
      >
        {renderGrid()}
      </div>
    </div>
  );
});

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;
