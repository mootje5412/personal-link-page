#!/bin/bash

echo "FindNow Bot - Restart Script"
echo "=============================="
echo ""

# Kill all node processes (force kill)
echo "Stopping bot..."
pkill -9 -f "node" 2>/dev/null || true
sleep 1

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
