#!/usr/bin/env bash
set -e
set -u

SERVER="${DEPLOY_SERVER:-109.71.252.128}"
USER="${DEPLOY_USER:-root}"
PASS="${DEPLOY_PASS:?Set DEPLOY_PASS environment variable}"
REMOTE_DIR="${DEPLOY_DIR:-/root/apexsearch-bot}"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Packaging bot..."
cd "$LOCAL_DIR"
tar -czf /tmp/apexsearch-bot.tar.gz \
  --exclude='node_modules' \
  --exclude='data/*.json' \
  .

echo "==> Uploading to ${SERVER}..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  "${USER}@${SERVER}" "mkdir -p ${REMOTE_DIR}"

sshpass -p "$PASS" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  /tmp/apexsearch-bot.tar.gz "${USER}@${SERVER}:${REMOTE_DIR}/"

echo "==> Installing on server..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  "${USER}@${SERVER}" "REMOTE_DIR='${REMOTE_DIR}' bash -s" << 'REMOTE'
set -euo pipefail

echo "==> Stopping old bots..."
pm2 delete apexsearch 2>/dev/null || true
pm2 delete findnow 2>/dev/null || true
pkill -f "/root/findnow-bot" 2>/dev/null || true
pkill -f "node index.js" 2>/dev/null || true
rm -rf /root/findnow-bot
sleep 1

cd "$REMOTE_DIR"
tar -xzf apexsearch-bot.tar.gz
rm -f apexsearch-bot.tar.gz
mkdir -p data

cat > .env << 'EOF'
TELEGRAM_BOT_TOKEN=8296025702:AAFxh2r7gxJSOkAbYkQtuKxCDLA7zCFPZGY
OWNER_ID=8073205490
INTEL_API_KEY=2aaef599-fcf9-461c-b996-69e5e5d71ee2
INTEL_BASE_URL=https://www.osintcat.net/api
EOF

if ! command -v node >/dev/null 2>&1; then
  echo "Installing Node.js 20..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq curl ca-certificates
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

echo "Node: $(node -v) | npm: $(npm -v)"

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

npm install --production

pm2 start index.js --name apexsearch --cwd "$REMOTE_DIR"
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

sleep 2
pm2 status apexsearch
pm2 logs apexsearch --lines 10 --nostream
REMOTE

echo "==> Deployment complete!"
