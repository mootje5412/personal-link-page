#!/bin/bash
set -euo pipefail

SERVER="109.71.252.128"
USER="root"
REMOTE_DIR="/root/search-api"
API_KEY="z2GFltjwp4rgccrOJdtc"

echo "Deploying VeriPanel phone search API to ${SERVER}..."

cd "$(dirname "$0")/.."

echo "Creating deployment package..."
tar -czf /tmp/search-api-deploy.tar.gz \
  search-api/main.py \
  search-api/requirements.txt \
  search-api/run.sh \
  search-api/restart.sh \
  search-api/cleanup.sh \
  search-api/.env.example

echo "Uploading to server..."
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  /tmp/search-api-deploy.tar.gz "${USER}@${SERVER}:/tmp/"

echo "Installing on server..."
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "${USER}@${SERVER}" << ENDSSH
set -euo pipefail

APP_DIR="${REMOTE_DIR}"
mkdir -p "\$APP_DIR/databases"

if [ -f "\$APP_DIR/cleanup.sh" ]; then
  bash "\$APP_DIR/cleanup.sh" || true
fi

mkdir -p "\$APP_DIR"
find "\$APP_DIR" -mindepth 1 -maxdepth 1 ! -name 'databases' -exec rm -rf {} +

tar -xzf /tmp/search-api-deploy.tar.gz -C /tmp
cp /tmp/search-api/main.py /tmp/search-api/requirements.txt /tmp/search-api/run.sh /tmp/search-api/restart.sh /tmp/search-api/cleanup.sh "\$APP_DIR/"
rm -rf /tmp/search-api /tmp/search-api-deploy.tar.gz

cat > "\$APP_DIR/.env" << EOF
API_KEY=${API_KEY}
PORT=8080
AUTO_REBUILD=0
EOF

pkill -9 -f "findnow-bot" 2>/dev/null || true
pkill -9 -f "node index.js" 2>/dev/null || true
rm -rf /root/findnow-bot /root/findnow-osint-bot

cd "\$APP_DIR"
chmod +x run.sh restart.sh cleanup.sh
bash restart.sh

sleep 3
curl -s "http://127.0.0.1:8080/api/phone?key=${API_KEY}" || true
echo ""
echo "Deploy complete."
ENDSSH

rm -f /tmp/search-api-deploy.tar.gz
echo "Done. API: http://${SERVER}:8080/api/phone"
