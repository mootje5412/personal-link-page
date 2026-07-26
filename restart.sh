#!/bin/bash

echo "Gezochte Mensen Odido Zoeker - Herstart"
echo "========================================"
echo ""

echo "Bot stoppen..."
pkill -9 -f "node index.js" 2>/dev/null || true
pkill -9 -f "node /root/odido-zoeker/index.js" 2>/dev/null || true
sleep 1

if pgrep -f "node index.js" > /dev/null; then
    echo "Waarschuwing: bot draait nog. Opnieuw stoppen..."
    pkill -9 -f "node index.js" 2>/dev/null || true
    sleep 1
fi

echo "Bot starten..."
nohup npm start > bot.log 2>&1 &

sleep 2

if pgrep -f "node index.js" > /dev/null; then
    echo "Bot is gestart!"
    echo ""
    echo "Logs bekijken: tail -f bot.log"
else
    echo "Starten mislukt. Bekijk: cat bot.log"
fi
