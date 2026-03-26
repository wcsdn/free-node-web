#!/bin/bash
# API 500错误扫描脚本
export PATH="$HOME/.nvm/versions/node/v24.13.1/bin:$PATH"
BASE="http://127.0.0.1:8788"
WALLET="0x1234567890abcdef1234567890abcdef12345678"
AUTH="X-Wallet-Auth: ${WALLET}:test_signature"

echo "=== API 500错误扫描 ==="
echo "扫描时间: $(date)"
echo ""

# 存储500错误的文件
ERRORS_FILE="/tmp/api_500_errors.txt"
> "$ERRORS_FILE"

# 测试函数
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ "$method" = "GET" ]; then
        code=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "${BASE}${endpoint}")
    else
        code=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" -X POST -H "Content-Type: application/json" -d "$data" "${BASE}${endpoint}")
    fi
    
    if [ "$code" = "500" ]; then
        echo "❌ 500 ERROR: $method $endpoint"
        echo "$method $endpoint" >> "$ERRORS_FILE"
    else
        echo "✅ $code: $method $endpoint"
    fi
}

echo "=== /api/game ==="
test_endpoint GET "/api/game/user-info"
test_endpoint GET "/api/game/city-list"
test_endpoint GET "/api/game/status"
test_endpoint POST "/api/game/city-list" "{}"

echo ""
echo "=== /api/hero ==="
test_endpoint GET "/api/hero/list"
test_endpoint POST "/api/hero/list" "{}"
test_endpoint GET "/api/hero/detail?id=1"
test_endpoint GET "/api/hero/count"
test_endpoint GET "/api/hero/user-heroes"
test_endpoint GET "/api/hero/attrs?id=1"
test_endpoint GET "/api/hero/battle-power?id=1"
test_endpoint POST "/api/hero/detail" '{"id":1}'
test_endpoint GET "/api/hero/simple-heroes"

echo ""
echo "=== /api/building ==="
test_endpoint GET "/api/building/"
test_endpoint GET "/api/building/1"
test_endpoint GET "/api/building/city/1"
test_endpoint GET "/api/building/available/1"
test_endpoint GET "/api/building/config/list"
test_endpoint GET "/api/building/by-pos?city_id=1&pos=0"
test_endpoint GET "/api/building/by-id?id=1"
test_endpoint POST "/api/building/build" '{"city_id":1,"type":1,"position":1}'
test_endpoint POST "/api/building/upgrade" '{"building_id":1}'
test_endpoint POST "/api/building/cancel" '{"building_id":1}'
test_endpoint POST "/api/building/speed-up" '{"building_id":1}'
test_endpoint GET "/api/building/queue?city_id=1"

echo ""
echo "=== /api/battle ==="
test_endpoint GET "/api/battle/chessboard?city_id=1"
test_endpoint GET "/api/battle/state?pos=0"
test_endpoint GET "/api/battle/chess-status?city_id=1"
test_endpoint GET "/api/battle/chess-num?city_id=1"
test_endpoint GET "/api/battle/report"
test_endpoint GET "/api/battle/chess-rank"
test_endpoint GET "/api/battle/chess/event?pos=1"
test_endpoint GET "/api/battle/chess/board?city_id=1"
test_endpoint GET "/api/battle/chess/rank"
test_endpoint GET "/api/battle/chess/rank-by-user?wallet=$WALLET"
test_endpoint GET "/api/battle/user-battle"
test_endpoint POST "/api/battle/chess/move" '{"pos":1,"toPos":2}'
test_endpoint POST "/api/battle/chess/attack" '{"chessIndex":1,"targetID":11}'
test_endpoint POST "/api/battle/settle" '{"pos":1}'
test_endpoint GET "/api/battle/takeoff-battle?city_id=1"
test_endpoint POST "/api/battle/fight/update" '{"pos":1}'

echo ""
echo "=== /api/mail ==="
test_endpoint GET "/api/mail/list"
test_endpoint GET "/api/mail/new-count"
test_endpoint GET "/api/mail/fight"
test_endpoint GET "/api/mail/announcements"
test_endpoint GET "/api/mail/detail?mail_id=1"
test_endpoint POST "/api/mail/send" '{"to":"test","title":"test","content":"test"}'
test_endpoint POST "/api/mail/claim/1" '{}'
test_endpoint POST "/api/mail/claim-all" '{}'

echo ""
echo "=== /api/rank ==="
test_endpoint GET "/api/rank/power"
test_endpoint GET "/api/rank/level"
test_endpoint GET "/api/rank/wealth"
test_endpoint GET "/api/rank/city"
test_endpoint GET "/api/rank/defense"
test_endpoint GET "/api/rank/my-rank"

echo ""
echo "=== /api/item ==="
test_endpoint GET "/api/item/list"
test_endpoint GET "/api/item/config"
test_endpoint GET "/api/item/configs"
test_endpoint POST "/api/item/use" '{"item_id":1,"count":1}'
test_endpoint POST "/api/item/discard" '{"item_id":1,"count":1}'
test_endpoint GET "/api/item/items-by-type?type=1"
test_endpoint GET "/api/item/items-by-name?name=test"
test_endpoint POST "/api/item/compose" '{"type":1}'
test_endpoint POST "/api/item/enhance" '{"hero_id":1,"item_id":1}'
test_endpoint GET "/api/item/durability/1"

echo ""
echo "=== /api/shop ==="
test_endpoint GET "/api/shop/list"
test_endpoint GET "/api/shop/goods"
test_endpoint GET "/api/shop/info"
test_endpoint POST "/api/shop/buy" '{"goods_id":1}'

echo ""
echo "=== /api/market ==="
test_endpoint GET "/api/market/list"
test_endpoint GET "/api/market/info"
test_endpoint POST "/api/market/buy" '{"item_id":1,"count":1}'
test_endpoint POST "/api/market/sell" '{"item_id":1,"count":1,"price":100}'
test_endpoint POST "/api/market/cancel-sell" '{"market_id":1}'
test_endpoint GET "/api/market/price-history?item_id=1"

echo ""
echo "=== /api/task ==="
test_endpoint GET "/api/task/list"
test_endpoint GET "/api/task/daily"
test_endpoint GET "/api/task/1"
test_endpoint GET "/api/task/daily-progress"
test_endpoint POST "/api/task/claim/1" '{}'
test_endpoint POST "/api/task/daily/claim" '{}'
test_endpoint GET "/api/task/daily/list"

echo ""
echo "=== /api/tech ==="
test_endpoint GET "/api/tech/list"
test_endpoint GET "/api/tech/research"
test_endpoint GET "/api/tech/1"
test_endpoint POST "/api/tech/upgrade/1" '{}'

echo ""
echo "=== /api/event ==="
test_endpoint GET "/api/event/list"
test_endpoint GET "/api/event/active"
test_endpoint GET "/api/event/completable"
test_endpoint GET "/api/event/1"
test_endpoint POST "/api/event/complete/1" '{}'
test_endpoint POST "/api/event/accept" '{"event_id":1}'
test_endpoint GET "/api/event/fight"
test_endpoint GET "/api/event/other"

echo ""
echo "=== /api/arena ==="
test_endpoint GET "/api/arena/info"
test_endpoint GET "/api/arena/times"
test_endpoint GET "/api/rankings"
test_endpoint POST "/api/arena/challenge" '{"opponent":"test"}'

echo ""
echo "=== /api/defense ==="
test_endpoint GET "/api/defense/info?city_id=1"
test_endpoint GET "/api/defense/list?city_id=1"
test_endpoint GET "/api/defense/detail?city_id=1"
test_endpoint GET "/api/defense/formation?city_id=1"
test_endpoint POST "/api/defense/set-defence" '{"city_id":1,"defense_type":1}'

echo ""
echo "=== /api/effect ==="
test_endpoint GET "/api/effect/persist-group"
test_endpoint GET "/api/effect/over"
test_endpoint GET "/api/effect/over-array"
test_endpoint POST "/api/effect/add" '{"type":"test","value":1}'
test_endpoint POST "/api/effect/remove/1" '{}'
test_endpoint POST "/api/effect/clear" '{}'

echo ""
echo "=== /api/chat ==="
test_endpoint GET "/api/chat/list"
test_endpoint POST "/api/chat/send" '{"to":"test","content":"hello"}'
test_endpoint GET "/api/chat/conversations"

echo ""
echo "=== /api/appendant-npc ==="
test_endpoint GET "/api/appendant-npc/list"
test_endpoint GET "/api/appendant-npc/my-npc"
test_endpoint GET "/api/appendant-npc/benefits/1"
test_endpoint POST "/api/appendant-npc/occupy" '{"pos":1}'
test_endpoint POST "/api/appendant-npc/abandon" '{"pos":1}'

echo ""
echo "=== /api/city-ext ==="
test_endpoint GET "/api/city-ext/prosperity/level"
test_endpoint GET "/api/city-ext/resource/output"
test_endpoint GET "/api/city-ext/prosperity/bonus"
test_endpoint GET "/api/city-ext/population"
test_endpoint POST "/api/city-ext/population/update" '{"city_id":1}'
test_endpoint POST "/api/city-ext/prosperity/update" '{"city_id":1}'

echo ""
echo "=== /api/warfare ==="
test_endpoint GET "/api/warfare/signup-status"
test_endpoint GET "/api/warfare/can-signup"
test_endpoint GET "/api/warfare/info"
test_endpoint POST "/api/warfare/signup" '{"war_id":1}'
test_endpoint POST "/api/warfare/cancel" '{"war_id":1}'
test_endpoint GET "/api/warfare/list"

echo ""
echo "=== /api/guild ==="
test_endpoint GET "/api/guild/list"
test_endpoint GET "/api/guild/my"
test_endpoint GET "/api/guild/1"
test_endpoint GET "/api/guild/members/1"
test_endpoint POST "/api/guild/create" '{"name":"test"}'
test_endpoint POST "/api/guild/1/join" '{}'
test_endpoint POST "/api/guild/1/leave" '{}'
test_endpoint POST "/api/guild/1/donate" '{}'
test_endpoint GET "/api/guild/my-info"

echo ""
echo "=== /api/corps ==="
test_endpoint GET "/api/corps/list"
test_endpoint GET "/api/corps/state"
test_endpoint GET "/api/corps/1"
test_endpoint GET "/api/corps/members/1"
test_endpoint GET "/api/corps/member-list"
test_endpoint GET "/api/corps/members-resource"

echo ""
echo "=== /api/hero-ext ==="
test_endpoint GET "/api/hero-ext/attr-bonus"
test_endpoint GET "/api/hero-ext/skill-detail/1"
test_endpoint GET "/api/hero-ext/breakthrough"
test_endpoint GET "/api/hero-ext/breakthrough/config"
test_endpoint GET "/api/hero-ext/breakthrough/check"
test_endpoint POST "/api/hero-ext/awake" '{"hero_id":1}'
test_endpoint GET "/api/hero-ext/awake/config"
test_endpoint GET "/api/hero-ext/awake/check"
test_endpoint GET "/api/hero-ext/fate/config"
test_endpoint GET "/api/hero-ext/fate/bonus"
test_endpoint GET "/api/hero-ext/fate/check"
test_endpoint GET "/api/hero-ext/unit-adapt/config"
test_endpoint POST "/api/hero-ext/unit-adapt/upgrade" '{"hero_id":1}'
test_endpoint GET "/api/hero-ext/unit-adapt/check?hero_id=1"

echo ""
echo "=== /api/item-ext ==="
test_endpoint GET "/api/item-ext/compose/recipes"
test_endpoint GET "/api/item-ext/compose/count"
test_endpoint POST "/api/item-ext/compose/start" '{"type":1}'
test_endpoint GET "/api/item-ext/compose/by-type?type=1"
test_endpoint GET "/api/item-ext/enhance/config"
test_endpoint POST "/api/item-ext/enhance/check" '{"hero_id":1}'
test_endpoint GET "/api/item-ext/dismantle/check?hero_id=1"
test_endpoint POST "/api/item-ext/disassemble" '{"hero_id":1}'
test_endpoint GET "/api/item-ext/gem/slots/1"
test_endpoint POST "/api/item-ext/gem/equip" '{"item_id":1,"gem_id":1,"slot":1}'
test_endpoint POST "/api/item-ext/gem/unequip" '{"item_id":1,"slot":1}'
test_endpoint GET "/api/item-ext/explore"

echo ""
echo "=== /api/event-ext ==="
test_endpoint GET "/api/event-ext/event"
test_endpoint GET "/api/event-ext/list"

echo ""
echo "=== /api/mail-ext ==="
test_endpoint GET "/api/mail-ext/node"

echo ""
echo "=== /api/organize-ext ==="
test_endpoint GET "/api/organize-ext/organize"
test_endpoint GET "/api/organize-ext/other"
test_endpoint GET "/api/organize-ext/other/by-type?type=1"
test_endpoint GET "/api/organize-ext/other/reward?event_id=1"
test_endpoint GET "/api/organize-ext/other/simple"

echo ""
echo "=== /api/persist-effect-ext ==="
test_endpoint GET "/api/persist-effect-ext/persist-effect"
test_endpoint GET "/api/persist-effect-ext/persist-effect-flags"

echo ""
echo "=== /api/task-ext ==="
test_endpoint GET "/api/task-ext/hero"
test_endpoint GET "/api/task-ext/hero/:heroId"

echo ""
echo "=== /api/user-ext ==="
test_endpoint GET "/api/user-ext/stats"
test_endpoint GET "/api/user-ext/achievements"
test_endpoint GET "/api/user-ext/vip"
test_endpoint GET "/api/user-ext/vip-seven-days"
test_endpoint GET "/api/user-ext/vip-thirty-days"
test_endpoint POST "/api/user-ext/signin" '{}'
test_endpoint GET "/api/user-ext/achievements/:achievementId/progress"
test_endpoint GET "/api/user-ext/story/chapters"
test_endpoint GET "/api/user-ext/story/start?chapter_id=1"

echo ""
echo "=== /api/map ==="
test_endpoint GET "/api/map/world/landform?x=0&y=0"
test_endpoint GET "/api/map/world/pos-state?pos=0"
test_endpoint GET "/api/map/world/cities"
test_endpoint GET "/api/map/area/0/0"
test_endpoint GET "/api/map/area/1/1"

echo ""
echo "=== /api/admin ==="
test_endpoint GET "/api/admin/online-users"
test_endpoint POST "/api/admin/kick-user" '{"target_address":"test"}'

echo ""
echo "=== 扫描完成 ==="
echo ""
if [ -s "$ERRORS_FILE" ]; then
    echo "❌ 发现 500 错误:"
    cat "$ERRORS_FILE"
else
    echo "✅ 未发现 500 错误"
fi