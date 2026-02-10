# API 问题修复日志

## 测试发现的 问题

### 1. 404 错误 - 路由不存在
- POST /api/game/user-info
- POST /api/game/character
- POST /api/battle/stats
- POST /api/battle/power
- POST /api/arena/list
- POST /api/dungeon/list
- POST /api/shop/list
- POST /api/market/list
- POST /api/mail/list
- POST /api/task/list
- POST /api/daily/list
- POST /api/gift/validate

### 2. 500 错误 - 服务端错误
- POST /api/game/city/detail
- POST /api/game/city/collect
- POST /api/corps/list

## 修复计划

1. 检查路由定义
2. 检查前端调用路径
3. 修复不匹配的问题
4. 修复 500 错误
