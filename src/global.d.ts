// 全局类型声明文件
// 将此文件放在你的 React 项目的 src 目录下

// CSS Modules 类型声明
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { [key: string]: string };
  export default classes;
}

// 图片类型声明
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';
declare module '*.webp';

// Vite 环境变量类型声明
interface ImportMetaEnv {
  readonly VITE_ORACLE_API?: string;
  readonly VITE_GHOST_CORE_API?: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Turnstile 类型声明 - 见 src/types/turnstile.d.ts
