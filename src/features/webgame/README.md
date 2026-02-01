# WebGame 策略游戏

## 功能概述

赛博朋克风格的策略游戏，支持钱包签名认证。

## 技术栈

- React 18 + TypeScript
- Zustand 状态管理
- RainbowKit + wagmi 钱包集成
- CSS Modules 样式
- PageLayout 统一页面布局

## 文件结构

```
src/features/webgame/
├── index.tsx                    # 主入口组件
├── components/
│   ├── GameCanvas.tsx           # 游戏画布（地图和单位）
│   └── GameControl.tsx          # 控制面板（商店、状态）
├── hooks/
│   └── useGameLogic.ts          # 游戏逻辑 Hook
├── stores/
│   └── useWebGameStore.ts       # 游戏状态管理
├── styles/
│   └── game.module.css          # 样式文件
├── config.ts                    # 游戏配置
└── README.md                    # 文档
```

## 游戏玩法

1. 连接钱包并签名认证
2. 购买单位（战士、弓箭手、法师、坦克）
3. 在地图上部署单位
4. 移动单位和攻击敌人
5. 击败所有敌人获胜

## 游戏配置

- 地图尺寸：20x15
- 初始金币：500
- 每回合金币：100
- 最大回合数：50

## 单位类型

| 单位 | 图标 | HP | 攻击 | 防御 | 花费 |
|------|------|-----|------|------|------|
| 战士 | ⚔️ | 100 | 20 | 10 | 50 |
| 弓箭手 | 🏹 | 80 | 25 | 5 | 60 |
| 法师 | 🔮 | 60 | 35 | 3 | 80 |
| 坦克 | 🛡️ | 150 | 15 | 20 | 100 |

## API 端点

- 保存游戏：`POST /api/webgame/save`
- 加载游戏：`GET /api/webgame/load`
- 排行榜：`GET /api/webgame/leaderboard`

## 待实现功能

- [ ] AI 敌人逻辑
- [ ] 攻击动画
- [ ] 音效
- [ ] 排行榜
- [ ] 多人对战
