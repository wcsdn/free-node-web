import React from 'react';
import './styles.css';

const CyberRose: React.FC = React.memo(() => {
  return (
    <div className="cyber-rose-container">
      <div className="cyber-rose">
        {/* 花朵 - 多层花瓣 */}
        <div className="rose-flower">
          {/* 外层花瓣 */}
          <div className="petal-layer outer">
            <div className="petal petal-1"></div>
            <div className="petal petal-2"></div>
            <div className="petal petal-3"></div>
            <div className="petal petal-4"></div>
            <div className="petal petal-5"></div>
            <div className="petal petal-6"></div>
          </div>
          {/* 内层花瓣 */}
          <div className="petal-layer inner">
            <div className="petal petal-1"></div>
            <div className="petal petal-2"></div>
            <div className="petal petal-3"></div>
            <div className="petal petal-4"></div>
          </div>
          {/* 花心 */}
          <div className="rose-center">
            <div className="center-core"></div>
            <div className="center-ring"></div>
          </div>
        </div>
        {/* 茎 */}
        <div className="rose-stem">
          <div className="stem-segment"></div>
          <div className="stem-segment"></div>
          <div className="stem-segment"></div>
          <div className="stem-glow"></div>
        </div>
        {/* 叶子 */}
        <div className="rose-leaf rose-leaf-left">
          <div className="leaf-vein"></div>
        </div>
        <div className="rose-leaf rose-leaf-right">
          <div className="leaf-vein"></div>
        </div>
      </div>
    </div>
  );
});

export default CyberRose;
