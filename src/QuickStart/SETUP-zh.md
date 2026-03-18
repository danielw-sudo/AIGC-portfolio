# AIGC Portfolio — 设置指南

大约 15 分钟即可部署您自己的 AI 艺术展厅。基础设置无需使用命令行。

---

## 快速设置 (自动)

如果您本地安装了 Node.js 20+，设置脚本将处理所有事务 —— 创建数据库、存储桶、修补配置并部署：

```bash
git clone https://github.com/YOUR_USERNAME/AIGC-portfolio.git
cd AIGC-portfolio
bash setup.sh
```

您需要一个具有 **Workers**、**D1** 和 **R2** 编辑权限的 [Cloudflare API 令牌](https://dash.cloudflare.com/profile/api-tokens)（使用"Edit Cloudflare Workers"模板并添加 D1 + R2）。

脚本完成后，跳至 [步骤 7 (Zero Trust)](#步骤-7-设置-zero-trust-可选但建议) 以保护您的管理面板。

---

## 手动设置

如果您希望手动设置，或者自动脚本不适合您的环境，请按照以下步骤操作。

### 前提条件

- GitHub 账号
- Cloudflare 账号（免费版即可）
- Node.js 20+（仅用于本地开发）

---

### 步骤 1: Fork 此仓库

在 GitHub 上点击 **"Use this template"** 或 **Fork**。
如果您想进行开发，请克隆到本地：

```bash
git clone https://github.com/YOUR_USERNAME/AIGC-portfolio.git
cd AIGC-portfolio
npm install
```

---

### 步骤 2: 创建 Cloudflare 资源

登录 [Cloudflare 控制面板](https://dash.cloudflare.com)。

### 2a. 查找您的账户 ID (Account ID)

1. 在侧边栏中点击 **Workers & Pages**
2. 从右侧边栏复制您的 **Account ID**

### 2b. 创建 D1 数据库

1. 前往 **Workers & Pages → D1 SQL Database**
2. 点击 **Create database**
3. 命名（例如：`aigc-portfolio-db`）
4. 创建后复制 **Database ID**

### 2c. 创建 R2 存储桶 (Bucket)

1. 前往 **R2 Object Storage → Create bucket**
2. 命名（例如：`aigc-portfolio-images`）
3. (可选) 在存储桶设置 → 公共访问 (Public access) 下为公共访问设置 **自定义域 (Custom domain)**

### 2d. 创建 Cloudflare API 令牌

1. 前往 **My Profile → API Tokens → Create Token**
2. 使用 **"Edit Cloudflare Workers"** 模板
3. 添加这些权限：
   - **Account** → D1 → Edit
   - **Account** → Workers R2 Storage → Edit
   - **Account** → Workers AI → Read (用于 AI 功能)
4. 复制令牌 —— 您将在 GitHub Actions 中用到它

---

### 步骤 3: 配置 wrangler.json

打开 `wrangler.json` 并替换占位符的值：

```json
{
  "name": "aigc-portfolio",
  "account_id": "您的账户ID",
  "d1_databases": [{
    "binding": "DB",
    "database_name": "aigc-portfolio-db",
    "database_id": "您的D1数据库ID"
  }],
  "r2_buckets": [{
    "binding": "IMAGES",
    "bucket_name": "aigc-portfolio-images"
  }],
  "vars": {
    "R2_PUBLIC_URL": "https://your-r2-domain.example.com",
    "SITE_NAME": "我的 AI 展厅",
    "SITE_URL": "https://your-site.example.com",
    "SITE_AUTHOR": "您的名字"
  }
}
```

同时使用您的实际域名更新 `robots.txt` 中的网站地图 (Sitemap) URL。

---

### 步骤 4: 添加 GitHub Secret

1. 前往您 Fork 的仓库 → **Settings → Secrets and variables → Actions**
2. 点击 **New repository secret**
3. 名称: `CLOUDFLARE_API_TOKEN`
4. 值: 粘贴步骤 2d 中的 API 令牌

---

### 步骤 5: 部署

**首次部署：** 前往仓库的 **Actions** 标签页，点击 **"Deploy to Cloudflare Workers"** → **Run workflow**。这样可以在启用自动部署前验证一切正常。

**之后：** 每次向 `main` 推送代码都会通过 GitHub Actions 自动部署（需要步骤 4 中设置的 `CLOUDFLARE_API_TOKEN` secret）。

或者通过命令行部署：

```bash
npm run deploy
```

---

### 步骤 6: 初始化数据库

首次部署后，您的站点已上线但内容为空。

1. 访问 `https://your-worker.your-subdomain.workers.dev/admin/migrations`
2. 将 `schema.sql` 的内容粘贴到 SQL 框中
3. 点击 **Execute**

现在数据库已就绪。

---

## 步骤 7: 设置 Zero Trust (可选但建议)

使用 Cloudflare Access 保护您的 `/admin` 路由：

1. 前往 **Zero Trust → Access → Applications → Add an application**
2. 类型: **Self-hosted**
3. 应用程序域名: `your-domain.com`，路径为 `/admin/*`
4. 添加策略: **Allow** → **Emails** → 您的电子邮件地址
5. 身份验证方法: **One-time PIN** (发送到您的邮箱)

现在只有您可以访问管理面板。

---

## 步骤 8: 配置您的站点

登录 `/admin` 并进行以下操作：

1. **Site Config** — 设置主标题、副标题、页眉/页脚链接、Meta 描述
2. **AI Settings** — 选择文本生成和视觉标签模型
3. **New Gallery Entry** — 上传您的第一件艺术品
4. **New Blog Post** — 写下您的第一篇博文

---

## 可选: AI 提供商密钥 (AI Provider Keys)

该站点无需任何 AI 密钥即可工作——Cloudflare Workers AI 包含在您 Cloudflare 账号的免费套餐中（受每日用量限制）。对于其他提供商：

### NVIDIA API
1. 在 [build.nvidia.com](https://build.nvidia.com) 获取密钥
2. 添加为 Wrangler secret: `npx wrangler secret put NVIDIA_API_KEY`

### Google AI
1. 在 [aistudio.google.com](https://aistudio.google.com) 获取密钥
2. 添加为 Wrangler secret: `npx wrangler secret put GOOGLE_AI_KEY`

---

## 本地开发

```bash
npm install
npm run dev
```

这将启动具有 D1/R2 本地模拟的 Astro 开发服务器。
本地数据库存储在 `.wrangler/state/v3` 中。

初始化本地数据库：
```bash
npm run db:schema
npm run db:seed
```

---

## 环境变量参考

| 变量 | 位置 | 是否必填 | 描述 |
|----------|-------|----------|-------------|
| `CLOUDFLARE_API_TOKEN` | GitHub Secret | 是 | 通过 GitHub Actions 部署 |
| `account_id` | wrangler.json | 是 | 您的 Cloudflare 账户 ID |
| `database_id` | wrangler.json | 是 | 您的 D1 数据库 ID |
| `R2_PUBLIC_URL` | wrangler.json vars | 是 | 您 R2 存储桶的公共 URL |
| `SITE_NAME` | wrangler.json vars | 否 | 站点名称 (默认: "AIGC Portfolio") |
| `SITE_URL` | wrangler.json vars | 否 | 规范 URL (默认: "https://example.com") |
| `SITE_AUTHOR` | wrangler.json vars | 否 | 用于 JSON-LD 的作者姓名 |
| `NVIDIA_API_KEY` | Wrangler secret | 否 | NVIDIA AI API 密钥 |
| `GOOGLE_AI_KEY` | Wrangler secret | 否 | Google AI API 密钥 |

---

[返回 README](../../README.md)
