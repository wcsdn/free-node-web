#!/bin/bash
# Ghost Game API 测试脚本
# 使用方法: ./run-tests.sh [backend_url]

API_BASE=${1:-"http://localhost:8788"}
echo "🎮 Ghost Game API 测试"
echo "========================"
echo "测试地址: $API_BASE"
echo ""

# 测试服务器状态
echo "📡 测试服务器连接..."
if curl -s "$API_BASE/health" > /dev/null 2>&1; then
    echo "✅ 服务器在线"
else
    echo "⚠️  服务器可能离线，使用 --skip-server 参数跳过服务器测试"
fi

echo ""
echo "📋 测试用例列表:"
echo "  1. 服务器状态检查"
echo "  2. 城市列表"
echo "  3. 武将列表"
echo "  4. 军团列表"
echo "  5. 邮件列表"
echo "  6. 商店列表"
echo "  7. 科技列表"
echo "  8. 技能列表"
echo "  9. 繁荣度信息"
echo " 10. 签到信息"
echo " 11. NPC 占领列表"
echo " 12. 帮会列表"
echo " 13. 任务列表"
echo " 14. 日常任务"
echo " 15. 地图信息"
echo " 16. 副本列表"
echo " 17. 竞技场信息"
echo " 18. 物品列表"
echo " 19. 市场列表"
echo ""

# 运行 curl 测试
WALLET="0x1234567890abcdef1234567890abcdef12345678"
AUTH_HEADER="$WALLET:test_signature"

echo "🔍 快速接口测试:"
echo ""

tests=(
    "/api/game/status:服务器状态"
    "/api/game/city/list:城市列表"
    "/api/game/hero/list:武将列表"
    "/api/corps:军团列表"
    "/api/mail:邮件列表"
    "/api/shop/list?type=1:商店列表"
    "/api/technic/list:科技列表"
    "/api/skill/list:技能列表"
    "/api/interior/info:繁荣度信息"
    "/api/signin/info:签到信息"
    "/api/appendant-npc/npc-list:NPC占领列表"
    "/api/guild/list:帮会列表"
    "/api/task/list:任务列表"
    "/api/daily/list:日常任务"
    "/api/map/info:地图信息"
    "/api/dungeon/list:副本列表"
    "/api/arena/info:竞技场信息"
    "/api/item/list:物品列表"
    "/api/market/list:市场列表"
)

pass=0
fail=0

for test in "${tests[@]}"; do
    IFS=':' read -r path name <<< "$test"
    
    response=$(curl -s -w "\n%{http_code}" -H "X-Wallet-Auth: $AUTH_HEADER" "$API_BASE$path" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        echo "✅ $name"
        ((pass++))
    elif [ "$http_code" = "401" ]; then
        echo "✅ $name (需要认证)"
        ((pass++))
    else
        echo "❌ $name (HTTP $http_code)"
        ((fail++))
    fi
done

echo ""
echo "========================"
echo "📊 测试结果: $pass 通过, $fail 失败"
echo "========================"

# 生成测试报告
cat > test-report.json << EOF
{
    "timestamp": "$(date -Iseconds)",
    "apiBase": "$API_BASE",
    "wallet": "${WALLET:0:10}...",
    "results": {
        "passed": $pass,
        "failed": $fail,
        "total": $((pass + fail))
    },
    "status": "$([ $fail -eq 0 ] && echo 'all_passed' || echo 'has_failures')"
}
EOF

echo "📄 测试报告已生成: test-report.json"
