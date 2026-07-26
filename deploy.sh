#!/bin/bash

SERVER="109.71.252.128"
USER="root"
PASS="${DEPLOY_PASSWORD:-}"
REMOTE_DIR="/root/odido-zoeker"

if [ -z "$PASS" ]; then
  echo "Stel DEPLOY_PASSWORD in voor SSH-toegang."
  exit 1
fi

echo "Deployment-pakket maken..."
cd /workspace
tar -czf bot-deploy.tar.gz \
  config/ \
  src/ \
  index.js \
  bot-package.json \
  restart.sh

echo "Verbinden met server..."

ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${USER}@${SERVER} << 'ENDSSH'
mkdir -p /root/odido-zoeker
echo "Map aangemaakt"
ENDSSH

echo "Bestanden uploaden..."
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null bot-deploy.tar.gz ${USER}@${SERVER}:${REMOTE_DIR}/

echo "Installeren en bot starten..."
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${USER}@${SERVER} << 'ENDSSH'
cd /root/odido-zoeker
tar -xzf bot-deploy.tar.gz
rm bot-deploy.tar.gz
mv bot-package.json package.json

if ! command -v node &> /dev/null; then
    echo "Node.js installeren..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "Dependencies installeren..."
npm install

echo "Oude bot instanties stoppen..."
pkill -9 -f "/root/odido-zoeker" 2>/dev/null || true
pkill -9 -f "node /root/findnow-bot/index.js" 2>/dev/null || true
sleep 1

echo "Bot starten via pm2..."
chmod +x restart.sh
pm2 delete odido-zoeker 2>/dev/null || true
pm2 start index.js --name odido-zoeker
pm2 save

sleep 3
echo "Bot gestart!"
pm2 logs odido-zoeker --lines 20 --nostream
ENDSSH

echo "Deployment voltooid!"
echo "Bot draait op ${SERVER} in ${REMOTE_DIR}"
