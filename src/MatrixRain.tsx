import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  fontSize?: number;
  columns?: number;
}

const MatrixRain: React.FC<MatrixRainProps> = ({ fontSize = 14, columns = 50 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布大小
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 字符集（95%英文数字，5%日文中文）
    const englishChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?'.repeat(19);
    const otherChars = 'アイウエオ自由节点';
    const chars = englishChars + otherChars;
    const charArray = chars.split('');

    // 计算列数（增加 5%）
    const calculatedColumns = Math.floor(canvas.width / fontSize / 2 * 1.05);
    const drops: number[] = [];
    const charIndexes: number[] = [];
    const speeds: number[] = [];
    const fontSizes: number[] = []; // 每列的字体大小

    // 初始化每列
    for (let i = 0; i < calculatedColumns; i++) {
      drops[i] = Math.random() * -100; // 随机起始位置
      charIndexes[i] = Math.floor(Math.random() * charArray.length);
      speeds[i] = 0.3 + Math.random() * 2.5; // 随机速度范围更大：0.3-2.8，有快有慢
      fontSizes[i] = fontSize * (0.85 + Math.random() * 0.3); // 字体大小在 85%-115% 之间随机
    }

    // 绘制函数
    const draw = () => {
      // 更高透明度让拖尾快速消失，减少重影密度
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = 'center';

      // 绘制每列
      for (let i = 0; i < drops.length; i++) {
        // 每帧都随机改变字符，让字母在下坠过程中不断变化
        charIndexes[i] = Math.floor(Math.random() * charArray.length);

        const char = charArray[charIndexes[i]];
        const columnFontSize = fontSizes[i]; // 使用该列的字体大小
        const x = i * fontSize * 2; // 增加列间距
        const y = drops[i] * fontSize * 1.5; // 增加行间距，让每列字符更稀疏

        // 设置该列的字体大小
        ctx.font = `bold ${columnFontSize}px 'Courier New', monospace`;

        // 计算当前位置在屏幕上的百分比
        const positionRatio = (drops[i] * fontSize * 1.5) / canvas.height;
        
        // 渐变效果：顶部字符更亮更不透明
        const brightness = Math.max(0.2, 1 - positionRatio * 0.8);
        const opacity = Math.min(1, 0.4 + (1 - positionRatio) * 0.6);

        // 绘制字符，顶部字符更亮
        ctx.fillStyle = `rgba(0, ${Math.floor(255 * brightness)}, 0, ${opacity})`;
        ctx.fillText(char, x + fontSize / 2, y);

        // 重置位置
        if (drops[i] * fontSize * 1.5 > canvas.height && Math.random() > 0.97) {
          drops[i] = 0;
          charIndexes[i] = Math.floor(Math.random() * charArray.length);
          speeds[i] = 0.3 + Math.random() * 2.5; // 重新随机速度，范围更大
        }

        // 移动位置（使用随机速度）
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
        position: 'absolute',
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

