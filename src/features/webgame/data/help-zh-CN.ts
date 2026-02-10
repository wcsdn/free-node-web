/**
 * 静态帮助页面 - JSON 数据
 * 用于 HelpPanel 组件的静态资源模式
 */

export interface HelpCategory {
  id: string;
  name: string;
  icon: string;
  articles: HelpArticle[];
}

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  keywords: string[];
}

// 中文帮助文档数据
export const helpData: HelpCategory[] = [
  {
    id: 'tyro',
    name: '新手手册',
    icon: '📖',
    articles: [
      {
        id: 'intro',
        title: '游戏介绍',
        content: `剑侠情缘是一款以武侠题材为背景的网页游戏，玩家扮演一位江湖侠客，通过建设城市、招募侠客、提升实力，最终成为一代大侠。

游戏特色：
- 武侠题材，还原经典江湖
- 城市建设，发展属于自己的门派
- 侠客招募，培养最强阵容
- 实时战斗，策略制胜
- 帮派系统，兄弟结义`,
        keywords: ['新手', '介绍', '入门'],
      },
      {
        id: 'login',
        title: '游戏登录',
        content: `游戏采用钱包地址登录方式：
1. 连接你的钱包（如 MetaMask）
2. 首次登录自动创建角色
3. 体验完整游戏功能

支持的钱包：
- MetaMask
- Coinbase Wallet
- WalletConnect`,
        keywords: ['登录', '钱包', 'MetaMask'],
      },
    ],
  },
  {
    id: 'interior',
    name: '内政建设',
    icon: '🏗️',
    articles: [
      {
        id: 'buildings',
        title: '建筑系统',
        content: `内政建设是城市发展的基础，合理搭配建筑可以最大化发展效率。

主要建筑：
- 聚义厅：帮会建筑，等级决定帮会规模
- 义舍：增加人口上限
- 钱庄：影响金钱产量
- 民居：影响税收收入
- 农场：影响粮食产量
- 演武场：提升武将经验

建筑升级需要消耗资源，合理规划发展路线。`,
        keywords: ['建筑', '升级', '内政'],
      },
      {
        id: 'tech',
        title: '科技系统',
        content: `科技可以大幅提升城市能力，通过消耗资源研究科技。

主要科技：
- 移山填海：提升资源产量
- 招贤纳士：提升招募质量
- 厉兵秣马：提升战斗经验
- 城防科技：提升防御能力

科技研究需要相应等级的工匠坊支持。`,
        keywords: ['科技', '研究', '升级'],
      },
    ],
  },
  {
    id: 'hero',
    name: '侠客系统',
    icon: '🦸',
    articles: [
      {
        id: 'recruit',
        title: '侠客招募',
        content: `侠客是战斗的核心战力，通过招募获取强力侠客。

招募方式：
1. 普通招募：消耗金币，获得蓝色品质侠客
2. 高级招募：消耗元宝，获得紫色/橙色侠客
3. 限时招募：特定活动期间开放

侠客品质：白 < 绿 < 蓝 < 紫 < 橙 < 红`,
        keywords: ['侠客', '招募', '品质'],
      },
      {
        id: 'train',
        title: '侠客培养',
        content: `侠客培养包括以下方式：

1. 升级：使用经验道具提升等级
2. 突破：消耗相同侠客提升品阶
3. 技能：学习强力技能
4. 装备：穿戴装备提升属性

注意培养资源有限，优先培养核心侠客。`,
        keywords: ['侠客', '培养', '升级', '突破'],
      },
    ],
  },
  {
    id: 'battle',
    name: '战斗系统',
    icon: '⚔️',
    articles: [
      {
        id: 'pve',
        title: 'PVE 战斗',
        content: `PVE 战斗包括：
- 讨伐 NPC：占领资源据点
- 副本挑战：获取装备和材料
- 世界boss：全服共同挑战

战斗策略：
- 合理搭配侠客阵容
- 注意兵种相克
- 活用技能时机`,
        keywords: ['战斗', 'PVE', '副本', 'NPC'],
      },
      {
        id: 'pvp',
        title: 'PVP 竞技',
        content: `PVP 竞技场是检验实力的最佳场所：

- 每日免费挑战次数
- 挑战排名更高的玩家
- 胜利获得积分和奖励
- 赛季排名结算奖励

竞技场技巧：
- 观察对手阵容进行克制
- 合理使用暂停功能
- 保持良好胜率`,
        keywords: ['竞技场', 'PVP', '排名'],
      },
    ],
  },
  {
    id: 'item',
    name: '物品道具',
    icon: '🎒',
    articles: [
      {
        id: 'equipment',
        title: '装备系统',
        content: `装备分为以下类型：
- 武器：提升攻击力
- 防具：提升防御力
- 首饰：提供特殊属性

装备品质：白 < 绿 < 蓝 < 紫 < 橙 < 红
高级装备可通过副本掉落或锻造获得。`,
        keywords: ['装备', '武器', '防具', '首饰'],
      },
      {
        id: 'consumable',
        title: '消耗品',
        content: `常用消耗品：
- 经验道具：快速升级
- 恢复药剂：战斗恢复
- 增益药剂：临时提升属性
- 召唤道具：招募侠客

合理使用消耗品可以大幅提升游戏体验。`,
        keywords: ['消耗品', '道具', '使用'],
      },
    ],
  },
  {
    id: 'guild',
    name: '帮派系统',
    icon: '🏯',
    articles: [
      {
        id: 'create',
        title: '创建帮派',
        content: `创建帮派需要满足：
- 城市等级达到8级
- 消耗一定资源
- 帮派名称符合规范

帮派成员职位：
- 帮主：最高权限
- 副帮主：辅助管理
- 长老：协助管理
- 帮众：普通成员`,
        keywords: ['帮派', '创建', '成员'],
      },
      {
        id: 'benefits',
        title: '帮派福利',
        content: `加入帮派可享受以下福利：
- 帮派技能加成
- 专属任务奖励
- 帮派仓库存储
- 聊天频道交流

积极参与帮派活动可获得更多资源。`,
        keywords: ['帮派', '福利', '技能'],
      },
    ],
  },
  {
    id: 'defense',
    name: '城防系统',
    icon: '🛡️',
    articles: [
      {
        id: 'defense_building',
        title: '防御建筑',
        content: `防御建筑是保护城市的重要设施：

- 城墙：阻挡敌人前进
- 护城河：使敌人停滞
- 陷阱：对敌人造成伤害
- 滚木：直线范围伤害
- 礌石：周围范围伤害
- 箭塔：主动攻击敌人

合理搭配防御设施可以有效抵御进攻。`,
        keywords: ['城防', '防御', '建筑'],
      },
    ],
  },
  {
    id: 'map',
    name: '大地图',
    icon: '🗺️',
    articles: [
      {
        id: 'map_type',
        title: '地图区域',
        content: `大地图包含以下区域：

- 玩家城市：玩家自己的城市
- NPC据点：可占领获取资源
- 历史名城：高级挑战区域
- 荒野区域：资源采集点

点击地图上的据点可查看详情并进行挑战。`,
        keywords: ['地图', 'NPC', '占领'],
      },
    ],
  },
  {
    id: 'gift',
    name: '礼包兑换',
    icon: '🎁',
    articles: [
      {
        id: 'redeem',
        title: 'CDK 兑换',
        content: `礼包兑换功能使用激活码领取丰厚奖励：

兑换方式：
1. 进入礼品领取页面
2. 输入激活码
3. 点击兑换按钮
4. 奖励自动发放到背包

常见礼包码：
- 新手礼包：首次登录获得
- 推广礼包：邀请好友获得
- 活动礼包：参与活动获得

注意：每个激活码只能使用一次。`,
        keywords: ['礼包', '激活码', '兑换', 'CDK'],
      },
    ],
  },
];

// 获取所有帮助文章
export function getAllArticles(): HelpArticle[] {
  const articles: HelpArticle[] = [];
  for (const category of helpData) {
    articles.push(...category.articles);
  }
  return articles;
}

// 按关键词搜索
export function searchArticles(keyword: string): HelpArticle[] {
  const lowerKeyword = keyword.toLowerCase();
  return getAllArticles().filter(
    (article) =>
      article.title.toLowerCase().includes(lowerKeyword) ||
      article.content.toLowerCase().includes(lowerKeyword) ||
      article.keywords.some((k) => k.toLowerCase().includes(lowerKeyword))
  );
}

// 获取分类
export function getCategory(id: string): HelpCategory | undefined {
  return helpData.find((c) => c.id === id);
}

// 获取文章
export function getArticle(categoryId: string, articleId: string): HelpArticle | undefined {
  const category = getCategory(categoryId);
  return category?.articles.find((a) => a.id === articleId);
}
