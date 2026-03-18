# How to Get Free / Test API Keys

This project supports three AI providers. One works with no key at all; the other two offer free tiers sufficient for testing and light personal use.

---

## 1. Cloudflare Workers AI — No Key Required

Cloudflare Workers AI is built into the Cloudflare Workers runtime. As long as you deploy this project to Cloudflare Workers (free plan is fine), you get AI inference automatically with no API key needed.

**Free tier limits (as of 2025):**

| Model tier | Estimated calls/day |
|------------|-------------------|
| Fast       | ~1,400            |
| Balanced   | ~625              |
| Quality    | ~310              |

These are estimates based on Cloudflare's [neuron budget](https://developers.cloudflare.com/workers-ai/platform/pricing/). Limits are per Cloudflare account and subject to change.

**Steps:**
1. Create a free Cloudflare account at [dash.cloudflare.com](https://dash.cloudflare.com)
2. Deploy the project following [SETUP.md](./SETUP-en.md)
3. Workers AI works automatically — no extra configuration needed

---

## 2. NVIDIA API — Free Credits on Sign-Up

NVIDIA's API platform ([build.nvidia.com](https://build.nvidia.com)) gives new accounts **1,000 free inference credits** on sign-up. This is enough for substantial testing of vision and language models.

**Steps:**
1. Go to [build.nvidia.com](https://build.nvidia.com)
2. Sign up with a free account (email required)
3. Navigate to any model page and click **Get API Key**
4. Copy your key and add it as a Wrangler secret:
   ```bash
   npx wrangler secret put NVIDIA_API_KEY
   ```
5. Paste your key when prompted

**Notes:**
- Free credits do not expire but are consumed per request
- No credit card required for the free tier
- Once credits are exhausted, paid plans apply

---

## 3. Google AI Studio — Free API Key

Google AI Studio ([aistudio.google.com](https://aistudio.google.com)) provides a free API key for Gemini models. The free tier has generous rate limits suitable for personal projects.

**Free tier rate limits (as of 2025):**

| Model             | Requests/min | Requests/day |
|-------------------|-------------|-------------|
| Gemini 2.5 Flash  | 10          | 500         |
| Gemini 1.5 Flash  | 15          | 1,500       |

**Steps:**
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with a Google account
3. Click **Get API key** in the left sidebar
4. Click **Create API key** and copy it
5. Add it as a Wrangler secret:
   ```bash
   npx wrangler secret put GOOGLE_AI_KEY
   ```
6. Paste your key when prompted

**Notes:**
- A Google account is required
- Free tier is rate-limited but has no monthly cost
- Usage beyond free limits requires enabling billing in Google Cloud

---

## Quick Comparison

| Provider           | Key required | Free tier                    | Best for              |
|--------------------|-------------|------------------------------|-----------------------|
| Cloudflare Workers AI | No       | ~300–1,400 calls/day         | Default; zero setup   |
| NVIDIA             | Yes         | 1,000 credits on sign-up     | High-quality vision   |
| Google AI (Gemini) | Yes         | 500–1,500 requests/day       | Fast vision & text    |

**Recommendation for testing:** Start with Cloudflare Workers AI (no setup), then add a Google AI key for higher daily limits or better vision quality.

---

## Adding Keys After Deployment

If you already deployed the site and want to add a key later:

```bash
# Add NVIDIA key
npx wrangler secret put NVIDIA_API_KEY

# Add Google AI key
npx wrangler secret put GOOGLE_AI_KEY
```

The site picks up new secrets on the next request — no redeployment needed.
