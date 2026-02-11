# API 请求流程说明

## 问题背景

原始项目使用 ASP.NET + AjaxPro，现在迁移到 Cloudflare Workers。需要保持前端代码不变，通过适配器桥接到新后端。

## 原始系统流程（ASP.NET + AjaxPro）

### 1. 前端调用
```javascript
// 前端 JavaScript 调用
Main.GetCityInteriorInfo(CityID, callback);
```

### 2. AjaxPro 自动生成
- AjaxPro 在页面加载时自动注入 JavaScript 代码
- 生成 `Main` 对象，包含所有标记了 `[AjaxPro.AjaxMethod]` 的方法
- 注册代码在 `Main.aspx.cs` 的 `Page_Load` 中：
```csharp
AjaxPro.Utility.RegisterTypeForAjax(typeof(Main));
```

### 3. HTTP 请求
- **端点**: `/ajaxpro/Main,App_Web_xxx.ashx` (动态生成)
- **方法**: POST
- **请求体**:
```json
{
  "method": "GetCityInteriorInfo",
  "params": [1]  // cityID
}
```
- **请求头**: `Content-Type: application/json`

### 4. C# 后端处理
```csharp
// Main.aspx.cs
[AjaxPro.AjaxMethod(AjaxPro.HttpSessionStateRequirement.ReadWrite)]
public CityInteriorInfo GetCityInteriorInfo(int cityID)
{
    if (this.IsSessionTimeOut())
        return null;

    string userName = HttpContext.Current.Session["UserName"].ToString();
    CityInteriorInfo cityInteriorInfo = WebGame.BLL.CityInterior.GetCityInteriorInfo(userName, cityID);

    return cityInteriorInfo;
}
```

**关键点：**
- 参数名：`cityID`（大写 ID）
- `userName` 从 Session 中获取，不需要前端传递
- 返回类型：`CityInteriorInfo` 对象

### 5. 业务逻辑层
```csharp
// CityInterior.cs (BLL)
public static CityInteriorInfo GetCityInteriorInfo(String userName, int cityID)
{
    DateTime time = DateTime.Now;
    int flag = 0;
    return GetCityInteriorInfo(userName, cityID, time, flag);
}
```

### 6. 响应格式
AjaxPro 自动包装响应：
```json
{
  "value": {
    "CityID": 1,
    "Men": 1000,
    "Money": 5000,
    "Food": 3000,
    ...
  },
  "error": null
}
```

---

## 现在的系统流程（Cloudflare Workers）

### 1. 前端调用（不变）
```javascript
// 前端 JavaScript 调用 - 完全相同
Main.GetCityInteriorInfo(CityID, callback);
```

### 2. 适配器生成 Main 对象
**文件**: `public/jx-web/Js/api-adapter-v2.js`

```javascript
// 根据配置自动生成 Main 对象
window.Main = {};

Object.keys(window.API_MAPPING).forEach(methodName => {
  const config = window.API_MAPPING[methodName];
  window.Main[methodName] = generateApiMethod(methodName, config);
});
```

### 3. API 配置
**文件**: `public/jx-web/Js/api-config.js`

```javascript
GetCityInteriorInfo: {
  endpoint: '/game/city/interior-info/:cityID',  // 路径参数
  httpMethod: 'POST',
  params: ['cityID'],  // 参数映射：前端传入的参数按顺序映射
  auth: true  // 需要钱包认证
}
```

**配置说明：**
- `endpoint`: API 端点，`:cityID` 是路径参数占位符
- `params`: 参数数组，按顺序映射前端传入的参数
- 适配器会将 `params[0]` 的值替换到 `:cityID` 位置

### 4. 适配器处理请求
```javascript
// api-adapter-v2.js 中的处理逻辑
function generateApiMethod(methodName, config) {
  return function(...args) {
    const callback = args.pop();  // 最后一个参数是回调
    
    let endpoint = config.endpoint;
    const data = {};
    
    // 处理参数映射
    config.params.forEach((paramName, index) => {
      if (args[index] !== undefined) {
        // 如果端点中有 :paramName，替换为实际值
        const pathParam = ':' + paramName;
        if (endpoint.includes(pathParam)) {
          endpoint = endpoint.replace(pathParam, args[index]);
        } else {
          data[paramName] = args[index];
        }
      }
    });
    
    // 添加钱包地址
    if (config.auth && window.walletAddress) {
      data.wallet_address = window.walletAddress;
    }
    
    // 发送请求
    apiRequest(endpoint, config.httpMethod, data, config.auth, callback);
  };
}
```

### 5. HTTP 请求
- **端点**: `/api/game/city/interior-info/1` (cityID=1)
- **方法**: POST
- **请求头**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <wallet_signature>` (钱包签名认证)
- **请求体**:
```json
{
  "wallet_address": "0x1234..."
}
```

**关键差异：**
- cityID 在 URL 路径中，不在请求体
- 使用钱包地址认证，不是 Session
- wallet_address 在请求体中

### 6. Worker 后端处理
**文件**: `workers/ghost-game/src/routes/city.ts`

```typescript
// 路由定义
app.post('/interior-info/:cityID', async (c) => {
  // 1. 验证钱包认证
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  // 2. 获取路径参数
  const cityID = parseInt(c.req.param('cityID'));
  if (!cityID) return error(c, 'cityID is required');

  // 3. 验证城市属于用户
  const isOwner = await db.prepare(`
    SELECT id FROM cities WHERE id = ? AND wallet_address = ?
  `).bind(cityID, walletAddress).first();

  if (!isOwner) return error(c, 'City not found', 404);

  // 4. 获取城市信息
  const city = await db.prepare(`
    SELECT * FROM cities WHERE id = ?
  `).bind(cityID).first();

  // 5. 返回数据
  return success(c, {
    cityId: city.id,
    prosperity: Number(city.prosperity) || 0,
    money: Number(city.money) || 0,
    food: Number(city.food) || 0,
    population: Number(city.population) || 0,
    ...
  });
});
```

**关键点：**
- 参数名：`cityID`（大写 ID，与 C# 原始一致）
- `walletAddress` 从认证中获取，替代原来的 Session
- 数据从 D1 数据库读取

### 7. 响应格式
```json
{
  "success": true,
  "data": {
    "cityId": 1,
    "prosperity": 150,
    "money": 5000,
    "food": 3000,
    "population": 1000,
    ...
  }
}
```

---

## 关键差异对比

| 项目 | 原始系统 (ASP.NET) | 现在系统 (Workers) |
|------|-------------------|-------------------|
| **认证方式** | Session (服务器端) | 钱包签名 (去中心化) |
| **用户标识** | Session["UserName"] | wallet_address |
| **参数传递** | 请求体 JSON | URL 路径参数 |
| **端点格式** | `/ajaxpro/Main,xxx.ashx` | `/api/game/city/interior-info/:cityID` |
| **响应包装** | `{value: ..., error: ...}` | `{success: ..., data: ...}` |
| **数据库** | SQL Server | Cloudflare D1 (SQLite) |

---

## 常见问题排查

### 1. 参数名大小写问题
**症状**: 404 Not Found 或参数为空

**原因**: Worker 路由参数名与配置不一致

**检查清单**:
- [ ] C# 原始方法的参数名（如 `cityID`）
- [ ] Worker 路由定义 `app.post('/xxx/:cityID')`
- [ ] API 配置 `params: ['cityID']`
- [ ] 适配器中的参数替换逻辑

**正确示例**:
```javascript
// api-config.js
params: ['cityID']  // ✅ 大写 ID

// city.ts
app.post('/interior-info/:cityID')  // ✅ 大写 ID
const cityID = parseInt(c.req.param('cityID'));  // ✅ 大写 ID
```

**错误示例**:
```javascript
// api-config.js
params: ['cityId']  // ❌ 小写 id

// city.ts
app.post('/interior-info/:cityId')  // ❌ 小写 id - 与 C# 不一致
```

### 2. 认证失败
**症状**: 401 Unauthorized

**原因**: 钱包地址未传递或签名无效

**检查**:
- 前端是否已连接钱包
- `window.walletAddress` 是否有值
- `Authorization` 头是否正确

### 3. 数据格式不匹配
**症状**: 前端回调收到的数据结构不对

**原因**: Worker 返回格式与 AjaxPro 不同

**解决**: 在适配器中添加数据转换
```javascript
transform: (response) => {
  // 将 Worker 格式转换为 AjaxPro 格式
  return { value: response.data, error: null };
}
```

---

## 迁移检查清单

为其他 API 方法迁移时，按此清单检查：

1. **查找 C# 原始定义**
   - [ ] 找到 `Main.aspx.cs` 中的方法
   - [ ] 记录方法名（如 `GetCityInteriorInfo`）
   - [ ] 记录参数名和类型（如 `int cityID`）
   - [ ] 记录返回类型

2. **查找业务逻辑**
   - [ ] 找到 BLL 层的实现（如 `CityInterior.cs`）
   - [ ] 理解业务逻辑
   - [ ] 确认需要的数据库表

3. **创建 Worker 路由**
   - [ ] 参数名与 C# 一致（大小写）
   - [ ] 实现相同的业务逻辑
   - [ ] 返回相同结构的数据

4. **配置 API 映射**
   - [ ] 在 `api-config.js` 中添加配置
   - [ ] 参数名与 C# 一致
   - [ ] 端点路径与 Worker 路由一致

5. **测试验证**
   - [ ] 使用测试页面调用
   - [ ] 检查请求参数
   - [ ] 检查响应数据
   - [ ] 验证业务逻辑正确性

---

## 参考文件

- **前端适配器**: `public/jx-web/Js/api-adapter-v2.js`
- **API 配置**: `public/jx-web/Js/api-config.js`
- **测试页面**: `public/jx-web/test-api.html`
- **C# 原始代码**: `jx/Web/Main.aspx.cs`
- **业务逻辑**: `jx/BLL/CityInterior.cs`
- **Worker 路由**: `workers/ghost-game/src/routes/city.ts`
- **API 映射文档**: `docs/API_MAPPING.md`

---

**最后更新**: 2026-02-11
**维护者**: 根据实际情况更新
