# 部署指南

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NUXT_BASE_URL` | 应用基础路径 | `/` |

## 部署方式

### 1. Vercel 部署（推荐）

适合独立访问，如 `https://your-app.vercel.app`

```bash
# 设置环境变量
NUXT_BASE_URL=/

# 构建
pnpm build:vercel

# 或直接在 Vercel 上部署（自动识别）
vercel --prod
```

**配置说明：**
- 使用 `vercel.json` 配置了 SPA 路由回退
- 静态资源长期缓存，HTML 不缓存
- 支持 API 路由代理到龙猫服务器

### 2. Hexo 博客嵌入

适合嵌入到个人博客中

```bash
# 设置环境变量
NUXT_BASE_URL=/totoro/

# 构建静态文件
pnpm build:embed

# 复制到 Hexo
rm -rf ../source/totoro
cp -r .output/public ../source/totoro

# 在 Hexo 中创建页面
# 参考 ../source/totoro-run/index.md
```

### 3. 本地开发

```bash
pnpm dev
```

访问 http://localhost:3000

## 常见问题

### Q: 页面白屏？
检查 `NUXT_BASE_URL` 是否设置正确。Vercel 用 `/`，子路径用 `/totoro/`。

### Q: API 404？
确保 `routeRules` 中的代理配置正确，且目标服务器可访问。

### Q: 样式丢失？
检查构建后的 HTML 中资源路径是否正确。
