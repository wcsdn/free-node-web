# API 前后端一致性验证指南

## 问题背景

在 C# 到 Cloudflare Workers 的迁移过程中，最常见的问题是**前后端数据不一致**：
- 返回格式不匹配 (对象 vs 数组)
- 字段名不一致 (camelCase vs PascalCase)
- 字段缺失或多余
- 数据类型不匹配

这份指南提供了一个系统化的验证流程，确保每个 API 端点都与前端期望完全一致。

---

## 验证流程 (5 步法)

### Step 1: 找到前端调用代码

**目标**: 确定前端如何调用这个 API，以及如何使用返回数据。

**操作步骤**:
```bash
# 1. 搜索 API 方法名
grep -r "Main.GetBuildingByPos" public/jx-web/Js/

# 2. 找到回调函数
grep -r "cb_GetBuildingByPos" public/jx-web/Js/
```

**关键信息**:
- 调用参数: `Main.GetBuildingByPos(CityID, 1, ClickPos, cb_GetBuildingByPos)`
- 回调函数: `function cb_GetBuildingByPos(result)`
- 数据使用: `PosBuildingInfo = result.value`

**示例**:
```javascript
// Area.js:99
Main.GetBuildingByPos(CityID, 1, ClickPos, cb_GetBuildingByPos);

// Area.js:348
function cb_GetBuildingByPos(result) {
    if(DataValidate(result)==false) return;
    
    PosBuildingInfo = result.value;  // ← 前端期望 result.value 是什么？
    
    // 遍历数组
    while(PosBuildingInfo!=null && PosBuildingInfo[i]!=null) {
        if(PosBuildingInfo[i].Index != index)  // ← 访问 Index 字段
            PosBuildingInfo.splice(i,1);
        i++;
    }
}
```

**结论**: 
- ✅ 前端期望 `result.value` 是**数组**
- ✅ 数组元素有 `Index` 字段

---

### Step 2: 找到 C# 原版实现

**目标**: 确定 C# 原版的方法签名和返回类型。

**操作步骤**:
```bash
# 搜索 C# 方法定义
grep -r "GetBuildingByPos" jx/Web/*.cs
```

**关键信息**:
- 方法签名
- 返回类型
- 参数类型和顺序

**示例**:
```csharp
// Main.aspx.cs:241
[AjaxPro.AjaxMethod]
public BuildingInfo[] GetBuildingByPos(int cityID, int buildingType, int pos)
{
    string userName = HttpContext.Current.Session["UserName"].ToString();
    BuildingInfo[] buildingInfoList = WebGame.BLLEX.BuildingEx.GetBuildingByPos(
        userName, cityID, buildingType, pos
    );
    return buildingInfoList;
}
```

**结论**:
- ✅ 返回类型: `BuildingInfo[]` (数组)
- ✅ 参数: `(int cityID, int buildingType, int pos)`

---

### Step 3: 找到 C# 数据模型定义

**目标**: 确定返回对象的所有字段名和类型。

**操作步骤**:
```bash
# 搜索 Model 类定义
grep -r "class BuildingInfo" jx/Model/
```

**关键信息**:
- 所有字段名 (注意大小写)
- 字段类型
- 必填 vs 可选

**示例**:
```csharp
// BuildingInfo.cs
public class BuildingInfo
{
    public int ID { get; set; }
    public int CityID { get; set; }
    public int Index { get; set; }      // ← 注意是 Index，不是 index
    public int State { get; set; }
    public string UserName { get; set; }
    public string Name { get; set; }
    public string Des { get; set; }
    public int Pos { get; set; }
    public int Level { get; set; }
    // ... 60+ 字段
}
```

**结论**:
- ✅ 字段名使用 **PascalCase** (首字母大写)
- ✅ `Index` 字段存在

---

### Step 4: 检查后端实现

**目标**: 验证后端返回格式是否与 C# 原版一致。

**检查清单**:

#### 4.1 返回格式
```typescript
// ❌ 错误: 返回对象
return success(c, {
  building: { ID: 1, Name: "主城" }
});
// 前端收到: { value: { building: {...} } }
// 前端期望: { value: [{...}] }

// ✅ 正确: 返回数组
return success(c, [{
  ID: 1,
  Name: "主城"
}]);
// 前端收到: { value: [{...}] }
```

#### 4.2 字段名大小写
```typescript
// ❌ 错误: camelCase
{
  id: 1,
  cityId: 1,
  index: 10,
  name: "主城"
}

// ✅ 正确: PascalCase (与 C# 一致)
{
  ID: 1,
  CityID: 1,
  Index: 10,
  Name: "主城"
}
```

#### 4.3 字段完整性
```typescript
// ❌ 错误: 字段缺失
{
  ID: 1,
  Name: "主城"
  // 缺少 Index, State, Level 等字段
}

// ✅ 正确: 所有字段都存在
{
  ID: 1,
  CityID: 1,
  Index: 10,
  State: 0,
  UserName: "player1",
  Name: "主城",
  Des: "描述",
  Pos: 1,
  Level: 1,
  // ... 60+ 字段
}
```

#### 4.4 空数据处理
```typescript
// ❌ 错误: 返回 null 或空对象
return success(c, null);
return success(c, {});

// ✅ 正确: 返回空数组或特殊标记
return success(c, []);  // 空数组
// 或者 C# 约定的特殊值
return success(c, [{ ID: -1 }]);  // 表示无数据
```

---

### Step 5: 验证 API 适配层

**目标**: 确认前端适配器正确转换后端返回格式。

**检查文件**: `public/jx-web/Js/api-adapter-v2.js`

**关键代码**:
```javascript
success: function(response) {
  var result;
  if (response && typeof response === 'object') {
    if (response.data) {
      result = { value: response.data };  // ← 后端 { data: [...] } → 前端 { value: [...] }
    } else if (response.value) {
      result = response;
    } else {
      result = { value: response };
    }
  }
  callback(result);
}
```

**验证流程**:
1. 后端返回: `{ success: true, data: [{...}] }`
2. 适配器转换: `{ value: [{...}] }`
3. 前端接收: `result.value` 是数组

---

## 常见错误模式

### 错误 1: 对象 vs 数组

**症状**: 前端报错 `PosBuildingInfo[i] is undefined`

**原因**:
```typescript
// 后端返回对象
return success(c, { building: {...} });
// 前端收到: { value: { building: {...} } }
// 前端代码: PosBuildingInfo[0]  ← undefined
```

**修复**:
```typescript
// 返回数组
return success(c, [{...}]);
// 前端收到: { value: [{...}] }
// 前端代码: PosBuildingInfo[0]  ← 正确
```

---

### 错误 2: 字段名大小写

**症状**: 前端显示空白或 `undefined`

**原因**:
```typescript
// 后端返回 camelCase
{ id: 1, name: "主城" }

// 前端访问 PascalCase
building.ID    // ← undefined
building.Name  // ← undefined
```

**修复**:
```typescript
// 使用 PascalCase
{ ID: 1, Name: "主城" }
```

---

### 错误 3: 字段缺失

**症状**: 前端部分功能不工作

**原因**:
```typescript
// 后端只返回部分字段
{
  ID: 1,
  Name: "主城"
  // 缺少 Level, State 等
}

// 前端代码
if (building.Level > 5) {  // ← undefined > 5 = false
  // 永远不执行
}
```

**修复**:
```typescript
// 返回所有字段 (即使是默认值)
{
  ID: 1,
  Name: "主城",
  Level: 1,
  State: 0,
  // ... 所有字段
}
```

---

### 错误 4: 空数据处理

**症状**: 前端报错或显示异常

**原因**:
```typescript
// 后端返回 null
return success(c, null);

// 前端代码
PosBuildingInfo.length  // ← Cannot read property 'length' of null
```

**修复**:
```typescript
// 返回空数组或特殊标记
return success(c, []);
// 或
return success(c, [{ ID: -1 }]);  // C# 约定
```

---

## 验证工具和技巧

### 1. 使用 console.log 调试

在前端适配器中添加日志:
```javascript
success: function(response) {
  console.log('📡 API response:', endpoint, JSON.stringify(response).substring(0, 200));
  // ...
  console.log('📡 callback result:', endpoint, JSON.stringify(result).substring(0, 200));
  callback(result);
}
```

### 2. 使用 curl 测试

```bash
# 测试 API 返回格式
curl -X GET "http://localhost:8787/building/by-pos?city_id=1&map_type=1&pos=1" \
  -H "X-Wallet-Auth: 0x1234:test" \
  | jq .
```

### 3. 对比 C# 和 TypeScript

创建对比表格:
```markdown
| 字段名 | C# 类型 | TS 类型 | 后端返回 | 前端期望 | 状态 |
|--------|---------|---------|----------|----------|------|
| ID     | int     | number  | ✅       | ✅       | ✅   |
| Name   | string  | string  | ✅       | ✅       | ✅   |
| Index  | int     | number  | ❌ 缺失  | ✅       | ❌   |
```

### 4. 自动化验证脚本

```javascript
// verify-api-response.js
function verifyBuildingInfo(response) {
  const required = ['ID', 'CityID', 'Index', 'State', 'Name', 'Level'];
  const missing = required.filter(field => !(field in response));
  
  if (missing.length > 0) {
    console.error('❌ 缺少字段:', missing);
    return false;
  }
  
  console.log('✅ 所有必需字段都存在');
  return true;
}
```

---

## 完整验证检查清单

在实现每个 API 端点后，使用此检查清单验证:

- [ ] **Step 1**: 找到前端调用代码
  - [ ] 确定调用参数
  - [ ] 找到回调函数
  - [ ] 分析数据使用方式

- [ ] **Step 2**: 找到 C# 原版实现
  - [ ] 确定方法签名
  - [ ] 确定返回类型 (对象/数组)
  - [ ] 确定参数顺序

- [ ] **Step 3**: 找到 C# 数据模型
  - [ ] 列出所有字段名
  - [ ] 确认字段类型
  - [ ] 注意大小写规则

- [ ] **Step 4**: 检查后端实现
  - [ ] 返回格式正确 (对象/数组)
  - [ ] 字段名大小写正确 (PascalCase)
  - [ ] 所有字段都存在
  - [ ] 空数据处理正确

- [ ] **Step 5**: 验证适配层
  - [ ] 适配器正确转换格式
  - [ ] 前端能正确接收数据

- [ ] **测试验证**
  - [ ] 编译通过
  - [ ] curl 测试返回正确
  - [ ] 前端显示正常

---

## 示例: GetBuildingByPos 完整验证

### 前端调用
```javascript
Main.GetBuildingByPos(CityID, 1, ClickPos, cb_GetBuildingByPos);

function cb_GetBuildingByPos(result) {
    PosBuildingInfo = result.value;  // 期望数组
    while(PosBuildingInfo[i] != null) {
        if(PosBuildingInfo[i].Index != index)  // 访问 Index 字段
    }
}
```

### C# 原版
```csharp
public BuildingInfo[] GetBuildingByPos(int cityID, int buildingType, int pos)
{
    return buildingInfoList;  // 返回数组
}
```

### C# 模型
```csharp
public class BuildingInfo {
    public int ID { get; set; }
    public int Index { get; set; }  // PascalCase
    // ... 60+ 字段
}
```

### 后端实现 (正确)
```typescript
app.get('/by-pos', async (c) => {
  // ...
  
  // ✅ 返回数组
  return success(c, [{
    ID: building.id,           // ✅ PascalCase
    CityID: building.city_id,  // ✅ PascalCase
    Index: building.config_id, // ✅ Index 字段存在
    State: building.state,
    Name: config?.Name || '',
    // ... 所有 60+ 字段
  }]);
});
```

### 验证结果
- ✅ 返回格式: 数组
- ✅ 字段名: PascalCase
- ✅ 字段完整: 60+ 字段都存在
- ✅ 前端显示: 正常

---

## 给后续 AI 的建议

1. **永远先看前端代码** - 前端是真理来源
2. **永远参考 C# 原版** - 不要猜测字段名
3. **使用检查清单** - 系统化验证每个端点
4. **添加日志** - 方便调试和验证
5. **测试再测试** - 编译通过不等于功能正确

---

## 总结

前后端一致性问题是迁移中最常见的问题。通过系统化的 5 步验证流程，可以确保每个 API 端点都与前端期望完全一致：

1. 看前端怎么用
2. 看 C# 怎么返回
3. 看 C# 模型定义
4. 检查后端实现
5. 验证适配层

记住：**前端期望什么，后端就返回什么。字段名、格式、类型必须 100% 匹配。**
