#!/bin/bash
set -euo pipefail

echo "Removing old FindNow Telegram bot from server..."
echo "================================================"

pkill -9 -f "node index.js" 2>/dev/null || true
pkill -9 -f "findnow-bot" 2>/dev/null || true
systemctl stop findnow-bot 2>/dev/null || true
systemctl disable findnow-bot 2>/dev/null || true

if [ -d "/root/findnow-bot" ]; then
  echo "Old bot folder found at /root/findnow-bot"
  echo "To delete it completely, run:"
  echo "  rm -rf /root/findnow-bot"
fi

echo ""
echo "Old bot stopped."
echo "Next: deploy the search API with ./deploy.sh"
