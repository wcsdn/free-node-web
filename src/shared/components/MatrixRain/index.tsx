import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  fontSize?: number;
  columns?: number;
}

const MatrixRain: React.FC<MatrixRainProps> = ({ fontSize = 14, columns = 50 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { 
      alpha: false, // 禁用透明度，提升性能
      desynchronized: true // 允许异步渲染
    });
    if (!ctx) return;

    // 设置画布大小（使用设备像素比）
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // 限制最大 2x
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 字符集（简化，减少随机选择开销）
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789アイウエオ';
    const charArray = chars.split('');

    // 减少列数以提升性能
    const calculatedColumns = Math.floor(window.innerWidth / (fontSize * 3));
    const drops: number[] = [];
    const charIndexes: number[] = [];
    const speeds: number[] = [];
    const fontSizes: number[] = [];

    // 初始化每列
    for (let i = 0; i < calculatedColumns; i++) {
      drops[i] = Math.random() * -100;
      charIndexes[i] = Math.floor(Math.random() * charArray.length);
      speeds[i] = 0.5 + Math.random() * 0.5; // 速度范围：0.5-1.0
      fontSizes[i] = fontSize * (0.9 + Math.random() * 0.2);
    }

    // 绘制函数（优化版）
    const draw = () => {
      frameCountRef.current++;
      
      // 降低帧率到 30fps（每 2 帧绘制一次）
      if (frameCountRef.current % 2 !== 0) return;

      // 黑色背景淡化
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      ctx.textAlign = 'center';

      // 绘制每列
      for (let i = 0; i < drops.length; i++) {
        // 每 3 帧才改变字符，减少随机计算
        if (frameCountRef.current % 3 === 0) {
          charIndexes[i] = Math.floor(Math.random() * charArray.length);
        }

        const char = charArray[charIndexes[i]];
        const columnFontSize = fontSizes[i];
        const x = i * fontSize * 3; // 增加列间距
        const y = drops[i] * fontSize * 1.5;

        // 缓存字体设置
        ctx.font = `${columnFontSize}px monospace`;

        // 简化渐变计算
        const positionRatio = y / window.innerHeight;
        const brightness = Math.max(0.3, 1 - positionRatio * 0.7);

        // 使用固定颜色减少字符串拼接
        ctx.fillStyle = brightness > 0.7 ? '#00ff00' : brightness > 0.5 ? '#00cc00' : '#009900';
        ctx.fillText(char, x, y);

        // 重置位置
        if (y > window.innerHeight && Math.random() > 0.975) {
          drops[i] = 0;
          speeds[i] = 0.5 + Math.random() * 0.5;
        }

        // 移动位置
        drops[i] += speeds[i];
      }
    };

    // 动画循环
    let animationId: number;
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [fontSize]);

  return (
    <canvas
      ref={canvasRef}
      className="matrix-rain"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
};

export default MatrixRain;

