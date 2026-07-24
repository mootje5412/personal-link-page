#!/bin/sh
set -eu

cd /root/search-api

echo "Stopping old API..."
pkill -f "/root/search-api/venv/bin/python main.py" 2>/dev/null || true
pkill -f "python main.py" 2>/dev/null || true

attempt=0
while [ "$attempt" -lt 15 ]; do
  if ! pgrep -f "/root/search-api/venv/bin/python main.py" >/dev/null 2>&1; then
    break
  fi
  attempt=$((attempt + 1))
  sleep 1
done

if command -v fuser >/dev/null 2>&1; then
  fuser -k 8080/tcp 2>/dev/null || true
  sleep 1
fi

rm -f .search_index.db-wal .search_index.db-shm \
  .search_index.building.db .search_index.building.db-wal .search_index.building.db-shm \
  .index-build.lock 2>/dev/null || true

echo "Starting API (use restart.sh, not run.sh)..."
nohup bash run.sh > api.log 2>&1 &
sleep 2

echo ""
echo "API starting. Watch: tail -f /root/search-api/api.log"
echo "Do NOT run 'bash run.sh' again — use 'bash restart.sh' to restart."
echo ""
curl -s http://127.0.0.1:8080/api || true
echo ""
