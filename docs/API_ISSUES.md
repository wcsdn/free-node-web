# API 问题详细报告 - 需要修复的问题

## 🔴 问题汇总

经过测试发现 **46 个 API 失败**，问题分为以下几类：

---

## 1. 后端路由未实现 (500 错误)

这些路由只有注释 `// 已实现`，没有实际代码：

### rank.ts (排行榜)
- ❌ `/rank/list` - 排行榜列表
- ❌ `/rank/user` - 用户排名
- ❌ `/rank/hero` - 英雄排名
- ❌ `/rank/fame` - 声望排名
- ❌ `/rank/prestige` - 声望排名
- ❌ `/rank/insignia` - 勋章排名
- ❌ `/rank/territory` - 领土排名
- ❌ `/rank/union` - 联盟排名

### arena.ts (竞技场)
- ❌ `/arena/info` - 竞技场信息
- ❌ `/arena/times` - 挑战次数

### tech.ts (科技)
- ❌ `/tech/by-building` - 建筑科技

### map.ts (地图)
- ❌ `/map/unit` - 地图单位
- ❌ `/map/world/landform` - 世界地形
- ❌ `/map/world/pos-state` - 位置状态

---

## 2. 端点路径不匹配

### 聊天接口
- 前端期望: `/api/chat/messages`
- 后端实际: `/api/chat/list`

### 物品接口  
- 前端期望: `/api/item/list`
- 后端实际: `/api/item/` (GET 根路径)

### 邮件接口
- 前端期望: `/api/mail/list`
- 后端实际: `/api/mail/` (GET 根路径)

---

## 3. HTTP 方法不匹配

前端使用 GET 但后端需要 POST：
- `GetHeroByID` - 前端 GET, 后端 POST
- `GetCanEenageHero` - 前端 GET, 后端 POST  
- `GetCanUseHero` - 前端 GET, 后端 POST
- `EngageHero` - 前端 POST ✓
- `FireTheHero` - 前端 POST ✓

---

## 4. 缺少必需参数 (400 错误)

部分接口需要正确参数才能工作：
- `GetMailByID` - 需要 mail_id
- `GetFightMailByID` - 需要 mail_id
- `DeleteMails` - 需要 mail_ids 数组
- `SendMessage` - 需要 junta, message

---

## 📋 修复优先级

### P0 - 阻断级 (页面无法加载)
1. 修复 rank.ts 路由实现 (18 个路由)
2. 修复 arena.ts 路由实现
3. 修复 tech.ts 路由实现
4. 修复 map.ts 路由实现

### P1 - 功能级 (功能不可用)
5. 添加聊天路由映射或修改前端
6. 修正物品/邮件接口路径

### P2 - 优化级
7. 统一 POST/GET 方法
8. 添加参数验证

---

## 💻 修复建议

### 1. 快速修复：前端适配后端

修改 `public/jx-web/Js/api-config.js`:

```javascript
// 聊天
GetserverChatWords: {
  endpoint: '/chat/list',  // 改为 /chat/list
  ...
}

// 物品
GetItemList: {
  endpoint: '/item/',    // 改为 /item/
  ...
}

// 邮件
GetMailList: {
  endpoint: '/mail/',     // 改为 /mail/
  ...
}
```

### 2. 长期修复：完成后端实现

需要实现 rank.ts, arena.ts, tech.ts, map.ts 中的空路由

