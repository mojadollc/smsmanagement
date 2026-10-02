#!/bin/bash
set -e

# ─────────────────────────────────────────────
# SMS Management - VPS Deploy Script
# Domain: sms.beegoo.app | Port: 4000
# Twilio credentials are configured AFTER
# login via the Settings page in the dashboard
# ─────────────────────────────────────────────

APP_DIR="/var/www/sms"
DOMAIN="sms.beegoo.app"
PORT=4000
REPO="https://github.com/mojadollc/smsmanagement.git"
DB_NAME="sms_management"

# ── Colors ──
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }
die()  { echo -e "${RED}[✗] $1${NC}"; exit 1; }

echo ""
echo "════════════════════════════════════════"
echo "  SMS Management Deploy — sms.beegoo.app"
echo "════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────
# 1. Check port 4000
# ─────────────────────────────────────────────
log "Checking port $PORT..."
if lsof -i :$PORT &>/dev/null; then
  die "Port $PORT is already in use. Free it first or choose another port."
fi
log "Port $PORT is available."

# ─────────────────────────────────────────────
# 2. Install Node.js 20 if needed
# ─────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  log "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  log "Node.js $(node -v) already installed."
fi

# ─────────────────────────────────────────────
# 3. Install PM2 if needed
# ─────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  log "Installing PM2..."
  npm install -g pm2
else
  log "PM2 $(pm2 -v) already installed."
fi

# ─────────────────────────────────────────────
# 4. Install Certbot if needed
# ─────────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  log "Installing Certbot..."
  apt-get install -y certbot python3-certbot-nginx
else
  log "Certbot already installed."
fi

# ─────────────────────────────────────────────
# 5. Auto-detect PostgreSQL credentials
# ─────────────────────────────────────────────
log "Detecting PostgreSQL credentials from existing apps..."

PG_USER="postgres"
PG_PASS=""
PG_HOST="localhost"
PG_PORT="5432"

ENV_FILES=$(find /var/www /home /root /srv -maxdepth 4 -name ".env" 2>/dev/null | grep -v "$APP_DIR" | head -20)

for f in $ENV_FILES; do
  URL=$(grep -oP 'DATABASE_URL=["'"'"']?\K[^"'"'"'\n]+' "$f" 2>/dev/null | grep -i 'postgres' | head -1 || true)
  if [ -n "$URL" ]; then
    EXTRACTED_USER=$(echo "$URL" | grep -oP '(?<=://)([^:@]+)' | head -1 || true)
    EXTRACTED_PASS=$(echo "$URL" | grep -oP '(?<=://[^:]{1,50}:)([^@]+)' | head -1 || true)
    EXTRACTED_HOST=$(echo "$URL" | grep -oP '(?<=@)([^:/]+)' | head -1 || true)
    EXTRACTED_PORT=$(echo "$URL" | grep -oP '(?<=@[^:]{1,50}:)(\d+)' | head -1 || true)
    if [ -n "$EXTRACTED_PASS" ]; then
      PG_USER="${EXTRACTED_USER:-postgres}"
      PG_PASS="$EXTRACTED_PASS"
      PG_HOST="${EXTRACTED_HOST:-localhost}"
      PG_PORT="${EXTRACTED_PORT:-5432}"
      warn "Found PostgreSQL credentials from: $f (user: $PG_USER @ $PG_HOST:$PG_PORT)"
      break
    fi
  fi
done

# Verify found credentials work
if [ -n "$PG_PASS" ]; then
  if PGPASSWORD="$PG_PASS" psql -U "$PG_USER" -h "$PG_HOST" -p "$PG_PORT" -c "\q" &>/dev/null; then
    log "PostgreSQL credentials verified."
    DB_URL="postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/${DB_NAME}"
  else
    warn "Found credentials but could not connect. Trying peer auth..."
    PG_PASS=""
  fi
fi

# Fallback: peer auth
if [ -z "$PG_PASS" ]; then
  if sudo -u postgres psql -c "\q" &>/dev/null; then
    log "Using PostgreSQL peer authentication."
    DB_URL="postgresql://postgres@localhost:5432/${DB_NAME}"
  else
    read -rp "Could not auto-detect PostgreSQL password. Enter it manually: " PG_PASS
    DB_URL="postgresql://postgres:${PG_PASS}@localhost:5432/${DB_NAME}"
  fi
fi

log "Database URL ready."

# ─────────────────────────────────────────────
# 6. Clone / pull repo
# ─────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  log "Repo exists — pulling latest..."
  cd "$APP_DIR"
  git pull origin main
else
  log "Cloning repo to $APP_DIR..."
  mkdir -p /var/www
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# ─────────────────────────────────────────────
# 7. Write .env (no Twilio keys — set via Settings page)
# ─────────────────────────────────────────────
log "Writing .env..."
cat > "$APP_DIR/.env" <<EOF
DATABASE_URL="${DB_URL}"
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
# Twilio credentials are configured via the Settings page
# at https://${DOMAIN}/dashboard/settings
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGING_SERVICE_SID=
EOF
chmod 600 "$APP_DIR/.env"

# ─────────────────────────────────────────────
# 8. Create database
# ─────────────────────────────────────────────
log "Creating database '$DB_NAME' if not exists..."
if [ -n "$PG_PASS" ]; then
  PGPASSWORD="$PG_PASS" psql -U "$PG_USER" -h "$PG_HOST" -p "$PG_PORT" \
    -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" \
    | grep -q 1 || PGPASSWORD="$PG_PASS" psql -U "$PG_USER" -h "$PG_HOST" -p "$PG_PORT" \
    -c "CREATE DATABASE ${DB_NAME};"
else
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" \
    | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};"
fi
log "Database ready."

# ─────────────────────────────────────────────
# 9. Install dependencies
# ─────────────────────────────────────────────
log "Installing npm dependencies..."
cd "$APP_DIR"
npm install --production=false

# ─────────────────────────────────────────────
# 10. Run migrations & generate Prisma client
# ─────────────────────────────────────────────
log "Running Prisma migrations..."
npx prisma migrate deploy
npx prisma generate

# ─────────────────────────────────────────────
# 11. Build Next.js
# ─────────────────────────────────────────────
log "Building Next.js app..."
npm run build

# ─────────────────────────────────────────────
# 12. Start with PM2
# ─────────────────────────────────────────────
log "Starting app with PM2..."
pm2 delete sms-dashboard 2>/dev/null || true
pm2 delete sms-worker    2>/dev/null || true
pm2 delete sms-scheduler 2>/dev/null || true

pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

# ─────────────────────────────────────────────
# 13. Nginx config
# ─────────────────────────────────────────────
log "Configuring Nginx..."
cat > /etc/nginx/sites-available/${DOMAIN} <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://localhost:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN}
nginx -t || die "Nginx config test failed."
systemctl reload nginx
log "Nginx configured."

# ─────────────────────────────────────────────
# 14. SSL with Let's Encrypt
# ─────────────────────────────────────────────
log "Obtaining SSL certificate..."
certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos \
  --email admin@beegoo.app --redirect || warn "Certbot failed — run manually: certbot --nginx -d ${DOMAIN}"

# ─────────────────────────────────────────────
# Done
# ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Deployed: https://${DOMAIN}${NC}"
echo -e "${GREEN}  ✓ App running on port ${PORT}${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}  NEXT STEP: Configure Twilio credentials${NC}"
echo -e "${YELLOW}  → https://${DOMAIN}/dashboard/settings${NC}"
echo ""
pm2 list
