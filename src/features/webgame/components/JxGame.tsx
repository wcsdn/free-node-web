/**
 * 剑侠情缘Web - 主布局组件
 * 使用原版 Main.aspx 的样式和逻辑
 */
import React, { useState, useEffect, memo } from 'react';
import { getApiBase, getAuthHeaders } from '../utils/api';
import styles from '../styles/jxweb.module.css';
import LeftPanel from './LeftPanel';
import ContentArea from './ContentArea';
import RightPanel from './RightPanel';
import JxModules from './JxModules';
import MarketPanel from './MarketPanel';
import MallPanel from './MallPanel';
import MailPanel from './MailPanel';
import TaskPanel from './TaskPanel';
import RankingPanel from './RankingPanel';
import ArenaPanel from './ArenaPanel';
import SkillPanel from './SkillPanel';
import MilitaryPanel from './MilitaryPanel';
import BattlePanel from './BattlePanel';
import DungeonPanel from './DungeonPanel';
import DefensePanel from './DefensePanel';
import ItemPanel from './ItemPanel';
import Overlay from './Overlay';
import Popup from './Popup';
import Tips from './Tips';

type ModuleType = 'main' | 'modules' | 'market' | 'mall' | 'mail' | 'task' | 'ranking' | 'arena' | 'skill' | 'military' | 'battle' | 'dungeon' | 'defense' | 'item';

interface JxGameProps {
  walletAddress: string;
}

interface ServerInfo {
  Time: string;
  O: number;
  ExpPer: number;
  TimePercent: number;
  ServerUnit: string;
}

interface CityInteriorInfo {
  Area: number;
  AreaRoom: number;
  Child: number;
  Bloom: number;
  ChildRate: number;
  Gold: number;
  Money: number;
  MoneyRoom: number;
  Food: number;
  FoodRoom: number;
  Men: number;
  MenRoom: number;
  MoneySpeed: number;
  FoodSpeed: number;
  MenSpeed: number;
  Level: number;
}

interface CityData {
  ID: number;
  Name: string;
  map_image?: string;
  buildings?: any[];
}

interface UserInfo {
  Name: string;
  Level: number;
  State: number;
  Organise: string;
  Insignia: number;
  CityList: CityData[];
}

interface GameData {
  serverInfo: ServerInfo | null;
  userInfo: UserInfo | null;
  cityInteriorInfo: CityInteriorInfo | null;
  cityData: CityData | null;
  notice: string;
}

const JxGame: React.FC<JxGameProps> = memo(({ walletAddress }) => {
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<GameData>({
    serverInfo: null,
    userInfo: null,
    cityInteriorInfo: null,
    cityData: null,
    notice: '',
  });
  const [showOverlay, setShowOverlay] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [currentModule, setCurrentModule] = useState<ModuleType>('main');

  // 加载游戏数据
  useEffect(() => {
    const fetchGameData = async () => {
      setLoading(true);
      
      let serverInfo: ServerInfo = {
        Time: new Date().toLocaleTimeString(),
        O: Math.floor(Math.random() * 1000),
        ExpPer: 1,
        TimePercent: 100,
        ServerUnit: '1',
      };
      
      let userInfo: UserInfo | null = null;
      let cityInteriorInfo: CityInteriorInfo | null = null;
      let cityData: CityData | null = null;
      
      try {
        // 1. 获取服务器信息
        try {
          const serverRes = await fetch(`${getApiBase()}/api/game/server-info`, {
            headers: getAuthHeaders(),
          });
          const serverData = await serverRes.json();
          if (serverData.success) {
            serverInfo = serverData.data;
          }
        } catch (e) {
          console.warn('Failed to load server info, using mock data');
        }

        // 2. 获取用户信息
        try {
          const userRes = await fetch(`${getApiBase()}/api/user/user-info`, {
            headers: getAuthHeaders(),
          });
          const userData = await userRes.json();
          if (userData.success) {
            userInfo = userData.data;
          }
        } catch (e) {
          userInfo = {
            Name: '新玩家',
            Level: 1,
            State: 0,
            Organise: '',
            Insignia: 0,
            CityList: [{ ID: 1, Name: '主城' }],
          };
        }

        // 3. 获取城市信息
        if (userInfo?.CityList && userInfo.CityList.length > 0) {
          const cityId = userInfo.CityList[0].ID;
          try {
            const cityRes = await fetch(`${getApiBase()}/api/city/${cityId}`, {
              headers: getAuthHeaders(),
            });
            const cityDetail = await cityRes.json();
            if (cityDetail.success) {
              cityData = {
                ID: cityDetail.data.id,
                Name: cityDetail.data.name,
                map_image: cityDetail.data.map_image,
                buildings: cityDetail.data.buildings,
              };
              cityInteriorInfo = {
                Area: cityDetail.data.area || 0,
                AreaRoom: cityDetail.data.areaMax || 100,
                Child: cityDetail.data.child || 0,
                Bloom: cityDetail.data.bloom || 0,
                ChildRate: cityDetail.data.childRate || 0,
                Gold: cityDetail.data.gold || 0,
                Money: cityDetail.data.money || 0,
                MoneyRoom: cityDetail.data.moneyMax || 1000,
                Food: cityDetail.data.food || 0,
                FoodRoom: cityDetail.data.foodMax || 1000,
                Men: cityDetail.data.men || 0,
                MenRoom: cityDetail.data.menMax || 100,
                MoneySpeed: cityDetail.data.moneySpeed || 0,
                FoodSpeed: cityDetail.data.foodSpeed || 0,
                MenSpeed: cityDetail.data.menSpeed || 0,
                Level: cityDetail.data.level || 1,
              };
            }
          } catch (e) {
            cityInteriorInfo = {
              Area: 0,
              AreaRoom: 100,
              Child: 0,
              Bloom: 100,
              ChildRate: 0,
              Gold: 999999,
              Money: 3000,
              MoneyRoom: 1000,
              Food: 3000,
              FoodRoom: 1000,
              Men: 300,
              MenRoom: 100,
              MoneySpeed: 99,
              FoodSpeed: 99,
              MenSpeed: 99,
              Level: 1,
            };
            cityData = { ID: 1, Name: '主城', map_image: 'm1.JPG', buildings: [] };
          }
        }

        setGameData({
          serverInfo,
          userInfo,
          cityInteriorInfo,
          cityData,
          notice: '欢迎来到剑侠情缘！',
        });
      } catch (err) {
        console.error('Failed to load game data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [walletAddress]);

  const navigateTo = (module: string) => {
    setCurrentModule(module as ModuleType);
  };

  const goBack = () => {
    setCurrentModule('main');
  };

  if (loading) {
    return (
      <div className="loadingScreen" style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#000',
        fontSize: '12px'
      }}>
        <div className="loadingText" style={{ animation: 'blink 1s infinite' }}>正在加载游戏...</div>
      </div>
    );
  }

  // 显示模块页面
  if (currentModule !== 'main') {
    return (
      <div className="gameWrapper">
        {currentModule === 'modules' && <JxModules walletAddress={walletAddress} onNavigate={navigateTo} />}
        {currentModule === 'market' && <MarketPanel walletAddress={walletAddress} onClose={goBack} />}
        {currentModule === 'mall' && <MallPanel walletAddress={walletAddress} onClose={goBack} />}
        {currentModule === 'mail' && <MailPanel walletAddress={walletAddress} onClose={goBack} />}
        {currentModule === 'task' && <TaskPanel walletAddress={walletAddress} onClose={goBack} />}
        {currentModule === 'ranking' && <RankingPanel walletAddress={walletAddress} onClose={goBack} />}
        {currentModule === 'arena' && <ArenaPanel walletAddress={walletAddress} onClose={goBack} />}
        {currentModule === 'skill' && <SkillPanel walletAddress={walletAddress} onClose={goBack} />}
        {currentModule === 'military' && <MilitaryPanel walletAddress={walletAddress} onClose={goBack} />}
        {currentModule === 'battle' && <BattlePanel walletAddress={walletAddress} onClose={goBack} />}
        {currentModule === 'dungeon' && <DungeonPanel cityId={gameData.cityData?.ID || 1} onClose={goBack} />}
        {currentModule === 'defense' && <DefensePanel walletAddress={walletAddress} onClose={goBack} />}
        {currentModule === 'item' && <ItemPanel walletAddress={walletAddress} onClose={goBack} />}
        
        <div 
          style={{ 
            position: 'fixed', 
            top: 20, 
            left: 20,
            cursor: 'pointer',
            background: 'rgba(0,0,0,0.5)',
            padding: '10px 20px',
            color: '#fff',
            borderRadius: '5px'
          }}
          onClick={goBack}
        >
          ← 返回主界面
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gameWrapper}>
      {showOverlay && <Overlay onClose={() => setShowOverlay(false)} />}
      {showPopup && <Popup type="info" message="这是一个提示信息" onClose={() => setShowPopup(false)} />}
      {showTips && <Tips message="这是Tips信息" onClose={() => setShowTips(false)} />}
      
      <div className={styles.gameWrapperInner}>
        <LeftPanel 
          walletAddress={walletAddress}
          onNavigate={navigateTo}
        />
        
        <ContentArea 
          serverInfo={gameData.serverInfo}
          cityInteriorInfo={gameData.cityInteriorInfo ?? undefined}
          notice={gameData.notice}
        />
        
        <RightPanel 
          gameNotice={gameData.notice}
          walletAddress={walletAddress}
        />
      </div>
    </div>
  );
});

JxGame.displayName = 'JxGame';

export default JxGame;
