/**
 * 左面板组件
 * 完全参照原版 Main.aspx leftpanel 部分
 */
import React, { memo } from 'react';
import styles from '../styles/jxMain.module.css';

interface LeftPanelProps {
  walletAddress: string;
  onNavigate: (module: string) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = memo(() => {
  return (
    <div id="leftpanel" className={styles.leftPanel}>
      <div id="logo" className={styles.logo} onClick={() => window.location.reload()}></div>

      <div id="info_user" className={styles.infoUser}>
        <div id="userlevel" className={styles.userLevel}>
          <span>
            <a id="userName" className="font_bold" href="#">
              {'玩家'}
            </a>
          </span>
          <div id="vipeffect" className={styles.vipEffect}></div>
          <div>
            <span className="font_bold" id="userState"></span>
          </div>
          <ul>
            <li>
              官位:<a id="userLevel" href="#" target="_blank">0</a>
            </li>
            <li>帮派:<span id="userUnit">{'无'}</span></li>
            <li>
              战勋:<span id="userIns">0</span>
            </li>
          </ul>
        </div>

        <div id="usercity" className={styles.userCity}></div>

        <div id="info_out" className={styles.infoOut}>
          <ul>
            <li>
              <a id="to_main" href="#" target="_blank">首页</a>
            </li>
            <li>
              <a id="to_account" href="#">账户设置</a>
            </li>
            <li>
              <a id="to_gold" href="#" style={{ color: 'green' }}>充值元宝</a>
            </li>
            <li>
              <a id="to_gift" href="#">礼品领取</a>
            </li>
            <li>
              <a id="to_extend" href="#">没资源点我</a>
            </li>
            <li>
              <a id="to_forum" href="#">论坛</a>
            </li>
            <li>
              <a id="exit_4" href="#">退出</a>
            </li>
          </ul>
        </div>

        <div id="info_sever" className={styles.infoServer}>
          <ul>
            <li>服务器名称</li>
            <li><span id="serverName" className="font_bold">{'默认'}</span></li>
            <li>在线玩家:<span id="onlineNum">0</span></li>
            <li>服务器时间</li>
            <li id="serverTime">{'00:00:00'}</li>
            <li>服务器速度:<span id="percent">10</span></li>
            <li>经验倍率:<span id="expPer">1倍</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
});

LeftPanel.displayName = 'LeftPanel';

export default LeftPanel;
