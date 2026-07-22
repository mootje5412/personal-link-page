#!/bin/bash

echo "FindNow Bot - Restart Script"
echo "=============================="
echo ""

# Kill only FindNow bot processes (not all node)
echo "Stopping bot..."
pkill -9 -f "node index.js" 2>/dev/null || true
pkill -9 -f "node /root/findnow-bot/index.js" 2>/dev/null || true
sleep 1

# Verify nothing still polling
if pgrep -f "node index.js" > /dev/null; then
    echo "Warning: bot process still running. Force killing again..."
    pkill -9 -f "node index.js" 2>/dev/null || true
    sleep 1
fi

echo "Starting bot..."

# Start the bot
nohup npm start > bot.log 2>&1 &

sleep 2

# Check if running
if pgrep -f "node" > /dev/null; then
    echo "Bot started!"
    echo ""
    echo "View logs: tail -f bot.log"
else
    echo "Failed to start. Check: cat bot.log"
fi
