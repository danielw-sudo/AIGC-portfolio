# Deploy with AI

You don't need to know how to code. Just paste the prompt below into an AI coding IDE.

<p align="center">
  <a href="#english">English</a> | 
  <a href="#chinese">简体中文</a> | 
  <a href="#japanese">日本語</a>
</p>

---

<div id="english"></div>

## What you need before starting

1. **A GitHub account** — you probably already have one
2. **A Cloudflare account** (free) — sign up at [dash.cloudflare.com](https://dash.cloudflare.com)
3. **A Cloudflare API token** — [create one here](https://dash.cloudflare.com/profile/api-tokens):
   - Click **Create Token**
   - Use the **"Edit Cloudflare Workers"** template
   - Under **Account Resources**, add: **D1 (Edit)** and **Workers R2 Storage (Edit)**
   - Click **Continue to summary → Create Token**
   - Copy the token and save it somewhere safe (you'll paste it once during setup)
4. **An AI coding IDE** — pick one:
   - [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (best, requires subscription)
   - [Antigravity by Google](https://antigravity.dev) (free tier includes Claude)

## Fork first

1. Go to this repo on GitHub
2. Click **Fork** (top right)
3. You now own a copy — that's your portfolio repo

## Open your AI IDE

Connect it to your forked repo, then paste the prompt below.

---

## The Prompt

Copy everything inside the box and paste it into your AI IDE chat:

```text
I just forked an AIGC Portfolio template and I want to deploy it.
Here's my Cloudflare API token: [PASTE YOUR TOKEN HERE]

Please run the setup script for me:

1. Read src/QuickStart/SETUP.md and setup.sh to understand the project
2. Export my Cloudflare token: export CLOUDFLARE_API_TOKEN="[the token I gave you]"
3. Run: bash setup.sh
4. When the script asks questions, use these answers:
   - Site name: [YOUR SITE NAME, e.g. "Luna's AI Gallery"]
   - Author name: [YOUR NAME]
   - Site URL: just press Enter for default
   - R2 public URL: just press Enter for default
   - D1 database name: just press Enter for default
   - R2 bucket name: just press Enter for default
5. If it asks about GitHub Actions, say Yes
6. After setup completes, tell me my site URL and what to do next

Don't explain the code. Just do the steps and tell me the result.
```

Replace the `[BRACKETED PARTS]` with your actual info before pasting.

---

## After deployment

Your site is live. Visit `/admin` to:
- Set your hero title and subtitle
- Upload your first AI artwork
- Write your first blog post
- Pick AI models for auto-tagging

## Protect your admin panel

Ask your AI IDE:

```text
Set up Cloudflare Zero Trust to protect my /admin routes.
Walk me through the steps in the Cloudflare dashboard.
Only my email should have access.
```

## Add AI provider keys (optional)

Cloudflare Workers AI is free and works out of the box. For more models:

```text
Help me add my NVIDIA API key and Google AI key as Wrangler secrets.
```

---

## Troubleshooting

Paste this into your AI IDE if something goes wrong:

```text
The AIGC Portfolio setup failed. Check the error output above,
diagnose the problem, and fix it. Then re-run the failed step.
```

---

<div id="chinese"></div>

## 🇨🇳 简体中文 (Simplified Chinese)

您不需要掌握编程知识。只需将下方的提示词（Prompt）粘贴到 AI 编程 IDE 中即可。

### 开始前的准备工作

1. **GitHub 账号** — 您可能已经拥有了。
2. **Cloudflare 账号** (免费) — 在 [dash.cloudflare.com](https://dash.cloudflare.com) 注册。
3. **Cloudflare API 令牌** — [在此处创建](https://dash.cloudflare.com/profile/api-tokens):
   - 点击 **创建令牌 (Create Token)**
   - 使用 **“编辑 Cloudflare Workers”** 模板
   - 在 **账户资源 (Account Resources)** 中，添加：**D1 (编辑)** 和 **Workers R2 存储 (编辑)**
   - 点击 **继续以显示摘要 → 创建令牌**
   - 复制令牌并妥善保存（设置时需要用到）。
4. **AI 编程 IDE** — 选择其一：
   - [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (推荐，需订阅)
   - [Antigravity by Google](https://antigravity.dev) (免费版包含 Claude)

### 首先 Fork 仓库

1. 访问 GitHub 上的本项目仓库。
2. 点击右上角的 **Fork**。
3. 您现在拥有了一个副本 —— 这就是您的作品集仓库。

### 打开 AI IDE

连接到您 Fork 的仓库，然后粘贴下方的提示词。

---

### 提示词 (Prompt)

复制框内的所有内容并粘贴到您的 AI IDE 聊天框中：

```text
我刚刚 Fork 了一个 AIGC Portfolio 模板，我想部署它。
这是我的 Cloudflare API 令牌: [在此粘贴您的令牌]

请帮我运行设置脚本：

1. 阅读 src/QuickStart/SETUP.md 和 setup.sh 以了解项目内容。
2. 导出我的 Cloudflare 令牌: export CLOUDFLARE_API_TOKEN="[我提供给你的令牌]"
3. 运行: bash setup.sh
4. 当脚本提问时，使用以下答案：
    - Site name (站点名称): [您的站点名称，例如 "Luna's AI Gallery"]
    - Author name (作者名称): [您的名字]
    - Site URL: 直接按回车使用默认值
    - R2 public URL: 直接按回车使用默认值
    - D1 database name: 直接按回车使用默认值
    - R2 bucket name: 直接按回车使用默认值
5. 如果询问有关 GitHub Actions 的问题，回答 Yes。
6. 设置完成后，告诉我我的站点 URL 以及下一步该做什么。

不要解释代码。只需执行步骤并告知我结果。
```

请在粘贴前将 `[中括号部分]` 替换为您的实际信息。

---

<div id="japanese"></div>

## 🇯🇵 日本語 (Japanese)

コーディングの知識は不要です。以下のプロンプトを AI プログラミング IDE に貼り付けるだけです。

### 開始前に必要なもの

1. **GitHub アカウント** — すでにお持ちかと思います。
2. **Cloudflare アカウント** (無料) — [dash.cloudflare.com](https://dash.cloudflare.com) で登録。
3. **Cloudflare API トークン** — [ここから作成](https://dash.cloudflare.com/profile/api-tokens):
   - **トークンを作成** をクリック
   - **「Cloudflare Workers を編集する」** テンプレートを使用
   - **アカウントリソース** で、**D1 (編集)** と **Workers R2 ストレージ (編集)** を追加
   - **概要に進む → トークンを作成** をクリック
   - トークンをコピーして安全な場所に保存してください（セットアップ中に一度使用します）。
4. **AI プログラミング IDE** — いずれかを選択:
   - [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (推奨、サブスクリプションが必要)
   - [Antigravity by Google](https://antigravity.dev) (無料枠に Claude が含まれます)

### 最初にフォークする

1. GitHub でこのリポジトリにアクセスします。
2. **Fork** (右上のボタン) をクリックします。
3. これであなたのコピーが作成されました。これがあなたのポートフォリオ用リポジトリになります。

### AI IDE を開く

フォークしたリポジトリに接続し、以下のプロンプトを貼り付けます。

---

### プロンプト

枠内のすべてをコピーして、AI IDE のチャットに貼り付けてください：

```text
AIGC Portfolio テンプレートをフォークしたので、デプロイしたいです。
私の Cloudflare API トークンはこちらです: [ここにトークンを貼り付け]

セットアップスクリプトを実行してください：

1. src/QuickStart/SETUP.md と setup.sh を読んでプロジェクトを理解してください。
2. Cloudflare トークンをエクスポートする: export CLOUDFLARE_API_TOKEN="[提供したトークン]"
3. 実行: bash setup.sh
4. スクリプトで質問が出たら、以下の回答を使用してください：
    - Site name: [サイト名、例: "Luna's AI Gallery"]
    - Author name: [あなたの名前]
    - Site URL: そのまま Enter（デフォルト）
    - R2 public URL: そのまま Enter（デフォルト）
    - D1 database name: そのまま Enter（デフォルト）
    - R2 bucket name: そのまま Enter（デフォルト）
5. GitHub Actions について聞かれたら、「Yes」と答えてください。
6. セットアップが完了したら、サイトの URL と次のステップを教えてください。

コードの説明は不要です。手順を実行し、結果だけを報告してください。
```

貼り付ける前に、`[ブラケットで囲まれた部分]` を実際の情報に書き換えてください。

---

[⬅️ Back to README](../../README.md)
