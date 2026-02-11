# 剑侠情缘 Web 游戏

## 架构说明

### 目录结构
```
src/features/jx-web/
├── JxWebGame.tsx          # React 包装组件
└── README.md              # 本文档

public/jx-web/             # 静态资源 (HTML/CSS/JS/图片)
├── index.html             # 游戏主页面
├── config.js              # API 配置
├── Css/                   # 样式文件
├── Js/                    # JavaScript 逻辑
├── img/                   # 图片资源
└── *_help_CN.html         # 中文帮助文档
```

### 认证流程

**无需注册,使用钱包地址作为唯一凭证**

1. 用户访问 `/jxweb` 路由
2. `ProtectedRoute` 检查钱包连接状态
3. 如果未连接,弹出 RainbowKit 连接弹窗
4. 连接后,触发钱包签名认证
5. 认证成功后,通过 `postMessage` 将钱包地址和认证信息传递给 iframe
6. iframe 内的游戏使用钱包地址作为用户标识

### 技术栈

**前端容器**: React + TypeScript
- 路由: React Router
- 钱包连接: RainbowKit + wagmi
- 认证: 钱包签名

**游戏页面**: HTML + jQuery + CSS (原始版本)
- 通过 iframe 加载
- 使用 postMessage 通信

**后端**: Cloudflare Workers + TypeScript
- API: RESTful
- 数据库: D1 (SQLite)
- 认证: 钱包地址 + 签名验证

### API 配置

游戏页面通过 `config.js` 自动检测环境:
- 开发环境: `http://localhost:8788`
- 生产环境: `https://game.free-node.xyz`

所有 API 调用使用 `window.getApiUrl('/endpoint')` 获取完整 URL。

### 访问方式

- 开发: http://localhost:5173/jxweb
- 生产: https://free-node.xyz/jxweb

### 下一步工作

1. 修改 `public/jx-web/Js/Main.js` 中的 AJAX 调用
2. 修改 `public/jx-web/Js/Pages.js` 等文件的 API 调用
3. 实现钱包地址作为用户标识的逻辑
4. 测试完整的认证和游戏流程
