#!/bin/bash
set -euo pipefail

# ApexSearch — one-command server install/update
#
# Option A — clone repo then install:
#   git clone -b cursor/telegram-bot-setup-326b https://github.com/mootje5412/personal-link-page.git
#   cd personal-link-page/bot && bash install.sh
#
# Option B — one-liner (public repo):
#   curl -fsSL https://raw.githubusercontent.com/mootje5412/personal-link-page/cursor/telegram-bot-setup-326b/bot/install.sh | bash

REPO="${APEX_REPO:-https://github.com/mootje5412/personal-link-page.git}"
BRANCH="${APEX_BRANCH:-cursor/telegram-bot-setup-326b}"
INSTALL_DIR="${APEX_DIR:-/root/apexsearch-bot}"
OLD_DIR="/root/findnow-bot"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Stopping old bots..."
pm2 delete apexsearch 2>/dev/null || true
pm2 delete findnow 2>/dev/null || true
pkill -f "/root/findnow-bot" 2>/dev/null || true
pkill -f "node index.js" 2>/dev/null || true
sleep 1

echo "==> Removing old findnow-bot..."
rm -rf "$OLD_DIR"

if [ -f "$SCRIPT_DIR/index.js" ] && [ -f "$SCRIPT_DIR/package.json" ]; then
  echo "==> Installing from local bot folder..."
  rm -rf "$INSTALL_DIR"
  mkdir -p "$(dirname "$INSTALL_DIR")"
  cp -a "$SCRIPT_DIR" "$INSTALL_DIR"
else
  echo "==> Pulling latest ApexSearch from git..."
  if ! command -v git >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq git
  fi
  rm -rf /tmp/apexsearch-deploy
  git clone --depth 1 -b "$BRANCH" "$REPO" /tmp/apexsearch-deploy
  rm -rf "$INSTALL_DIR"
  mv /tmp/apexsearch-deploy/bot "$INSTALL_DIR"
  rm -rf /tmp/apexsearch-deploy
fi

cd "$INSTALL_DIR"
mkdir -p data

echo "==> Writing .env..."
cat > .env << 'EOF'
TELEGRAM_BOT_TOKEN=8296025702:AAFxh2r7gxJSOkAbYkQtuKxCDLA7zCFPZGY
OWNER_ID=8073205490
INTEL_API_KEY=2aaef599-fcf9-461c-b996-69e5e5d71ee2
INTEL_BASE_URL=https://www.osintcat.net/api
EOF

if ! command -v node >/dev/null 2>&1; then
  echo "==> Installing Node.js 20..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq curl ca-certificates
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Installing pm2..."
  npm install -g pm2
fi

echo "==> Installing dependencies..."
npm install --production

echo "==> Starting ApexSearch..."
pm2 delete apexsearch 2>/dev/null || true
pm2 start index.js --name apexsearch --cwd "$INSTALL_DIR"
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

sleep 2
echo ""
echo "==> Done. ApexSearch is running at $INSTALL_DIR"
pm2 status apexsearch
pm2 logs apexsearch --lines 15 --nostream
