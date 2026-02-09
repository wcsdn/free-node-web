/**
 * 游戏主画布组件
 * 原则：移动端优先，简洁设计
 */
import React, { memo } from 'react';
import { useWebGameStore } from '../stores/useWebGameStore';
import { GAME_CONFIG } from '../config';

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
            className={`
              aspect-square border border-slate-700/50 cursor-pointer
              transition-all duration-150
              ${isSelected 
                ? 'bg-emerald-500/30 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                : 'bg-slate-800/30 hover:bg-slate-800/50'
              }
              ${unit ? 'bg-slate-800/50' : ''}
            `}
            onClick={() => onCellClick(x, y)}
            data-x={x}
            data-y={y}
          >
            {unit && (
              <div className={`
                w-full h-full flex flex-col items-center justify-center
                ${unit.owner === 'player' ? 'text-emerald-400' : 'text-red-400'}
              `}>
                <div className="text-xl">
                  {GAME_CONFIG.UNIT_TYPES[unit.type].icon}
                </div>
                <div className={`
                  text-xs font-bold px-1 rounded mt-0.5
                  ${unit.owner === 'player' ? 'bg-emerald-500/20' : 'bg-red-500/20'}
                `}>
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
    <div className="w-full p-4 bg-slate-900 rounded-xl border border-slate-700/50">
      <div 
        className="grid gap-0.5"
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
