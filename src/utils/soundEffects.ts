/**
 * 音效生成工具 - 使用 Web Audio API 生成赛博朋克风格音效
 */

// 创建音频上下文
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

/**
 * 机械滋滋声 - 按钮 hover 音效
 */
export const playHoverSound = (volume: number = 0.1) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
};

/**
 * Access Granted 音效 - 连接成功
 */
export const playAccessGrantedSound = (volume: number = 0.15) => {
  try {
    const ctx = getAudioContext();
    
    // 第一个音符
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    gain1.gain.setValueAtTime(volume, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.2);

    // 第二个音符
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    gain2.gain.setValueAtTime(volume, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.3);

    // 第三个音符
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
    gain3.gain.setValueAtTime(volume, ctx.currentTime + 0.2);
    gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc3.start(ctx.currentTime + 0.2);
    osc3.stop(ctx.currentTime + 0.5);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
};

/**
 * 点击音效
 */
export const playClickSound = (volume: number = 0.12) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
};

/**
 * 错误音效
 */
export const playErrorSound = (volume: number = 0.15) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
};

/**
 * 背景白噪音 - Server Room Hum
 */
export class AmbientSound {
  private audioContext: AudioContext | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  start(volume: number = 0.08) {
    if (this.isPlaying) return;

    try {
      this.audioContext = getAudioContext();
      this.gainNode = this.audioContext.createGain();

      // 创建白噪音
      const bufferSize = 2 * this.audioContext.sampleRate;
      const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.noiseSource = this.audioContext.createBufferSource();
      this.noiseSource.buffer = noiseBuffer;
      this.noiseSource.loop = true;

      // 低通滤波器
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 100;

      // 连接节点
      this.noiseSource.connect(filter);
      filter.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // 设置音量
      this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

      // 启动
      this.noiseSource.start();
      this.isPlaying = true;
    } catch (error) {
      console.warn('Ambient sound failed:', error);
    }
  }

  stop() {
    if (!this.isPlaying || !this.gainNode || !this.audioContext) return;

    try {
      // 淡出
      this.gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      
      setTimeout(() => {
        if (this.noiseSource) {
          try {
            this.noiseSource.stop();
          } catch (e) {
            // 已经停止了
          }
          this.noiseSource = null;
        }
        this.isPlaying = false;
      }, 500);
    } catch (error) {
      console.warn('Stop ambient sound failed:', error);
    }
  }

  toggle(volume: number = 0.08) {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start(volume);
    }
  }

  isActive() {
    return this.isPlaying;
  }
}
