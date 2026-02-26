# 接口字段对比表

## 1. /game/user-info (C# GetUserInfo)
### C# UserInfo 字段:
- ID, Name, Organise, Level, State
- InteriorBuildingQueueNum, DefanceBuildingQueueNum
- FastUpDateNeedTimePercent, DegradeNeedResPercent
- EventBreakReturnResPercent, DegradeNeedTimePercent
- ItemCount, EndProtect, CreateDate, ServerUnit, Insignia
- CityList[] (CityShotInfo)

### Worker 现状:
- 缺少: ID, EventBreakReturnResPercent, ItemCount, EndProtect, CreateDate, ServerUnit
- CityList缺少: Num, State, BackImg, UserName

## 2. /game/city/interior-info (C# GetCityInteriorInfo)
### C# CityInteriorInfo 字段:
- Men, Food, Money, Gold, ChildRate
- MenSpeed, FoodSpeed, MoneySpeed
- MenRoom, FoodRoom, MoneyRoom
- Area, Child, Bloom, AreaRoom
- InteriorBuildingLevel[], TechnicLevel[]
- OldTime, AverageTrainingPer
- EngageHeroNum, NewEmailNum
- CurrentDefenceBuildNum, MaxDefenceBuildNum
- Level, CityPos, ChangeMapFlag, MaxItemNum
- MaxEngageHeroNum, IsLord

### Worker 现状: ✅ 已补全

## 3. /hero/list (C# GetCityHero -> HeroInfo)
### C# HeroInfo 字段:
- ID, Name, Sex, Junta, Icon, Image
- Level, PortraitIndex, AbilityIndex
- CityID, UserName, Training, DefencePos, PrenticeNum
- HeroType, Quality, ExpCount, NoSkillReason
- PropertyCounteract[], WuXing, UpTraining
- AutoExpGold, AutoExpCount, AutoExpResFood...
- FastTrainCost*, FastConscriptionCost*

### Worker 现状:
- 缺少大量字段

## 4. /building/city (C# GetBuildingList -> BuildingInfo)
### C# BuildingInfo 字段:
- ID, CityID, BuildingType, Name, Level
- Position, Image, UpNeedMoney, UpNeedFood
- UpNeedMen, UpNeedTime, EffectType, EffectValue
- CreateTime, UpdateTime

### Worker 现状: 基本完整

## 5. /task/list (C# GetValidTask -> TaskInfo)
### C# TaskInfo 字段:
- ID, TaskType, TaskName, Description
- ConditionType, ConditionValue, GainType, GainValue
- BeginTime, EndTime, State

### Worker 现状: 需要检查

## 6. /event/pending (C# GetValidEvent -> EventInfo)
### C# EventInfo 字段:
- ID, EventType, EventName, Description
- BeginTime, EndTime, CityID, State

### Worker 现状: 需要检查
