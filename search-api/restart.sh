#!/bin/sh
set -eu

cd /root/search-api

rm -f .search_index.db

pkill -f "/root/search-api/venv/bin/python main.py" 2>/dev/null || true
pkill -f "python main.py" 2>/dev/null || true
sleep 1

nohup bash run.sh > api.log 2>&1 &
sleep 3

curl -s http://127.0.0.1:8080/api/health || true
echo ""
