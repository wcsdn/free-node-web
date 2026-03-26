/**
 * 地图面板组件
 * 显示世界地图、领地、坐标，支持地图缩放、拖拽、地块信息展示
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============ 类型定义 ============

/** 地图配置 */
export interface MapConfig {
  width: number;
  height: number;
  worldSize: number;
  terrainTypes: Record<string, number>;
}

/** 地形类型 */
export type TerrainType = 'city' | 'npc_city' | 'wild' | 'mountain' | 'forest' | 'water' | 'empty';

/** 地块数据 */
export interface MapTile {
  x: number;
  y: number;
  pos: number;
  type: TerrainType;
  name: string;
  level: number;
  owner: string | null;
  /** 玩家城市特有 */
  prosperity?: number;
  /** NPC 城市特有 */
  portraitIndex?: number;
  /** 是否已探索 */
  explored?: boolean;
  /** 是否可攻击 */
  canAttack?: boolean;
  /** 是否受保护 */
  isProtected?: boolean;
}

/** 地图概览响应 */
export interface MapOverviewResponse {
  config: MapConfig;
  npcs: Array<{
    pos: number;
    level: number;
    name: string;
    picIndex: number;
  }>;
  terrains: Array<{
    pos: number;
    type: number;
    picIndex: number;
  }>;
  message?: string;
}

/** 位置详情响应 */
export interface PositionDetailResponse {
  position: number;
  type: 'city' | 'npc' | 'terrain' | 'empty';
  name?: string;
  owner?: string;
  ownerLevel?: number;
  level?: number;
  prosperity?: number;
  isProtected?: boolean;
  canAttack?: boolean;
  terrainType?: number;
  picIndex?: number;
  portraitIndex?: number;
  message?: string;
}

/** 玩家位置响应 */
export interface PlayerPositionResponse {
  position: number;
  name: string;
}

/** 探索结果 */
export interface ExploreResult {
  position: number;
  distance: number;
  explored: boolean;
  terrain: { type: number };
  message: string;
}

/** 移动状态 */
export interface MovementStatus {
  moving: boolean;
  from?: number;
  to?: number;
  startTime?: string;
  arriveTime?: string;
  remainingSeconds?: number;
  message?: string;
}

/** 地图地块信息（对应后端 MapUnitInfo） */
export interface MapUnitInfo {
  ID: number;
  Type: number;       // 1=建筑, 2=武将, 3=城市
  EventID: number;
  Name: string;
  Level: number;
  Pos: number;
  Image: string;
  Icon: string;
  Index: number;
  State: number;
  AttackCount: number;
  UniteCount: number;
  SubLevel: number;
  UserName: string;
  Quality: number;
  CityName: string;
  ArriveTime: string;
  DefeceFlag: number;
  EspecialType: number;
  IsAppendantNPC: number;
  IsLord: number;
  /** 领土标记 */
  isMyTerritory?: boolean;
}

/** 地块操作菜单 */
export interface TileAction {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'info';
}

interface MapPanelProps {
  /** 城市 ID（可选，默认使用主城） */
  cityId?: number;
  /** 是否全屏显示 */
  fullscreen?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 切换面板回调 */
  onNavigate?: (panel: string) => void;
}

// ============ 工具函数 ============

/** 坐标转位置 */
function coordToPos(x: number, y: number, mapWidth: number = 9): number {
  return y * mapWidth + x;
}

/** 位置转坐标 */
function posToCoord(pos: number, mapWidth: number = 9): { x: number; y: number } {
  return {
    x: pos % mapWidth,
    y: Math.floor(pos / mapWidth),
  };
}

/** 距离计算 */
function calcDistance(from: number, to: number, mapWidth: number = 9): number {
  const fromCoord = posToCoord(from, mapWidth);
  const toCoord = posToCoord(to, mapWidth);
  return Math.abs(fromCoord.x - toCoord.x) + Math.abs(fromCoord.y - toCoord.y);
}

/** 格式化时间 */
function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs}秒`;
}

// ============ 常量 ============

const MAP_WIDTH = 9;   // 默认地图宽度（9x9 区块）
const MAP_HEIGHT = 9;

/** 地形类型常量 */
const TERRAIN_TYPE_MAP: Record<number, TerrainType> = {
  1: 'wild',      // 平原 (旧: plain)
  2: 'mountain',   // 山地
  3: 'water',      // 水域
  4: 'forest',     // 森林
  5: 'empty',      // 沙漠 (旧: desert)
};

/** 地形图标 */
const TERRAIN_ICONS: Record<TerrainType, string> = {
  city: '🏰',
  npc_city: '🏯',
  wild: '🌿',
  mountain: '⛰️',
  forest: '🌲',
  water: '🌊',
  empty: '⬜',
};

/** 地形颜色 */
const TERRAIN_COLORS: Record<TerrainType, string> = {
  city: 'rgba(59, 130, 246, 0.4)',       // 蓝色 - 玩家城市
  npc_city: 'rgba(168, 85, 247, 0.4)',   // 紫色 - NPC城市
  wild: 'rgba(34, 197, 94, 0.2)',         // 绿色 - 荒野
  mountain: 'rgba(139, 119, 101, 0.4)',  // 棕色 - 山地
  forest: 'rgba(34, 197, 94, 0.3)',       // 深绿 - 森林
  water: 'rgba(59, 130, 246, 0.3)',       // 蓝色 - 水域
  empty: 'rgba(255, 255, 255, 0.03)',    // 透明 - 空地
};

/** 地形边框色 */
const TERRAIN_BORDER_COLORS: Record<TerrainType, string> = {
  city: '#3b82f6',
  npc_city: '#a855f7',
  wild: '#22c55e',
  mountain: '#8b7355',
  forest: '#16a34a',
  water: '#2563eb',
  empty: 'transparent',
};

// ============ 组件 ============

export const MapPanel: React.FC<MapPanelProps> = ({
  cityId,
  fullscreen = false,
  onClose,
  onNavigate,
}) => {
  // ---- 状态 ----
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 地图数据
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);
  const [tiles, setTiles] = useState<MapTile[]>([]);
  const [playerPos, setPlayerPos] = useState<number>(0);
  const [playerCityName, setPlayerCityName] = useState<string>('');

  // 交互状态
  const [selectedTile, setSelectedTile] = useState<MapTile | null>(null);
  const [hoveredTile, setHoveredTile] = useState<MapTile | null>(null);

  // 地图操作
  const [isExploring, setIsExploring] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [movementStatus, setMovementStatus] = useState<MovementStatus | null>(null);

  // 缩放和拖拽
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  // 视图模式
  const [viewMode, setViewMode] = useState<'overview' | 'territory'>('overview');

  // 侦察状态
  const [isScouting, setIsScouting] = useState(false);
  const [scoutResult, setScoutResult] = useState<{
    position: number;
    type: string;
    name?: string;
    level?: number;
    prosperity?: number;
    population?: number;
    isProtected?: boolean;
    canAttack?: boolean;
    message?: string;
  } | null>(null);

  // ---- API 调用 ----

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8788';
  const DEV_MODE = import.meta.env.DEV;
  const DEV_WALLET = '0x1234567890123456789012345678901234567890';

  /** 通用请求 */
  const apiRequest = useCallback(async <T,>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    data?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    const url = `${API_BASE}/api${endpoint}`;
    const walletAuth = DEV_MODE ? `${DEV_WALLET}:test_signature` : '';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': walletAuth,
        },
        body: method !== 'GET' ? JSON.stringify({ wallet_address: DEV_MODE ? DEV_WALLET : '', ...data }) : undefined,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        return { success: false, error: err.error || `HTTP ${response.status}` };
      }

      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  /** 加载地图概览 */
  const loadMapOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await apiRequest<MapOverviewResponse>('/map/', 'GET');

    if (!result.success) {
      setError(result.error || '加载地图失败');
      setIsLoading(false);
      return;
    }

    const { config, npcs } = result.data || {};

    // 构建地块数据（9x9 网格）
    const generatedTiles: MapTile[] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const pos = coordToPos(x, y, MAP_WIDTH);

        // 检查是否为 NPC 城市
        const npc = npcs?.find(n => n.pos === pos);

        if (npc) {
          generatedTiles.push({
            x, y, pos,
            type: 'npc_city',
            name: npc.name || `城池${pos}`,
            level: npc.level || 1,
            owner: null,
            portraitIndex: npc.picIndex,
            explored: true,
            canAttack: true,
          });
        } else {
          // 默认荒野
          generatedTiles.push({
            x, y, pos,
            type: 'empty',
            name: '',
            level: 0,
            owner: null,
            explored: false,
          });
        }
      }
    }

    setMapConfig(config || { width: MAP_WIDTH, height: MAP_HEIGHT, worldSize: 81, terrainTypes: {} });
    setTiles(generatedTiles);
    setIsLoading(false);
  }, [apiRequest]);

  /** 加载玩家位置 */
  const loadPlayerPosition = useCallback(async () => {
    const result = await apiRequest<PlayerPositionResponse>('/map/position', 'GET');

    if (result.success && result.data) {
      setPlayerPos(result.data.position);
      setPlayerCityName(result.data.name || '主城');

      // 标记玩家领土
      setTiles(prev => prev.map(tile => {
        if (tile.pos === result.data!.position) {
          return {
            ...tile,
            type: 'city' as TerrainType,
            name: result.data!.name || '主城',
            owner: DEV_MODE ? '我方' : '我方',
            explored: true,
            canAttack: false,
            isProtected: true,
          };
        }
        return tile;
      }));
    }
  }, [apiRequest]);

  /** 加载移动状态 */
  const loadMovementStatus = useCallback(async () => {
    const result = await apiRequest<MovementStatus>('/map/movement/status', 'GET');

    if (result.success) {
      setMovementStatus(result.data || null);
      setIsMoving(result.data?.moving || false);
    }
  }, [apiRequest]);

  /** 探索地块 */
  const handleExplore = useCallback(async (pos: number) => {
    setIsExploring(true);

    const result = await apiRequest<ExploreResult>('/map/explore', 'POST', {
      targetPosition: pos,
      useGold: false,
    });

    setIsExploring(false);

    if (result.success && result.data) {
      // 更新地块状态
      const { position, terrain } = result.data;

      setTiles(prev => prev.map(tile => {
        if (tile.pos === position) {
          return {
            ...tile,
            explored: true,
            type: (terrain?.type ? (TERRAIN_TYPE_MAP[terrain.type] || 'wild') : 'wild') as TerrainType,
          };
        }
        return tile;
      }));

      // 重新选择该地块
      const updatedTile = tiles.find(t => t.pos === position);
      if (updatedTile) {
        setSelectedTile({
          ...updatedTile,
          explored: true,
          type: (terrain?.type ? (TERRAIN_TYPE_MAP[terrain.type] || 'wild') : 'wild') as TerrainType,
        });
      }
    } else {
      setError(result.error || '探索失败');
    }
  }, [apiRequest, tiles]);

  /** 移动到地块 */
  const handleMove = useCallback(async (targetPos: number) => {
    const distance = calcDistance(playerPos, targetPos, MAP_WIDTH);
    if (distance === 0) return;

    setIsMoving(true);
    setError(null);

    const result = await apiRequest<{
      from: number;
      to: number;
      distance: number;
      travelTime: number;
      arriveTime: string;
      message: string;
    }>('/map/move', 'POST', {
      targetPosition: targetPos,
    });

    if (result.success && result.data) {
      setMovementStatus({
        moving: true,
        from: result.data.from,
        to: result.data.to,
        arriveTime: result.data.arriveTime,
        remainingSeconds: result.data.travelTime,
        message: result.data.message,
      });
    } else {
      setError(result.error || '移动失败');
      setIsMoving(false);
    }
  }, [apiRequest, playerPos]);

  /** 侦察地块（获取情报） */
  const handleScout = useCallback(async (tile: MapTile) => {
    if (tile.pos === playerPos) {
      setError('无法侦察自己的城市');
      return;
    }

    setIsScouting(true);
    setScoutResult(null);

    const result = await apiRequest<{
      position: number;
      type: string;
      name?: string;
      level?: number;
      prosperity?: number;
      population?: number;
      isProtected?: boolean;
      canAttack?: boolean;
      message?: string;
    }>('/map/world/pos-state', 'GET', { pos: tile.pos });

    setIsScouting(false);

    if (result.success && result.data) {
      setScoutResult(result.data);
    } else {
      setError(result.error || '侦察失败');
    }
  }, [apiRequest, playerPos]);

  /** 获取地块详情 */
  const handleTileClick = useCallback(async (tile: MapTile) => {
    setSelectedTile(tile);

    // 如果未探索，尝试探索
    if (!tile.explored) {
      await handleExplore(tile.pos);
    }
  }, [handleExplore]);

  /** 获取地块操作按钮 */
  const getTileActions = useCallback((tile: MapTile): TileAction[] => {
    const actions: TileAction[] = [];
    const distance = calcDistance(playerPos, tile.pos, MAP_WIDTH);

    if (tile.type === 'city' || tile.type === 'npc_city') {
      if (tile.canAttack) {
        actions.push({
          label: '发起进攻',
          icon: '⚔️',
          onClick: () => onNavigate?.('battle'),
          variant: 'danger',
        });
        actions.push({
          label: '侦查',
          icon: '🔍',
          onClick: () => handleScout(tile),
          variant: 'info',
        });
      } else if (distance > 0) {
        actions.push({
          label: '派遣军队',
          icon: '🚀',
          onClick: () => handleMove(tile.pos),
          disabled: isMoving,
        });
      }
    } else if (!tile.explored) {
      actions.push({
        label: '探索',
        icon: '🧭',
        onClick: () => handleExplore(tile.pos),
        disabled: isExploring,
        variant: 'primary',
      });
    } else if (distance > 0 && tile.explored) {
      actions.push({
        label: '移动至此',
        icon: '🚶',
        onClick: () => handleMove(tile.pos),
        disabled: isMoving,
        variant: 'primary',
      });
    }

    return actions;
  }, [playerPos, isMoving, isExploring, handleMove, handleExplore, handleScout, onNavigate]);

  // ---- 缩放和拖拽 ----

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    }
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(2, prev + 0.2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(0.5, prev - 0.2));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // ---- 生命周期 ----

  useEffect(() => {
    loadMapOverview();
    loadPlayerPosition();
    loadMovementStatus();

    // 定时刷新移动状态
    const interval = setInterval(() => {
      if (isMoving) {
        loadMovementStatus();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loadMapOverview, loadPlayerPosition, loadMovementStatus, isMoving]);

  // ---- 辅助 ----

  const playerCoord = posToCoord(playerPos, MAP_WIDTH);
  const exploredCount = tiles.filter(t => t.explored).length;

  // ---- 渲染 ----

  if (isLoading) {
    return (
      <div className="map-panel" style={fullscreen ? { height: '100vh', overflow: 'hidden' } : {}}>
        <div className="map-loading">
          <div className="task-loading-spinner" />
          <span>🗺️ 加载地图数据中...</span>
        </div>
      </div>
    );
  }

  if (error && !tiles.length) {
    return (
      <div className="map-panel" style={fullscreen ? { height: '100vh', overflow: 'hidden' } : {}}>
        <div className="map-error">
          <span style={{ fontSize: '32px' }}>⚠️</span>
          <p>{error}</p>
          <button className="building-action" onClick={() => { setError(null); loadMapOverview(); }}>
            🔄 重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="map-panel"
      style={fullscreen ? { height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' } : {}}
    >
      {/* ---- 头部 ---- */}
      <div className="map-header">
        <div className="map-header-left">
          <h2 className="map-title">🗺️ 世界地图</h2>
          <div className="map-pos-info">
            <span className="map-pos-label">📍 当前位置</span>
            <span className="map-pos-value">
              {playerCityName} ({playerCoord.x}, {playerCoord.y})
            </span>
          </div>
        </div>

        <div className="map-header-right">
          {/* 探索统计 */}
          <div className="map-stat">
            <span className="map-stat-icon">🔍</span>
            <span className="map-stat-value">{exploredCount}</span>
            <span className="map-stat-label">/ {tiles.length} 已探索</span>
          </div>

          {/* 移动状态 */}
          {isMoving && movementStatus?.moving && (
            <div className="map-moving-badge">
              <span>🚶 移动中</span>
              <span>{movementStatus.remainingSeconds ? formatTime(movementStatus.remainingSeconds) : ''}</span>
            </div>
          )}

          {/* 视图切换 */}
          <div className="map-view-toggle">
            <button
              className={`rank-tab ${viewMode === 'overview' ? 'active' : ''}`}
              onClick={() => setViewMode('overview')}
            >
              全图
            </button>
            <button
              className={`rank-tab ${viewMode === 'territory' ? 'active' : ''}`}
              onClick={() => setViewMode('territory')}
            >
              领土
            </button>
          </div>

          {/* 关闭按钮 */}
          {onClose && (
            <button className="task-close-btn" onClick={onClose}>✕</button>
          )}
        </div>
      </div>

      {/* ---- 主体 ---- */}
      <div className="map-body">
        {/* ---- 地图区域 ---- */}
        <div
          ref={mapRef}
          className="map-canvas-container"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {/* 地图网格 */}
          <div
            className="map-grid-container"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              display: 'grid',
              gridTemplateColumns: `repeat(${MAP_WIDTH}, var(--map-cell-size, 60px))`,
              gridTemplateRows: `repeat(${MAP_HEIGHT}, var(--map-cell-size, 60px))`,
              gap: '2px',
              width: 'fit-content',
              transition: isDragging ? 'none' : 'transform 0.2s ease',
            }}
          >
            {tiles.map((tile) => {
              const isSelected = selectedTile?.pos === tile.pos;
              const isHovered = hoveredTile?.pos === tile.pos;
              const isPlayer = tile.pos === playerPos;

              return (
                <div
                  key={tile.pos}
                  className={`map-cell ${tile.type} ${isSelected ? 'selected' : ''} ${isPlayer ? 'player' : ''} ${!tile.explored ? 'unexplored' : ''}`}
                  style={{
                    width: 'var(--map-cell-size, 60px)',
                    height: 'var(--map-cell-size, 60px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: !tile.explored
                      ? 'rgba(0, 0, 0, 0.3)'
                      : TERRAIN_COLORS[tile.type] || TERRAIN_COLORS.empty,
                    border: isSelected
                      ? '3px solid #ffd700'
                      : isPlayer
                        ? `2px solid #4ade80`
                        : `1px solid ${TERRAIN_BORDER_COLORS[tile.type] || 'transparent'}`,
                    borderRadius: '6px',
                    cursor: tile.explored || !isSelected ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    opacity: !tile.explored && viewMode === 'territory' ? 0.3 : 1,
                  }}
                  onClick={() => handleTileClick(tile)}
                  onMouseEnter={() => setHoveredTile(tile)}
                  onMouseLeave={() => setHoveredTile(null)}
                  title={!tile.explored ? '未探索' : `${tile.name || TERRAIN_ICONS[tile.type]} (${tile.x}, ${tile.y})`}
                >
                  {/* 地形图标 */}
                  <span className="cell-icon" style={{
                    fontSize: tile.explored ? '24px' : '16px',
                    filter: !tile.explored ? 'brightness(0.3)' : 'none',
                  }}>
                    {tile.explored ? TERRAIN_ICONS[tile.type] : '❓'}
                  </span>

                  {/* 等级标签 */}
                  {tile.explored && (tile.type === 'city' || tile.type === 'npc_city') && (
                    <span className="cell-level" style={{
                      position: 'absolute',
                      bottom: '2px',
                      fontSize: 'var(--map-cell-font, 12px)',
                      color: '#fff',
                      textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                      fontWeight: 'bold',
                    }}>
                      Lv.{tile.level}
                    </span>
                  )}

                  {/* 玩家标记 */}
                  {isPlayer && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      fontSize: '12px',
                    }}>
                      👑
                    </span>
                  )}

                  {/* 悬停效果 */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      pointerEvents: 'none',
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* 缩放控制 */}
          <div className="map-zoom-controls">
            <button className="map-zoom-btn" onClick={handleZoomIn} title="放大">➕</button>
            <span className="map-zoom-level">{Math.round(zoom * 100)}%</span>
            <button className="map-zoom-btn" onClick={handleZoomOut} title="缩小">➖</button>
            <button className="map-zoom-btn" onClick={handleResetView} title="重置">🔄</button>
          </div>

          {/* 坐标显示 */}
          <div className="map-coord-display">
            {hoveredTile ? (
              <span>({hoveredTile.x}, {hoveredTile.y}) - 位置 {hoveredTile.pos}</span>
            ) : (
              <span>坐标: ({playerCoord.x}, {playerCoord.y})</span>
            )}
          </div>
        </div>

        {/* ---- 侧边栏 ---- */}
        <div className="map-sidebar">
          {/* 地块详情 */}
          <div className="dashboard-card">
            <div className="dashboard-card-title">
              {selectedTile ? '📍 地块详情' : '📍 地块信息'}
            </div>
            <div className="dashboard-card-content">
              {selectedTile ? (
                <>
                  <div className="city-info-item">
                    <span className="city-info-label">类型</span>
                    <span className="city-info-value">
                      {selectedTile.explored
                        ? `${TERRAIN_ICONS[selectedTile.type]} ${getTerrainTypeName(selectedTile.type)}`
                        : '❓ 未探索'}
                    </span>
                  </div>
                  {selectedTile.name && (
                    <div className="city-info-item">
                      <span className="city-info-label">名称</span>
                      <span className="city-info-value">{selectedTile.name}</span>
                    </div>
                  )}
                  {selectedTile.type === 'city' && selectedTile.owner && (
                    <div className="city-info-item">
                      <span className="city-info-label">所属</span>
                      <span className="city-info-value" style={{ color: '#4ade80' }}>
                        {selectedTile.owner}
                      </span>
                    </div>
                  )}
                  {selectedTile.type === 'npc_city' && (
                    <div className="city-info-item">
                      <span className="city-info-label">等级</span>
                      <span className="city-info-value">Lv.{selectedTile.level}</span>
                    </div>
                  )}
                  <div className="city-info-item">
                    <span className="city-info-label">坐标</span>
                    <span className="city-info-value">({selectedTile.x}, {selectedTile.y})</span>
                  </div>
                  <div className="city-info-item">
                    <span className="city-info-label">位置编号</span>
                    <span className="city-info-value">{selectedTile.pos}</span>
                  </div>
                  {selectedTile.type !== 'empty' && (
                    <div className="city-info-item">
                      <span className="city-info-label">距离</span>
                      <span className="city-info-value">
                        {calcDistance(playerPos, selectedTile.pos, MAP_WIDTH)} 格
                      </span>
                    </div>
                  )}
                  {selectedTile.isProtected && (
                    <div className="city-info-item">
                      <span className="city-info-label">状态</span>
                      <span className="city-info-value" style={{ color: '#4ade80' }}>🛡️ 受保护</span>
                    </div>
                  )}
                  {selectedTile.canAttack && (
                    <div className="city-info-item">
                      <span className="city-info-label">状态</span>
                      <span className="city-info-value" style={{ color: '#ef4444' }}>⚔️ 可攻击</span>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: '#666', fontSize: '13px' }}>
                  点击地图上的地块查看详情
                </p>
              )}
            </div>

            {/* 操作按钮 */}
            {selectedTile && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getTileActions(selectedTile).map((action, idx) => (
                  <button
                    key={idx}
                    className="building-action"
                    disabled={action.disabled || isExploring || isMoving || isScouting}
                    onClick={action.onClick}
                    style={{
                      width: '100%',
                      background: action.variant === 'danger'
                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                        : action.variant === 'info'
                          ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                          : undefined,
                    }}
                  >
                    {action.icon} {action.label}
                    {(isExploring || isMoving) && action.label.includes('探索') && '...'}
                    {isScouting && action.label === '侦查' && '...'}
                  </button>
                ))}
              </div>
            )}

            {/* 侦察结果 */}
            {scoutResult && (
              <div className="scout-result">
                <div className="scout-result-title">
                  🔍 侦察报告
                  <button
                    onClick={() => setScoutResult(null)}
                    style={{
                      marginLeft: 'auto',
                      background: 'none',
                      border: 'none',
                      color: '#888',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div className="scout-result-item">
                  <span>位置</span>
                  <span>{scoutResult.position}</span>
                </div>
                {scoutResult.name && (
                  <div className="scout-result-item">
                    <span>名称</span>
                    <span>{scoutResult.name}</span>
                  </div>
                )}
                {scoutResult.level && (
                  <div className="scout-result-item">
                    <span>等级</span>
                    <span>Lv.{scoutResult.level}</span>
                  </div>
                )}
                {scoutResult.prosperity !== undefined && (
                  <div className="scout-result-item">
                    <span>繁荣度</span>
                    <span>{scoutResult.prosperity}</span>
                  </div>
                )}
                {scoutResult.population !== undefined && (
                  <div className="scout-result-item">
                    <span>人口</span>
                    <span>{scoutResult.population}</span>
                  </div>
                )}
                {scoutResult.isProtected && (
                  <div className="scout-result-item">
                    <span>状态</span>
                    <span style={{ color: '#4ade80' }}>🛡️ 受保护</span>
                  </div>
                )}
                {scoutResult.canAttack && (
                  <div className="scout-result-item">
                    <span>状态</span>
                    <span style={{ color: '#ef4444' }}>⚔️ 可攻击</span>
                  </div>
                )}
                {scoutResult.message && (
                  <div className="scout-result-item">
                    <span>备注</span>
                    <span style={{ color: '#f59e0b' }}>{scoutResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 图例 */}
          <div className="dashboard-card">
            <div className="dashboard-card-title">🗺️ 图例</div>
            <div className="dashboard-card-content" style={{ fontSize: '13px' }}>
              {([
                ['city', '🏰', '玩家城市', '#3b82f6'],
                ['npc_city', '🏯', 'NPC城池', '#a855f7'],
                ['wild', '🌿', '荒野', '#22c55e'],
                ['mountain', '⛰️', '山地', '#8b7355'],
                ['forest', '🌲', '森林', '#16a34a'],
                ['water', '🌊', '水域', '#2563eb'],
              ] as [TerrainType, string, string, string][]).map(([type, icon, label, color]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ color }}>{icon}</span>
                  <span style={{ flex: 1 }}>{label}</span>
                  <div style={{ width: '12px', height: '12px', background: color, borderRadius: '3px' }} />
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span>👑</span>
                <span style={{ flex: 1 }}>我的位置</span>
                <div style={{ width: '12px', height: '12px', background: '#4ade80', borderRadius: '3px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>❓</span>
                <span style={{ flex: 1 }}>未探索</span>
                <div style={{ width: '12px', height: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '3px' }} />
              </div>
            </div>
          </div>

          {/* 地图操作 */}
          <div className="dashboard-card">
            <div className="dashboard-card-title">🎮 地图操作</div>
            <div className="dashboard-card-content" style={{ fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button className="building-action" onClick={() => setZoom(prev => Math.min(2, prev + 0.2))}>
                  🔍 放大
                </button>
                <button className="building-action" onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}>
                  🔍 缩小
                </button>
                <button className="building-action" onClick={handleResetView}>
                  🧭 重置视角
                </button>
                <button className="building-action" onClick={() => onNavigate?.('city')}>
                  🏠 返回城市
                </button>
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="task-error">
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============ 辅助函数 ============

/** 获取地形类型中文名 */
function getTerrainTypeName(type: TerrainType): string {
  const names: Record<TerrainType, string> = {
    city: '玩家城市',
    npc_city: 'NPC城池',
    wild: '荒野',
    mountain: '山地',
    forest: '森林',
    water: '水域',
    empty: '空地',
  };
  return names[type] || '未知';
}

export default MapPanel;
