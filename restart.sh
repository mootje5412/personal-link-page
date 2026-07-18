#!/bin/bash

echo "FindNow Bot - Restart Script"
echo "=============================="
echo ""

# Kill all existing node processes running index.js
echo "Stopping all existing bot instances..."
pkill -9 -f "node index.js" || true
sleep 2

# Double check
pkill -9 -f "node.*index" || true
sleep 1

echo "All bot processes stopped."
echo ""

# Start the bot
echo "Starting FindNow Bot..."
cd /root/findnow-bot
nohup npm start > bot.log 2>&1 &

sleep 2

# Check if it's running
if pgrep -f "node index.js" > /dev/null; then
    echo "Bot started successfully!"
    echo ""
    echo "View logs: tail -f /root/findnow-bot/bot.log"
else
    echo "Failed to start bot. Check logs."
fi
