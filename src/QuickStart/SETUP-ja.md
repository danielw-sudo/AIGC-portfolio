# AIGC Portfolio — セットアップガイド

約15分で独自のAIアートギャラリーをデプロイできます。基本的なセットアップにCLIは不要です。

---

## クイックセットアップ (自動)

ローカルに Node.js 20+ がインストールされている場合、セットアップスクリプトがすべてを処理します。データベース、ストレージバケットの作成、設定の適用、およびデプロイを実行します。

```bash
git clone https://github.com/YOUR_USERNAME/AIGC-portfolio.git
cd AIGC-portfolio
bash setup.sh
```

**Workers**、**D1**、および **R2** の編集権限を持つ [Cloudflare API トークン](https://dash.cloudflare.com/profile/api-tokens)が必要です（"Edit Cloudflare Workers" テンプレートを使用し、D1 と R2 を追加してください）。

スクリプトが終了したら、[ステップ 7 (Zero Trust)](#ステップ-7-zero-trust-の設定-任意ですが推奨) に進み、管理パネルを保護してください。

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
git clone https://github.com/YOUR_USERNAME/AIGC-portfolio.git
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
    "R2_PUBLIC_URL": "https://your-r2-domain.example.com",
    "SITE_NAME": "私のAIギャラリー",
    "SITE_URL": "https://your-site.example.com",
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

[README に戻る](../../README.md)
