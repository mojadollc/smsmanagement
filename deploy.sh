#!/bin/bash
set -e

# ─────────────────────────────────────────────
# SMS Management - VPS Deploy Script
# Domain: sms.beegoo.app | Port: 4000
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

# ─────────────────────────────────────────────
# 0. Collect secrets
# ─────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo "  SMS Management Deploy — sms.beegoo.app"
echo "════════════════════════════════════════"
echo ""

read -rp "PostgreSQL password for 'postgres' user: " PG_PASS
read -rp "Twilio Account SID (ACxxx...): " TWILIO_SID
read -rp "Twilio Auth Token: " TWILIO_TOKEN
read -rp "Twilio Messaging Service SID (MGxxx...): " TWILIO_MSG_SID

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
# 5. Clone / pull repo
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
# 6. Write .env
# ─────────────────────────────────────────────
log "Writing .env..."
cat > "$APP_DIR/.env" <<EOF
DATABASE_URL="postgresql://postgres:${PG_PASS}@localhost:5432/${DB_NAME}"
TWILIO_ACCOUNT_SID=${TWILIO_SID}
TWILIO_AUTH_TOKEN=${TWILIO_TOKEN}
TWILIO_MESSAGING_SERVICE_SID=${TWILIO_MSG_SID}
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
EOF
chmod 600 "$APP_DIR/.env"

# ─────────────────────────────────────────────
# 7. Create database
# ─────────────────────────────────────────────
log "Creating database '$DB_NAME' if not exists..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" \
  | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};"

# ─────────────────────────────────────────────
# 8. Install dependencies
# ─────────────────────────────────────────────
log "Installing npm dependencies..."
cd "$APP_DIR"
npm install --production=false

# ─────────────────────────────────────────────
# 9. Run migrations & generate Prisma client
# ─────────────────────────────────────────────
log "Running Prisma migrations..."
npx prisma migrate deploy
npx prisma generate

# ─────────────────────────────────────────────
# 10. Build Next.js
# ─────────────────────────────────────────────
log "Building Next.js app..."
npm run build

# ─────────────────────────────────────────────
# 11. Start with PM2
# ─────────────────────────────────────────────
log "Starting app with PM2..."
pm2 delete sms-dashboard 2>/dev/null || true
pm2 delete sms-worker    2>/dev/null || true
pm2 delete sms-scheduler 2>/dev/null || true

pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

# ─────────────────────────────────────────────
# 12. Nginx config
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
# 13. SSL with Let's Encrypt
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
echo -e "${GREEN}  ✓ PM2 processes:${NC}"
pm2 list
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
warn "Remember to change your VPS root password!"
