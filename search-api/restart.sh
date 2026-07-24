#!/bin/sh
set -eu

cd /root/search-api

pkill -f "/root/search-api/venv/bin/python main.py" 2>/dev/null || true
pkill -f "python main.py" 2>/dev/null || true

attempt=0
while [ "$attempt" -lt 30 ]; do
  if ! pgrep -f "/root/search-api/venv/bin/python main.py" >/dev/null 2>&1; then
    break
  fi
  attempt=$((attempt + 1))
  sleep 1
done

rm -f .search_index.db-wal .search_index.db-shm \
  .search_index.building.db .search_index.building.db-wal .search_index.building.db-shm \
  .index-build.lock 2>/dev/null || true

nohup bash run.sh > api.log 2>&1 &
sleep 2

echo "API starting. Watch progress with: tail -f /root/search-api/api.log"
curl -s http://127.0.0.1:8080/api || true
echo ""
