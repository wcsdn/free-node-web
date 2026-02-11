/**
 * API 适配器 - 将原始的 Main.* 调用转换为 Workers API 调用
 * 使用钱包地址作为用户标识
 */

// 全局变量 - 从 iframe 父窗口接收
window.walletAddress = null;
window.authHeader = null;

// 监听来自父窗口的认证信息
window.addEventListener('message', function(event) {
  if (event.data.type === 'AUTH_INFO') {
    window.walletAddress = event.data.walletAddress;
    window.authHeader = event.data.authHeader;
    console.log('✅ 收到认证信息:', window.walletAddress);
    
    // 认证信息到达后,初始化游戏
    if (typeof InitGame === 'function') {
      InitGame();
    }
  }
});

// API 基础配置
const API_CONFIG = {
  baseURL: window.API_BASE_URL || 'http://localhost:8788',
  timeout: 30000
};

/**
 * 通用 API 请求函数
 */
function apiRequest(endpoint, data, callback) {
  // 确保有钱包地址
  if (!window.walletAddress) {
    console.error('❌ 未连接钱包');
    if (callback) callback({ success: false, message: '请先连接钱包' });
    return;
  }

  // 添加钱包地址到请求数据
  const requestData = {
    ...data,
    wallet_address: window.walletAddress
  };

  // 构建完整 URL
  const url = window.getApiUrl ? window.getApiUrl(endpoint) : (API_CONFIG.baseURL + '/api' + endpoint);

  // 发送请求
  $.ajax({
    url: url,
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(requestData),
    headers: window.authHeader ? { 'Authorization': window.authHeader } : {},
    timeout: API_CONFIG.timeout,
    success: function(response) {
      if (callback) {
        // 兼容原始回调格式
        callback(response.data || response);
      }
    },
    error: function(xhr, status, error) {
      console.error('❌ API 请求失败:', endpoint, error);
      if (callback) {
        callback({ 
          success: false, 
          message: xhr.responseJSON?.message || '请求失败' 
        });
      }
    }
  });
}

/**
 * Main 对象 - 模拟原始的 ASP.NET WebService 调用
 */
window.Main = {
  /**
   * 获取用户信息
   */
  GetUserInfo: function(callback) {
    apiRequest('/game/user-info', {}, callback);
  },

  /**
   * 获取服务器信息
   */
  GetServerInfo: function(callback) {
    apiRequest('/game/server-info', {}, callback);
  },

  /**
   * 获取服务器当前时间
   */
  GetServerTimeNow: function(callback) {
    apiRequest('/game/server-time', {}, callback);
  },

  /**
   * 更新用户在线状态
   */
  UpdateUserOnline: function(callback) {
    apiRequest('/game/update-online', {}, callback);
  },

  /**
   * 获取地图单元信息
   * @param {number} cityId - 城市ID
   * @param {number} mapType - 地图类型 (1:内政, 2:城防, 3:大地图)
   * @param {number} pos - 位置
   */
  GetMapUnitInfo: function(cityId, mapType, pos, callback) {
    apiRequest('/game/map-unit-info', { 
      city_id: cityId, 
      map_type: mapType, 
      pos: pos 
    }, callback);
  },

  /**
   * 获取城市内政信息
   */
  GetCityInteriorInfo: function(cityId, callback) {
    apiRequest('/game/city/interior/' + cityId, {}, callback);
  },

  /**
   * 获取建筑信息 (通过位置)
   */
  GetBuildingByPos: function(cityId, mapType, pos, callback) {
    apiRequest('/game/building/by-pos', {
      city_id: cityId,
      map_type: mapType,
      pos: pos
    }, callback);
  },

  /**
   * 获取建筑信息 (通过ID)
   */
  GetBuildingByID: function(cityId, mapType, buildingId, callback) {
    apiRequest('/game/building/' + buildingId, {
      city_id: cityId,
      map_type: mapType
    }, callback);
  },

  /**
   * 获取城市军团状态
   */
  GetCityCropsState: function(cityId, callback) {
    apiRequest('/game/city/corps-state/' + cityId, {}, callback);
  },

  /**
   * 获取城市英雄列表
   */
  GetCityHero: function(cityId, callback) {
    apiRequest('/game/city/heroes/' + cityId, {}, callback);
  },

  /**
   * 获取英雄信息 (通过ID)
   */
  GetHeroByID: function(cityId, heroId, callback) {
    apiRequest('/game/hero/' + heroId, {
      city_id: cityId
    }, callback);
  },

  /**
   * 获取城防数量
   */
  GetDefenceNum: function(cityId, callback) {
    apiRequest('/game/city/defence-num/' + cityId, {}, callback);
  },

  /**
   * 获取城防地形
   */
  GetDefenceLandform: function(cityId, callback) {
    apiRequest('/game/city/defence-landform/' + cityId, {}, callback);
  },

  /**
   * 获取大地图地形
   */
  GetWorldLandform: function(cityId, pos, callback) {
    apiRequest('/game/world/landform', {
      city_id: cityId,
      pos: pos
    }, callback);
  },

  /**
   * 获取有效事件
   */
  GetValidEvent: function(cityId, callback) {
    apiRequest('/game/city/events/' + cityId, {}, callback);
  },

  /**
   * 添加军团事件
   */
  AddCorpsEvent: function(cityId, actionType, corpsId, targetId, targetPos, callback) {
    apiRequest('/game/corps/add-event', {
      city_id: cityId,
      action_type: actionType,
      corps_id: corpsId,
      target_id: targetId,
      target_pos: targetPos
    }, callback);
  },

  /**
   * 召回军团
   */
  CallCorpsBack: function(cityId, callback) {
    apiRequest('/game/corps/call-back', {
      city_id: cityId
    }, callback);
  },

  /**
   * 获取世界位置状态
   */
  GetWorldPosState: function(cityId, pos, callback) {
    apiRequest('/game/world/pos-state', {
      city_id: cityId,
      pos: pos
    }, callback);
  },

  /**
   * 获取棋盘位置
   */
  GetChessboardPos: function(cityId, chessType, callback) {
    apiRequest('/game/chess/board-pos', {
      city_id: cityId,
      chess_type: chessType
    }, callback);
  },

  /**
   * 获取新邮件数量
   */
  GetNewMailNum: function(callback) {
    apiRequest('/game/mail/new-count', {}, callback);
  },

  /**
   * 获取邮件列表
   */
  GetMailList: function(page, pageSize, callback) {
    apiRequest('/game/mail/list', {
      page: page || 1,
      page_size: pageSize || 20
    }, callback);
  },

  /**
   * 获取任务列表
   */
  GetTaskList: function(cityId, callback) {
    apiRequest('/game/task/list', {
      city_id: cityId
    }, callback);
  },

  /**
   * 获取市场信息
   */
  GetMarketInfo: function(cityId, callback) {
    apiRequest('/game/market/info', {
      city_id: cityId
    }, callback);
  },

  /**
   * 获取商城信息
   */
  GetMallInfo: function(callback) {
    apiRequest('/game/mall/info', {}, callback);
  },

  /**
   * 获取排行榜
   */
  GetRankList: function(rankType, page, pageSize, callback) {
    apiRequest('/game/rank/list', {
      rank_type: rankType,
      page: page || 1,
      page_size: pageSize || 20
    }, callback);
  },

  /**
   * 获取竞技场信息
   */
  GetArena: function(pos, callback) {
    apiRequest('/game/arena/info', {
      pos: pos
    }, callback);
  },

  /**
   * 获取竞技场时间
   */
  GetArenaTimes: function() {
    // 返回固定时间段
    return { value: [9, 21] }; // 9:00-21:00
  },

  /**
   * 获取聊天消息
   */
  GetserverChatWords: function(lastId, callback) {
    apiRequest('/game/chat/messages', {
      last_id: lastId || 0
    }, callback);
  },

  /**
   * 发送聊天消息
   */
  SendChatMessage: function(message, callback) {
    apiRequest('/game/chat/send', {
      message: message
    }, callback);
  }
};

console.log('✅ API 适配器已加载');
