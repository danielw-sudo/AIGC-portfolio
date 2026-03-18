# AIGC Portfolio — Setup Guide

Deploy your own AI art gallery in ~15 minutes. No CLI required for basic setup.

---

## Quick Setup (Automated)

If you have Node.js 20+ installed locally, the setup script handles everything — creates your database, storage bucket, patches config, and deploys:

```bash
git clone https://github.com/YOUR_USERNAME/AIGC-portfolio.git
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
git clone https://github.com/YOUR_USERNAME/AIGC-portfolio.git
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
    "R2_PUBLIC_URL": "https://your-r2-domain.example.com",
    "SITE_NAME": "My AI Gallery",
    "SITE_URL": "https://your-site.example.com",
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

[Back to README](../../README.md)
