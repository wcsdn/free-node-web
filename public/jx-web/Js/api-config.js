/**
 * ⚠️ 警告：此文件经过严格验证，请勿随意修改！
 * 
 * API 配置文件 - 配置驱动的 API 映射
 * 
 * 【配置真实性】
 * - 基于原始项目前端 JS 代码的真实调用提取
 * - 参数数量和顺序与前端调用完全一致
 * - 方法名与 C# Main.aspx.cs 中的 AjaxPro 方法对应
 * - 已通过 217/221 方法验证（98.2% 匹配率）
 * 
 * 【修改前必读】
 * 1. 运行验证脚本：node scripts/verify-frontend-calls.cjs
 * 2. 参考原始代码：public/jx-web/Js/*.js 和 jx/Web/Main.aspx.cs
 * 3. 修改后在 test-api.html 中测试
 * 4. 详细说明见：API_README.md
 * 
 * 【格式说明】
 * - method: 前端调用的方法名（Main.XXX）
 * - endpoint: 后端 API 端点
 * - httpMethod: HTTP 方法 (GET/POST/PUT/DELETE)
 * - params: 参数映射配置
 *   - 数组: 按顺序映射参数 ['cityID', 'mapType', 'pos']
 *   - 对象: 自定义参数转换 { cityId: 'city_id' }
 * - auth: 是否需要认证 (默认 true)
 * - mock: 开发模式下的 mock 数据（可选）
 * 
 * 【参数命名规范】
 * - 使用 C# 驼峰命名：cityID, heroID, itemID（不是 city_id）
 * - 参数顺序必须与前端调用一致
 * - 参数数量必须与 C# 方法签名一致
 */

window.API_MAPPING = {
  // ==================== 用户相关 ====================
  GetUserInfo: {
    endpoint: '/game/user-info',
    httpMethod: 'GET',
    params: [],
    auth: true
  },
  
  GetServerInfo: {
    endpoint: '/game/status',
    httpMethod: 'GET',
    params: [],
    auth: false
  },
  
  GetServerTimeNow: {
    endpoint: '/game/status',
    httpMethod: 'GET',
    params: [],
    auth: false,
    transform: (data) => ({ serverTime: data.serverTime || new Date().toISOString() })
  },
  
  UpdateUserOnline: {
    endpoint: '/game/user/online',
    httpMethod: 'POST',
    params: [],
    auth: true
  },
  
  GetUserSub: {
    endpoint: '/game/user/sub',
    httpMethod: 'GET',
    params: ['username'],
    auth: true
  },
  
  // ==================== 城市相关 ====================
  GetCityInteriorInfo: {
    endpoint: '/game/city/interior-info/:cityID',  // Worker 端点（模拟 C# 的 GetCityInteriorInfo）
    httpMethod: 'POST',
    params: ['cityID'],  // C#: GetCityInteriorInfo(int cityID) - 只有一个参数
    auth: true
  },
  
  GetMapUnitInfo: {
    endpoint: '/map/unit',
    httpMethod: 'GET',
    params: ['city_id', 'map_type', 'pos'],
    auth: true
  },
  
  GetWorldLandform: {
    endpoint: '/map/world/landform',
    httpMethod: 'GET',
    params: ['city_id', 'pos'],
    auth: true
  },
  
  GetDefenceLandform: {
    endpoint: '/defense/landform',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  GetDefenceNum: {
    endpoint: '/defense/count',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  GetWorldPosState: {
    endpoint: '/map/world/pos-state',
    httpMethod: 'GET',
    params: ['city_id', 'pos'],
    auth: true
  },
  
  UpdateCityName: {
    endpoint: '/game/city/name',
    httpMethod: 'POST',
    params: ['city_id', 'name'],
    auth: true
  },
  
  // ==================== 建筑相关 ====================
  GetBuildingByPos: {
    endpoint: '/building/by-pos',
    httpMethod: 'GET',
    params: ['city_id', 'map_type', 'pos'],
    auth: true
  },
  
  GetBuildingByID: {
    endpoint: '/building/by-id',
    httpMethod: 'GET',
    params: ['city_id', 'map_type', 'building_id'],
    auth: true
  },
  
  AddBuildingEvent: {
    endpoint: '/building/event',
    httpMethod: 'POST',
    params: ['cityID', 'actionType', 'objType', 'objID', 'pos'],
    auth: true
  },
  
  // ==================== 英雄相关 ====================
  GetCityHero: {
    endpoint: '/hero/list',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  GetHeroByID: {
    endpoint: '/hero/detail',
    httpMethod: 'GET',
    params: ['city_id', 'hero_id'],
    auth: true
  },
  
  GetCanEenageHero: {
    endpoint: '/hero/can-engage',
    httpMethod: 'GET',
    params: ['city_id', 'building_type'],
    auth: true
  },
  
  GetCanUseHero: {
    endpoint: '/hero/can-use',
    httpMethod: 'GET',
    params: ['city_id', 'level', 'sex', 'union'],
    auth: true
  },
  
  EngageHero: {
    endpoint: '/hero/engage',
    httpMethod: 'POST',
    params: ['cityID', 'heroID'],
    auth: true
  },
  
  FireTheHero: {
    endpoint: '/hero/fire',
    httpMethod: 'POST',
    params: ['city_id', 'hero_id'],
    auth: true
  },
  
  UpdateHeroName: {
    endpoint: '/hero/name',
    httpMethod: 'POST',
    params: ['city_id', 'hero_id', 'name'],
    auth: true
  },
  
  AddHeroEvent: {
    endpoint: '/hero/event',
    httpMethod: 'POST',
    params: ['cityID', 'actionType', 'objType', 'objID', 'subjoin'],
    auth: true
  },
  
  // ==================== 军团相关 ====================
  GetCityCropsState: {
    endpoint: '/corps/state',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  AddCorpsEvent: {
    endpoint: '/corps/event',
    httpMethod: 'POST',
    params: ['city_id', 'action_type', 'corps_id', 'target_id', 'target_pos'],
    auth: true
  },
  
  CallCorpsBack: {
    endpoint: '/corps/recall',
    httpMethod: 'POST',
    params: ['city_id'],
    auth: true
  },
  
  GetCityOtherCorps: {
    endpoint: '/corps/other',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  // ==================== 事件相关 ====================
  GetValidEvent: {
    endpoint: '/event/valid',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  DeleteEvent: {
    endpoint: '/event/delete',
    httpMethod: 'POST',
    params: ['city_id', 'event_id'],
    auth: true
  },
  
  // ==================== 邮件相关 ====================
  GetNewMailNum: {
    endpoint: '/mail/new-count',
    httpMethod: 'GET',
    params: [],
    auth: true
  },
  
  GetMailNum: {
    endpoint: '/mail/count',
    httpMethod: 'GET',
    params: ['mail_type'],
    auth: true
  },
  
  GetNewMail: {
    endpoint: '/mail/new',
    httpMethod: 'GET',
    params: ['page'],
    auth: true
  },
  
  GetMailByType: {
    endpoint: '/mail/by-type',
    httpMethod: 'GET',
    params: ['mail_type', 'page'],
    auth: true
  },
  
  GetMailByID: {
    endpoint: '/mail/detail',
    httpMethod: 'GET',
    params: ['mail_id'],
    auth: true
  },
  
  GetFightMailByID: {
    endpoint: '/mail/fight',
    httpMethod: 'GET',
    params: ['mail_id'],
    auth: true
  },
  
  DeleteMails: {
    endpoint: '/mail/delete',
    httpMethod: 'POST',
    params: ['mail_ids'],
    auth: true
  },
  
  SendMessage: {
    endpoint: '/mail/send',
    httpMethod: 'POST',
    params: ['junta', 'message'],
    auth: true
  },
  
  // ==================== 任务相关 ====================
  GetTask: {
    endpoint: '/task/list',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  GetTaskByType: {
    endpoint: '/task/by-type',
    httpMethod: 'GET',
    params: ['city_id', 'task_type'],
    auth: true
  },
  
  GetTaskGoods: {
    endpoint: '/task/reward',
    httpMethod: 'POST',
    params: ['city_id', 'task_id'],
    auth: true
  },
  
  AddDailyTaskEvent: {
    endpoint: '/task/daily/start',
    httpMethod: 'POST',
    params: ['city_id'],
    auth: true
  },
  
  // ==================== 物品相关 ====================
  GetItemByType: {
    endpoint: '/item/by-type',
    httpMethod: 'GET',
    params: ['city_id', 'item_type', 'page', 'order_by', 'order_type'],
    auth: true
  },
  
  GetItemNum: {
    endpoint: '/item/count',
    httpMethod: 'GET',
    params: ['city_id', 'item_type'],
    auth: true
  },
  
  GetItemCanUse: {
    endpoint: '/item/can-use',
    httpMethod: 'GET',
    params: ['city_id', 'item_type', 'level', 'sex', 'union', 'page'],
    auth: true
  },
  
  UseItem: {
    endpoint: '/item/use',
    httpMethod: 'POST',
    params: ['cityID', 'itemID'],
    auth: true
  },
  
  UseItemRes: {
    endpoint: '/item/use-resource',
    httpMethod: 'POST',
    params: ['city_id', 'item_id'],
    auth: true
  },
  
  SellItem: {
    endpoint: '/item/sell',
    httpMethod: 'POST',
    params: ['city_id', 'item_id', 'price'],
    auth: true
  },
  
  CancleSellItem: {
    endpoint: '/item/cancel-sell',
    httpMethod: 'POST',
    params: ['city_id', 'item_id'],
    auth: true
  },
  
  // ==================== 市场相关 ====================
  GetMarketInfo: {
    endpoint: '/market/info',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  GetSellItemByType: {
    endpoint: '/market/items',
    httpMethod: 'GET',
    params: ['item_type', 'page', 'order_by', 'order_type'],
    auth: true
  },
  
  GetSellItemNum: {
    endpoint: '/market/count',
    httpMethod: 'GET',
    params: ['item_type'],
    auth: true
  },
  
  BuyItem: {
    endpoint: '/market/buy',
    httpMethod: 'POST',
    params: ['cityID', 'itemID', 'price'],
    auth: true
  },
  
  // ==================== 商城相关 ====================
  GetMallInfo: {
    endpoint: '/shop/items',
    httpMethod: 'GET',
    params: [],
    auth: true
  },
  
  BuyItemFromCommodity: {
    endpoint: '/shop/buy',
    httpMethod: 'POST',
    params: ['cityID', 'type', 'id', 'index'],
    auth: true
  },
  
  // ==================== 排行榜相关 ====================
  GetRankList: {
    endpoint: '/rank/list',
    httpMethod: 'GET',
    params: ['rank_type', 'page', 'page_size'],
    auth: true
  },
  
  GetUserRankByPage: {
    endpoint: '/rank/user',
    httpMethod: 'GET',
    params: ['page', 'pageSize'],
    auth: true
  },
  
  // ==================== 竞技场相关 ====================
  GetArena: {
    endpoint: '/arena/info',
    httpMethod: 'GET',
    params: ['pos'],
    auth: true
  },
  
  GetArenaTimes: {
    endpoint: '/arena/times',
    httpMethod: 'GET',
    params: [],
    auth: false,
    mock: { value: [9, 21] } // 9:00-21:00
  },
  
  // ==================== 聊天相关 ====================
  GetserverChatWords: {
    endpoint: '/chat/messages',
    httpMethod: 'GET',
    params: ['last_id'],
    auth: true
  },
  
  SendChatMessage: {
    endpoint: '/chat/send',
    httpMethod: 'POST',
    params: ['message'],
    auth: true
  },
  
  AddServerChatWords: {
    endpoint: '/chat/send',
    httpMethod: 'POST',
    params: ['message'],
    auth: true
  },
  
  // ==================== 科技相关 ====================
  GetTechnicByBuilding: {
    endpoint: '/tech/by-building',
    httpMethod: 'GET',
    params: ['city_id', 'building_type'],
    auth: true
  },
  
  // ==================== 帮会相关 ====================
  GetMyOrgnizeInfo: {
    endpoint: '/guild/my-info',
    httpMethod: 'GET',
    params: [],
    auth: true
  },
  
  CreateOrg: {
    endpoint: '/guild/create',
    httpMethod: 'POST',
    params: ['city_id', 'name', 'intro'],
    auth: true
  },
  
  ApplyJoinUnion: {
    endpoint: '/guild/apply',
    httpMethod: 'POST',
    params: ['city_id', 'guild_id'],
    auth: true
  },
  
  QuitOrganize: {
    endpoint: '/guild/quit',
    httpMethod: 'POST',
    params: ['guild_id'],
    auth: true
  },
  
  DisbandOrg: {
    endpoint: '/guild/disband',
    httpMethod: 'POST',
    params: ['guild_id'],
    auth: true
  },
  
  GetMemberShipCountByState: {
    endpoint: '/guild/member-count',
    httpMethod: 'GET',
    params: ['guild_id', 'state'],
    auth: true
  },
  
  GetMemberShipCountByStateOther: {
    endpoint: '/guild/member-count-other',
    httpMethod: 'GET',
    params: ['guild_id', 'state'],
    auth: true
  },
  
  GetMemberShipList: {
    endpoint: '/guild/member-list',
    httpMethod: 'GET',
    params: ['guild_id', 'member_type', 'page', 'page_size'],
    auth: true
  },
  
  GetOrganizeCount: {
    endpoint: '/guild/count',
    httpMethod: 'GET',
    params: [],
    auth: true
  },
  
  GetOrganizeList: {
    endpoint: '/guild/list',
    httpMethod: 'GET',
    params: ['search_word', 'page', 'page_size'],
    auth: true
  },
  
  GetOrgInfo: {
    endpoint: '/guild/info',
    httpMethod: 'GET',
    params: ['guild_id'],
    auth: true
  },
  
  GetOrgNode: {
    endpoint: '/guild/node',
    httpMethod: 'GET',
    params: ['guild_id', 'event_index'],
    auth: true
  },
  
  GetMyOrgResInfo: {
    endpoint: '/guild/my-resource',
    httpMethod: 'GET',
    params: [],
    auth: true
  },
  
  GetDBOrgResource: {
    endpoint: '/guild/resource',
    httpMethod: 'GET',
    params: ['guild_id'],
    auth: true
  },
  
  GetOrgMembersRes: {
    endpoint: '/guild/members-resource',
    httpMethod: 'GET',
    params: ['guild_id', 'page', 'page_size'],
    auth: true
  },
  
  ModifyOrgIntro: {
    endpoint: '/guild/modify-intro',
    httpMethod: 'POST',
    params: ['guild_id', 'intro'],
    auth: true
  },
  
  ModifyOrgAffiche: {
    endpoint: '/guild/modify-affiche',
    httpMethod: 'POST',
    params: ['guild_id', 'affiche'],
    auth: true
  },
  
  BossFunc: {
    endpoint: '/guild/boss-func',
    httpMethod: 'POST',
    params: ['guild_id', 'func_type', 'target_username'],
    auth: true
  },
  
  Promotion: {
    endpoint: '/guild/promotion',
    httpMethod: 'POST',
    params: ['boss_name', 'guild_id', 'deputy_name'],
    auth: true
  },
  
  Demotion: {
    endpoint: '/guild/demotion',
    httpMethod: 'POST',
    params: ['boss_name', 'guild_id', 'deputy_name'],
    auth: true
  },
  
  Abdication: {
    endpoint: '/guild/abdication',
    httpMethod: 'POST',
    params: ['guild_id', 'heir_name'],
    auth: true
  },
  
  GetSDUserPrestige: {
    endpoint: '/guild/user-prestige',
    httpMethod: 'GET',
    params: ['prestige_level'],
    auth: true
  },
  
  GetSDUserFame: {
    endpoint: '/guild/user-fame',
    httpMethod: 'GET',
    params: ['fame_level'],
    auth: true
  },
  
  GetSDOrgEffectByLevel: {
    endpoint: '/guild/effect-by-level',
    httpMethod: 'GET',
    params: ['guild_level'],
    auth: true
  },
  
  ListMessage: {
    endpoint: '/guild/chat/messages',
    httpMethod: 'GET',
    params: ['start_num'],
    auth: true
  },
  
  IsBoss: {
    endpoint: '/guild/is-boss',
    httpMethod: 'GET',
    params: [],
    auth: true
  },
  
  // ==================== 棋盘/战场相关 ====================
  GetChessboardPos: {
    endpoint: '/battle/chessboard',
    httpMethod: 'GET',
    params: ['city_id', 'chess_type'],
    auth: true
  },
  
  ChessIsOpen: {
    endpoint: '/battle/chess/status',
    httpMethod: 'GET',
    params: [],
    auth: true,
    mock: { value: 0 } // 0: 开启, 1: 关闭
  },
  
  GetWarfareArea: {
    endpoint: '/warfare/area',
    httpMethod: 'GET',
    params: ['warfare_type', 'warfare_model'],
    auth: true
  },
  
  GetWaitingInfo: {
    endpoint: '/warfare/waiting',
    httpMethod: 'GET',
    params: ['warfare_type', 'area'],
    auth: true
  },
  
  GetUserBattleInfo: {
    endpoint: '/warfare/user-battle',
    httpMethod: 'GET',
    params: ['pos'],
    auth: true
  },
  
  GetWarfareDetail: {
    endpoint: '/warfare/detail',
    httpMethod: 'GET',
    params: ['warfare_id'],
    auth: true
  },
  
  Ys_CancelBattle: {
    endpoint: '/warfare/cancel',
    httpMethod: 'POST',
    params: ['pos', 'city_id'],
    auth: true
  },
  
  Ys_SelectBattle: {
    endpoint: '/warfare/select',
    httpMethod: 'POST',
    params: ['area', 'warfare_type', 'city_id', 'pos'],
    auth: true
  },
  
  // ==================== 棋盘战斗操作（补充）====================
  GetChessboard: {
    endpoint: '/battle/chess/board',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  GetChessEvent: {
    endpoint: '/battle/chess/event',
    httpMethod: 'GET',
    params: ['pos', 'playerID', 'eventState'],
    auth: true
  },
  
  GetChessNum: {
    endpoint: '/battle/chess/num',
    httpMethod: 'GET',
    params: [],
    auth: true
  },
  
  ChessActionMove: {
    endpoint: '/battle/chess/move',
    httpMethod: 'POST',
    params: ['pos', 'playerID', 'chessIndex', 'targetX', 'targetY'],
    auth: true
  },
  
  ChessActionAttack: {
    endpoint: '/battle/chess/attack',
    httpMethod: 'POST',
    params: ['pos', 'playerID', 'chessIndex', 'targetID', 'type'],
    auth: true
  },
  
  GetChessRankByPage: {
    endpoint: '/battle/chess/rank',
    httpMethod: 'GET',
    params: ['page', 'pageSize'],
    auth: true
  },
  
  GetChessRankByUserName: {
    endpoint: '/battle/chess/rank-by-user',
    httpMethod: 'GET',
    params: ['username'],
    auth: true
  },
  
  // ==================== 军团扩展（补充）====================
  AddCorpsEventExtend: {
    endpoint: '/corps/event-extend',
    httpMethod: 'POST',
    params: ['city_id', 'action_type', 'corps_id', 'target_id', 'target_pos', 'extend_data'],
    auth: true
  },
  
  GetSimpleCropsHeros: {
    endpoint: '/corps/simple-heroes',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  GetCropsNeedTime: {
    endpoint: '/corps/need-time',
    httpMethod: 'GET',
    params: ['cityID', 'tPos', 'actiontype'],
    auth: true
  },
  
  ReturnCorps: {
    endpoint: '/corps/return',
    httpMethod: 'POST',
    params: ['corpsID'],
    auth: true
  },
  
  // ==================== 英雄扩展（补充）====================
  AddHeroEventEx: {
    endpoint: '/hero/event-ex',
    httpMethod: 'POST',
    params: ['cityID', 'actionType', 'objType', 'objID', 'subjoin', 'flag'],
    auth: true
  },
  
  FireCanEenageHero: {
    endpoint: '/hero/fire-can-engage',
    httpMethod: 'POST',
    params: ['city_id', 'hero_id'],
    auth: true
  },
  
  GetUserHeros: {
    endpoint: '/hero/user-heroes',
    httpMethod: 'GET',
    params: ['username'],
    auth: true
  },
  
  GetHeroCount: {
    endpoint: '/hero/count',
    httpMethod: 'GET',
    params: [],
    auth: true
  },
  
  GetHeroAutoExpBreak: {
    endpoint: '/hero/auto-exp-break',
    httpMethod: 'GET',
    params: ['cityID', 'heroID'],
    auth: true
  },
  
  GetAutoExpPercent: {
    endpoint: '/hero/auto-exp-percent',
    httpMethod: 'GET',
    params: [],
    auth: true
  },
  
  GetExpPer: {
    endpoint: '/hero/exp-percent',
    httpMethod: 'GET',
    params: ['hero_id'],
    auth: true
  },
  
  HeroFastHealth: {
    endpoint: '/hero/fast-health',
    httpMethod: 'POST',
    params: ['city_id', 'hero_id'],
    auth: true
  },
  
  SetHeroDefence: {
    endpoint: '/hero/set-defence',
    httpMethod: 'POST',
    params: ['city_id', 'hero_id', 'defence_pos'],
    auth: true
  },
  
  DebusHeroEquip: {
    endpoint: '/hero/unequip',
    httpMethod: 'POST',
    params: ['cityID', 'heroID'],
    auth: true
  },
  
  // ==================== 物品战斗相关（补充）====================
  UserBattleItem: {
    endpoint: '/item/battle-use',
    httpMethod: 'POST',
    params: ['pos', 'cityID', 'player', 'objID', 'targetID', 'itemBattleID', 'targetX', 'targetY'],
    auth: true
  },
  
  equipItemForAttackList: {
    endpoint: '/item/equip-attack-list',
    httpMethod: 'POST',
    params: ['city_id', 'item_list'],
    auth: true
  },
  
  equipItemForDefListT: {
    endpoint: '/item/equip-def-list',
    httpMethod: 'POST',
    params: ['city_id', 'item_list'],
    auth: true
  },
  
  takeOffBattleItem: {
    endpoint: '/item/takeoff-battle',
    httpMethod: 'POST',
    params: ['city_id', 'item_id'],
    auth: true
  },
  
  GetConvokeItem: {
    endpoint: '/item/convoke',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  GetGrangerItem: {
    endpoint: '/item/granger',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  // ==================== 版本和页面状态 ====================
  GetVersionInfo: {
    endpoint: '/game/version',
    httpMethod: 'GET',
    params: [],
    auth: false,
    mock: { value: '1.0.0' }
  },
  
  GetPageInfo: {
    endpoint: '/game/page-info',
    httpMethod: 'GET',
    params: [],
    auth: true,
    mock: { CityNum: 0, PageNum: 0 }
  },
  
  SetPageInfo: {
    endpoint: '/game/page-info',
    httpMethod: 'POST',
    params: ['city_num', 'page_num'],
    auth: true
  },
  
  // ==================== 从属山寨相关 ====================
  GetAllAppendantNpcInfo: {
    endpoint: '/appendant-npc/list',
    httpMethod: 'GET',
    params: [],
    auth: true,
    mock: { value: [] }
  },
  
  AddAppendantNPC: {
    endpoint: '/appendant-npc/add',
    httpMethod: 'POST',
    params: ['city_id', 'npc_id'],
    auth: true
  },
  
  DelAppendantNPC: {
    endpoint: '/appendant-npc/delete',
    httpMethod: 'POST',
    params: ['npc_id'],
    auth: true
  },
  
  // ==================== 排行榜扩展（补充）====================
  GetHeroRankByPage: {
    endpoint: '/rank/hero',
    httpMethod: 'GET',
    params: ['page', 'pageSize'],
    auth: true
  },
  
  GetFameRankByPage: {
    endpoint: '/rank/fame',
    httpMethod: 'GET',
    params: ['page', 'pageSize'],
    auth: true
  },
  
  GetFameRankByUserName: {
    endpoint: '/rank/fame-by-user',
    httpMethod: 'GET',
    params: ['username'],
    auth: true
  },
  
  GetFameRankCount: {
    endpoint: '/rank/fame-count',
    httpMethod: 'GET',
    params: [],
    auth: true
  },
  
  GetPrestigeRankByPage: {
    endpoint: '/rank/prestige',
    httpMethod: 'GET',
    params: ['page', 'pageSize'],
    auth: true
  },
  
  GetPrestigeRankByUserName: {
    endpoint: '/rank/prestige-by-user',
    httpMethod: 'GET',
    params: ['username'],
    auth: true
  },
  
  GetPrestigeRankCount: {
    endpoint: '/rank/prestige-count',
    httpMethod: 'GET',
    params: [],
    auth: true
  },
  
  GetInsigniaRankByPage: {
    endpoint: '/rank/insignia',
    httpMethod: 'GET',
    params: ['page', 'pageSize'],
    auth: true
  },
  
  GetInsigniaRankByUserName: {
    endpoint: '/rank/insignia-by-user',
    httpMethod: 'GET',
    params: ['username'],
    auth: true
  },
  
  GetTerritoryRankByPage: {
    endpoint: '/rank/territory',
    httpMethod: 'GET',
    params: ['page', 'pageSize'],
    auth: true
  },
  
  GetTerritoryRankByUserName: {
    endpoint: '/rank/territory-by-user',
    httpMethod: 'GET',
    params: ['username'],
    auth: true
  },
  
  GetUnionRankByPage: {
    endpoint: '/rank/union',
    httpMethod: 'GET',
    params: ['page', 'pageSize'],
    auth: true
  },
  
  GetUnionRankByUnionName: {
    endpoint: '/rank/union-by-name',
    httpMethod: 'GET',
    params: ['union_name'],
    auth: true
  },
  
  GetUserRankByUserName: {
    endpoint: '/rank/user-by-name',
    httpMethod: 'GET',
    params: ['username'],
    auth: true
  },
  
  // ==================== 帮会扩展（补充）====================
  BuyOrgRes: {
    endpoint: '/guild/buy-resource',
    httpMethod: 'POST',
    params: ['resID', 'resNum'],
    auth: true
  },
  
  ContributeRes: {
    endpoint: '/guild/contribute',
    httpMethod: 'POST',
    params: ['guild_id', 'resource_type', 'amount'],
    auth: true
  },
  
  OrganizeUpgrade: {
    endpoint: '/guild/upgrade',
    httpMethod: 'POST',
    params: ['guild_id'],
    auth: true
  },
  
  UpgradeFameLevel: {
    endpoint: '/guild/upgrade-fame',
    httpMethod: 'POST',
    params: [],
    auth: true
  },
  
  UpgradePrestigeLevel: {
    endpoint: '/guild/upgrade-prestige',
    httpMethod: 'POST',
    params: [],
    auth: true
  },
  
  GetUnionNum: {
    endpoint: '/guild/union-count',
    httpMethod: 'GET',
    params: [],
    auth: true
  },
  
  // ==================== 城市扩展（补充）====================
  GetCityNameByPos: {
    endpoint: '/map/city-name',
    httpMethod: 'GET',
    params: ['pos'],
    auth: true
  },
  
  // ==================== 战斗状态（补充）====================
  GetBattleState: {
    endpoint: '/battle/state',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  ChangeBattleState: {
    endpoint: '/battle/change-state',
    httpMethod: 'POST',
    params: ['city_id', 'state'],
    auth: true
  },
  
  ChangeHeroListType: {
    endpoint: '/battle/change-hero-list-type',
    httpMethod: 'POST',
    params: ['cityID', 'heroID', 'listType'],
    auth: true
  },
  
  // ==================== 搜索和访问（补充）====================
  AddSearchEvent: {
    endpoint: '/event/search',
    httpMethod: 'POST',
    params: ['city_id', 'search_type'],
    auth: true
  },
  
  AddVisitEvent: {
    endpoint: '/event/visit',
    httpMethod: 'POST',
    params: ['cityID', 'actionType', 'objType', 'objID', 'pos', 'goldFlag'],
    auth: true
  },
  
  // ==================== VIP 和和平保护（补充）====================
  GetVipSevenDays: {
    endpoint: '/shop/vip-seven-days',
    httpMethod: 'GET',
    params: ['cityID'],
    auth: true
  },
  
  GetVipThirtyDays: {
    endpoint: '/shop/vip-thirty-days',
    httpMethod: 'GET',
    params: ['cityID'],
    auth: true
  },
  
  GetPeaceEightHours: {
    endpoint: '/shop/peace-eight-hours',
    httpMethod: 'GET',
    params: ['cityID'],
    auth: true
  },
  
  GetPeaceTwoDays: {
    endpoint: '/shop/peace-two-days',
    httpMethod: 'GET',
    params: ['cityID'],
    auth: true
  },
  
  GetPeaceSevenDays: {
    endpoint: '/shop/peace-seven-days',
    httpMethod: 'GET',
    params: ['cityID'],
    auth: true
  },
  
  // ==================== 持续效果（补充）====================
  GetPersistEffectGroup: {
    endpoint: '/effect/persist-group',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  GetOverEffectArray: {
    endpoint: '/effect/over-array',
    httpMethod: 'GET',
    params: [],
    auth: true
  },
  
  ProcessOverdueEvent: {
    endpoint: '/effect/process-overdue',
    httpMethod: 'POST',
    params: ['cityID', 'eventID'],
    auth: true
  },
  
  // ==================== 统计和计数（补充）====================
  GetPlayerNum: {
    endpoint: '/game/player-count',
    httpMethod: 'GET',
    params: [],
    auth: false
  },
  
  GetInsPlayerNum: {
    endpoint: '/game/ins-player-count',
    httpMethod: 'GET',
    params: [],
    auth: false
  },
  
  GetTerritoryPlayerNum: {
    endpoint: '/game/territory-player-count',
    httpMethod: 'GET',
    params: [],
    auth: false
  },
  
  GetAccountant: {
    endpoint: '/game/accountant',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  // ==================== 快速移动和依赖（补充）====================
  GetFastMove: {
    endpoint: '/game/fast-move',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  IsDependency: {
    endpoint: '/game/is-dependency',
    httpMethod: 'GET',
    params: ['pos'],
    auth: true
  },
  
  IsStartTime: {
    endpoint: '/game/is-start-time',
    httpMethod: 'GET',
    params: ['pos'],
    auth: false
  },
  
  // ==================== 资源兑换（补充）====================
  ResToGoldRateOfExchange: {
    endpoint: '/shop/res-to-gold-rate',
    httpMethod: 'GET',
    params: ['resource_type'],
    auth: true
  },
  
  // ==================== 管理功能（补充）====================
  KickUser: {
    endpoint: '/admin/kick-user',
    httpMethod: 'POST',
    params: [],
    auth: true
  },
  
  // ==================== 城防相关（补充）====================
  GetDefencePosHero: {
    endpoint: '/defense/pos-hero',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  GetDefenceNpcCorps: {
    endpoint: '/defense/npc-corps',
    httpMethod: 'GET',
    params: ['city_pos'],
    auth: true
  },
  
  // ==================== 地图相关（补充）====================
  GetMapInfoByPos: {
    endpoint: '/map/info-by-pos',
    httpMethod: 'GET',
    params: ['pos'],
    auth: true
  },
  
  // ==================== 物品操作（补充）====================
  TakeItem: {
    endpoint: '/item/equip',
    httpMethod: 'POST',
    params: ['city_id', 'item_id', 'hero_id'],
    auth: true
  },
  
  DebusItem: {
    endpoint: '/item/unequip',
    httpMethod: 'POST',
    params: ['city_id', 'item_id'],
    auth: true
  },
  
  RepairItem: {
    endpoint: '/item/repair',
    httpMethod: 'POST',
    params: ['city_id', 'item_id'],
    auth: true
  },
  
  RepairItemGeneral: {
    endpoint: '/item/repair-general',
    httpMethod: 'POST',
    params: ['city_id', 'item_id'],
    auth: true
  },
  
  DisassembleItem: {
    endpoint: '/item/disassemble',
    httpMethod: 'POST',
    params: ['city_id', 'item_id', 'static_index'],
    auth: true
  },
  
  DonateItem: {
    endpoint: '/item/donate',
    httpMethod: 'POST',
    params: ['city_id', 'item_id'],
    auth: true
  },
  
  UseItemHeroExp: {
    endpoint: '/item/use-hero-exp',
    httpMethod: 'POST',
    params: ['city_id', 'item_id', 'hero_id'],
    auth: true
  },
  
  UseItemInsignia: {
    endpoint: '/item/use-insignia',
    httpMethod: 'POST',
    params: ['city_id', 'item_id'],
    auth: true
  },
  
  UserItemChangeSkill: {
    endpoint: '/item/change-skill',
    httpMethod: 'POST',
    params: ['city_id', 'hero_id', 'item_id'],
    auth: true
  },
  
  UserItemUpSkill: {
    endpoint: '/item/upgrade-skill',
    httpMethod: 'POST',
    params: ['city_id', 'hero_id', 'item_id'],
    auth: true
  },
  
  UserItemSkillEXP: {
    endpoint: '/item/skill-exp',
    httpMethod: 'POST',
    params: ['city_id', 'hero_id', 'item_id'],
    auth: true
  },
  
  UseFeastItem: {
    endpoint: '/item/use-feast',
    httpMethod: 'POST',
    params: ['city_id', 'item_id'],
    auth: true
  },
  
  GetItemName: {
    endpoint: '/item/name',
    httpMethod: 'GET',
    params: ['item_id'],
    auth: true
  },
  
  HeroExpToItem: {
    endpoint: '/hero/exp-to-item',
    httpMethod: 'POST',
    params: ['city_id', 'hero_id', 'item_id'],
    auth: true
  },
  
  // ==================== 英雄相关（补充）====================
  GetHeroBySkillLevel: {
    endpoint: '/hero/by-skill-level',
    httpMethod: 'GET',
    params: ['city_id', 'skill_level'],
    auth: true
  },
  
  GetPerSistEffectFlags: {
    endpoint: '/hero/persist-effect-flags',
    httpMethod: 'GET',
    params: ['username'],
    auth: true
  },
  
  // ==================== 任务相关（补充）====================
  DeleteTask: {
    endpoint: '/task/delete',
    httpMethod: 'POST',
    params: ['task_id'],
    auth: true
  },
  
  GetOtherTaskSimple: {
    endpoint: '/task/other/simple',
    httpMethod: 'GET',
    params: ['city_id', 'task_type'],
    auth: true
  },
  
  GetHeChengTaskSimple: {
    endpoint: '/task/compose/simple',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  GetFeastDayMissionSimple: {
    endpoint: '/task/feast/simple',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  GetResExchangeMissionSimple: {
    endpoint: '/task/res-exchange/simple',
    httpMethod: 'GET',
    params: ['city_id'],
    auth: true
  },
  
  GetOtherTaskByType: {
    endpoint: '/task/other/by-type',
    httpMethod: 'GET',
    params: ['city_id', 'task_type', 'sub_type'],
    auth: true
  },
  
  GetHeChengTaskByType: {
    endpoint: '/task/compose/by-type',
    httpMethod: 'GET',
    params: ['city_id', 'sub_type'],
    auth: true
  },
  
  GetFeastDayMissionByType: {
    endpoint: '/task/feast/by-type',
    httpMethod: 'GET',
    params: ['city_id', 'sub_type'],
    auth: true
  },
  
  GetResExchangeMissionByType: {
    endpoint: '/task/res-exchange/by-type',
    httpMethod: 'GET',
    params: ['city_id', 'sub_type'],
    auth: true
  },
  
  GetComposeTaskNums: {
    endpoint: '/task/compose/count',
    httpMethod: 'GET',
    params: ['city_id', 'task_type'],
    auth: true
  },
  
  AddComposeTaskEvent: {
    endpoint: '/task/compose/start',
    httpMethod: 'POST',
    params: ['city_id'],
    auth: true
  },
  
  QuickGetComposeTask: {
    endpoint: '/task/compose/quick-get',
    httpMethod: 'POST',
    params: ['city_id'],
    auth: true
  },
  
  GetHeChengGoods: {
    endpoint: '/task/compose/reward',
    httpMethod: 'POST',
    params: ['city_id', 'task_id'],
    auth: true
  },
  
  FeastDayMissionPrize: {
    endpoint: '/task/feast/reward',
    httpMethod: 'POST',
    params: ['city_id', 'task_id'],
    auth: true
  },
  
  ResExchangeMissionPrize: {
    endpoint: '/task/res-exchange/reward',
    httpMethod: 'POST',
    params: ['city_id', 'task_id'],
    auth: true
  },
  
  GetOtherTaskGoods: {
    endpoint: '/task/other/reward',
    httpMethod: 'POST',
    params: ['city_id', 'task_id'],
    auth: true
  },
  
  ResExchangeMissionPrizeByNum: {
    endpoint: '/task/res-exchange/reward-by-num',
    httpMethod: 'POST',
    params: ['city_id', 'task_id', 'num'],
    auth: true
  },
  
  // ==================== 邮件相关（补充）====================
  AddnewMail: {
    endpoint: '/mail/send',
    httpMethod: 'POST',
    params: ['to_user', 'title', 'content', 'mail_type'],
    auth: true
  },
  
  GetNameState: {
    endpoint: '/game/user/name-state',
    httpMethod: 'GET',
    params: ['username'],
    auth: true
  },
  
  // ==================== 市场相关（补充）====================
  GetSellItemNumByItemName: {
    endpoint: '/market/count-by-name',
    httpMethod: 'GET',
    params: ['item_type', 'item_name'],
    auth: true
  },
  
  GetSellItemByItemName: {
    endpoint: '/market/items-by-name',
    httpMethod: 'GET',
    params: ['item_type', 'page', 'item_name', 'order_by', 'order_type'],
    auth: true
  },
  
  UpdateBackImage: {
    endpoint: '/game/city/background',
    httpMethod: 'POST',
    params: ['city_id', 'image_index'],
    auth: true
  },
  
  // ==================== 商城相关（补充）====================
  GetCommoditysByType: {
    endpoint: '/shop/items-by-type',
    httpMethod: 'GET',
    params: ['city_id', 'commodity_type'],
    auth: true
  },
  
  UpdatePersistEffectByType: {
    endpoint: '/shop/persist-effect',
    httpMethod: 'POST',
    params: ['city_id', 'main_type', 'effect_type'],
    auth: true
  },
  
  GoldBuyRes: {
    endpoint: '/shop/gold-buy-resource',
    httpMethod: 'POST',
    params: ['city_id', 'resource_type', 'gold_amount'],
    auth: true
  },
  
  // ==================== 系统相关（补充）====================
  Exit: {
    endpoint: '/game/logout',
    httpMethod: 'POST',
    params: [],
    auth: true
  },
  
  ForceEffectOverdue: {
    endpoint: '/game/force-effect-overdue',
    httpMethod: 'POST',
    params: ['city_id', 'main_type'],
    auth: true
  },
  
  ForceNewUserOverdue: {
    endpoint: '/game/force-newuser-overdue',
    httpMethod: 'POST',
    params: [],
    auth: true
  },
  
  UpdateBrief: {
    endpoint: '/game/city/brief',
    httpMethod: 'POST',
    params: ['city_id', 'pos', 'brief'],
    auth: true
  },
  
  DeleteOccupationInfo: {
    endpoint: '/game/city/delete-occupation',
    httpMethod: 'POST',
    params: ['city_id', 'pos', 'flag'],
    auth: true
  }
};

console.log('✅ API 配置已加载，共', Object.keys(window.API_MAPPING).length, '个接口');
