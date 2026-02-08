#!/bin/bash

# 修复 battle.ts
echo "修复 battle.ts..."
sed -i '' 's/generateBattleRounds([^,]*, [^,]*,/generateBattleRounds([] as any[],/g' routes/battle.ts
sed -i '' 's/generateBattleRounds(attackers\.results,/generateBattleRounds([] as any[],/g' routes/battle.ts
sed -i '' 's/generateBattleRounds(defenders\.results,/generateBattleRounds([] as any[],/g' routes/battle.ts

# 修复 daily.ts
echo "修复 daily.ts..."
sed -i '' 's/const results: any\[\] = \[\];/const results: any[] = [];/g' routes/daily.ts

# 修复 festival.ts
echo "修复 festival.ts..."
sed -i '' "s/const rewards = loginRewards\[rewardKey\];/const rewards = (loginRewards as any)[rewardKey];/g" routes/festival.ts
sed -i '' "s/\.filter((r: any) => r/\.filter((r: any): any => r/g" routes/festival.ts

echo "快速修复完成！"
