# 部署指南

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 本地预览构建结果
npm run build
npm run preview
```

## 手动部署到 Cloudflare Pages

### 方法 1: 使用快速部署脚本（推荐）

```bash
# 一键构建并部署
bash scripts/deploy.sh

# 或使用 npm 命令
npm run deploy
```

### 方法 2: 使用 npm 命令

```bash
# 构建并部署到生产环境
npm run deploy:prod

# 部署到预览环境
npm run deploy:preview

# 快速部署（使用当前分支）
npm run deploy
```

### 方法 3: 手动执行

```bash
# 1. 构建项目
npm run build

# 2. 部署到 Cloudflare Pages
npx wrangler pages deploy dist --project-name=free-node-web
```

## 自动部署（GitHub Actions）

项目已配置 GitHub Actions 自动部署。

### 配置步骤：

1. **获取 Cloudflare API Token**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 进入 "My Profile" > "API Tokens"
   - 创建新 Token，权限选择 "Cloudflare Pages - Edit"

2. **Cloudflare Account ID**
   - 已配置: `2ed0456a5784e1a98c4676eb6c131336`

3. **配置 GitHub Secrets**
   - 进入 GitHub 仓库 Settings > Secrets and variables > Actions
   - 添加以下 secrets：
     - `CLOUDFLARE_API_TOKEN`: 你的 Cloudflare API Token
     - `VITE_WALLETCONNECT_PROJECT_ID`: 你的 WalletConnect Project ID

4. **触发部署**
   - 推送代码到 `main` 分支会自动触发生产部署
   - 创建 Pull Request 会自动创建预览部署

## 环境变量

项目需要以下环境变量：

```bash
# .env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

## 构建产物

- 构建目录: `dist/`
- 入口文件: `dist/index.html`
- 静态资源: `dist/assets/`

## Cloudflare Pages 配置

项目使用 `wrangler.toml` 配置文件：

```toml
name = "free-node-web"
compatibility_date = "2024-12-02"
account_id = "2ed0456a5784e1a98c4676eb6c131336"
pages_build_output_dir = "dist"
```

### 项目信息

- **项目名称**: free-node-web
- **Account ID**: 2ed0456a5784e1a98c4676eb6c131336
- **访问地址**: https://free-node-web.pages.dev

## 故障排查

### 构建失败

1. 检查 Node.js 版本（推荐 18+）
2. 清理依赖重新安装：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### 部署失败

1. 检查 Cloudflare API Token 权限
2. 确认 Account ID 正确
3. 查看 wrangler 日志：
   ```bash
   npx wrangler pages deploy dist --project-name=free-node-web --verbose
   ```

### 环境变量未生效

1. 确保 `.env` 文件存在
2. 环境变量必须以 `VITE_` 开头
3. 修改环境变量后需要重新构建

## 性能优化建议

当前构建有一些大文件警告，可以考虑：

1. **代码分割**
   ```js
   // 使用动态导入
   const Component = lazy(() => import('./Component'))
   ```

2. **手动分块**
   在 `vite.config.mjs` 中配置：
   ```js
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           'vendor': ['react', 'react-dom'],
           'web3': ['wagmi', 'viem', '@rainbow-me/rainbowkit']
         }
       }
     }
   }
   ```

3. **调整警告阈值**
   ```js
   build: {
     chunkSizeWarningLimit: 1000
   }
   ```
