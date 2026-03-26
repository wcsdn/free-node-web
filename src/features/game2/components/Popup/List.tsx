/**
 * List - 攻擂/占领列表弹框内容组件
 * 
 * 功能：显示攻擂擂台列表或占领山寨列表
 * type: 105=攻擂擂台, 107=占领山寨
 */
import React from 'react';
import { Modal } from '../common/Modal';

interface ArenaItem {
  id: string;
  name: string;
  position: { x: number; y: number };
}

interface MountainHideoutItem {
  id: string;
  name: string;
  position: { x: number; y: number };
  endTime: string;
}

interface ListProps {
  open: boolean;
  onClose: () => void;
  onSelect: (x: number, y: number) => void;
  /** 105=攻擂擂台, 107=占领山寨 */
  type: 105 | 107;
  /** 攻擂列表 (type=105) */
  arenaList?: ArenaItem[];
  /** 山寨列表 (type=107) */
  hideoutList?: MountainHideoutItem[];
  /** 占领消耗元宝 */
  occupationGold?: number;
  /** 占领消耗战勋 */
  occupationInsignia?: number;
}

// 默认攻擂列表
const DEFAULT_ARENA_LIST: ArenaItem[] = [
  { id: '116_303', name: '东岳庙', position: { x: 116, y: 303 } },
  { id: '226_353', name: '黑风山', position: { x: 226, y: 353 } },
  { id: '161_114', name: '骷髅山', position: { x: 161, y: 114 } },
  { id: '282_100', name: '白骨洞', position: { x: 282, y: 100 } },
  { id: '116_345', name: '火云洞', position: { x: 116, y: 345 } },
  { id: '106_213', name: '盘丝洞', position: { x: 106, y: 213 } },
  { id: '91_284', name: '黄花观', position: { x: 91, y: 284 } },
  { id: '241_252', name: '号山', position: { x: 241, y: 252 } },
  { id: '308_252', name: '麒麟山', position: { x: 308, y: 252 } },
  { id: '136_185', name: '积雷山', position: { x: 136, y: 185 } },
];

export const PopUpList: React.FC<ListProps> = ({
  open,
  onClose,
  onSelect,
  type,
  arenaList = DEFAULT_ARENA_LIST,
  hideoutList = [],
  occupationGold = 0,
  occupationInsignia = 0,
}) => {
  const handleSelect = (id: string) => {
    const [x, y] = id.split('_').map(Number);
    onSelect(x, y);
  };

  const renderArenaList = () => (
    <div>
      <div style={{ lineHeight: '20px', marginBottom: 10 }}>
        选择要挑战的擂台
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* 擂台列表 */}
        <ul className="Arena" style={{ width: 180 }}>
          <li style={{ fontWeight: 'bold' }}>擂台</li>
          {arenaList.map(item => (
            <li key={item.id}>
              <a
                href="#"
                onClick={e => {
                  e.preventDefault();
                  handleSelect(item.id);
                }}
                title={`${item.name}(${item.position.x},${item.position.y})`}
              >
                {item.name}({item.position.x},{item.position.y})
              </a>
            </li>
          ))}
        </ul>

        {/* 等级限制说明 */}
        <ul className="Arena">
          <li style={{ fontWeight: 'bold' }}>
            等级限制
          </li>
          <li>挑战等级 &lt; 10 级</li>
          <li>挑战等级 &lt; 20 级</li>
          <li>挑战等级 &lt; 30 级</li>
          <li>挑战等级 &lt; 40 级</li>
          <li>挑战等级 &lt; 50 级</li>
          <li>挑战等级 &lt; 60 级</li>
          <li>挑战等级 &lt; 70 级</li>
          <li>挑战等级 &lt; 80 级</li>
          <li>挑战等级 &lt; 90 级</li>
          <li>挑战等级 &lt; 100 级</li>
        </ul>
      </div>

      <div
        style={{
          color: '#9d080d',
          width: 450,
          clear: 'both',
          paddingTop: 10,
        }}
      >
        (攻擂胜利后需等待30分钟才能再次攻擂)
      </div>
    </div>
  );

  const renderHideoutList = () => (
    <div>
      <div style={{ lineHeight: '20px', marginBottom: 10 }}>
        请选择要占领的山寨
      </div>
      <div style={{ lineHeight: '16px', marginBottom: 4 }}>
        占领后可以使用战勋或元宝购买资源
      </div>
      <div style={{ lineHeight: '16px', marginBottom: 4 }}>
        占领后每分钟可领取资源
      </div>
      <div style={{ lineHeight: '16px', marginBottom: 10 }}>
        占领后可派遣侠客驻守
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* 山寨名称列表 */}
        <ul className="Arena" style={{ width: 130 }}>
          <li style={{ fontWeight: 'bold' }}>山寨</li>
          {hideoutList.map(item => (
            <li key={item.id}>
              <a
                href="#"
                onClick={e => {
                  e.preventDefault();
                  handleSelect(item.id);
                }}
                title={`${item.position.x},${item.position.y}`}
              >
                {item.name}({item.position.x},{item.position.y})
              </a>
            </li>
          ))}
        </ul>

        {/* 占领截止时间 */}
        <ul className="Arena">
          <li style={{ fontWeight: 'bold' }}>截止时间</li>
          {hideoutList.map((item, index) => (
            <li key={index}>{item.endTime}</li>
          ))}
        </ul>
      </div>

      <div
        style={{
          color: '#9d080d',
          width: 290,
          clear: 'both',
          paddingTop: 10,
        }}
      >
        (占领后需等待一定时间才能再次占领)
      </div>

      {occupationGold > 0 && occupationInsignia > 0 && (
        <div style={{ marginTop: 10 }}>
          <span>消耗：</span>
          <span>
            <img src="img/4/4.gif" alt="元宝" style={{ marginRight: 4 }} />
            {occupationGold}
          </span>
          <span style={{ marginLeft: 10 }}>
            <img src="img/o/76.gif" alt="战勋" style={{ marginRight: 4 }} />
            {occupationInsignia}
          </span>
        </div>
      )}
    </div>
  );

  const getTitle = () => {
    switch (type) {
      case 105:
        return '攻擂擂台';
      case 107:
        return '占领山寨';
      default:
        return '列表';
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={getTitle()}
      width={type === 105 ? 531 : 400}
      footer={
        <div className="popup_button">
          <button className="btn-default" onClick={onClose}>
            关闭
          </button>
        </div>
      }
    >
      <div className="list-content">
        {type === 105 ? renderArenaList() : renderHideoutList()}
      </div>
    </Modal>
  );
};

export default PopUpList;
