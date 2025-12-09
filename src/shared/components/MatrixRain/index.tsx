import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  fontSize?: number;
  columns?: number;
}

const MatrixRain: React.FC<MatrixRainProps> = React.memo(({ fontSize = 14, columns = 50 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCountRef = useRef(0);
  const fpsRef = useRef(60);
  const lastFrameTimeRef = useRef(Date.now());
  const densityRef = useRef(1.0);

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

    // 溅射粒子系统
    interface Splash {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      char: string;
    }
    const splashes: Splash[] = [];

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

        // 重置位置并创建溅射效果
        if (y > window.innerHeight && Math.random() > 0.975) {
          // 创建溅射粒子
          const splashCount = 3 + Math.floor(Math.random() * 3); // 3-5个粒子
          for (let j = 0; j < splashCount; j++) {
            splashes.push({
              x: x,
              y: window.innerHeight,
              vx: (Math.random() - 0.5) * 4, // 水平速度
              vy: -2 - Math.random() * 3, // 向上速度
              life: 1.0,
              char: charArray[Math.floor(Math.random() * charArray.length)]
            });
          }
          
          drops[i] = 0;
          speeds[i] = 0.5 + Math.random() * 0.5;
        }

        // 移动位置
        drops[i] += speeds[i];
      }

      // 绘制溅射粒子
      for (let i = splashes.length - 1; i >= 0; i--) {
        const splash = splashes[i];
        
        // 更新粒子位置
        splash.x += splash.vx;
        splash.y += splash.vy;
        splash.vy += 0.3; // 重力
        splash.life -= 0.05;

        // 绘制粒子
        if (splash.life > 0) {
          ctx.font = `${fontSize * 0.8}px monospace`;
          ctx.fillStyle = `rgba(0, 255, 0, ${splash.life * 0.8})`;
          ctx.fillText(splash.char, splash.x, splash.y);
        } else {
          // 移除死亡粒子
          splashes.splice(i, 1);
        }
      }
    };

    // 动画循环
    let animationId: number;
    const animate = () => {
      // 计算帧率
      const now = Date.now();
      const delta = now - lastFrameTimeRef.current;
      if (delta > 0) {
        const currentFps = 1000 / delta;
        fpsRef.current = fpsRef.current * 0.9 + currentFps * 0.1; // 平滑 FPS
        
        // 自动降级：如果帧率低于 30fps，降低密度
        if (fpsRef.current < 30 && densityRef.current > 0.5) {
          densityRef.current *= 0.9;
          // 减少列数
          const targetColumns = Math.floor(calculatedColumns * densityRef.current);
          drops.length = targetColumns;
          charIndexes.length = targetColumns;
          speeds.length = targetColumns;
          fontSizes.length = targetColumns;
        }
      }
      lastFrameTimeRef.current = now;
      
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
});

export default MatrixRain;

