# API 配置完成

## ⚠️ 重要说明 - 请勿随意修改

**api-config.js 是经过严格验证的真实配置文件，请谨慎修改！**

### 配置真实性验证

此配置文件已通过以下三重验证：

1. **前端真实调用验证** ✅
   - 基于原始项目前端 JS 代码中的 `Main.*` 方法调用提取
   - 参数数量和顺序与前端实际调用完全一致
   - 覆盖率：217/221 方法被前端实际使用

2. **C# 后端方法验证** ✅
   - 与 `jx/Web/Main.aspx.cs` 中的 AjaxPro 方法定义对比
   - 方法名匹配率：217/221 (98.2%)
   - 参数定义参考 C# 原始签名

3. **参数命名规范** ✅
   - 使用 C# 驼峰命名（如 `cityID`），不使用下划线（如 `city_id`）
   - 参数顺序严格按照前端调用顺序
   - 参数数量经过逐一核对

### 修改前必读

**如需修改此文件，请务必：**

1. 先运行验证脚本确认影响范围：
   ```bash
   # 验证参数数量是否与前端一致
   node scripts/verify-frontend-calls.cjs
   
   # 验证方法名是否在 C# 中存在
   node scripts/verify-csharp-methods.cjs
   ```

2. 参考原始代码：
   - 前端调用：`public/jx-web/Js/*.js` 中的 `Main.方法名(参数...)` 调用
   - C# 定义：`jx/Web/Main.aspx.cs` 中的方法签名
   - 请求流程：`docs/API_REQUEST_FLOW.md`

3. 修改后必须验证：
   - 在 `test-api.html` 中测试修改的方法
   - 确保参数数量、顺序、命名都正确
   - 检查是否影响其他方法

**数据来源优先级：**
```
前端 JS 真实调用 > C# 方法定义 > Worker 实现
```
前端和 C# 是原始项目的真实数据，Worker 是后期实现，可能有误差。

---

## 状态
- 前端调用: 217 个方法
- 已配置: 221 个方法  
- 覆盖率: 98.2% ✅
- C# 方法匹配: 217/221 ✅

## 文件
- `api-config.js` - 226 个方法配置
- `api-adapter-v2.js` - 配置驱动引擎

## 使用
```javascript
// 添加新方法：在 api-config.js 添加配置
YourMethod: {
  endpoint: '/your/endpoint',
  httpMethod: 'POST',
  params: ['param1', 'param2'],
  auth: true
}

// 前端自动可用
Main.YourMethod(value1, value2, callback);
```

## 规则
- GET 用于查询
- POST 用于修改
- 参数顺序必须与前端一致
- 前端是真实数据源
