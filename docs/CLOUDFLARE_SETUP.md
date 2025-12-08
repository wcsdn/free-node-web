# Cloudflare Pages 配置指南

## 🔧 更新 Cloudflare Pages 构建配置

你需要在 Cloudflare Dashboard 上更新构建设置，因为项目已经从 Create React App 迁移到 Vite。

### 📍 访问配置页面

1. 打开你的 Cloudflare Pages 项目：
   ```
   https://dash.cloudflare.com/2ed0456a5784e1a98c4676eb6c131336/pages/view/free-node-web
   ```

2. 点击 **Settings** 标签

3. 找到 **Build & deployments** 部分

---

## ⚙️ 需要修改的配置

### 构建配置 (Build configuration)

| 配置项 | 旧值 (CRA) | 新值 (Vite) |
|--------|-----------|-------------|
| **Framework preset** | Create React App | None |
| **Build command** | `npm install && npm run build` | `npm run build` |
| **Build output directory** | `build` 或 `/dist` | **`dist`** ⚠️ 重要！ |
| **Root directory** | `/` | `/` (不变) |

### 环境变量 (Environment variables)

确保设置了以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_WALLETCONNECT_PROJECT_ID` | `你的 Project ID` | WalletConnect 项目 ID |
| `NODE_VERSION` | `18` | Node.js 版本（可选） |

---

## 📝 详细步骤

### 1. 更新构建输出目录

这是**最重要**的修改！

1. 在 Settings 页面找到 **Build configuration**
2. 找到 **Build output directory** 字段
3. 将 `build` 或 `/dist` 改为 **`dist`**（不要前面的斜杠）
4. 点击 **Save** 保存

### 2. 更新构建命令

简化构建命令（Cloudflare 会自动安装依赖）：

```bash
npm run build
```

**注意：** 不需要 `npm install &&`，Cloudflare Pages 检测到 `package-lock.json` 后会自动运行 `npm ci`

### 3. 添加环境变量

1. 在 Settings 页面找到 **Environment variables**
2. 点击 **Add variable**
3. 添加：
   - **Variable name**: `VITE_WALLETCONNECT_PROJECT_ID`
   - **Value**: `2d0b34f43158d2d790b6f53945e95391`
   - **Environment**: Production (和 Preview，如果需要)
4. 点击 **Save**

---

## 🔄 触发重新部署

配置更新后，你需要触发一次新的部署：

### 方法 1：通过 Dashboard

1. 进入 **Deployments** 标签
2. 找到最新的部署
3. 点击 **Retry deployment**

### 方法 2：推送代码

```bash
git add .
git commit -m "chore: 更新 Cloudflare Pages 配置"
git push origin main
```

### 方法 3：手动部署

```bash
yarn deploy
```

---

## ✅ 验证配置

部署完成后，访问你的网站：
- https://free-node-web.pages.dev

检查：
- ✅ Matrix 字符雨背景正常显示
- ✅ News Terminal 能加载新闻
- ✅ Web3 钱包连接按钮显示
- ✅ 没有 404 错误

---

## 🚨 常见问题

### 问题 1：部署后显示 404

**原因：** 构建输出目录配置错误

**解决：** 确保 **Build output directory** 设置为 `dist`（不是 `build`）

### 问题 2：环境变量未生效

**原因：** 环境变量名称错误或未保存

**解决：** 
1. 确保变量名是 `VITE_WALLETCONNECT_PROJECT_ID`（必须以 `VITE_` 开头）
2. 保存后重新部署

### 问题 3：构建失败

**原因：** Node.js 版本不兼容

**解决：** 在环境变量中添加 `NODE_VERSION=18`

---

## 📊 配置对比

### 旧配置 (Create React App)
```
Framework: Create React App
Build command: npm install && npm run build
Output directory: build 或 /dist
```

### 新配置 (Vite + npm)
```
Framework: None
Build command: npm run build
Output directory: dist  ⚠️ 关键修改（不要前面的斜杠）
Node.js version: 18 或 22（推荐）
```

**说明：**
- Cloudflare Pages 会自动检测 `package-lock.json` 并运行 `npm ci`
- 不需要在构建命令中手动添加 `npm install`
- 输出目录使用 `dist` 而不是 `/dist`

---

## 🔗 相关链接

- Cloudflare Pages Dashboard: https://dash.cloudflare.com/2ed0456a5784e1a98c4676eb6c131336/pages/view/free-node-web
- Cloudflare Pages 文档: https://developers.cloudflare.com/pages/
- Vite 部署指南: https://vitejs.dev/guide/static-deploy.html

---

## 💡 提示

- 修改配置后，Cloudflare 不会自动重新部署，需要手动触发
- 环境变量修改后也需要重新部署才能生效
- 建议先在 Preview 环境测试，确认无误后再部署到 Production
