# 建筑建造功能实现任务链

## 任务概述
实现"点击空地建造建筑"功能，包括前后端完整流程。

## 当前状态
- ✅ 后端 API 已实现（获取可建造建筑列表、建造建筑）
- ✅ BuildingSelectPanel 组件已创建
- ✅ 前端集成已完成
- ⏳ 等待用户测试

---

## 任务 1: 添加前端 API 调用方法
**文件**: `src/features/webgame/services/api/cityApi.ts`

**状态**: ✅ 已完成

**任务内容**:
```typescript
// 添加两个新方法

/**
 * 获取指定位置可建造的建筑列表
 */
async getAvailableBuildings(cityId: number, position: number): Promise<any> {
  const res = await fetch(`${getApiBase()}/api/game/city/${cityId}/available-buildings/${position}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
}

/**
 * 建造新建筑
 */
async buildBuilding(cityId: number, configId: number, position: number): Promise<any> {
  const res = await fetch(`${getApiBase()}/api/game/city/${cityId}/build-building`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ configId, position }),
  });
  return res.json();
}
```

**验收标准**:
- [x] 方法添加到 cityApi.ts
- [x] 类型定义正确
- [x] 请求头包含认证信息

---

## 任务 2: 在 PopupManager 中注册 BuildingSelectPanel
**文件**: `src/features/webgame/components/PopupManager.tsx`

**状态**: ✅ 已完成

**任务内容**:
1. 导入 BuildingSelectPanel 组件
2. 添加 popup 类型定义
3. 在 renderPopup 中添加渲染逻辑

```typescript
import BuildingSelectPanel from './popups/BuildingSelectPanel';

// 添加类型
type PopupType = 
  | { type: 'buildingDetail'; building: any; cityInfo: any }
  | { type: 'buildingSelect'; position: number; availableBuildings: any[]; cityInfo: any };

// 在 renderPopup 中添加
case 'buildingSelect':
  return (
    <BuildingSelectPanel
      position={popup.position}
      availableBuildings={popup.availableBuildings}
      cityInfo={popup.cityInfo}
      onClose={closePopup}
      onBuild={async (buildingId) => {
        // 调用建造 API
        const result = await cityApi.buildBuilding(1, buildingId, popup.position);
        if (result.success) {
          // 刷新建筑列表
          await loadBuildings();
          closePopup();
        } else {
          throw new Error(result.error);
        }
      }}
    />
  );
```

**验收标准**:
- [x] BuildingSelectPanel 正确导入
- [x] popup 类型包含 buildingSelect
- [x] onBuild 回调正确实现
- [x] 建造成功后刷新建筑列表

---

## 任务 3: 在 JxWebTest 中添加空地点击逻辑
**文件**: `src/features/webgame/components/JxWebTest.tsx`

**状态**: ✅ 已完成

**任务内容**:
1. 修改 `<area>` 的 onClick 事件
2. 区分有建筑和空地的点击
3. 空地点击时调用 API 获取可建造建筑列表
4. 打开 BuildingSelectPanel 弹窗

```typescript
// 在 JxWebTest.tsx 中修改 area 的 onClick

const handleAreaClick = async (position: number) => {
  const building = buildings.find(b => b.position === position);
  
  if (building) {
    // 有建筑 - 显示详情
    openPopup({
      type: 'buildingDetail',
      building: {
        ...building,
        Name: getBuildingName(building.configId),
      },
      cityInfo: cityInfo,
    });
  } else {
    // 空地 - 获取可建造建筑列表
    try {
      const result = await cityApi.getAvailableBuildings(1, position);
      if (result.success && result.data.buildings.length > 0) {
        openPopup({
          type: 'buildingSelect',
          position,
          availableBuildings: result.data.buildings,
          cityInfo: cityInfo,
        });
      } else {
        alert('该位置暂无可建造的建筑');
      }
    } catch (err) {
      console.error('获取可建造建筑失败:', err);
      alert('获取可建造建筑失败');
    }
  }
};

// 在 JSX 中使用
<area
  id={`area_1_${position}`}
  shape="poly"
  coords={coords}
  onClick={() => handleAreaClick(position)}
  style={{ cursor: 'pointer' }}
/>
```

**验收标准**:
- [x] 点击有建筑的位置显示详情
- [x] 点击空地显示建造面板
- [x] API 调用正确
- [x] 错误处理完善

---

## 任务 4: 测试完整流程
**测试步骤**:

1. **测试空地点击**:
   - [ ] 点击空地（如位置 1、2、3 等）
   - [ ] 验证是否显示建造面板
   - [ ] 验证可建造建筑列表是否正确

2. **测试建筑选择**:
   - [ ] 选择不同的建筑
   - [ ] 验证资源显示是否正确
   - [ ] 验证资源不足时的提示

3. **测试建造功能**:
   - [ ] 资源充足时点击建造
   - [ ] 验证建造是否成功
   - [ ] 验证建筑是否出现在地图上
   - [ ] 验证资源是否正确扣除

4. **测试边界情况**:
   - [ ] 点击已有建筑的位置（应显示详情，不是建造面板）
   - [ ] 资源不足时尝试建造（应提示错误）
   - [ ] 建造后再次点击该位置（应显示建筑详情）

---

## 任务 5: 优化和完善
**可选优化**:

1. **前置条件检查**:
   - [ ] 完善聚义厅等级检查
   - [ ] 添加科技等级检查
   - [ ] 显示前置条件未满足的提示

2. **UI 优化**:
   - [ ] 添加建造动画
   - [ ] 优化弹窗样式
   - [ ] 添加建造成功的提示音效

3. **性能优化**:
   - [ ] 缓存可建造建筑列表
   - [ ] 优化 API 调用次数

---

## 完成标准

### 功能完整性
- [x] 后端 API 实现
- [x] 前端 API 调用
- [x] 弹窗组件集成
- [x] 空地点击逻辑
- [x] 建造流程完整（代码已完成，待测试）

### 用户体验
- [ ] 点击响应流畅
- [ ] 错误提示清晰
- [ ] 建造成功有反馈
- [ ] 资源显示准确

### 代码质量
- [x] 类型定义完整
- [x] 错误处理完善
- [x] 代码注释清晰
- [x] 遵循原有代码风格

---

## 预计时间
- 任务 1: 10 分钟
- 任务 2: 15 分钟
- 任务 3: 20 分钟
- 任务 4: 30 分钟
- 任务 5: 可选

**总计**: 约 1-1.5 小时

---

## 参考资料
- 原版逻辑: `jx/BLLEX/BuildingEx.cs` (GetBuildingByPos)
- 前端原版: `jx/Web/Js/Area.js` (ShowPosBuilding)
- 后端 API: `workers/ghost-game/src/routes/game.ts`
- 建筑配置: `workers/ghost-game/src/config/buildings.json`

---

**创建时间**: 2026-02-05
**状态**: 进行中
**负责人**: 开发团队
