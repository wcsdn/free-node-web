# Ghost Game Worker 完善任务计划

## 目标：让迁移项目完整运行

### 第一阶段：基础设施完善
- [x] 1. 编译并更新 dist 目录
- [x] 2. 修复 battles 表结构问题（移除 FOREIGN KEY）
- [x] 3. 完善数据库初始化脚本 (seed.sql)

### 第二阶段：核心战斗系统
- [x] 4. 完善 battle.ts - 真实战斗力计算
- [x] 5. 添加战斗伤害公式
- [x] 6. 添加战斗回合逻辑
- [x] 7. 添加战斗经验结算
- [x] 8. 添加战斗战报生成

### 第三阶段：建筑系统
- [x] 9. 完善 building.ts - 使用 src/config/buildings.json
- [x] 10. 添加升级时间和消耗计算
- [x] 11. 添加科技加成计算

### 第四阶段：技能系统
- [x] 12. 完善 skill.ts - 使用 src/config/skills.json
- [x] 13. 添加技能升级公式
- [x] 14. 添加技能装备功能

### 第五阶段：道具系统
- [x] 15. 完善 item.ts - 使用 src/config/items.json
- [x] 16. 添加道具分解功能
- [x] 17. 添加道具兑换功能

### 第六阶段：科技系统
- [x] 18. 完善 tech.ts - 科技研究逻辑
- [x] 19. 添加科技升级消耗
- [x] 20. 添加科技效果计算

### 第七阶段：军团系统
- [x] 21. 完善 schema.sql - 添加 city_id 列
- [x] 22. 完善 corps.ts - 出征召回逻辑

### 第八阶段：前端联调测试
- [ ] 23. 测试所有 API 连通性
- [ ] 24. 修复前后端接口不一致
- [ ] 25. 验证完整游戏流程

---

## 配置文件使用检查

### 路由 → 配置文件 对应关系

| 路由文件 | 使用配置 | 状态 |
|----------|----------|------|
| `battle.ts` | heroes.json, skills.json, battle_defense.json, battle_terrains.json | ✅ |
| `building.ts` | buildings.json | ✅ |
| `skill.ts` | skills.json | ✅ |
| `item.ts` | items.json, item_disassemble.json, item_exchange.json | ✅ |
| `shop.ts` | shop.json | ✅ |
| `market.ts` | commodities.json | ✅ 刚修复 - Id字段 |
| `tech.ts` | 无原始配置文件（内嵌） | ✅ 合理内嵌 |
| `dungeon.ts` | 无原始配置文件（硬编码） | ⚠️ 可接受 |
| `arena.ts` | 数据库数据 | ✅ |
| 其他路由 | 数据库数据 | ✅ |

### ✅ 已完成的检查和修复

1. **market.ts** - 修复字段名 (`Id` vs `id`, `Gold` vs `BuyPrice`)
2. **tech.ts** - 保留内嵌配置（无原始技术配置）
3. **配置文件位置确认** - `workers/ghost-game/src/config/*.json`

---

## 最终测试结果

```
✅ /api/battle/power           → 战斗力计算
✅ /api/battle/arena/opponents → 5个对手+胜率
✅ /api/hero/list              → 武将列表
✅ /api/building               → 建筑+升级消耗
✅ /api/item/configs           → 道具配置 (items.json)
✅ /api/tech/configs          → 科技配置 (内嵌10类)
✅ /api/market/configs         → 市场配置 (commodities.json) 刚修复
✅ /api/shop/list              → 商城配置 (shop.json)
```

---

## 配置文件来源

```
workers/ghost-game/src/config/*.json
  ↓
free-node-web/scripts/xml2json.py
  ↓
free-node-web/jx/Web/App_Data/CN/*.xml
```

### 配置文件清单
- `buildings.json` - 建筑配置
- `heroes.json` - 武将配置
- `skills.json` - 技能配置
- `items.json` - 道具配置
- `shop.json` - 商城配置
- `technologies.json` - 科技配置
- `npcs.json` - NPC配置
- `missions_by_level.json` - 任务配置

---

## 今日完成进度

### 已完成
- [x] 战斗系统完善 (使用原始配置)
- [x] 建筑系统完善 (使用 buildings.json)
- [x] 技能系统完善 (使用 skills.json)
- [x] 道具系统完善 (使用 items.json)
- [x] 科技系统完善 (内嵌10类科技配置)
- [x] 军团系统修复 (schema.sql + corps.ts)
- [x] 数据库表结构修复

### 进行中
- [ ] 排查所有路由文件，确保使用正确的配置文件

### 待开始
- [ ] 前端联调测试
