#!/usr/bin/env bash
set -euo pipefail

SERVER="${DEPLOY_SERVER:-109.71.252.128}"
USER="${DEPLOY_USER:-root}"
PASS="${DEPLOY_PASS:?Set DEPLOY_PASS environment variable}"
REMOTE_DIR="${DEPLOY_DIR:-/root/hextlo}"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"
BOT_TOKEN="${HEXTLO_BOT_TOKEN:?Set HEXTLO_BOT_TOKEN environment variable}"
API_KEY="${HEXTLO_API_KEY:?Set HEXTLO_API_KEY environment variable}"

echo "==> Packaging HexTLO..."
cd "$LOCAL_DIR"
tar -czf /tmp/hextlo-bot.tar.gz \
  --exclude='.venv' \
  --exclude='__pycache__' \
  --exclude='.env' \
  .

echo "==> Uploading to ${SERVER}..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  "${USER}@${SERVER}" "mkdir -p ${REMOTE_DIR}"

sshpass -p "$PASS" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  /tmp/hextlo-bot.tar.gz "${USER}@${SERVER}:${REMOTE_DIR}/"

echo "==> Installing on server..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  "${USER}@${SERVER}" "REMOTE_DIR='${REMOTE_DIR}' BOT_TOKEN='${BOT_TOKEN}' API_KEY='${API_KEY}' bash -s" << 'REMOTE'
set -euo pipefail

cd "$REMOTE_DIR"
tar -xzf hextlo-bot.tar.gz
rm -f hextlo-bot.tar.gz

cat > .env << EOF
HEXTLO_BOT_TOKEN=${BOT_TOKEN}
HEXTLO_API_KEY=${API_KEY}
HEXTLO_API_BASE_URL=https://zopztlo.zopzstress.st/api/v1
EOF

export DEBIAN_FRONTEND=noninteractive
if ! command -v python3 >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y -qq python3 python3-venv python3-pip
fi

if [ ! -d venv ]; then
  python3 -m venv venv
fi

venv/bin/pip install -q --upgrade pip
venv/bin/pip install -q -r requirements.txt

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

pm2 delete hextlo 2>/dev/null || true
pm2 start venv/bin/python --name hextlo --cwd "$REMOTE_DIR" -- main.py
pm2 save

sleep 2
pm2 status hextlo
pm2 logs hextlo --lines 15 --nostream
REMOTE

echo "==> HexTLO deployed to ${SERVER}!"
