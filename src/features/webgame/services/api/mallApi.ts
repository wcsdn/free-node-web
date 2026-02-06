/**
 * 商城 API 服务
 * 基于原项目 Mall.js 逻辑
 */
import { getApiBase, getAuthHeaders } from '../../utils/api';

// 商城商品类型
export type MallItemType =
  | 1  // 热销
  | 2  // 建筑类 (未开放)
  | 3  // 科技类 (未开放)
  | 4  // 侠客类
  | 5  // 军事类
  | 6  // 道具类
  | 7  // 资源类
  | 8  // 其它类

// 商城商品数据结构 (参考原项目 MallItemInfo)
export interface MallItem {
  Id: number;          // 商品ID
  Type: number;         // 类型 (参考 MallItemType)
  TypeName: string;     // 类型名称
  Name: string;        // 商品名称
  Image: string;       // 图片路径
  Gold: number;        // 价格 (元宝)
  BuyType: number;     // 购买类型: 1=道具, 2=状态, 3=资源购买(粮食), 4=资源购买(银两), 5=资源购买(人口)
  UseType: number;     // 使用类型: 1=可购买
  IsUsed: number;      // 是否已使用: 0=未使用, 1=已使用
  Index?: number;      // 索引
  Desc?: string;       // 描述
  Limit?: number;      // 购买限制
}

// 商城物品类型配置
export const MALL_ITEM_TYPES: Record<number, { id: number; name: string; key: string }> = {
  1: { id: 1, name: '热销', key: 'hot' },
  4: { id: 4, name: '侠客', key: 'hero' },
  5: { id: 5, name: '军事', key: 'military' },
  6: { id: 6, name: '道具', key: 'item' },
  7: { id: 7, name: '资源', key: 'resource' },
  8: { id: 8, name: '其它', key: 'other' },
};

// 商城响应
export interface MallListResponse {
  success: boolean;
  data: MallItem[];
  message?: string;
}

// 购买请求
export interface BuyRequest {
  itemId: number;
  buyType: number;
  count?: number;
}

// 购买响应
export interface BuyResponse {
  success: boolean;
  message?: string;
  data?: {
    itemId: number;
    count: number;
    cost: number;
  };
}

// 商城 API
export const mallApi = {
  /**
   * 获取商城物品列表
   */
  async getItems(type: MallItemType = 1): Promise<MallListResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/shop/list?type=${type}`, {  // ⚠️ 修正: 后端路由是 /api/shop/*
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to fetch mall items:', err);
      return getMockItems(type);
    }
  },

  /**
   * 购买商品
   */
  async buy(request: BuyRequest): Promise<BuyResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/shop/buy`, {  // ⚠️ 修正: 后端路由是 /api/shop/*
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ shop_id: request.itemId, count: request.count }),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to buy item:', err);
      return { success: false, message: '购买失败' };
    }
  },

  /**
   * 购买资源 (快速购买粮食/银两/人口)
   */
  async buyResource(
    resourceType: 'food' | 'money' | 'men',
    amount: number
  ): Promise<BuyResponse> {
    const buyTypeMap = {
      food: 3,  // BuyType=3: 粮食购买
      money: 4, // BuyType=4: 银两购买
      men: 5,   // BuyType=5: 人口购买
    };

    return this.buy({
      itemId: 0, // 资源购买不需要特定商品ID
      buyType: buyTypeMap[resourceType],
      count: amount,
    });
  },
};

// 模拟商城数据 (基于原项目 Mall.js 逻辑)
function getMockItems(type: MallItemType): MallListResponse {
  const mockItems: MallItem[] = [];

  switch (type) {
    case 1: // 热销
      mockItems.push(
        { Id: 101, Type: 1, TypeName: '热销', Name: 'VIP体验卡', Image: '/img/2/1.gif', Gold: 100, BuyType: 1, UseType: 1, IsUsed: 0, Desc: 'VIP体验3天', Limit: 1 },
        { Id: 102, Type: 1, TypeName: '热销', Name: '体力恢复药水', Image: '/img/2/2.gif', Gold: 50, BuyType: 1, UseType: 1, IsUsed: 0, Desc: '恢复100点体力', Limit: 0 },
        { Id: 103, Type: 1, TypeName: '热销', Name: '加速卡', Image: '/img/2/3.gif', Gold: 30, BuyType: 2, UseType: 1, IsUsed: 0, Desc: '建造加速30分钟', Limit: 0 },
      );
      break;
    case 4: // 侠客类
      mockItems.push(
        { Id: 401, Type: 4, TypeName: '侠客', Name: '高级武功', Image: '/img/2/4.gif', Gold: 500, BuyType: 1, UseType: 1, IsUsed: 0, Desc: '提升武力值+10' },
        { Id: 402, Type: 4, TypeName: '侠客', Name: '护体神功', Image: '/img/2/5.gif', Gold: 800, BuyType: 1, UseType: 1, IsUsed: 0, Desc: '增加防御力+10' },
        { Id: 403, Type: 4, TypeName: '侠客', Name: '内功心法', Image: '/img/2/6.gif', Gold: 300, BuyType: 1, UseType: 1, IsUsed: 0, Desc: '增加内力+50' },
      );
      break;
    case 5: // 军事类
      mockItems.push(
        { Id: 501, Type: 5, TypeName: '军事', Name: '增援令', Image: '/img/2/7.gif', Gold: 200, BuyType: 1, UseType: 1, IsUsed: 0, Desc: '增加带兵数+10' },
        { Id: 502, Type: 5, TypeName: '军事', Name: '训练加速', Image: '/img/2/8.gif', Gold: 150, BuyType: 2, UseType: 1, IsUsed: 0, Desc: '训练加速1小时' },
        { Id: 503, Type: 5, TypeName: '军事', Name: '军粮', Image: '/img/2/9.gif', Gold: 100, BuyType: 1, UseType: 1, IsUsed: 0, Desc: '行军粮食+1000' },
      );
      break;
    case 6: // 道具类
      mockItems.push(
        { Id: 601, Type: 6, TypeName: '道具', Name: '随机传送符', Image: '/img/2/10.gif', Gold: 50, BuyType: 1, UseType: 1, IsUsed: 0, Desc: '随机传送到任意地点' },
        { Id: 602, Type: 6, TypeName: '道具', Name: '隐身符', Image: '/img/2/11.gif', Gold: 80, BuyType: 2, UseType: 1, IsUsed: 0, Desc: '隐身30分钟' },
        { Id: 603, Type: 6, TypeName: '道具', Name: '复活丹', Image: '/img/2/12.gif', Gold: 200, BuyType: 1, UseType: 1, IsUsed: 0, Desc: '复活战死的武将' },
      );
      break;
    case 7: // 资源类
      mockItems.push(
        { Id: 701, Type: 7, TypeName: '资源', Name: '粮食袋', Image: '/img/2/13.gif', Gold: 10, BuyType: 3, UseType: 0, IsUsed: 0, Desc: '获得10000粮食' },
        { Id: 702, Type: 7, TypeName: '资源', Name: '银两箱', Image: '/img/2/14.gif', Gold: 10, BuyType: 4, UseType: 0, IsUsed: 0, Desc: '获得10000银两' },
        { Id: 703, Type: 7, TypeName: '资源', Name: '招募令', Image: '/img/2/15.gif', Gold: 10, BuyType: 5, UseType: 0, IsUsed: 0, Desc: '获得100人口' },
      );
      break;
    case 8: // 其它
      mockItems.push(
        { Id: 801, Type: 8, TypeName: '其它', Name: '改名卡', Image: '/img/2/16.gif', Gold: 500, BuyType: 1, UseType: 1, IsUsed: 0, Desc: '修改角色名称' },
        { Id: 802, Type: 8, TypeName: '其它', Name: '头像框', Image: '/img/2/17.gif', Gold: 100, BuyType: 1, UseType: 1, IsUsed: 0, Desc: '30天头像装饰' },
      );
      break;
  }

  return { success: true, data: mockItems };
}

// 导出默认 API
export default mallApi;
