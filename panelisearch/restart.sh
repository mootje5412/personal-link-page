#!/bin/sh
set -eu

cd /root/panelisearch

echo "Stopping old PaneliSearch..."
pkill -f "/root/panelisearch/venv/bin/python main.py" 2>/dev/null || true
pkill -f "panelisearch/venv/bin/python main.py" 2>/dev/null || true

attempt=0
while [ "$attempt" -lt 15 ]; do
  if ! pgrep -f "/root/panelisearch/venv/bin/python main.py" >/dev/null 2>&1; then
    break
  fi
  attempt=$((attempt + 1))
  sleep 1
done

if command -v fuser >/dev/null 2>&1; then
  fuser -k 8080/tcp 2>/dev/null || true
  sleep 1
fi

echo "Starting PaneliSearch..."
nohup bash run.sh > api.log 2>&1 &
sleep 3

echo ""
echo "PaneliSearch started. Watch: tail -f /root/panelisearch/api.log"
curl -s http://127.0.0.1:8080/health || true
echo ""
