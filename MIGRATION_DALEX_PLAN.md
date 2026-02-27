# C# to Workers Migration Plan

## 目标
将 C# 后端逻辑迁移到 Cloudflare Workers，保持前端 HTML/JS 不变

## 核心原则
1. **前端是真理** - 前端 JS 调用决定接口契约
2. **C# 是参考** - C# 代码提供业务逻辑实现
3. **字段名必须匹配** - 前端期望什么字段，后端就返回什么字段
4. **真实逻辑，不要 Mock** - 迁移真实的数据库查询和业务计算

## 迁移状态

### 已完成 (基础架构)
- ✅ 认证系统
- ✅ 用户信息接口 (GetUserInfo)
- ✅ 城市内政接口 (GetCityInteriorInfo)
- ✅ 基础路由结构

### 进行中 (本次任务)
- 🔄 分析前端 API 调用
- 🔄 对比 C# 实现
- 🔄 迁移核心业务逻辑

## API 优先级列表

基于前端调用频率和重要性：

### P0 - 核心功能 (必须先完成)
1. GetCityHero - 获取武将列表
2. GetBuildingByPos - 获取建筑信息
3. GetValidEvent - 获取事件列表
4. GetTask - 获取任务列表
5. GetNewMailNum - 获取新邮件数量

### P1 - 重要功能
6. AddBuildingEvent - 添加建筑事件
7. AddHeroEvent - 添加武将事件
8. EngageHero - 雇佣武将
9. GetItemByType - 获取物品列表
10. GetTechnicByBuilding - 获取科技列表

### P2 - 次要功能
11. GetMarketInfo - 市场信息
12. GetMallInfo - 商城信息
13. GetRankList - 排行榜
14. GetMyOrgnizeInfo - 帮会信息

## 执行计划

1. **Phase 1: 分析阶段** (当前)
   - 读取前端 JS，找出所有 API 调用
   - 记录每个 API 的参数和返回值期望
   - 读取对应的 C# 代码，理解业务逻辑

2. **Phase 2: 实现阶段**
   - 按优先级逐个实现 API
   - 确保字段名 100% 匹配
   - 实现真实的数据库查询

3. **Phase 3: 验证阶段**
   - 对比 Worker 返回和前端期望
   - 测试核心流程

## 当前进度
- [ ] 分析 Main.js 中的 API 调用
- [ ] 分析 Hero.js 中的 API 调用
- [ ] 分析 Building.js 中的 API 调用
- [ ] 实现 GetCityHero
- [ ] 实现 GetBuildingByPos
