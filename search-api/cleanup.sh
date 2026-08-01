#!/bin/sh
set -eu

APP_DIR="/root/search-api"
SAVE="/tmp/databases-backup-$$"

echo "Cleaning server — keeping only search-api/databases/"

mkdir -p "$SAVE"
if [ -d "$APP_DIR/databases" ]; then
  cp -a "$APP_DIR/databases/." "$SAVE/"
  echo "Backed up databases folder"
fi

pm2 kill 2>/dev/null || true
pkill -9 -f "node index.js" 2>/dev/null || true
pkill -9 -f "findnow-bot" 2>/dev/null || true
pkill -9 -f "uvicorn" 2>/dev/null || true
pkill -9 -f "main.py" 2>/dev/null || true

systemctl stop findnow-bot 2>/dev/null || true
systemctl disable findnow-bot 2>/dev/null || true
rm -f /etc/systemd/system/findnow-bot.service

rm -rf /root/apexsearch-bot
rm -rf /root/hextlo
rm -rf /root/odido-zoeker
rm -rf /root/panelisearch
rm -rf /root/findnow-bot
rm -rf /root/findnow-osint-bot
rm -rf /root/findnow-osint

mkdir -p "$APP_DIR"
find "$APP_DIR" -mindepth 1 -maxdepth 1 ! -name 'databases' -exec rm -rf {} +
mkdir -p "$APP_DIR/databases"

if [ -d "$SAVE" ] && [ "$(ls -A "$SAVE" 2>/dev/null)" ]; then
  cp -an "$SAVE/." "$APP_DIR/databases/"
fi
rm -rf "$SAVE"

echo "Done. Only $APP_DIR remains with databases/"
