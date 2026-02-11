# API 适配器使用说明

## 📋 概述

使用**配置驱动**的方式管理所有 API 调用，通过修改配置文件即可添加/修改 API，无需手动编写每个方法。

## 📁 文件结构

```
Js/
├── api-config.js        # API 配置文件（核心）
├── api-adapter-v2.js    # 配置驱动的适配器引擎
├── api-adapter.js       # 旧版适配器（已废弃）
└── API_README.md        # 本文档
```

## 🚀 快速开始

### 1. 添加新 API

只需在 `api-config.js` 中添加配置：

```javascript
window.API_MAPPING = {
  // ... 其他配置
  
  // 新增 API
  YourNewMethod: {
    endpoint: '/your/endpoint',      // 后端端点
    httpMethod: 'POST',               // HTTP 方法
    params: ['param1', 'param2'],     // 参数列表
    auth: true                        // 是否需要认证
  }
};
```

### 2. 前端调用

```javascript
// 自动生成的方法，直接调用
Main.YourNewMethod(value1, value2, function(response) {
  console.log('返回数据:', response);
});
```

## 📖 配置详解

### 基本配置

```javascript
MethodName: {
  endpoint: '/api/path',        // 必填：后端 API 路径
  httpMethod: 'GET',            // 必填：GET/POST/PUT/DELETE
  params: [],                   // 必填：参数配置
  auth: true,                   // 可选：是否需要认证（默认 true）
  mock: {},                     // 可选：开发模式 mock 数据
  transform: (data) => data     // 可选：响应数据转换函数
}
```

### 参数配置方式

#### 方式 1：数组（按顺序映射）

```javascript
params: ['city_id', 'hero_id', 'level']
```

前端调用：
```javascript
Main.GetHero(123, 456, 10, callback);
// 转换为: { city_id: 123, hero_id: 456, level: 10 }
```

#### 方式 2：对象（自定义映射）

```javascript
params: {
  cityId: 'city_id',
  heroId: 'hero_id'
}
```

前端调用：
```javascript
Main.GetHero(123, 456, callback);
// 转换为: { city_id: 123, hero_id: 456 }
```

### Mock 数据

开发模式下自动返回 mock 数据，无需后端：

```javascript
GetArenaTimes: {
  endpoint: '/arena/times',
  httpMethod: 'GET',
  params: [],
  auth: false,
  mock: { value: [9, 21] }  // 开发模式返回这个
}
```

### 数据转换

对返回数据进行转换：

```javascript
GetServerTimeNow: {
  endpoint: '/game/status',
  httpMethod: 'GET',
  params: [],
  transform: (data) => ({
    serverTime: data.serverTime || new Date().toISOString()
  })
}
```

## 🔧 HTTP 方法选择

### GET 请求
- 用于查询数据
- 参数自动添加到 URL query string
- 示例：`/api/hero/list?city_id=123`

```javascript
GetCityHero: {
  endpoint: '/hero/list',
  httpMethod: 'GET',
  params: ['city_id']
}
```

### POST 请求
- 用于创建/修改数据
- 参数放在 request body（JSON 格式）
- 示例：`POST /api/hero/engage` with body `{"city_id": 123, "hero_id": 456}`

```javascript
EngageHero: {
  endpoint: '/hero/engage',
  httpMethod: 'POST',
  params: ['city_id', 'hero_id']
}
```

## 📊 当前状态

### 已配置 API（100+）

- ✅ 用户相关（6个）
- ✅ 城市相关（7个）
- ✅ 建筑相关（3个）
- ✅ 英雄相关（9个）
- ✅ 军团相关（4个）
- ✅ 事件相关（2个）
- ✅ 邮件相关（8个）
- ✅ 任务相关（4个）
- ✅ 物品相关（8个）
- ✅ 市场相关（4个）
- ✅ 商城相关（2个）
- ✅ 排行榜相关（2个）
- ✅ 竞技场相关（2个）
- ✅ 聊天相关（3个）
- ✅ 科技相关（1个）
- ✅ 帮会相关（4个）
- ✅ 战场相关（2个）
- ✅ 其他（5个）

### 待补充 API（50+）

需要根据实际使用情况逐步添加：
- 战斗系统详细接口
- 帮会管理详细接口
- 更多排行榜类型
- 活动系统接口
- 等等...

## 🎯 给其他 AI 的指南

### 添加新 API 的步骤

1. **确认后端端点**
   - 查看 `workers/ghost-game/src/routes/` 下的路由文件
   - 确认端点路径和 HTTP 方法

2. **添加配置**
   - 打开 `api-config.js`
   - 在对应分类下添加配置
   - 按照格式填写完整

3. **测试**
   - 刷新页面
   - 在控制台查看是否生成方法
   - 调用方法测试

### 常见问题

**Q: 如何知道参数名？**
A: 查看后端路由文件中的参数定义，或查看原始 ASP.NET 代码。

**Q: GET 还是 POST？**
A: 
- 查询数据 → GET
- 创建/修改/删除数据 → POST/PUT/DELETE

**Q: 如何调试？**
A: 
- 打开浏览器控制台
- 查看网络请求
- 检查请求参数和响应

**Q: Mock 数据什么时候用？**
A: 
- 后端接口还未实现
- 需要快速测试前端逻辑
- 开发环境下模拟数据

## 📝 示例

### 完整示例：添加"获取英雄装备"接口

1. 后端端点（假设）：`GET /api/hero/equipment?hero_id=123`

2. 添加配置：
```javascript
GetHeroEquipment: {
  endpoint: '/hero/equipment',
  httpMethod: 'GET',
  params: ['hero_id'],
  auth: true
}
```

3. 前端调用：
```javascript
Main.GetHeroEquipment(heroId, function(response) {
  if (response.success) {
    console.log('装备列表:', response.equipment);
  }
});
```

## 🔄 迁移指南

### 从旧版适配器迁移

旧版（手动编写）：
```javascript
window.Main = {
  GetUserInfo: function(callback) {
    apiRequest('/game/user-info', {}, callback);
  }
};
```

新版（配置驱动）：
```javascript
// api-config.js
GetUserInfo: {
  endpoint: '/game/user-info',
  httpMethod: 'GET',
  params: [],
  auth: true
}
```

优势：
- ✅ 配置清晰，易于维护
- ✅ 自动生成方法，减少重复代码
- ✅ 统一错误处理
- ✅ 支持 Mock 数据
- ✅ 易于扩展

## 📚 相关文档

- 后端路由：`workers/ghost-game/src/routes/`
- 后端服务：`workers/ghost-game/src/services/`
- 原始代码参考：`jx/` 目录

## 🎉 总结

配置驱动的 API 适配器让 API 管理变得简单：
1. 只需修改配置文件
2. 自动生成所有方法
3. 统一处理请求逻辑
4. 易于维护和扩展

**记住：修改 `api-config.js`，一切自动完成！**
