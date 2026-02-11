/**
 * API 配置文件 - 配置驱动的 API 映射
 * 
 * 格式说明：
 * - method: 前端调用的方法名（Main.XXX）
 * - endpoint: 后端 API 端点
 * - httpMethod: HTTP 方法 (GET/POST/PUT/DELETE)
 * - params: 参数映射配置
 *   - 数组: 按顺序映射参数 ['city_id', 'map_type', 'pos']
 *   - 对象: 自定义参数转换 { cityId: 'city_id' }
 * - auth: 是否需要认证 (默认 true)
 * - mock: 开发模式下的 mock 数据（可选）
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
    endpoint: '/interior/info',
    httpMethod: 'GET',
    params: ['city_id'],
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
    params: ['city_id', 'building_type', 'pos', 'action_type'],
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
    params: ['city_id', 'hero_id', 'building_id'],
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
    params: ['city_id', 'hero_id', 'action_type'],
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
    params: ['to_user', 'subject', 'content'],
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
    params: ['city_id', 'item_id', 'hero_id'],
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
    params: ['city_id', 'item_id'],
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
    params: ['city_id', 'commodity_id', 'quantity'],
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
    params: ['page'],
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
    params: ['name', 'intro'],
    auth: true
  },
  
  ApplyJoinUnion: {
    endpoint: '/guild/apply',
    httpMethod: 'POST',
    params: ['guild_id'],
    auth: true
  },
  
  QuitOrganize: {
    endpoint: '/guild/quit',
    httpMethod: 'POST',
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
  }
};

console.log('✅ API 配置已加载，共', Object.keys(window.API_MAPPING).length, '个接口');
