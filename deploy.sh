#!/bin/bash

SERVER="109.71.252.128"
USER="root"
PASS="zWE2CTnItIWftvmTdxF4"
REMOTE_DIR="/root/findnow-bot"

echo "Creating deployment package..."
cd /workspace
tar -czf bot-deploy.tar.gz \
  config/ \
  src/ \
  index.js \
  package.json \
  .gitignore

echo "Connecting to server..."

# Create directory and upload files
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${USER}@${SERVER} << 'ENDSSH'
mkdir -p /root/findnow-bot
echo "Directory created"
ENDSSH

echo "Uploading bot files..."
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null bot-deploy.tar.gz ${USER}@${SERVER}:${REMOTE_DIR}/

echo "Installing and starting bot..."
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${USER}@${SERVER} << 'ENDSSH'
cd /root/findnow-bot
tar -xzf bot-deploy.tar.gz
rm bot-deploy.tar.gz

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "Installing dependencies..."
npm install

echo "Stopping any existing bot..."
pkill -f "node index.js" || true

echo "Starting bot..."
nohup npm start > bot.log 2>&1 &

sleep 2
echo "Bot started!"
tail -n 20 bot.log
ENDSSH

echo "Deployment complete!"
echo "Bot is running on ${SERVER}"
