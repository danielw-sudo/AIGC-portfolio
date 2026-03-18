#!/usr/bin/env bash
# AIGC Portfolio — Automated Setup
# Creates D1 + R2, patches config, deploys to Cloudflare Workers.
# Usage: bash setup.sh
set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'
YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'

info()  { echo -e "${CYAN}▸${NC} $1"; }
ok()    { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}!${NC} $1"; }
fail()  { echo -e "${RED}✗ $1${NC}" >&2; exit 1; }

# ── Preflight ───────────────────────────────────────────────────────
command -v node  >/dev/null 2>&1 || fail "Node.js is required. Install from https://nodejs.org"
command -v npx   >/dev/null 2>&1 || fail "npx is required (ships with Node.js)"

echo -e "\n${BOLD}AIGC Portfolio — Setup${NC}\n"

# ── Auth ────────────────────────────────────────────────────────────
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  warn "CLOUDFLARE_API_TOKEN not set."
  echo "  Create one at: https://dash.cloudflare.com/profile/api-tokens"
  echo "  Use the \"Edit Cloudflare Workers\" template, add D1 + R2 edit permissions."
  echo ""
  read -rp "Paste your API token: " CLOUDFLARE_API_TOKEN
  [ -z "$CLOUDFLARE_API_TOKEN" ] && fail "API token is required."
  export CLOUDFLARE_API_TOKEN
fi

info "Verifying API token..."
WHOAMI_OUTPUT=$(npx wrangler whoami 2>&1) || fail "Invalid API token. Check permissions."
ok "Authenticated."

# Extract account ID from wrangler whoami output
ACCOUNT_ID=$(echo "$WHOAMI_OUTPUT" | grep -oP '[a-f0-9]{32}' | head -1)
[ -z "$ACCOUNT_ID" ] && fail "Could not detect account ID. Check your API token permissions."
ok "Account ID: ${ACCOUNT_ID}"

# ── Prompts ─────────────────────────────────────────────────────────
echo ""
prompt_with_default() {
  local varname=$1 prompt_text=$2 default=$3
  read -rp "$(echo -e "${CYAN}?${NC}") $prompt_text [$default]: " value
  printf -v "$varname" '%s' "${value:-$default}"
}

prompt_with_default SITE_NAME     "Site name"        "AIGC Portfolio"
prompt_with_default SITE_AUTHOR   "Author name"      "Your Name"
prompt_with_default SITE_URL      "Site URL"          "https://example.com"
prompt_with_default R2_PUBLIC_URL "R2 public URL"     "https://example.com"
prompt_with_default DB_NAME       "D1 database name"  "aigc-portfolio-db"
prompt_with_default BUCKET_NAME   "R2 bucket name"    "aigc-portfolio-images"

echo ""

# ── Create D1 Database ──────────────────────────────────────────────
info "Creating D1 database: $DB_NAME"
D1_OUTPUT=$(npx wrangler d1 create "$DB_NAME" 2>&1) || {
  if echo "$D1_OUTPUT" | grep -qi "already exists"; then
    warn "D1 database '$DB_NAME' already exists. Fetching ID..."
    D1_LIST=$(npx wrangler d1 list --json 2>&1)
    DB_ID=$(node -e "
      const dbs = JSON.parse(process.argv[1]);
      const db = dbs.find(d => d.name === '$DB_NAME');
      if (db) console.log(db.uuid); else process.exit(1);
    " "$D1_LIST") || fail "Could not find database '$DB_NAME' in account."
  else
    echo "$D1_OUTPUT" >&2
    fail "Failed to create D1 database."
  fi
}

if [ -z "${DB_ID:-}" ]; then
  DB_ID=$(echo "$D1_OUTPUT" | grep -oP 'database_id\s*=\s*"\K[^"]+' || \
          echo "$D1_OUTPUT" | grep -oP '[a-f0-9-]{36}' | head -1)
  [ -z "$DB_ID" ] && fail "Could not parse database ID from wrangler output."
fi
ok "D1 database ready: $DB_ID"

# ── Create R2 Bucket ───────────────────────────────────────────────
info "Creating R2 bucket: $BUCKET_NAME"
R2_OUTPUT=$(npx wrangler r2 bucket create "$BUCKET_NAME" 2>&1) || {
  if echo "$R2_OUTPUT" | grep -qi "already exists"; then
    warn "R2 bucket '$BUCKET_NAME' already exists. Continuing."
  else
    echo "$R2_OUTPUT" >&2
    fail "Failed to create R2 bucket."
  fi
}
ok "R2 bucket ready: $BUCKET_NAME"

# ── Patch wrangler.json ────────────────────────────────────────────
info "Patching wrangler.json..."
SETUP_ACCOUNT_ID="$ACCOUNT_ID" \
SETUP_DB_NAME="$DB_NAME" \
SETUP_DB_ID="$DB_ID" \
SETUP_BUCKET="$BUCKET_NAME" \
SETUP_R2_URL="$R2_PUBLIC_URL" \
SETUP_SITE_NAME="$SITE_NAME" \
SETUP_SITE_URL="$SITE_URL" \
SETUP_SITE_AUTHOR="$SITE_AUTHOR" \
node -e "
  const fs = require('fs');
  const file = 'wrangler.json';
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
  const e = process.env;

  cfg.account_id = e.SETUP_ACCOUNT_ID;
  cfg.d1_databases[0].database_name = e.SETUP_DB_NAME;
  cfg.d1_databases[0].database_id = e.SETUP_DB_ID;
  cfg.r2_buckets[0].bucket_name = e.SETUP_BUCKET;
  cfg.vars.R2_PUBLIC_URL = e.SETUP_R2_URL;
  cfg.vars.SITE_NAME = e.SETUP_SITE_NAME;
  cfg.vars.SITE_URL = e.SETUP_SITE_URL;
  cfg.vars.SITE_AUTHOR = e.SETUP_SITE_AUTHOR;

  fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
"
ok "wrangler.json updated."

# ── Patch package.json ─────────────────────────────────────────────
info "Patching package.json db scripts..."
SETUP_DB_NAME="$DB_NAME" node -e "
  const fs = require('fs');
  const file = 'package.json';
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  const dbName = process.env.SETUP_DB_NAME;

  for (const key of Object.keys(pkg.scripts)) {
    if (key.startsWith('db:')) {
      pkg.scripts[key] = pkg.scripts[key].replace(/YOUR_DB_NAME/g, dbName);
    }
  }

  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
"
ok "package.json updated."

# ── Run Schema + Seed ──────────────────────────────────────────────
info "Applying database schema to remote D1..."
npx wrangler d1 execute "$DB_NAME" --remote --file=schema.sql || fail "Schema migration failed."
ok "Schema applied."

info "Seeding AI models..."
npx wrangler d1 execute "$DB_NAME" --remote --file=migrations/0002_seed_models.sql || {
  warn "Model seed skipped (may already exist)."
}
ok "Database ready."

# ── Upload Sample Content to R2 ──────────────────────────────────
info "Uploading sample images to R2..."
for IMG_FILE in public/samples/sample-kittens.jpg public/samples/sample-whale-ride.jpg public/samples/sample-winter-village.jpg; do
  KEY="samples/$(basename "$IMG_FILE")"
  npx wrangler r2 object put "$BUCKET_NAME/$KEY" --file="$IMG_FILE" --content-type="image/jpeg" 2>/dev/null || \
    warn "Could not upload $KEY (non-fatal)."
done
ok "Sample images uploaded."

info "Seeding sample content..."
# Replace R2 URL placeholder and execute
sed "s|R2_PUBLIC_URL_PLACEHOLDER|${R2_PUBLIC_URL%/}|g" migrations/0010_seed_content.sql > /tmp/seed_content_resolved.sql
npx wrangler d1 execute "$DB_NAME" --remote --file=/tmp/seed_content_resolved.sql || {
  warn "Sample content seed skipped (may already exist)."
}
rm -f /tmp/seed_content_resolved.sql
ok "Sample content seeded."

# ── Install & Deploy ───────────────────────────────────────────────
info "Installing dependencies..."
npm install --silent

info "Building and deploying..."
npm run deploy || fail "Deploy failed. Check build output above."
ok "Deployed!"

# ── GitHub Actions Secret ──────────────────────────────────────────
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  echo ""
  read -rp "$(echo -e "${CYAN}?${NC}") Set up GitHub Actions auto-deploy? [Y/n]: " GH_CONFIRM
  if [[ "${GH_CONFIRM:-Y}" =~ ^[Yy]$ ]]; then
    REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
    if [ -n "$REPO_URL" ]; then
      info "Setting CLOUDFLARE_API_TOKEN as GitHub Actions secret..."
      echo "$CLOUDFLARE_API_TOKEN" | gh secret set CLOUDFLARE_API_TOKEN --repo="$REPO_URL" 2>/dev/null && \
        ok "GitHub Actions secret set. Pushes to main will auto-deploy." || \
        warn "Could not set GitHub secret. Set it manually in repo Settings → Secrets."
    else
      warn "No git remote found. Set the GitHub secret manually."
    fi
  fi
else
  echo ""
  warn "gh CLI not found or not authenticated. To enable auto-deploy on push:"
  echo "  1. Install: https://cli.github.com"
  echo "  2. Run: gh auth login"
  echo "  3. Run: gh secret set CLOUDFLARE_API_TOKEN"
fi

# ── Summary ─────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}Setup complete!${NC}"
echo ""
echo -e "  ${BOLD}D1 Database:${NC}  $DB_NAME ($DB_ID)"
echo -e "  ${BOLD}R2 Bucket:${NC}    $BUCKET_NAME"
echo -e "  ${BOLD}Worker:${NC}       aigc-portfolio"
echo ""
echo -e "  ${BOLD}Next steps:${NC}"
echo "  1. Visit your worker URL → /admin (the setup checklist will guide you)"
echo "  2. Set up Zero Trust to protect /admin (see src/QuickStart/SETUP.md Step 7)"
echo "  3. (Optional) Add AI provider keys:"
echo "     npx wrangler secret put NVIDIA_API_KEY"
echo "     npx wrangler secret put GOOGLE_AI_KEY"
echo ""
