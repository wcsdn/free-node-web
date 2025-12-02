#!/bin/bash

# FREE-NODE Web3 快速部署脚本
# 用于部署到 Cloudflare Pages

set -e

echo "🚀 开始部署 FREE-NODE Web3..."
echo ""

# 检查环境变量
if [ ! -f .env ]; then
    echo "⚠️  警告: .env 文件不存在"
    echo "📝 请先复制 .env.example 并配置 VITE_WALLETCONNECT_PROJECT_ID"
    exit 1
fi

# 构建项目
echo "📦 正在构建项目..."
yarn build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建成功"
echo ""

# 部署到 Cloudflare Pages
echo "🌐 正在部署到 Cloudflare Pages..."
wrangler pages deploy dist --project-name=free-node-web

if [ $? -eq 0 ]; then
    echo ""
    echo "✨ 部署成功！"
    echo "🔗 访问: https://free-node-web.pages.dev"
else
    echo "❌ 部署失败"
    exit 1
fi
