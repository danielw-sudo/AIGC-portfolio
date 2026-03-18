# AIGC Portfolio — Setup Guide | 设置指南 | セットアップガイド

<p align="center">
  <a href="#english">English</a> | 
  <a href="#chinese">简体中文</a> | 
  <a href="#japanese">日本語</a>
</p>

---

<div id="english"></div>

# AIGC Portfolio — Setup Guide

Deploy your own AI art gallery in ~15 minutes. No CLI required for basic setup.

---

## Quick Setup (Automated)

If you have Node.js 20+ installed locally, the setup script handles everything — creates your database, storage bucket, patches config, and deploys:

```bash
git clone [https://github.com/YOUR_USERNAME/AIGC-portfolio.git](https://github.com/YOUR_USERNAME/AIGC-portfolio.git)
cd AIGC-portfolio
bash setup.sh
```

You'll need a [Cloudflare API token](https://dash.cloudflare.com/profile/api-tokens) with **Workers**, **D1**, and **R2** edit permissions (use the "Edit Cloudflare Workers" template and add D1 + R2).

After the script finishes, skip to [Step 7 (Zero Trust)](#step-7-set-up-zero-trust-optional-but-recommended) to protect your admin panel.

---

## Manual Setup

Follow the steps below if you prefer to set things up manually, or if the automated script doesn't suit your environment.

### Prerequisites

- GitHub account
- Cloudflare account (free tier works)
- Node.js 20+ (for local development only)

---

### Step 1: Fork This Repo

Click **"Use this template"** or **Fork** on GitHub.
Clone it locally if you want to develop:

```bash
git clone [https://github.com/YOUR_USERNAME/AIGC-portfolio.git](https://github.com/YOUR_USERNAME/AIGC-portfolio.git)
cd AIGC-portfolio
npm install
```

---

### Step 2: Create Cloudflare Resources

Log into the [Cloudflare Dashboard](https://dash.cloudflare.com).

### 2a. Find your Account ID

1. Go to **Workers & Pages** in the sidebar
2. Copy your **Account ID** from the right sidebar

### 2b. Create a D1 Database

1. Go to **Workers & Pages → D1 SQL Database**
2. Click **Create database**
3. Name it (e.g., `aigc-portfolio-db`)
4. Copy the **Database ID** after creation

### 2c. Create an R2 Bucket

1. Go to **R2 Object Storage → Create bucket**
2. Name it (e.g., `aigc-portfolio-images`)
3. (Optional) Set up a **custom domain** for public access under bucket settings → Public access

### 2d. Create a Cloudflare API Token

1. Go to **My Profile → API Tokens → Create Token**
2. Use the **"Edit Cloudflare Workers"** template
3. Add these permissions:
   - **Account** → D1 → Edit
   - **Account** → Workers R2 Storage → Edit
   - **Account** → Workers AI → Read (for AI features)
4. Copy the token — you'll need it for GitHub Actions

---

### Step 3: Configure wrangler.json

Open `wrangler.json` and replace the placeholder values:

```json
{
  "name": "aigc-portfolio",
  "account_id": "YOUR_CLOUDFLARE_ACCOUNT_ID",
  "d1_databases": [{
    "binding": "DB",
    "database_name": "aigc-portfolio-db",
    "database_id": "YOUR_D1_DATABASE_ID"
  }],
  "r2_buckets": [{
    "binding": "IMAGES",
    "bucket_name": "aigc-portfolio-images"
  }],
  "vars": {
    "R2_PUBLIC_URL": "[https://your-r2-domain.example.com](https://your-r2-domain.example.com)",
    "SITE_NAME": "My AI Gallery",
    "SITE_URL": "[https://your-site.example.com](https://your-site.example.com)",
    "SITE_AUTHOR": "Your Name"
  }
}
```

Also update `robots.txt` with your actual domain for the Sitemap URL.

---

### Step 4: Add GitHub Secret

1. Go to your forked repo → **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `CLOUDFLARE_API_TOKEN`
4. Value: paste the API token from Step 2d

---

### Step 5: Deploy

**First deploy:** Go to your repo's **Actions** tab and click **"Deploy to Cloudflare Workers"** → **Run workflow**. This lets you verify everything works before enabling auto-deploy.

**After that:** every push to `main` will auto-deploy via GitHub Actions (requires the `CLOUDFLARE_API_TOKEN` secret from Step 4).

Or deploy from the command line:

```bash
npm run deploy
```

---

### Step 6: Bootstrap the Database

After the first deploy, your site will be live but empty.

1. Visit `https://your-worker.your-subdomain.workers.dev/admin/migrations`
2. Paste the contents of `schema.sql` into the SQL box
3. Click **Execute**

The database is now ready.

---

## Step 7: Set Up Zero Trust (Optional but Recommended)

Protect your `/admin` routes with Cloudflare Access:

1. Go to **Zero Trust → Access → Applications → Add an application**
2. Type: **Self-hosted**
3. Application domain: `your-domain.com` with path `/admin/*`
4. Add a policy: **Allow** → **Emails** → your email address
5. Auth method: **One-time PIN** (sent to your email)

Now only you can access the admin panel.

---

## Step 8: Configure Your Site

Log into `/admin` and:

1. **Site Config** — set hero title, subtitle, header/footer links, meta descriptions
2. **AI Settings** — choose models for text generation and vision tagging
3. **New Gallery Entry** — upload your first artwork
4. **New Blog Post** — write your first post

---

## Optional: AI Provider Keys

The site works without any AI keys — Cloudflare Workers AI is included in your Cloudflare account's free tier (subject to daily limits). For additional providers:

### NVIDIA API
1. Get a key at [build.nvidia.com](https://build.nvidia.com)
2. Add as Wrangler secret: `npx wrangler secret put NVIDIA_API_KEY`

### Google AI
1. Get a key at [aistudio.google.com](https://aistudio.google.com)
2. Add as Wrangler secret: `npx wrangler secret put GOOGLE_AI_KEY`

---

## Local Development

```bash
npm install
npm run dev
```

This starts the Astro dev server with D1/R2 local emulation.
Local database lives in `.wrangler/state/v3`.

To bootstrap local DB:
```bash
npm run db:schema
npm run db:seed
```

---

## Environment Variables Reference

| Variable | Where | Required | Description |
|----------|-------|----------|-------------|
| `CLOUDFLARE_API_TOKEN` | GitHub Secret | Yes | Deploys via GitHub Actions |
| `account_id` | wrangler.json | Yes | Your Cloudflare account ID |
| `database_id` | wrangler.json | Yes | Your D1 database ID |
| `R2_PUBLIC_URL` | wrangler.json vars | Yes | Public URL for your R2 bucket |
| `SITE_NAME` | wrangler.json vars | No | Site name (default: "AIGC Portfolio") |
| `SITE_URL` | wrangler.json vars | No | Canonical URL (default: "https://example.com") |
| `SITE_AUTHOR` | wrangler.json vars | No | Author name for JSON-LD |
| `NVIDIA_API_KEY` | Wrangler secret | No | NVIDIA AI API key |
| `GOOGLE_AI_KEY` | Wrangler secret | No | Google AI API key |

---

<div id="chinese"></div>

# AIGC Portfolio — 设置指南

大约 15 分钟即可部署您自己的 AI 艺术展厅。基础设置无需使用命令行。

---

## 快速设置 (自动)

如果您本地安装了 Node.js 20+，设置脚本将处理所有事务 —— 创建数据库、存储桶、修补配置并部署：

```bash
git clone [https://github.com/YOUR_USERNAME/AIGC-portfolio.git](https://github.com/YOUR_USERNAME/AIGC-portfolio.git)
cd AIGC-portfolio
bash setup.sh
```

您需要一个具有 **Workers**、**D1** 和 **R2** 编辑权限的 [Cloudflare API 令牌](https://dash.cloudflare.com/profile/api-tokens)（使用“Edit Cloudflare Workers”模板并添加 D1 + R2）。

脚本完成后，跳至 [步骤 7 (Zero Trust)](#step-7-set-up-zero-trust-optional-but-recommended) 以保护您的管理面板。

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
git clone [https://github.com/YOUR_USERNAME/AIGC-portfolio.git](https://github.com/YOUR_USERNAME/AIGC-portfolio.git)
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
    "R2_PUBLIC_URL": "[https://your-r2-domain.example.com](https://your-r2-domain.example.com)",
    "SITE_NAME": "我的 AI 展厅",
    "SITE_URL": "[https://your-site.example.com](https://your-site.example.com)",
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

<div id="japanese"></div>

# AIGC Portfolio — セットアップガイド

約15分で独自のAIアートギャラリーをデプロイできます。基本的なセットアップにCLIは不要です。

---

## クイックセットアップ (自動)

ローカルに Node.js 20+ がインストールされている場合、セットアップスクリプトがすべてを処理します。データベース、ストレージバケットの作成、設定の適用、およびデプロイを実行します。

```bash
git clone [https://github.com/YOUR_USERNAME/AIGC-portfolio.git](https://github.com/YOUR_USERNAME/AIGC-portfolio.git)
cd AIGC-portfolio
bash setup.sh
```

**Workers**、**D1**、および **R2** の編集権限を持つ [Cloudflare API トークン](https://dash.cloudflare.com/profile/api-tokens)が必要です（"Edit Cloudflare Workers" テンプレートを使用し、D1 と R2 を追加してください）。

スクリプトが終了したら、[ステップ 7 (Zero Trust)](#step-7-set-up-zero-trust-optional-but-recommended) に進み、管理パネルを保護してください。

---

## 手動セットアップ

手動で設定したい場合や、自動スクリプトが環境に合わない場合は、以下の手順に従ってください。

### 前提条件

- GitHub アカウント
- Cloudflare アカウント（無料プランで可）
- Node.js 20+（ローカル開発用のみ）

---

### ステップ 1: このリポジトリをフォークする

GitHub で **"Use this template"** または **Fork** をクリックします。
開発を行う場合はローカルにクローンしてください：

```bash
git clone [https://github.com/YOUR_USERNAME/AIGC-portfolio.git](https://github.com/YOUR_USERNAME/AIGC-portfolio.git)
cd AIGC-portfolio
npm install
```

---

### ステップ 2: Cloudflare リソースの作成

[Cloudflare ダッシュボード](https://dash.cloudflare.com)にログインします。

### 2a. アカウント ID を確認する

1. サイドバーの **Workers & Pages** に移動します
2. 右サイドバーから **Account ID** をコピーします

### 2b. D1 データベースを作成する

1. **Workers & Pages → D1 SQL Database** に移動します
2. **Create database** をクリックします
3. 名前を付けます（例：`aigc-portfolio-db`）
4. 作成後、**Database ID** をコピーします

### 2c. R2 バケットを作成する

1. **R2 Object Storage → Create bucket** に移動します
2. 名前を付けます（例：`aigc-portfolio-images`）
3. （任意）バケット設定 → Public access で、公開アクセス用の **カスタムドメイン** を設定します

### 2d. Cloudflare API トークンを作成する

1. **My Profile → API Tokens → Create Token** に移動します
2. **"Edit Cloudflare Workers"** テンプレートを使用します
3. 以下の権限を追加します：
   - **Account** → D1 → Edit
   - **Account** → Workers R2 Storage → Edit
   - **Account** → Workers AI → Read (AI機能用)
4. トークンをコピーします。GitHub Actions で必要になります

---

### ステップ 3: wrangler.json の設定

`wrangler.json` を開き、プレースホルダーの値を置き換えます：

```json
{
  "name": "aigc-portfolio",
  "account_id": "あなたのアカウントID",
  "d1_databases": [{
    "binding": "DB",
    "database_name": "aigc-portfolio-db",
    "database_id": "あなたのD1データベースID"
  }],
  "r2_buckets": [{
    "binding": "IMAGES",
    "bucket_name": "aigc-portfolio-images"
  }],
  "vars": {
    "R2_PUBLIC_URL": "[https://your-r2-domain.example.com](https://your-r2-domain.example.com)",
    "SITE_NAME": "私のAIギャラリー",
    "SITE_URL": "[https://your-site.example.com](https://your-site.example.com)",
    "SITE_AUTHOR": "あなたの名前"
  }
}
```

また、サイトマップ URL のために `robots.txt` を実際のドメインで更新してください。

---

### ステップ 4: GitHub Secret の追加

1. フォークしたリポジトリ → **Settings → Secrets and variables → Actions** に移動します
2. **New repository secret** をクリックします
3. 名前：`CLOUDFLARE_API_TOKEN`
4. 値：ステップ 2d の API トークンを貼り付けます

---

### ステップ 5: デプロイ

**初回デプロイ：** リポジトリの **Actions** タブで **"Deploy to Cloudflare Workers"** → **Run workflow** をクリックします。自動デプロイを有効にする前に、すべてが正しく動作することを確認できます。

**以降：** `main` ブランチへのプッシュごとに GitHub Actions で自動デプロイされます（ステップ 4 の `CLOUDFLARE_API_TOKEN` secret が必要です）。

またはコマンドラインからデプロイ：

```bash
npm run deploy
```

---

### ステップ 6: データベースの初期化

最初のデプロイ後、サイトは公開されますが内容は空です。

1. `https://your-worker.your-subdomain.workers.dev/admin/migrations` にアクセスします
2. `schema.sql` の内容を SQL ボックスに貼り付けます
3. **Execute** をクリックします

これでデータベースの準備が整いました。

---

## ステップ 7: Zero Trust の設定 (任意ですが推奨)

Cloudflare Access で `/admin` ルートを保護します：

1. **Zero Trust → Access → Applications → Add an application** に移動します
2. タイプ：**Self-hosted**
3. アプリケーションドメイン：`your-domain.com`、パスは `/admin/*`
4. ポリシーを追加：**Allow** → **Emails** → あなたのメールアドレス
5. 認証方法：**One-time PIN**（メールに送信されます）

これで、あなただけが管理パネルにアクセスできるようになります。

---

## ステップ 8: サイトの設定

`/admin` にログインして以下を行います：

1. **Site Config** — メインタイトル、サブタイトル、ヘッダー/フッターリンク、メタ説明を設定します
2. **AI Settings** — テキスト生成とビジョンタグ付け用のモデルを選択します
3. **New Gallery Entry** — 最初のアートワークをアップロードします
4. **New Blog Post** — 最初の記事を書きます

---

## オプション: AI プロバイダーキー

サイトは AI キーなしでも動作します。Cloudflare Workers AI はご自身の Cloudflare アカウントの無料枠に含まれています（1 日の利用制限あり）。追加のプロバイダーを利用する場合：

### NVIDIA API
1. [build.nvidia.com](https://build.nvidia.com) でキーを取得します
2. Wrangler secret として追加：`npx wrangler secret put NVIDIA_API_KEY`

### Google AI
1. [aistudio.google.com](https://aistudio.google.com) でキーを取得します
2. Wrangler secret として追加：`npx wrangler secret put GOOGLE_AI_KEY`

---

## ローカル開発

```bash
npm install
npm run dev
```

これにより、D1/R2 のローカルエミュレーションを含む Astro 開発サーバーが起動します。
ローカルデータベースは `.wrangler/state/v3` に保存されます。

ローカル DB の初期化：
```bash
npm run db:schema
npm run db:seed
```

---

## 環境変数リファレンス

| 変数名 | 場所 | 必須 | 説明 |
|----------|-------|----------|-------------|
| `CLOUDFLARE_API_TOKEN` | GitHub Secret | はい | GitHub Actions 経由のデプロイに使用 |
| `account_id` | wrangler.json | はい | Cloudflare アカウント ID |
| `database_id` | wrangler.json | はい | D1 データベース ID |
| `R2_PUBLIC_URL` | wrangler.json vars | はい | R2 バケットの公開 URL |
| `SITE_NAME` | wrangler.json vars | いいえ | サイト名（デフォルト: "AIGC Portfolio"） |
| `SITE_URL` | wrangler.json vars | いいえ | 正準 URL（デフォルト: "https://example.com"） |
| `SITE_AUTHOR` | wrangler.json vars | いいえ | JSON-LD 用の著者名 |
| `NVIDIA_API_KEY` | Wrangler secret | いいえ | NVIDIA AI API キー |
| `GOOGLE_AI_KEY` | Wrangler secret | いいえ | Google AI API キー |

---

[⬅️ Back to README](../../README.md)
