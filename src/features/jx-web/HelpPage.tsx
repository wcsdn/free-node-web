/**
 * 剑侠情缘 Web - 移动端帮助页面
 * 移动端友好的游戏帮助系统，支持 Tab 切换和折叠展开
 */
import React, { useState } from 'react';
import './HelpPage.css';

// ============== 帮助内容数据 ==============

// 建筑数据
const buildings = [
  { name: '聚义厅', icon: '🏛️', requires: '无', desc: '扩展村镇规模的前提，缩短建筑物的建造时间' },
  { name: '义舍', icon: '🏠', requires: '聚义厅1级', desc: '招集人员的建筑，更快招集村中人员' },
  { name: '农场', icon: '🌾', requires: '聚义厅1级', desc: '粮食的主要产地' },
  { name: '钱庄', icon: '💰', requires: '聚义厅1级', desc: '铜钱的主要来源' },
  { name: '民居', icon: '🏡', requires: '义舍1级', desc: '人员居住的场所，供更多人居住' },
  { name: '粮仓', icon: '🛒', requires: '农场1级', desc: '储存粮食的场所' },
  { name: '账房', icon: '📒', requires: '钱庄1级', desc: '管理铜钱的场所，储存更多铜钱' },
  { name: '密库', icon: '🔐', requires: '聚义厅4级', desc: '储藏资源，敌人掠夺时无法掠夺密库中的资源' },
  { name: '工匠坊', icon: '⚒️', requires: '聚义厅3级', desc: '研究城防武器及建筑的场所' },
  { name: '营造司', icon: '📐', requires: '聚义厅4级', desc: '研究城市发展相关科技' },
  { name: '演武场', icon: '⚔️', requires: '聚义厅5级', desc: '研究军事科技的建筑' },
];

// 门派建筑数据
const factionBuildings = [
  { name: '天王号令台', icon: '👑', element: '金', desc: '招募天王帮侠客' },
  { name: '少林大雄宝殿', icon: '⛩️', element: '金', desc: '招募少林寺侠客' },
  { name: '唐门神机房', icon: '🎯', element: '木', desc: '招募唐门侠客' },
  { name: '五毒冰蟾宫', icon: '🐍', element: '木', desc: '招募五毒派侠客' },
  { name: '峨嵋清音阁', icon: '🌸', element: '水', desc: '招募峨嵋派侠客' },
  { name: '翠烟楼', icon: '🌺', element: '水', desc: '招募翠烟门侠客' },
  { name: '天忍圣坛', icon: '🔥', element: '火', desc: '招募天忍教侠客' },
  { name: '丐帮忠义堂', icon: '🍶', element: '火', desc: '招募丐帮侠客' },
  { name: '武当灵霄宫', icon: '☯️', element: '土', desc: '招募武当派侠客' },
  { name: '昆仑三圣堂', icon: '❄️', element: '土', desc: '招募昆仑派侠客' },
];

// 科技数据
const technologies = [
  { name: '移山填海', icon: '⛰️', desc: '提高村镇面积上限', building: '营造司' },
  { name: '土木技术', icon: '🏗️', desc: '提升聚义厅级别上限', building: '营造司' },
  { name: '招贤纳士', icon: '👥', desc: '提高可雇佣侠客数量上限', building: '营造司' },
  { name: '计量技术', icon: '📊', desc: '提高城防建筑数量上限', building: '工匠坊' },
  { name: '城墙升级', icon: '🧱', desc: '增加城墙耐久度', building: '工匠坊' },
  { name: '箭塔升级', icon: '🏹', desc: '增加箭塔攻击力', building: '工匠坊' },
  { name: '陷阱升级', icon: '⚠️', desc: '增加陷阱伤害值', building: '工匠坊' },
  { name: '滚木升级', icon: '🪵', desc: '增加滚木伤害值', building: '工匠坊' },
  { name: '礌石升级', icon: '🪨', desc: '增加礌石伤害值', building: '工匠坊' },
  { name: '厉兵秣马', icon: '🐴', desc: '缩短侠客招募弟子时间', building: '演武场' },
  { name: '犒劳三军', icon: '🎖️', desc: '增加侠客训练弟子效果', building: '演武场' },
  { name: '枕戈待旦', icon: '⏰', desc: '缩短侠客训练弟子时间', building: '演武场' },
];

// 城防数据
const defenses = [
  { name: '城墙', icon: '🧱', attack: '1-3', durability: '4-12', desc: '阻挡敌人前进，高级更坚固' },
  { name: '护城河', icon: '🌊', attack: '-', durability: '10', desc: '敌人进入后停止行动一回合' },
  { name: '陷阱', icon: '⚠️', attack: '2-10', durability: '1-3', desc: '对同格内敌人造成严重伤害' },
  { name: '滚木', icon: '🪵', attack: '2-9', durability: '1-4', desc: '对前方直线四格内敌人造成伤害' },
  { name: '礌石', icon: '🪨', attack: '2-8', durability: '1-5', desc: '对周围四格内所有敌人造成伤害' },
  { name: '箭塔', icon: '🏹', attack: '1-6', durability: '1-6', desc: '阻挡敌人并主动攻击周围四格' },
];

// 门派数据
const factions = [
  { name: '天王帮', icon: '👑', element: '金', gender: '男', desc: '南抗赵宋，北抵金兵，杨幺创建', skills: ['刀天王', '锤天王', '枪天王', '金钟罩'] },
  { name: '少林派', icon: '⛩️', element: '金', gender: '男', desc: '中国佛教禅宗圣地，跋陀创建', skills: ['拳少林', '棍少林', '刀少林', '易筋经', '如来千叶'] },
  { name: '唐门', icon: '🎯', element: '木', gender: '男女', desc: '饮誉武林的暗器家族，以暗器和火器雄踞蜀中', skills: ['飞刀', '飞镖', '箭弩', '地焰火'] },
  { name: '五毒教', icon: '🐍', element: '木', gender: '男女', desc: '近年来新兴教派，组织严密', skills: ['掌五毒', '刀五毒', '九天狂雷', '赤炎蚀天'] },
  { name: '峨嵋派', icon: '🌸', element: '水', gender: '女', desc: '女子所创武林门派，入佛门', skills: ['气宗', '剑宗', '普渡众生', '梦蝶'] },
  { name: '翠烟门', icon: '🌺', element: '水', gender: '女', desc: '云南神秘门派，女侠所创', skills: ['单刀', '双刀', '冰骨雪心', '冰心倩影'] },
  { name: '天忍教', icon: '🔥', element: '火', gender: '男女', desc: '金国创建的对付宋国武林的组织', skills: ['矛天忍', '刀天忍', '火莲焚华', '飞鸿无迹'] },
  { name: '丐帮', icon: '🍶', element: '火', gender: '男女', desc: '天下第一帮，历史久远', skills: ['掌丐', '棍丐', '醉蝶狂舞'] },
  { name: '武当派', icon: '☯️', element: '土', gender: '男女', desc: '道教名山，张三丰开宗立派', skills: ['剑宗', '气宗', '太极神功'] },
  { name: '昆仑派', icon: '❄️', element: '土', gender: '男女', desc: '西域创派，百年奇人闯出赫赫威名', skills: ['刀昆仑', '剑昆仑', '欺寒傲雪', '束缚咒'] },
];

// 武器数据
const weapons = [
  { name: '飞镖', icon: '🎯', levels: '1-90', desc: '唐门镖术，暗器类' },
  { name: '飞刀', icon: '🗡️', levels: '1-90', desc: '唐门飞刀术，近距离暗器' },
  { name: '袖箭', icon: '🏹', levels: '1-90', desc: '藏于袖中，按机括发射' },
  { name: '剑', icon: '⚔️', levels: '1-90', desc: '武当、峨嵋派常用武器' },
  { name: '单刀', icon: '🔪', levels: '1-90', desc: '天王、少林、五毒等门派使用' },
  { name: '棍棒', icon: '🏏', levels: '1-90', desc: '少林、丐帮常用武器' },
  { name: '枪矛', icon: '🔱', levels: '1-90', desc: '天王、天忍门派使用' },
  { name: '锤', icon: '🔨', levels: '1-90', desc: '天王锤天王使用，重型武器' },
  { name: '双刀', icon: '⚔️⚔️', levels: '1-90', desc: '翠烟门特色武器' },
  { name: '缠手', icon: '🤚', levels: '1-90', desc: '各门派拳掌功夫必备' },
];

// 消耗品数据
const consumables = [
  { name: '宝箱', icon: '📦', desc: '江湖忽现的神秘宝箱，内藏神秘宝物' },
  { name: '侠客手札', icon: '📜', desc: '记录功法心得，侠客使用后获得经验值' },
  { name: '洗髓经', icon: '📿', desc: '侠客使用后随机更换为对应门派的1级基础技能' },
  { name: '真元丹', icon: '💊', desc: '侠客服用后获得技能真元值' },
  { name: '技能升级丹', icon: '✨', desc: '可提升技能等级的珍贵丹药' },
];

// 常见问题数据
const faqData = [
  { q: '剑侠中有几种资源？', a: '共有3种资源：金钱、粮食、人口' },
  { q: '游戏初期应该怎样发展？', a: '优先升级资源类建筑（钱庄、农场、义舍）与资源仓库类建筑（粮仓、账房、民居）' },
  { q: '为什么有些按钮是灰色的？', a: '将鼠标悬停在按钮上时，红色标识的部分是操作失败的原因' },
  { q: '有新手保护期吗？', a: '游戏对新手提供了三天的新手保护期，其他玩家不能攻击您的村镇' },
  { q: '如何获得侠客？', a: '建造升级门派建筑，寻访并雇佣侠客来组建侠客队伍' },
  { q: '建筑最高可以升到几级？', a: '技类建筑、门派类建筑满级20级，其它建筑满级30级' },
  { q: '升级聚义厅有什么好处？', a: '聚义厅是建造资源建筑、军事建筑、科技建筑的前提条件，还能缩短建造升级建筑的时间' },
  { q: '密库有什么作用？', a: '储藏部分资源，敌人掠夺时无法掠夺密库中的资源' },
  { q: '维护弟子是什么？', a: '维护弟子数量所需资源产量减值的百分比，影响资源实际产量' },
  { q: '侠客品质有什么区别？', a: '侠客分为5级品质，品质决定成长潜力，品质越高成长潜力越大，门派建筑等级越高，寻访到高品质侠客几率越高' },
];

// 新手教程数据
const newbieGuide = [
  { step: 1, title: '建造资源建筑', content: '建造1级农场、钱庄、义舍与粮仓、账房、民居，并升级到5级' },
  { step: 2, title: '升级聚义厅', content: '将聚义厅升级到2级，解锁更多建筑类型' },
  { step: 3, title: '建造门派建筑', content: '在内政页面建造1级门派建筑（如天王号令台）' },
  { step: 4, title: '招募侠客', content: '在门派建筑中寻访并雇用侠客' },
  { step: 5, title: '训练弟子', content: '让侠客招募并训练弟子，然后攻打低级山寨获取资源' },
  { step: 6, title: '继续升级', content: '继续升级资源建筑，积累更多资源' },
  { step: 7, title: '建造城防', content: '建造1级工匠坊后，在城防页面建造城防建筑' },
  { step: 8, title: '发展科技', content: '建造科技建筑营造司和演武场，升级科技' },
  { step: 9, title: '扩大门派', content: '建造更多门派建筑，招募更多侠客' },
  { step: 10, title: '加入帮派', content: '在帮派页面加入帮派，与朋友并肩作战' },
];

// ============== 折叠组件 ==============
interface CollapseProps {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const Collapse: React.FC<CollapseProps> = ({ title, icon, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="help-collapse">
      <button className="help-collapse-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="help-collapse-icon">{icon}</span>
        <span className="help-collapse-title">{title}</span>
        <span className={`help-collapse-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      <div className={`help-collapse-content ${isOpen ? 'open' : ''}`}>
        {children}
      </div>
    </div>
  );
};

// ============== 主组件 ==============
const HelpPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'building' | 'hero' | 'defense' | 'item' | 'newbie'>('building');

  const tabs = [
    { id: 'building' as const, label: '建筑', icon: '🏛️' },
    { id: 'hero' as const, label: '武将', icon: '⚔️' },
    { id: 'defense' as const, label: '城防', icon: '🛡️' },
    { id: 'item' as const, label: '物品', icon: '🎒' },
    { id: 'newbie' as const, label: '新手', icon: '📖' },
  ];

  return (
    <div className="help-page">
      {/* 顶部标题栏 */}
      <div className="help-header">
        <div className="help-title">📜 游戏帮助</div>
        <a href="/jxweb" className="help-back-btn">返回游戏</a>
      </div>

      {/* Tab 导航 */}
      <div className="help-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`help-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="help-tab-icon">{tab.icon}</span>
            <span className="help-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="help-content">
        {/* 建筑页 */}
        {activeTab === 'building' && (
          <div className="help-section">
            <Collapse title="基础建筑" icon="🏛️" defaultOpen>
              <div className="help-card-grid">
                {buildings.map((b, i) => (
                  <div key={i} className="help-card">
                    <div className="help-card-icon">{b.icon}</div>
                    <div className="help-card-name">{b.name}</div>
                    <div className="help-card-require">需求: {b.requires}</div>
                    <div className="help-card-desc">{b.desc}</div>
                  </div>
                ))}
              </div>
            </Collapse>

            <Collapse title="门派建筑" icon="⛩️" defaultOpen>
              <div className="help-card-grid">
                {factionBuildings.map((b, i) => (
                  <div key={i} className="help-card">
                    <div className="help-card-icon">{b.icon}</div>
                    <div className="help-card-name">{b.name}</div>
                    <div className="help-card-element">五行: {b.element}</div>
                    <div className="help-card-desc">{b.desc}</div>
                  </div>
                ))}
              </div>
            </Collapse>

            <Collapse title="科技研究" icon="🔬">
              <div className="help-card-grid">
                {technologies.map((t, i) => (
                  <div key={i} className="help-card">
                    <div className="help-card-icon">{t.icon}</div>
                    <div className="help-card-name">{t.name}</div>
                    <div className="help-card-require">建筑: {t.building}</div>
                    <div className="help-card-desc">{t.desc}</div>
                  </div>
                ))}
              </div>
            </Collapse>
          </div>
        )}

        {/* 武将页 */}
        {activeTab === 'hero' && (
          <div className="help-section">
            <div className="help-intro">
              <p>侠客是攻城略地、抵御外敌的利器。侠客分为5级品质：</p>
              <div className="help-quality-legend">
                <span className="quality-1">普通</span>
                <span className="quality-2">优秀</span>
                <span className="quality-3">精品</span>
                <span className="quality-4">稀有</span>
                <span className="quality-5">罕见</span>
              </div>
            </div>

            <Collapse title="门派总览" icon="⚔️" defaultOpen>
              <div className="help-card-grid">
                {factions.map((f, i) => (
                  <div key={i} className="help-card hero-card">
                    <div className="help-card-icon">{f.icon}</div>
                    <div className="help-card-name">{f.name}</div>
                    <div className="help-card-element">五行: {f.element} | 性别: {f.gender}</div>
                    <div className="help-card-desc">{f.desc}</div>
                    <div className="help-card-skills">
                      技能: {f.skills.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </Collapse>

            <Collapse title="五行属性说明" icon="☯️">
              <div className="help-info-table">
                <div className="help-info-row">
                  <span className="element-badge gold">金</span>
                  <span>天王帮、少林派 - 高防御高血量</span>
                </div>
                <div className="help-info-row">
                  <span className="element-badge wood">木</span>
                  <span>唐门、五毒教 - 擅长毒属性攻击</span>
                </div>
                <div className="help-info-row">
                  <span className="element-badge water">水</span>
                  <span>峨嵋派、翠烟门 - 治疗和辅助能力强</span>
                </div>
                <div className="help-info-row">
                  <span className="element-badge fire">火</span>
                  <span>天忍教、丐帮 - 高爆发高伤害</span>
                </div>
                <div className="help-info-row">
                  <span className="element-badge dust">土</span>
                  <span>武当派、昆仑派 - 均衡型门派</span>
                </div>
              </div>
            </Collapse>
          </div>
        )}

        {/* 城防页 */}
        {activeTab === 'defense' && (
          <div className="help-section">
            <div className="help-intro">
              <p>强大的城防可令来犯之敌损失惨重，合理搭配建设各种城防设施，配合己方侠客防守，必将使敌方无功而返。</p>
            </div>

            <Collapse title="城防建筑" icon="🛡️" defaultOpen>
              <div className="help-card-grid">
                {defenses.map((d, i) => (
                  <div key={i} className="help-card defense-card">
                    <div className="help-card-icon">{d.icon}</div>
                    <div className="help-card-name">{d.name}</div>
                    <div className="help-card-stats">
                      <span>攻击: {d.attack}</span>
                      <span>耐久: {d.durability}</span>
                    </div>
                    <div className="help-card-desc">{d.desc}</div>
                  </div>
                ))}
              </div>
            </Collapse>

            <Collapse title="城防建设要点" icon="📋">
              <div className="help-tips">
                <div className="help-tip">
                  <span className="tip-icon">💡</span>
                  <span>升级工匠坊中的计量技术可以增加城防设施的可建数量</span>
                </div>
                <div className="help-tip">
                  <span className="tip-icon">💡</span>
                  <span>城防建筑满级20级</span>
                </div>
                <div className="help-tip">
                  <span className="tip-icon">💡</span>
                  <span>护城河可以让敌人在其中停止一回合，配合陷阱效果更佳</span>
                </div>
                <div className="help-tip">
                  <span className="tip-icon">💡</span>
                  <span>箭塔是唯一既能阻挡敌人又能攻击的建筑</span>
                </div>
              </div>
            </Collapse>
          </div>
        )}

        {/* 物品页 */}
        {activeTab === 'item' && (
          <div className="help-section">
            <div className="help-intro">
              <p>道具分为装备类道具与消耗型道具。装备给侠客穿戴后如虎添翼，消耗品使用后物品消失。</p>
              <p>道具品质：普通(绿)→优秀(青)→精品(蓝)→稀有(紫)→罕见(橙)</p>
            </div>

            <Collapse title="武器装备" icon="⚔️" defaultOpen>
              <div className="help-card-grid">
                {weapons.map((w, i) => (
                  <div key={i} className="help-card item-card">
                    <div className="help-card-icon">{w.icon}</div>
                    <div className="help-card-name">{w.name}</div>
                    <div className="help-card-require">等级: {w.levels}</div>
                    <div className="help-card-desc">{w.desc}</div>
                  </div>
                ))}
              </div>
            </Collapse>

            <Collapse title="消耗品" icon="📦">
              <div className="help-card-grid">
                {consumables.map((c, i) => (
                  <div key={i} className="help-card item-card consumable">
                    <div className="help-card-icon">{c.icon}</div>
                    <div className="help-card-name">{c.name}</div>
                    <div className="help-card-desc">{c.desc}</div>
                  </div>
                ))}
              </div>
            </Collapse>

            <Collapse title="材料合成" icon="💎">
              <div className="help-info-text">
                <p>通过分解物品可以获得材料，用于合成高级装备。</p>
                <div className="help-material-list">
                  <div className="material-item">💎 绿水晶 - 分解绿色装备获得</div>
                  <div className="material-item">💎 青水晶 - 分解青色装备获得</div>
                  <div className="material-item">💎 蓝水晶 - 分解蓝色装备获得</div>
                  <div className="material-item">🪨 黑石 - 分解新手礼包装备获得</div>
                </div>
              </div>
            </Collapse>
          </div>
        )}

        {/* 新手页 */}
        {activeTab === 'newbie' && (
          <div className="help-section">
            <Collapse title="十步成侠" icon="🎯" defaultOpen>
              <div className="help-steps">
                {newbieGuide.map((g, i) => (
                  <div key={i} className="help-step">
                    <div className="step-number">{g.step}</div>
                    <div className="step-content">
                      <div className="step-title">{g.title}</div>
                      <div className="step-desc">{g.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Collapse>

            <Collapse title="常见问题" icon="❓">
              <div className="help-faq">
                {faqData.map((faq, i) => (
                  <div key={i} className="help-faq-item">
                    <div className="faq-q">Q: {faq.q}</div>
                    <div className="faq-a">A: {faq.a}</div>
                  </div>
                ))}
              </div>
            </Collapse>

            <Collapse title="资源系统" icon="💰">
              <div className="help-info-text">
                <p>剑侠中共有3种资源：</p>
                <div className="help-resource-list">
                  <div className="resource-item">💰 金钱 - 用于建造、升级、招募等大部分操作</div>
                  <div className="resource-item">🌾 粮食 - 维持人口和军队运转</div>
                  <div className="resource-item">👥 人口 - 城寨运转和招募的基础</div>
                </div>
                <p className="help-note">注意：侠客带领的弟子需要维护费用，会消耗部分资源产量</p>
              </div>
            </Collapse>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpPage;
