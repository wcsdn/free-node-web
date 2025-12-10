# 🐰 Ghost Oracle - 神谕兔兔

AI 聊天助手，基于 DeepSeek API，Matrix 风格终端界面。

## 架构

```
前端 (ChatBtn + ChatPopup)
    ↓ POST /
Worker (ghost-oracle)
    ↓ 流式透传
DeepSeek API
```

## 组件结构

```
src/shared/components/
├── ChatBtn/           # 悬浮按钮 + 弹窗容器
│   ├── index.tsx
│   └── styles.css
├── ChatPopup/         # 聊天终端
│   ├── index.tsx
│   └── styles.css
└── LazyRabbit/        # 兔子 SVG 图标
    ├── index.tsx
    └── styles.css
```

## Worker 配置

路径: `workers/ghost-oracle/`

### 环境变量 (Secrets)

```bash
# 设置 DeepSeek API Key
npx wrangler secret put DEEPSEEK_API_KEY

# 设置 Turnstile Secret Key
npx wrangler secret put TURNSTILE_SECRET_KEY
```

### wrangler.toml

```toml
name = "ghost-oracle"
main = "src/index.ts"
workers_dev = true

routes = [
  { pattern = "oracle.free-node.xyz/*", zone_name = "free-node.xyz" }
]
```

## Turnstile 人机验证

- Site Key: `0x4AAAAAACFkDvmJNnbofax2` (前端)
- Secret Key: 在 Cloudflare Dashboard 获取 (后端)
- 使用 `react-turnstile` 包
- 每次弹窗只需验证一次

## 功能特性

1. **流式输出** - 打字机效果实时显示
2. **Markdown 渲染** - 代码块、行内代码、粗体
3. **人机验证** - Cloudflare Turnstile
4. **调皮兔子** - 点击显示气泡「要翘起来了...💕」
5. **状态提示** - 「正在摇尾巴...」

## 部署

```bash
npm run deploy:oracle
```

## API 费用

DeepSeek Chat 模型计费：
- 输入: ~¥1/百万 tokens
- 输出: ~¥2/百万 tokens

已设置 `max_tokens: 2048` 限制单次输出长度。
