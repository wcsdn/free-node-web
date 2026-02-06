/**
 * JxWeb 主组件
 * 完整的剑侠情缘 Web 版游戏界面
 */
import React, { useState, useEffect, useCallback } from 'react';
import { gameApi } from '../services/gameApi';
import { useResources } from '../hooks/useResources';
import { getApiBase, getAuthHeaders } from '../utils/api';
import PopupManager from './PopupManager';
import styles from '../styles/jxweb.module.css';
import '../styles/jxMain.module.css'; // 引入建筑位置样式

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  time?: string;
}

interface JxWebTestProps {
  walletAddress?: string;
  onLogout?: () => void;
}

const JxWebTest: React.FC<JxWebTestProps> = ({ walletAddress: propWalletAddress }) => {
  const walletAddress = propWalletAddress || localStorage.getItem('wallet-address') || '';
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [resources, setResources] = useState({
    money: 0, food: 0, population: 0, gold: 0
  });
  const [rates, setRates] = useState({
    moneyRate: 0, foodRate: 0, populationRate: 0
  });
  const [cityInfo, setCityInfo] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [lastChatId, setLastChatId] = useState(0);

  // 实时资源更新 Hook
  const { collect } = useResources(1);
  
  // 城池建筑数据
  const [buildings, setBuildings] = useState<any[]>([]);
  
  // 加载城池建筑数据（提取为独立函数，可以在任何地方调用）
  const loadBuildings = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/game/city/building-list/1`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data?.buildings) {
        setBuildings(data.data.buildings);
      }
    } catch (err) {
      console.error('Failed to load buildings:', err);
    }
  }, []);
  
  // 根据建筑 configId 和 level 动态生成图标路径
  const getBuildingIcon = (configId: number, level: number) => {
    // 图标文件名是根据等级来的，不是configId
    // 1-5级：1.GIF, 2.GIF, 3.GIF, 4.GIF, 5.GIF
    // 6-10级：a6.GIF, a7.GIF, a8.GIF, a9.GIF, a10.GIF
    // 11-15级：b11.GIF, b12.GIF, b13.GIF, b14.GIF, b15.GIF
    // 16-20级：c16.GIF, c17.GIF, c18.GIF, c19.GIF, c20.GIF
    let prefix = '';
    let fileName = level;
    
    if (level >= 6 && level <= 10) {
      prefix = 'a';
    } else if (level >= 11 && level <= 15) {
      prefix = 'b';
    } else if (level >= 16 && level <= 20) {
      prefix = 'c';
    } else if (level > 20) {
      // 超过20级，使用最高级图标
      prefix = 'c';
      fileName = 20;
    }
    
    return `2/b/m/${prefix}${fileName}.GIF`;
  };
  
  // 获取建筑名称
  const getBuildingName = (configId: number) => {
    const names: Record<number, string> = {
      1: '聚义厅',
      2: '民心设施',
      3: '银库',
      4: '粮仓',
      5: '民居',
      6: '市场',
      7: '铁匠铺',
      8: '客栈',
      9: '兵营',
      10: '校场',
      11: '马厩',
      12: '工坊',
      13: '祭坛',
      14: '驿站',
      15: '仓库',
      16: '城墙',
    };
    return names[configId] || '未知建筑';
  };
  
  // 内政建筑位置数量
  const INTERIOR_POS_NUM = 16;
  
  // 建筑位置样式（硬编码，确保正确显示）
  const BUILDING_POSITION_STYLES: Record<number, React.CSSProperties> = {
    1: { position: 'absolute', zIndex: 1, left: '48px', top: '98px' },
    2: { position: 'absolute', zIndex: 1, left: '183px', top: '45px' },
    3: { position: 'absolute', zIndex: 1, left: '274px', top: '103px' },
    4: { position: 'absolute', zIndex: 1, left: '423px', top: '83px' },
    5: { position: 'absolute', zIndex: 2, left: '100px', top: '130px' },
    6: { position: 'absolute', zIndex: 3, left: '37px', top: '198px' },
    7: { position: 'absolute', zIndex: 3, left: '149px', top: '157px' },
    8: { position: 'absolute', zIndex: 3, left: '246px', top: '126px' },
    9: { position: 'absolute', zIndex: 5, left: '165px', top: '338px' },
    10: { position: 'absolute', zIndex: 4, left: '198px', top: '193px' },
    11: { position: 'absolute', zIndex: 5, left: '306px', top: '160px' },
    12: { position: 'absolute', zIndex: 4, left: '413px', top: '150px' },
    13: { position: 'absolute', zIndex: 7, left: '300px', top: '375px' },
    14: { position: 'absolute', zIndex: 6, left: '306px', top: '279px' },
    15: { position: 'absolute', zIndex: 6, left: '417px', top: '223px' },
    16: { position: 'absolute', zIndex: 4, left: '72px', top: '268px' },
  };
  
  // 内政建筑热点坐标（空地）
  const interiorAreaCoordsEmpty = [
    "53,145,94,126,122,147,80,165",
    "184,132,223,114,254,129,213,148",
    "337,125,391,131,371,155,314,149",
    "441,150,471,129,512,148,484,169",
    "100,179,140,160,172,179,131,199",
    "49,263,84,287,130,263,93,238",
    "160,219,208,196,241,215,193,238",
    "268,153,321,165,299,199,242,186",
    "167,402,219,431,272,396,220,363",
    "200,284,276,317,297,306,311,312,342,296,352,277,329,245,292,219,244,199,200,219",
    "337,222,382,245,413,222,368,199",
    "437,234,485,257,516,234,468,211",
    "100,330,140,311,172,330,131,350",
    "184,283,223,265,254,280,213,299",
    "337,276,391,282,371,306,314,300",
    "441,301,471,280,512,299,484,320"
  ];
  
  // 内政建筑热点坐标（有建筑）
  const interiorAreaCoordsFull = [
    "46,137,64,158,88,156,111,151,119,142,106,108,68,96",
    "191,51,190,140,241,140,242,51",
    "300,115,398,117,397,147,317,148,290,130",
    "431,146,477,168,512,155,519,127,468,100,436,111",
    "96,184,133,195,163,179,143,151,124,147,101,155",
    "49,276,78,288,124,270,131,254,115,231,74,210,44,244",
    "156,223,198,239,254,215,210,194,207,179,188,171,159,184,158,200",
    "256,148,287,132,323,148,323,177,299,199,242,186",
    "167,402,219,431,272,396,220,363",
    "200,284,276,317,297,306,311,312,342,296,352,277,329,245,292,219,244,199,200,219",
    "337,222,382,245,413,222,368,199",
    "437,234,485,257,516,234,468,211",
    "96,335,133,346,163,330,143,302,124,298,101,306",
    "184,283,223,265,254,280,213,299",
    "337,276,391,282,371,306,314,300",
    "441,301,471,280,512,299,484,320"
  ];

  // 初始化完成后设置 loading 为 false
  useEffect(() => {
    // 加载原始游戏的 CSS
    const loadStyles = () => {
      const styles = [
        '/jx/Web/Css/Common.css',
      ];
      
      styles.forEach(href => {
        // 检查是否已经加载
        if (!document.querySelector(`link[href="${href}"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = href;
          document.head.appendChild(link);
        }
      });
    };
    
    loadStyles();
    
    // 加载城市数据（资源、产量等）
    const loadCityData = async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/game/city/interior/1`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success && data.data) {
          const city = data.data;
          setCityInfo(city);
          setResources({
            money: city.money || 0,
            food: city.food || 0,
            population: city.population || 0,
            gold: city.gold || 0,
          });
          setRates({
            moneyRate: city.moneyRate || 0,
            foodRate: city.foodRate || 0,
            populationRate: city.populationRate || 0,
          });
        }
      } catch (err) {
        console.error('Failed to load city data:', err);
      }
    };
    
    loadCityData();
    loadBuildings();
    
    // 简单延迟后设置为加载完成
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [loadBuildings]);

  // 时钟更新
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 收集资源
  const handleCollectResources = useCallback(async () => {
    await collect();
  }, [collect]);

  // 聊天功能 - 暂时禁用，等 API 实现后再启用
  useEffect(() => {
    // TODO: 等聊天 API 实现后启用
    const CHAT_ENABLED = false;
    
    if (!CHAT_ENABLED) return;
    
    const fetchChat = async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/chat/messages?lastId=${lastChatId}&limit=20`, {
          headers: getAuthHeaders(),
        });
        
        // 检查响应类型
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return;
        }
        
        const data = await res.json();
        if (data.success && data.data?.messages) {
          setChatMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMsgs = data.data.messages.filter((m: any) => !existingIds.has(m.id));
            return [...prev, ...newMsgs].slice(-100);
          });
          const lastId = data.data.messages[data.data.messages.length - 1]?.id;
          if (lastId > lastChatId) {
            setLastChatId(lastId);
          }
        }
      } catch (err) {
        // 静默处理
      }
    };

    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [lastChatId]);

  // 发送聊天消息
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    // TODO: 等聊天 API 实现后启用
    alert('聊天功能开发中...');
    return;
    
    /* 暂时禁用
    try {
      const res = await fetch(`${getApiBase()}/api/chat/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ 
          content: chatInput, 
          channel: 0
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChatInput('');
        const msg = data.data;
        setChatMessages(prev => [...prev, { 
          id: msg.id, 
          sender: '我', 
          content: chatInput,
          time: new Date().toLocaleTimeString()
        }].slice(-100));
    } catch (err) {
      console.error('Failed to send chat:', err);
      alert('发送失败');
    }
    */
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingText}>正在加载游戏...</div>
      </div>
    );
  }

  return (
    <div id="wrapper">
      <PopupManager />
      
      <div id="line"></div>
      <div id="line1"></div>

      {/* 左面板 */}
      <div id="leftpanel">
        <div 
          id="logo"
          onClick={() => window.location.reload()}
        ></div>
        
        <div id="info_user">
          <div id="userlevel">
            <span>
              <a id="userName" className="font_bold">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </a>
            </span>
            <div id="vipeffect"></div>
            <div><span className="font_bold" id="userState"></span></div>
            <ul>
              <li>官位:<a id="userLevel" href="#">1</a></li>
              <li>帮派:<span id="userUnit">无</span></li>
              <li>战勋:<span id="userIns">0</span></li>
            </ul>
          </div>
          
          <div id="usercity"></div>
          
          <div id="info_out">
            <ul>
              <li><a id="to_main" href="#">首页</a></li>
              <li><a id="to_account" href="#">帐户设置</a></li>
              <li><a id="to_gold" href="#" style={{color:'green'}}>充值元宝</a></li>
              <li><a id="to_gift" href="#">礼品领取</a></li>
              <li><a id="to_extend" href="#">没资源点我</a></li>
              <li><a id="to_forum" href="#">论坛</a></li>
              <li><a id="exit_4" href="#">退出</a></li>
            </ul>
          </div>
          
          <div id="info_sever">
            <ul>
              <li>服务器名称</li>
              <li><span id="serverName" className="font_bold">测试服</span></li>
              <li>在线玩家:<span id="onlineNum">1</span></li>
              <li>服务器时间</li>
              <li id="serverTime">{currentTime}</li>
              <li>服务器速度:<span id="percent">10</span></li>
              <li>经验倍率:<span id="expPer">1</span>倍</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 中间内容区 */}
      <div id="contentarea">
        <div id="mainnav">
          <ul>
            <li id="nav_1"><a id="p_1" className="nav_a_1" href="#" onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined' && (window as any).OpenPage) {
                (window as any).OpenPage('p_1');
              }
            }}></a></li>
            <li id="nav_2"><a id="p_2" className="nav_a_2" href="#" onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined' && (window as any).OpenPage) {
                (window as any).OpenPage('p_2');
              }
            }}></a></li>
            <li id="nav_3"><a id="p_3" className="nav_a_3" href="#" onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined' && (window as any).OpenPage) {
                (window as any).OpenPage('p_3');
              }
            }}></a></li>
            <li id="nav_4"><a id="p_4" className="nav_a_4" href="#" onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined' && (window as any).OpenPage) {
                (window as any).OpenPage('p_4');
              }
            }}></a></li>
            <li id="nav_5">
              <a id="p_5" className="nav_a_5" href="#" onClick={(e) => {
                e.preventDefault();
                if (typeof window !== 'undefined' && (window as any).OpenPage) {
                  (window as any).OpenPage('p_5');
                }
              }}></a>
            </li>
            <li id="nav_6"><a id="p_6" className="nav_a_6" href="#" onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined' && (window as any).OpenPage) {
                (window as any).OpenPage('p_6');
              }
            }}></a></li>
            <li id="nav_7"><a id="p_7" className="nav_a_7" href="#" onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined' && (window as any).OpenPage) {
                (window as any).OpenPage('p_7');
              }
            }}></a></li>
          </ul>
        </div>
        
        <div id="userres">
          <table width="542" style={{height:'30px'}} border={0} cellSpacing="0" cellPadding="0">
            <tbody>
              <tr>
                <td style={{width:'33px'}}>面积:</td>
                <td style={{width:'60px'}}><span id="area">0</span>/<span id="areaRoom">0</span></td>
                <td style={{width:'33px'}}>弟子:</td>
                <td style={{width:'26px'}}><span id="child">0</span></td>
                <td style={{width:'33px'}}><img alt="" src="/jx/Web/img/4/1.gif" width="17" height="16" /></td>
                <td style={{width:'87px'}}><span id="r_money">{resources.money}</span>/<span id="moneyRoom">10000</span></td>
                <td style={{width:'33px'}}><img alt="" src="/jx/Web/img/4/2.GIF" width="16" height="17" /></td>
                <td style={{width:'87px'}}><span id="r_food">{resources.food}</span>/<span id="foodRoom">10000</span></td>
                <td style={{width:'33px'}}><img alt="" src="/jx/Web/img/4/3.GIF" width="17" height="15" /></td>
                <td style={{width:'77px'}}><span id="r_men">{resources.population}</span>/<span id="menRoom">5000</span></td>
                <td style={{width:'23px'}}><a href="#"><img alt="" src="/jx/Web/img/4/4.gif" width="21" height="14"/></a></td>
                <td style={{width:'34px'}}><span id="r_gold">{resources.gold}</span></td>
              </tr>
              <tr>
                <td>繁荣:</td>
                <td><span id="bloom">0</span></td>
                <td>维护:</td>
                <td><span id="childRate">0</span></td>
                <td>产量:</td>
                <td><span id="moneySpeed">{rates.moneyRate}</span>/小时</td>
                <td>产量:</td>
                <td><span id="foodSpeed">{rates.foodRate}</span>/小时</td>
                <td>产量:</td>
                <td><span id="menSpeed">{rates.populationRate}</span>/小时</td>
                <td colSpan={2}>&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div id="mainpic">
          {/* 内政页面 - 完整实现 */}
          {/* 背景图 */}
          <img 
            id="botpic_1" 
            className="botpic_1" 
            src="/jx/Web/img/2/b/m/0.JPG" 
            alt="城池背景"
          />
          
          {/* 透明建筑区域图（用于热点映射） */}
          <img 
            id="clearpic_1" 
            className="clearpic_1" 
            src="/jx/Web/img/2/b/m/22.gif" 
            useMap="#map_1"
            alt="建筑区域"
          />
          
          {/* 建筑热点地图 */}
          <map id="map_1" name="map_1">
            {Array.from({ length: INTERIOR_POS_NUM }, (_, i) => {
              const position = i + 1; // CSS 位置从 1 开始
              const building = buildings.find(b => b.position === position); // 查找对应位置的建筑
              const coords = building ? interiorAreaCoordsFull[i] : interiorAreaCoordsEmpty[i];
              
              return (
                <area
                  key={position}
                  id={`area_1_${position}`}
                  shape="poly"
                  coords={coords}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    if (building) {
                      // 有建筑，打开建筑详情
                      const icon = getBuildingIcon(building.configId, building.level);
                      const name = getBuildingName(building.configId);
                      if (typeof window !== 'undefined' && (window as any).OpenBuilding) {
                        (window as any).OpenBuilding({
                          ...building,
                          Name: name,
                          Icon: icon,
                          Position: building.position,
                          Level: building.level,
                          ConfigID: building.configId,
                        }, cityInfo, (updatedData: any) => {
                          // 更新建筑数据
                          if (updatedData.building) {
                            setBuildings(prev => prev.map(b => 
                              b.position === building.position ? { ...b, level: updatedData.building.Level } : b
                            ));
                          } else if (updatedData.building === null) {
                            // 建筑被拆除
                            setBuildings(prev => prev.filter(b => b.position !== building.position));
                          }
                          
                          // 更新资源数据
                          if (updatedData.resources) {
                            setResources(prev => ({ ...prev, ...updatedData.resources }));
                            setCityInfo((prev: any) => ({ ...prev, ...updatedData.resources }));
                          }
                        });
                      }
                    } else {
                      // 空地，打开建造面板
                      console.log(`点击空地位置: ${position}`);
                      if (typeof window !== 'undefined' && (window as any).OpenBuildingSelect) {
                        (window as any).OpenBuildingSelect(position, cityInfo, () => {
                          // 建造成功后刷新建筑列表
                          loadBuildings();
                        });
                      }
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                  alt={building ? getBuildingName(building.configId) : `位置${position}`}
                />
              );
            })}
          </map>
          
          {/* 建筑图标（叠加在背景上） */}
          {buildings.map((building) => {
            // 使用服务器返回的image字段，如果没有则fallback到getBuildingIcon
            const icon = building.image || getBuildingIcon(building.configId, building.level);
            const name = getBuildingName(building.configId);
            const position = building.position; // 直接使用服务器返回的 position，对应 CSS 类 img_1_${position}
            
            return (
              <img
                key={`${building.position}-${building.level}`}
                id={`img_1_${position}`}
                className={`img_1_${position}`}
                src={`/jx/Web/img/${icon}`}
                alt={name}
                style={{ ...BUILDING_POSITION_STYLES[position], pointerEvents: 'none' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/jx/Web/img/2/b/m/1.GIF';
                }}
              />
            );
          })}
        </div>
      </div>

      {/* 右面板 */}
      <div id="rightpanel">
        <div id="sidebav">
          <img alt="" id="new_mail" src="/jx/Web/img/o/33.GIF" style={{display:'none', zIndex: 1, right: '195px', position: 'absolute', top: '16px'}} />
          <img alt="" id="task_sgin" src="/jx/Web/img/1/10a.GIF" style={{zIndex: 1, right: '102px', position: 'absolute', top: '16px'}} />
          <ul id="chalink">
            <li><a id="p_12" className="nav_a_12" href="#" onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined' && (window as any).OpenPage) {
                (window as any).OpenPage('p_12');
              }
            }}>竞技</a></li>
            <li><a className="nav_a_13" style={{color:'Red'}} href="#" onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined' && (window as any).OpenMall) {
                (window as any).OpenMall();
              }
            }}>商城</a></li>
            <li><a id="p_8" className="nav_a_8" href="#" onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined' && (window as any).OpenPage) {
                (window as any).OpenPage('p_8');
              }
            }}>消息</a></li>
            <li><a id="p_9" className="nav_a_9" href="#" onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined' && (window as any).OpenPage) {
                (window as any).OpenPage('p_9');
              }
            }}>市场</a></li>
            <li><a id="p_10" className="nav_a_10" href="#" onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined' && (window as any).OpenPage) {
                (window as any).OpenPage('p_10');
              }
            }}>任务</a></li>
            <li><a id="p_11" className="nav_a_11" href="#" onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined' && (window as any).OpenPage) {
                (window as any).OpenPage('p_11');
              }
            }}>排行</a></li>
            <li><a href="#" target="_blank" onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined' && (window as any).OpenHelp) {
                (window as any).OpenHelp();
              }
            }}>帮助</a></li>
          </ul>
          <div id="gamenews">
            <div className="gonggao">欢迎来到剑侠情缘 Web 版！</div>
          </div>
        </div>
        <div id="eventinfo"></div>
        
        {/* 建筑区域 - 使用原始样式 */}
        <div id="trees">
          {buildings.map((building, index) => {
            const iconLarge = getBuildingIcon(building.configId, building.level); // 主地图用的大图标
            const iconSmall = `2/b/o/${building.configId}.GIF`; // 右侧列表用的小图标
            const name = getBuildingName(building.configId);
            return (
              <div key={building.position || index} className="container">
                {/* 建筑标题 */}
                <div>
                  <img 
                    className="node_control" 
                    src="/jx/Web/img/o/2.gif" 
                    alt="展开"
                  />
                  <img 
                    className="node_icon_1"
                    src={`/jx/Web/img/${iconSmall}`}
                    alt={name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/jx/Web/img/2/b/o/1.GIF';
                    }}
                  />
                  <span className="node_title_span">{name} Lv.{building.level}</span>
                </div>
                {/* 建筑操作列表 */}
                <ul style={{ display: 'none' }}>
                  <li>
                    <a 
                      className="node_handle_a"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (typeof window !== 'undefined' && (window as any).OpenBuilding) {
                          (window as any).OpenBuilding({
                            ...building,
                            Name: name,
                            Icon: iconLarge,
                            Position: building.position,
                            Level: building.level,
                            ConfigID: building.configId,
                          }, cityInfo, (updatedData: any) => {
                            // 更新建筑数据
                            if (updatedData.building) {
                              setBuildings(prev => prev.map(b => 
                                b.position === building.position ? { ...b, level: updatedData.building.Level } : b
                              ));
                            } else if (updatedData.building === null) {
                              // 建筑被拆除
                              setBuildings(prev => prev.filter(b => b.position !== building.position));
                            }
                            
                            // 更新资源数据
                            if (updatedData.resources) {
                              setResources(prev => ({ ...prev, ...updatedData.resources }));
                              setCityInfo((prev: any) => ({ ...prev, ...updatedData.resources }));
                            }
                          });
                        }
                      }}
                    >
                      查看详情
                    </a>
                  </li>
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* 聊天窗口 */}
      <div id="main" className="dragclass">
        <div id="ChatHead">
          <span style={{float:'left', fontSize:'12px', color:'#000'}}>世界聊天</span>
        </div>
        <div id="ChatBody">
          <div id="chatContent" style={{height:'150px', overflow:'auto', padding:'5px'}}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{marginBottom:'5px'}}>
                <span style={{color:'#666', fontSize:'11px'}}>{msg.time}</span>
                <span style={{color:'#000', fontWeight:'bold', marginLeft:'5px'}}>{msg.sender}:</span>
                <span style={{marginLeft:'5px'}}>{msg.content}</span>
              </div>
            ))}
          </div>
          <div style={{padding:'5px', borderTop:'1px solid #ccc'}}>
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              style={{width:'80%', padding:'3px'}}
              placeholder="输入消息..."
            />
            <button onClick={sendChatMessage} style={{marginLeft:'5px'}}>发送</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JxWebTest;
