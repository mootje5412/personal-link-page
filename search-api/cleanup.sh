#!/bin/sh
set -eu

APP_DIR="/root/search-api"
SAVE="/tmp/databases-backup-$$"

echo "Cleaning server..."
echo "Keeping only: $APP_DIR/databases/"

mkdir -p "$SAVE"
if [ -d "$APP_DIR/databases" ]; then
  cp -a "$APP_DIR/databases/." "$SAVE/"
  echo "Backed up databases folder"
fi

pkill -9 -f "node index.js" 2>/dev/null || true
pkill -9 -f "findnow-bot" 2>/dev/null || true
pkill -9 -f "uvicorn" 2>/dev/null || true
pkill -9 -f "main.py" 2>/dev/null || true
systemctl stop findnow-bot 2>/dev/null || true
systemctl disable findnow-bot 2>/dev/null || true
systemctl stop search-api 2>/dev/null || true
systemctl disable search-api 2>/dev/null || true
rm -f /etc/systemd/system/findnow-bot.service
rm -f /etc/systemd/system/search-api.service
systemctl daemon-reload 2>/dev/null || true

rm -rf /root/findnow-bot
rm -rf /root/findnow-osint-bot

mkdir -p "$APP_DIR"
find "$APP_DIR" -mindepth 1 -maxdepth 1 ! -name 'databases' -exec rm -rf {} +
mkdir -p "$APP_DIR/databases"

if [ -d "$SAVE" ] && [ "$(ls -A "$SAVE" 2>/dev/null)" ]; then
  cp -an "$SAVE/." "$APP_DIR/databases/"
fi
rm -rf "$SAVE"

echo ""
echo "Done."
echo "Kept: $APP_DIR/databases/"
echo ""
echo "Next:"
echo "  cd /tmp && rm -rf personal-link-page && git clone https://github.com/mootje5412/personal-link-page.git"
echo "  cp personal-link-page/search-api/main.py $APP_DIR/"
echo "  cp personal-link-page/search-api/requirements.txt $APP_DIR/"
echo "  cd $APP_DIR && pip3 install -r requirements.txt && python3 main.py"
