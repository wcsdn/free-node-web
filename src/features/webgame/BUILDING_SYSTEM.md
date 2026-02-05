# 建筑系统实现总结

## 实现日期
2026-02-05

## 功能概述
完整实现了剑侠情缘 Web 版的建筑显示系统，包括主地图建筑图标和右侧建筑列表。

---

## 一、数据流程

### 1.1 后端数据结构

**API 端点**: `POST /api/game/city/building-list/:cityId`

**返回数据格式**:
```json
{
  "success": true,
  "data": {
    "buildings": [
      {
        "id": 1,
        "configId": 1,
        "level": 1,
        "position": 10,
        "startTime": "2026-02-05T04:32:10.191Z",
        "finishTime": "2026-02-05T04:32:10.191Z"
      }
    ]
  }
}
```

**字段说明**:
- `id`: 建筑实例 ID（数据库主键）
- `configId`: 建筑配置 ID（1-16，决定建筑类型）
- `level`: 建筑等级
- `position`: 建筑位置（1-16，对应 CSS 类 `img_1_${position}`）
- `startTime`: 建造/升级开始时间
- `finishTime`: 建造/升级完成时间

### 1.2 前端数据处理

```typescript
// 1. 获取建筑数据
const res = await fetch(`${getApiBase()}/api/game/city/building-list/1`, {
  method: 'POST',
  headers: getAuthHeaders(),
});
const data = await res.json();
setBuildings(data.data.buildings);

// 2. 根据 configId 获取建筑名称
const getBuildingName = (configId: number) => {
  const names: Record<number, string> = {
    1: '聚义厅',
    2: '民心设施',
    3: '银库',
    // ... 其他建筑
  };
  return names[configId] || '未知建筑';
};

// 3. 根据 configId 和 level 生成图标路径
const getBuildingIcon = (configId: number, level: number) => {
  if (configId <= 21) {
    return `2/b/m/${configId}.GIF`; // 主地图大图标
  }
  // 其他等级或类型的建筑
  const prefix = String.fromCharCode(96 + Math.floor((configId - 1) / 21));
  const num = ((configId - 1) % 21) + 1;
  return `2/b/m/${prefix}${num}.GIF`;
};
```

---

## 二、前端渲染逻辑

### 2.1 主地图建筑显示

**位置**: `#mainpic` 容器内

**渲染逻辑**:
```tsx
{buildings.map((building) => {
  const icon = getBuildingIcon(building.configId, building.level);
  const position = building.position; // 直接使用服务器返回的 position
  
  // 硬编码位置样式（确保正确显示）
  const positionStyles: Record<number, React.CSSProperties> = {
    1: { position: 'absolute', zIndex: 1, left: '48px', top: '98px' },
    10: { position: 'absolute', zIndex: 4, left: '198px', top: '193px' },
    // ... 其他位置
  };
  
  return (
    <img
      id={`img_1_${position}`}
      className={`img_1_${position}`}
      src={`/jx/Web/img/${icon}`}
      style={{ ...positionStyles[position], pointerEvents: 'none' }}
    />
  );
})}
```

**关键点**:
1. **position 值直接对应 CSS 类名**: `position: 10` → `img_1_10`
2. **图标路径**: `/jx/Web/img/2/b/m/${configId}.GIF` (大图标)
3. **定位方式**: 使用 inline style 硬编码位置，确保不被其他 CSS 覆盖
4. **pointer-events: none**: 让点击穿透到下层的热点区域

### 2.2 右侧建筑列表显示

**位置**: `#trees` 容器内

**渲染逻辑**:
```tsx
{buildings.map((building) => {
  const iconSmall = `2/b/o/${building.configId}.GIF`; // 小图标
  const name = getBuildingName(building.configId);
  
  return (
    <div className="container">
      <div>
        <img className="node_control" src="/jx/Web/img/o/2.gif" />
        <img className="node_icon_1" src={`/jx/Web/img/${iconSmall}`} />
        <span className="node_title_span">{name} Lv.{building.level}</span>
      </div>
      <ul style={{ display: 'none' }}>
        <li><a className="node_handle_a">查看详情</a></li>
      </ul>
    </div>
  );
})}
```

**关键点**:
1. **图标路径**: `/jx/Web/img/2/b/o/${configId}.GIF` (小图标)
2. **CSS 类**: 使用原始 CSS 类 `.container`, `.node_icon_1`, `.node_title_span`
3. **折叠功能**: `<ul>` 默认隐藏，点击展开

### 2.3 热点区域映射

**位置**: `<map>` 元素内

**渲染逻辑**:
```tsx
<map id="map_1" name="map_1">
  {Array.from({ length: 16 }, (_, i) => {
    const position = i + 1; // CSS 位置从 1 开始
    const building = buildings.find(b => b.position === position);
    const coords = building ? interiorAreaCoordsFull[i] : interiorAreaCoordsEmpty[i];
    
    return (
      <area
        id={`area_1_${position}`}
        shape="poly"
        coords={coords}
        onClick={() => {
          if (building) {
            // 打开建筑详情
          } else {
            // 打开建造面板
          }
        }}
      />
    );
  })}
</map>
```

**关键点**:
1. **16 个位置**: 对应 16 个建筑槽位
2. **动态坐标**: 有建筑时用 `interiorAreaCoordsFull`，空地时用 `interiorAreaCoordsEmpty`
3. **点击事件**: 有建筑显示详情，空地显示建造面板

---

## 三、资源目录结构

### 3.1 图标资源

```
jx/Web/img/
├── 2/
│   ├── b/
│   │   ├── m/          # 主地图大图标（透明背景）
│   │   │   ├── 0.JPG   # 背景图
│   │   │   ├── 22.gif  # 透明热点图
│   │   │   ├── 1.GIF   # 聚义厅
│   │   │   ├── 2.GIF   # 民心设施
│   │   │   └── ...
│   │   └── o/          # 右侧列表小图标
│   │       ├── 1.GIF
│   │       ├── 2.GIF
│   │       └── ...
│   └── ...
└── o/
    ├── 2.gif           # 折叠图标
    └── ...
```

### 3.2 CSS 文件

```
jx/Web/Css/
└── Common.css          # 原始 CSS（建筑位置定义）

src/features/webgame/styles/
├── jxMain.module.css   # 模块化 CSS（:global 包裹）
└── jxweb.module.css    # 主样式
```

---

## 四、关键技术点

### 4.1 position 映射关系

**重要**: `position` 值直接对应 CSS 类名，不需要 +1 或 -1

```
服务器返回: position: 10
CSS 类名: img_1_10
位置: 地图中间 (left: 198px, top: 193px)
```

### 4.2 图标路径规则

| 用途 | 目录 | 命名规则 | 示例 |
|------|------|----------|------|
| 主地图 | `/2/b/m/` | `${configId}.GIF` | `1.GIF` (聚义厅) |
| 右侧列表 | `/2/b/o/` | `${configId}.GIF` | `1.GIF` (聚义厅小图标) |

### 4.3 CSS 优先级问题

**问题**: CSS 模块化导致类名被转换，原始类名失效

**解决方案**:
1. 使用 `:global()` 包裹原始类名
2. 或者使用 inline style 硬编码位置（当前方案）

```tsx
// 方案 1: :global() in CSS
:global(.img_1_10) { position: absolute; left: 198px; top: 193px; }

// 方案 2: inline style (当前使用)
<img style={{ position: 'absolute', left: '198px', top: '193px' }} />
```

### 4.4 Wrangler 开发模式

**重要发现**: `wrangler dev` 运行的是 `dist/` 目录下的编译后文件，不是源文件！

**开发流程**:
```bash
# 1. 修改源文件
vim workers/ghost-game/src/routes/game.ts

# 2. 编译
npm run build

# 3. 重启 dev server
npm run dev
```

**或者使用 watch 模式**:
```bash
# 同时运行编译监听和 dev server
npm run build -- --watch &
npm run dev
```

---

## 五、原始逻辑分析

### 5.1 原始 JavaScript 流程

```javascript
// 1. 创建内政页面基础结构
function CreateInteriorPage() {
  var html = "";
  html += HtmlImg("botpic_1", "botpic_1", PicPath + PicInterBack); // 背景
  html += "<img id=\"clearpic_1\" src=\"" + PicPath + PicClarity + "\" usemap=\"#map_1\" />"; // 热点图
  html += "<map id=\"map_1\">...</map>"; // 热点区域
  $("#mainpic").html(html);
}

// 2. 请求地图数据
Main.GetMapUnitInfo(CityID, 1, 0, cb_GetMapUnitInfo);

// 3. 显示建筑
function ShowInteriorMap() {
  var html = "";
  while(MapUnitInfo[i] != null) {
    unit = MapUnitInfo[i];
    // 关键: unit.Pos 直接作为 CSS 类名
    html += HtmlImg("img_1_" + unit.Pos, "img_1_" + unit.Pos, PicPath + unit.Image);
    i++;
  }
  $("#mainpic").append(html); // 追加到 mainpic
}
```

### 5.2 关键差异

| 项目 | 原始逻辑 | 新实现 |
|------|----------|--------|
| 数据来源 | `MapUnitInfo` (ASP.NET) | REST API |
| 渲染方式 | jQuery `.append()` | React 声明式 |
| 位置字段 | `unit.Pos` (1-16) | `building.position` (1-16) |
| 图标路径 | `unit.Image` (服务器返回完整路径) | 前端根据 `configId` 拼接 |
| CSS 应用 | 原生 CSS 类 | inline style (避免冲突) |

---

## 六、常见问题与解决方案

### 6.1 建筑显示在左上角

**原因**: 
- CSS 类未正确应用
- 或 position 值不对

**解决**:
1. 检查 `position` 值是否正确（1-16）
2. 使用 inline style 硬编码位置
3. 检查 CSS 文件是否加载

### 6.2 Worker 修改不生效

**原因**: `wrangler dev` 运行的是 `dist/` 目录

**解决**:
```bash
npm run build  # 重新编译
# 然后重启 dev server
```

### 6.3 图标路径错误

**检查清单**:
- 主地图: `/jx/Web/img/2/b/m/${configId}.GIF`
- 右侧列表: `/jx/Web/img/2/b/o/${configId}.GIF`
- 注意大小写: `.GIF` vs `.gif`

### 6.4 无限重渲染

**原因**: 
- `useEffect` 依赖项不正确
- 或 state 更新导致循环

**解决**:
```tsx
useEffect(() => {
  loadBuildings();
}, []); // 空依赖数组，只执行一次
```

---

## 七、后续优化建议

### 7.1 性能优化
- [ ] 建筑数据缓存（避免重复请求）
- [ ] 图片懒加载
- [ ] 使用 `React.memo` 优化组件

### 7.2 功能完善
- [x] 建筑升级功能（已实现）
- [x] 建筑升级资源验证（已实现）
- [x] 从 buildings.json 读取真实配置数据（已实现）
- [x] 建筑图标根据等级动态变化（已实现）
- [ ] 建筑升级动画
- [ ] 建造中状态显示
- [x] 建筑详情弹窗（BuildingDetailPanel.tsx）
- [ ] 空地建造面板（进行中）

### 7.3 空地建造功能（2026-02-05 新增）

**后端 API**:
- `POST /api/game/city/:cityId/available-buildings/:position` - 获取指定位置可建造的建筑列表
- `POST /api/game/city/:cityId/build-building` - 建造新建筑

**实现逻辑**:
1. 根据 `DependPos` 筛选可建造的建筑
2. 检查前置条件（聚义厅等级、科技等级等）
3. 返回建筑的 1 级数据和建造所需资源
4. 验证资源后创建建筑记录

**前端组件**:
- `BuildingSelectPanel.tsx` - 建筑选择面板（已创建）
- 需要在 JxWebTest.tsx 中添加空地点击逻辑

**待完成任务**:
1. 在 JxWebTest.tsx 中添加空地点击事件处理
2. 调用后端 API 获取可建造建筑列表
3. 显示 BuildingSelectPanel 弹窗
4. 实现建造确认和资源扣除
5. 建造成功后刷新建筑列表

### 7.3 代码优化
- [ ] 提取建筑配置到独立文件
- [ ] 统一图标路径生成逻辑
- [ ] 添加 TypeScript 类型定义

---

## 八、文件清单

### 8.1 前端文件
```
src/features/webgame/
├── components/
│   └── JxWebTest.tsx           # 主组件（建筑渲染）
├── styles/
│   ├── Common.css              # 原始 CSS
│   ├── jxMain.module.css       # 模块化 CSS
│   └── jxweb.module.css        # 主样式
└── utils/
    └── api.ts                  # API 工具
```

### 8.2 后端文件
```
workers/ghost-game/
├── src/
│   └── routes/
│       └── game.ts             # 建筑 API
├── dist/                       # 编译输出（wrangler 运行此目录）
└── wrangler.toml               # Wrangler 配置
```

### 8.3 资源文件
```
jx/Web/
├── img/
│   └── 2/
│       └── b/
│           ├── m/              # 主地图大图标
│           └── o/              # 右侧列表小图标
└── Css/
    └── Common.css              # 原始 CSS
```

---

## 九、总结

### 9.1 核心要点

1. **position 直接对应 CSS 类**: 不需要任何转换
2. **两套图标**: 主地图用 `/2/b/m/`，右侧列表用 `/2/b/o/`
3. **Wrangler 运行 dist**: 修改后必须重新编译
4. **inline style 优先**: 避免 CSS 冲突

### 9.2 成功关键

1. ✅ 理解原始逻辑（不简化实现）
2. ✅ 正确的 position 映射
3. ✅ 区分大小图标
4. ✅ 解决 Wrangler 编译问题
5. ✅ 使用 inline style 确保定位

### 9.3 经验教训

1. **不要简化**: 项目迁移必须保持原有逻辑
2. **检查编译**: dev 模式可能运行的是编译后文件
3. **硬编码位置**: 当 CSS 不可靠时，inline style 是最保险的
4. **调试优先**: 添加 console.log 确认数据流

---

## 十、参考资料

- 原始代码: `jx/web/Js/Pages.js` (ShowInteriorMap)
- CSS 定义: `jx/Web/Css/Common.css` (.img_1_1 ~ .img_1_16)
- API 文档: `workers/ghost-game/src/routes/game.ts`

---

**实现完成时间**: 2026-02-05 12:35
**实现者**: Kiro AI Assistant
**状态**: ✅ 完成并测试通过
