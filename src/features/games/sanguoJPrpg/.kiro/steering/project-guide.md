# 色块RPG项目 - AI架构师指南

## 🎭 AI人设

我是这个项目的**架构师兼制作人**，负责：
1. 项目结构设计与维护
2. 代码规范制定
3. 功能模块划分
4. 进度追踪与文档同步

---

## 📁 项目结构（当前）

```
/
├── mobile_new.html     # 移动端入口（主力开发）⭐
├── index.html          # PC端入口（旧版）
├── mapPreview.html     # 地图预览工具
├── mobile.html         # 移动端旧版
├── README.md           # 项目说明
│
├── js/                 # JavaScript文件
│   ├── config.js       # 游戏配置与消息
│   ├── utils.js        # 工具函数
│   ├── game.js         # 游戏主控制器
│   ├── modal.js        # 弹框系统逻辑
│   ├── mobile.js       # 移动端旧版JS
│   └── newGame.js      # 新游戏逻辑（待整理）
│
├── css/                # 样式文件
│   ├── modal.css       # 弹框样式
│   ├── style.css       # 主样式
│   └── mobile.css      # 移动端样式
│
├── classes/            # 游戏对象类
│   ├── Mission.js      # 矿区（原任务）
│   ├── Enemy.js        # 敌人/妖怪
│   ├── ShopItem.js     # 商店物品
│   ├── SpecialItems.js # 特殊功能（待添加弹框）
│   └── ItemObj.js      # 掉落物品
│
├── maps/               # 地图数据（750×1334适配）
│   ├── data_1_经典随机.js
│   ├── data_2_区域划分.js
│   ├── data_3_螺旋进阶.js
│   ├── data_4_迷宫通道.js
│   ├── data_5_塔防路径.js
│   └── maps_summary.json
│
├── data/               # 数据文件
│   ├── data.js         # 原始地图数据（旧）
│   └── final_data.json # 最终数据
│
├── tools/              # 开发工具
│   ├── mapGenerator.js # 地图生成器类
│   └── generateMaps.js # 地图生成脚本（node运行）
│
└── .kiro/steering/     # AI指导文档
    └── project-guide.md
```

---

## 🎮 游戏世界观

### 背景设定
- 玩家是一名**矿区领主**
- 世界被**妖怪**占领，矿区被封锁
- 目标：攻占矿区、击败妖怪、收集资源、变强

### 核心元素对应
| 游戏元素 | 世界观名称 | 颜色 |
|---------|-----------|------|
| Mission | 妖怪占领的矿区 | 🔵蓝色 |
| Enemy | 妖怪/怪物 | 🔴红色 |
| ShopItem ATK | 武器商店 | 🟣洋红 |
| ShopItem DEF | 防具商店 | 🔵青色 |
| Special | 特殊设施 | 🟢绿色等 |
| Boss | 妖王 | 🔴深红 |

---

## ⚠️ AI开发注意事项（坑点规避）

### 1. 文件编码
- 所有文件使用 **UTF-8** 编码
- 中文文件名在Node.js中可能有问题，但浏览器端OK

### 2. 代码拆分原则
- 单个文件不超过 **300行**
- CSS/JS 分离到独立文件
- 弹框、UI组件独立成模块

### 3. 类文件修改规范
- 修改类文件时，先 `readFile` 确认当前内容
- 使用 `strReplace` 精确替换，避免全文件重写
- 类中添加新方法时，放在类的末尾

### 4. 数据文件规范
- 地图数据使用 `const` 声明
- 必须包含：MISSION_DATA, ENEMY_DATA, SHOP_DATA_TEMPLATE, SPECIAL_DATA
- SPECIAL_DATA 必须包含所有12个字段

### 5. 弹框系统
- 所有交互通过弹框进行
- 弹框函数命名：`show{Type}Modal()`
- 操作函数命名：`do{Type}{Action}()`

### 6. 避免的操作
- ❌ 不要在HTML中写大段内联JS
- ❌ 不要硬编码数值，放config.js
- ❌ 不要直接修改DOM样式，用CSS类
- ❌ 不要用 `var`，用 `const/let`

---

## 📊 当前开发进度

### ✅ 已完成
- [x] 基础游戏框架（从Egret重构）
- [x] 移动端适配（750×1334）
- [x] 地图生成器（5种风格）
- [x] 弹框交互系统
- [x] 矿区主题改造（原任务系统）

### 🔄 进行中
- [ ] 项目结构整理
- [ ] 特殊功能弹框（SpecialItems）
- [ ] 掉落物品优化

### 📋 待开发
- [ ] 存档系统
- [ ] 音效系统
- [ ] 成就系统UI
- [ ] 新手引导
- [ ] 更多地图风格

---

## 🔧 常用命令

```bash
# 启动本地服务器
python -m http.server 3000

# 重新生成地图（在tools目录下运行）
cd tools
node generateMaps.js

# 访问地址
http://localhost:3000/mobile_new.html  # 游戏
http://localhost:3000/mapPreview.html  # 地图预览
```

---

## 📝 Session交接清单

每次session结束前，更新以下内容：
1. 本次完成的功能
2. 遇到的问题及解决方案
3. 下次需要继续的工作
4. 任何重要的设计决策

---

## 📅 Session记录

### Session 1 (2024-12-18)

**完成的功能：**
- 深度梳理游戏规则，更新README.md
- 创建地图生成器（5种风格：经典随机、区域划分、螺旋进阶、迷宫通道、塔防路径）
- 适配750×1334移动端屏幕（80%游戏区/20%属性栏）
- 实现弹框交互系统（矿区、敌人、商店）
- 任务系统改造为"妖怪占领的矿区"主题
- 拆分弹框代码到独立文件（modal.css, modal.js）
- 创建AI架构师指南

**遇到的问题：**
1. ItemObj.js文件被截断导致语法错误 → 重写整个文件
2. 地图生成器boss字段缺失 → 添加mustGenerate强制生成
3. 色块太小看不清 → 改用弹框交互

**下次继续：**
- [ ] 整理文件到css/js/tools目录
- [ ] 为SpecialItems添加弹框
- [ ] 优化掉落物品收集体验
- [ ] 实现存档系统

---

## 🎯 设计原则

1. **移动优先** - 所有功能先在移动端实现
2. **弹框交互** - 避免小按钮，用弹框展示详情
3. **数据驱动** - 游戏内容由数据文件定义
4. **模块化** - 功能独立，便于维护
5. **渐进增强** - 核心玩法先行，细节后补
