# 🚀 AIGC portofolio

---

## 🌐 Internationalization / 多语言支持 / 多言語対応

**[English](#aigc-portofolio) | [中文说明](#zh--中文说明) | [日本語の説明](#jp--日本語の説明)**

---

![AIGC Portfolio Social Preview](./public/social-preview.png)

A production-ready, **AI-Agentic** art gallery and blog with an **extreme lightweight structure**. Built with **Astro 5** and powered by the **Cloudflare Ecosystem**.

> [!IMPORTANT]
> **No Coding Required.** This project is designed to build fast agentic workflows without vendor-locked heavy packages. Fast to deploy, easy to use, zero cost to start, and potential to go beyond and above. Fork the repo, follow the [Deployment Guide](./DEPLOY_WITH_AI.md), and have your site live in minutes.

---

## 🧭 Project Navigation
* [**🎨 Fast Deployment**] — Launch your site in 5 minutes.
* [**🛠️ Customize your site**] — Configure and customize your AI agents.
* [**💻 Develop new features**] — Scale, modify, and dev with Claude Code & Antigravity.
* [**🔑 Get Free API Keys**](./how-to-get-free-test-api.md) — Get started with free-tier keys for all supported AI providers.

---

## 🏗️ Workflow Overview

```mermaid
graph LR
    A([🍴 Fork the Repo]) --> B([🔑 Grab a Free API Key])
    B --> C([☁️ Deploy to Cloudflare])
    C --> D([🖼️ Drop in Your Art])
    D --> E{🤖 AI Agent}
    E -->|✨ Auto-tag & describe| F[(🗄️ Cloudflare D1)]
    E -->|📤 Store image| G[(📦 Cloudflare R2)]
    F & G --> H([🌐 Your Live Portfolio])
    H --> I([🎉 Share with the World!])

    style A fill:#6ee7b7,stroke:#059669,color:#000
    style B fill:#fcd34d,stroke:#d97706,color:#000
    style C fill:#93c5fd,stroke:#2563eb,color:#000
    style D fill:#c4b5fd,stroke:#7c3aed,color:#000
    style E fill:#f97316,stroke:#c2410c,color:#fff
    style F fill:#e2e8f0,stroke:#64748b,color:#000
    style G fill:#e2e8f0,stroke:#64748b,color:#000
    style H fill:#34d399,stroke:#059669,color:#000
    style I fill:#fb7185,stroke:#e11d48,color:#000
```
_Click the titles below to view the sections_
<details>
<summary>🚀 <b>How to Deploy with AI (0 coding)</b></summary>

### The "No-Code" Path
This workflow is designed for users who want a professional site without touching a terminal or writing code.

1. **Fork this Repo**: Click the "Fork" button at the top right to claim your own copy of the project.
2. **Cloudflare Integration**: Connect your GitHub account to Cloudflare Pages.
3. **Automated Provisioning**: Cloudflare will detect the configuration and automatically set up your database (D1) and image storage (R2).
4. **Go Live**: Your site is now live! Visit your unique URL to start sharing your art.

*See [**DEPLOY_WITH_AI.md**](./DEPLOY_WITH_AI.md) for a visual step-by-step guide.*
</details>

<details>
<summary>⚙️ <b>How to Set Up Your Site with AI</b></summary>

### Manage your site and your AI "employees"
If you are comfortable with API keys and settings, you can fine-tune how the AI works for you:

1. **API Selection**: Use the dashboard to toggle between **NVIDIA NIM**, **Google Gemini 3 Flash**, or **Cloudflare Worker AI** for your image analysis.
2. **System Prompting**: Tweak the "Agent Vibe" to change how descriptions are written (e.g., "Professional," "Poetic," or "Detailed Technical").
3. **Zero Trust Security**: Use Cloudflare Access to protect your `/admin` area so only you can manage the content.

*See [**SETUP.md**](./SETUP.md) for advanced configuration and [**how-to-get-free-test-api.md**](./how-to-get-free-test-api.md) for step-by-step instructions on obtaining free API keys.*
</details>

<details>
<summary>🛠️ <b>How to Build New Features (agentic coding)</b></summary>

### High-Velocity Agentic Development
This repository is a "Clean Slate" pre-configured for **Claude Code** and **Google Antigravity**.

1. **AI-Ready Workspace**: We have included the `.claude/` and `.antigravity/` directories. These contain the context and rules the AI needs to understand the project structure.
2. **Seamless Onboarding**: 
    * **Claude Code**: Run `claude` in the root. The agent will read your `CLAUDE.md` and be ready to refactor or add features instantly.
    * **Antigravity**: Use the `mission_control.json` to manage complex tasks across the Astro 5 codebase.
3. **Optimized for 2026**: Built with Tailwind 4 and Astro 5, utilizing the latest in container queries and CSS-next features.

> [!NOTE]
> `.claude/` and `.antigravity/` folders will be added with the next commit.
</details>

---

## 🛠️ The Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Astro 5 (SSR) |
| **Runtime** | Cloudflare Workers |
| **Database** | Cloudflare D1 (Serverless SQLite) |
| **Storage** | Cloudflare R2 (S3-compatible) |
| **AI Agents** | NVIDIA NIM + Google Gemini + CF Workers AI |
| **Styling** | Tailwind CSS 4 |

---

## 🌍 Usage, Ethics & Regulation

> [NOTICE]
> **Responsible AI Usage:** Free-tier keys are sufficient for testing and development — see [**how-to-get-free-test-api.md**](./how-to-get-free-test-api.md) for a guide on obtaining them. We recommend transitioning to paid AI model APIs for long-term production use to ensure higher data quality, increased processing capacity, and uninterrupted service.
>
> **Regional Compliance:**
> AI regulations (such as the EU AI Act, China's Generative AI Measures, or Canada's AIDA) vary by region. Please ensure your implementation complies with the local laws and data privacy regulations of your operating jurisdiction. As the operator of your fork, you are responsible for:
> 1. **Transparency:** Disclosing AI-generated content to your visitors.
> 2. **Data Privacy:** Ensuring your use of Vision-AI complies with local privacy laws regarding image metadata.
> 3. **Usage Accountability:** Maintaining responsibility for the accuracy and ethical impact of AI-generated outputs delivered through your platform.

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](https://github.com/danielw-sudo/AIGC-portfolio?tab=MIT-1-ov-file) for full details.

---
**Crafted with 🤖 AI Agents for the next generation of creators.**

---

## ZH / 中文说明

一个生产就绪、基于 **AI Agent** 的艺术馆与博客系统，拥有**极简架构**。基于 **Astro 5** 构建，并由 **Cloudflare 生态系统**驱动。

> [!IMPORTANT]
> **无需代码。** 本项目旨在构建快速的 Agent 工作流，不依赖任何供应商锁定的重型软件包。部署快、易使用、零成本启动，且极具扩展潜力。Fork 本仓库，按照 [部署指南](./DEPLOY_WITH_AI.md) 操作，几分钟内即可上线您的网站。

### 🚀 如何利用 AI 部署 (零代码)
**“无代码”路径**：专为不想接触终端或编写代码的用户设计。
1. **Fork 本仓库**：点击右上角的“Fork”按钮。
2. **Cloudflare 集成**：将您的 GitHub 账号连接至 Cloudflare Pages。
3. **自动配置**：Cloudflare 将检测配置并自动设置数据库 (D1) 和图像存储 (R2)。
4. **正式上线**：您的网站已就绪！访问您的唯一 URL 即可开始分享作品。

### ⚙️ 如何利用 AI 设置网站
**管理您的网站与 AI “员工”**：如果您熟悉 API 密钥，可以微调 AI 的工作方式。
1. **API 选择**：在控制面板切换 **NVIDIA NIM**、**Google Gemini 3 Flash** 或 **Cloudflare Worker AI** 进行图像分析。
2. **系统提示词 (Prompting)**：调整”Agent 氛围”以改变描述风格（如”专业”、”诗意”或”详细技术风”）。
3. **零信任安全**：使用 Cloudflare Access 保护您的 `/admin` 区域。

*如需了解如何免费获取各 AI 提供商的 API 密钥，请参阅 [**how-to-get-free-test-api.md**](./how-to-get-free-test-api.md)。*

### 🛠️ 如何开发新功能 (Agentic Coding)
**高速 Agent 开发**：本仓库是为 **Claude Code** 和 **Google Antigravity** 预配置的“干净模板”。
1. **AI 就绪工作区**：包含 `.claude/` 和 `.antigravity/` 目录，提供 AI 所需的项目上下文。
2. **无缝衔接**：运行 `claude` 即可根据 `CLAUDE.md` 立即进行重构或添加功能。
3. **面向 2026 优化**：基于 Tailwind 4 和 Astro 5 构建，利用最新的容器查询和 CSS 特性。

---

## JP / 日本語の説明

生産準備完了、**AI エージェント**ベースのギャラリー＆ブログシステムです。**極めて軽量な構造**で、**Astro 5** と **Cloudflare エコシステム**によって構築されています。

> [!IMPORTANT]
> **コーディング不要。** このプロジェクトは、ベンダーロックインされた重いパッケージを使わずに、高速なエージェントワークフローを構築するために設計されています。デプロイは迅速で、使いやすく、無料で開始でき、さらなる拡張性も秘めています。リポジトリを Fork し、[デプロイガイド](./DEPLOY_WITH_AI.md)に従うだけで、数分でサイトを公開できます。

### 🚀 AI を使用したデプロイ (ノーコード)
**「ノーコード」パス**：ターミナルやコードに触れたくないユーザー向けのワークフローです。
1. **リポジトリを Fork**：右上にある「Fork」ボタンをクリックします。
2. **Cloudflare 連携**：GitHub アカウントを Cloudflare Pages に接続します。
3. **自動プロビジョニング**：Cloudflare が設定を検出し、データベース (D1) と画像ストレージ (R2) を自動的にセットアップします。
4. **公開**：サイトがライブになりました！固有の URL にアクセスして作品の共有を開始しましょう。

### ⚙️ AI を使用したサイト設定
**サイトと AI 「従業員」の管理**：API キーの設定に慣れている場合は、AI の挙動を微調整できます。
1. **API の選択**：ダッシュボードを使用して、画像解析用に **NVIDIA NIM**、**Google Gemini 3 Flash**、または **Cloudflare Worker AI** を切り替えます。
2. **システムプロンプト**：エージェントの「雰囲気」を調整し、説明文のスタイル（「プロフェッショナル」、「詩的」、「詳細なテクニカル」など）を変更します。
3. **ゼロトラストセキュリティ**：Cloudflare Access を使用して `/admin` エリアを保護します。

*各 AI プロバイダーの無料 API キーの取得方法については、[**how-to-get-free-test-api.md**](./how-to-get-free-test-api.md) を参照してください。*

### 🛠️ 新機能の開発 (Agentic Coding)
**高速エージェント開発**：このリポジトリは **Claude Code** と **Google Antigravity** 用に事前構成された「クリーンな状態」です。
1. **AI 対応ワークスペース**：AI がプロジェクト構造を理解するために必要なコンテキストを含む `.claude/` および `.antigravity/` ディレクトリが含まれています。
2. **シームレスなオンボーディング**：`claude` を実行するだけで、エージェントが `CLAUDE.md` を読み込み、即座にリファクタリングや機能追加が可能になります。
3. **2026 年向け最適化**：Tailwind 4 と Astro 5 で構築され、最新のコンテナクエリや CSS 機能を利用しています。
