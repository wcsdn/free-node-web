# Info Hunter Worker 操作说明文档

## 项目简介

这是一个部署在 Cloudflare Workers 上的 Hacker News 爬虫，用 TypeScript 编写，可以抓取 HN 热榜前30条新闻并提供中文翻译。

**在线访问**：https://news.free-node.xyz

**项目信息**：
- 域名：free-node.xyz
- 子域名：news.free-node.xyz
- Cloudflare 账号：1340408028@qq.com
- Account ID：2ed0456a5784e1a98c4676eb6c131336

## 项目结构

```
info-hunter-worker/
├── src/
│   └── index.ts          # 主要业务逻辑
├── wrangler.toml         # Cloudflare Workers 配置文件
├── package.json          # Node.js 项目配置和依赖
├── tsconfig.json         # TypeScript 配置
└── README.md            # 本文档
```

## 环境要求

- Node.js >= 20.0.0
- npm 或 yarn
- Cloudflare 账号（用于部署）

## 安装步骤

### 1. 创建项目目录
```bash
mkdir info-hunter-worker
cd info-hunter-worker
```

### 2. 初始化项目文件

创建 `package.json`：
```json
{
  "name": "info-hunter-worker",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "start": "wrangler dev"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241127.0",
    "typescript": "^5.6.3",
    "wrangler": "^4.0.0"
  }
}
```

创建 `wrangler.toml`：
```toml
name = "info-hunter-worker"
main = "src/index.ts"
compatibility_date = "2024-11-01"
```

创建 `tsconfig.json`：
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

### 3. 安装依赖
```bash
npm install
```

## 核心代码说明

### 主要功能模块

1. **路由处理**：处理不同的 URL 路径
   - `/` - 返回 HTML 页面
   - `/api/news` - 返回 JSON 数据
   - `/test` - 返回测试数据

2. **数据抓取**：从 Hacker News 获取数据
   - 使用 `fetch()` 获取 HN 首页 HTML
   - 正则表达式解析标题和链接
   - 错误处理和降级机制

3. **中文翻译**：简单的关键词翻译
   - 预定义常用技术词汇映射
   - 批量替换英文关键词为中文

4. **HTML 渲染**：生成美观的网页界面
   - 响应式设计
   - 中英文双语显示

### 关键代码片段

**路由处理**：
```typescript
if (url.pathname === '/api/news') {
  const items = await fetchHackerNews();
  return Response.json(items, { headers: corsHeaders });
}
```

**数据解析**：
```typescript
const titleRegex = /<span class="titleline"><a href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
while ((match = titleRegex.exec(html)) && rank < 30) {
  // 解析标题和链接
}
```

**翻译功能**：
```typescript
const translations: Record<string, string> = {
  'Show HN': '展示 HN',
  'Ask HN': '问 HN',
  'AI': '人工智能',
  // ... 更多映射
};
```

## 本地开发

### 1. 启动开发服务器
```bash
npm run dev
# 或
npx wrangler dev
```

### 2. 测试接口
```bash
# 测试模拟数据
curl http://localhost:8787/test

# 测试真实数据（需要 remote 模式）
npx wrangler dev --remote
curl http://localhost:8787/api/news
```

### 3. 浏览器访问
- 主页：http://localhost:8787
- API：http://localhost:8787/api/news
- 测试：http://localhost:8787/test

## 部署流程

### 1. 登录 Cloudflare
```bash
npx wrangler login
```
这会打开浏览器，登录你的 Cloudflare 账号并授权。

### 2. 部署到生产环境
```bash
npm run deploy
# 或
npx wrangler deploy
```

### 3. 查看部署结果
部署成功后会显示类似：
```
Deployed info-hunter-worker triggers
https://news.free-node.xyz
```

**访问地址**：
- 主域名：https://news.free-node.xyz
- API 接口：https://news.free-node.xyz/api/news
- 测试数据：https://news.free-node.xyz/test

## 常见问题

### Q: 本地开发时 fetch 外部网站超时？
A: 这是 Wrangler 本地模式的限制，使用 `--remote` 参数：
```bash
npx wrangler dev --remote
```

### Q: 如何修改抓取数量？
A: 修改 `src/index.ts` 中的数字：
```typescript
while ((match = titleRegex.exec(html)) && rank < 30) // 改成你想要的数量
```

### Q: 如何添加更多翻译词汇？
A: 在 `translateTitle` 函数的 `translations` 对象中添加：
```typescript
const translations: Record<string, string> = {
  'your_english_word': '你的中文翻译',
  // ...
};
```

### Q: 如何自定义样式？
A: 修改 `renderHTML` 函数中的 CSS 样式。

## 监控和维护

### 查看日志
```bash
npx wrangler tail
```

### 查看部署状态
```bash
npx wrangler deployments list
```

### 删除部署
```bash
npx wrangler delete
```

## 扩展功能建议

1. **缓存机制**：添加 Cloudflare KV 存储缓存数据
2. **定时更新**：使用 Cron Triggers 定时抓取
3. **更好的翻译**：集成翻译 API（如百度翻译、腾讯翻译）
4. **数据统计**：记录访问量和热门文章
5. **RSS 输出**：提供 RSS 订阅功能

## 技术栈

- **运行环境**：Cloudflare Workers
- **开发语言**：TypeScript
- **构建工具**：Wrangler 4.x
- **数据来源**：Hacker News (news.ycombinator.com)
- **部署平台**：Cloudflare 边缘网络

## 性能特点

- **全球加速**：部署在 Cloudflare 的 300+ 边缘节点
- **零冷启动**：V8 Isolates 技术，毫秒级响应
- **自动扩容**：根据流量自动扩展
- **免费额度**：每天 100,000 次请求免费

---

*最后更新：2024年11月*


## KV 存储功能

### KV 命名空间信息
- **命名空间名称**：NEWS_CACHE
- **KV ID**：fe4901d1d41f4c8880ec776be03058fc
- **缓存键**：latest_news
- **缓存时长**：30分钟自动刷新

### API 接口说明

1. **GET /api/news** - 获取新闻数据
   - 优先从 KV 缓存读取（30分钟内有效）
   - 如果缓存过期或不存在，自动抓取最新数据并更新 KV
   - 返回格式：
   ```json
   {
     "items": [...],
     "timestamp": 1234567890,
     "updateTime": "2024-11-26 14:30:00"
   }
   ```

2. **GET /api/cache** - 查看缓存数据
   - 直接读取 KV 中存储的数据
   - 不会触发新的抓取

3. **GET /api/refresh** - 强制刷新
   - 立即抓取最新数据
   - 更新 KV 缓存
   - 返回更新后的数据

4. **GET /test** - 测试数据
   - 返回模拟数据，用于测试

### 使用示例

```bash
# 获取新闻（自动缓存）
curl https://news.free-node.xyz/api/news

# 查看当前缓存
curl https://news.free-node.xyz/api/cache

# 强制刷新数据
curl https://news.free-node.xyz/api/refresh
```

### KV 管理命令

```bash
# 查看 KV 中的数据
npx wrangler kv key get latest_news --namespace-id=fe4901d1d41f4c8880ec776be03058fc

# 手动删除缓存
npx wrangler kv key delete latest_news --namespace-id=fe4901d1d41f4c8880ec776be03058fc

# 列出所有键
npx wrangler kv key list --namespace-id=fe4901d1d41f4c8880ec776be03058fc
```
