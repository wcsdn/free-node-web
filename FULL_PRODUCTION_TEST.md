# 生产环境接口全面测试

## 测试方法
```bash
# 1. 设置环境变量
export API_BASE="https://game.free-node.xyz"
export WALLET="0x1234567890abcdef1234567890abcdef12345678"
export SIGNATURE="test_signature"

# 2. 运行测试
node tests/full-integration.test.cjs
```

## 需要测试的接口列表
## 路由清单
- activity
- appendant-npc
- arena
- battle
- building
- character
- chat
- city-interior
- city
- corps-member
- corps
- daily
- defense
- dungeon
- event
- feishu
- festival
- game
- gift
- guild
- help
- hero
- item-craft
- item
- mail
- map
- market
- military
- notification
- persist-effect
- rank
- shop
- signin
- skill
- task
- tech
