# How to Properly Restart the Bot

## Option 1: Use the Restart Script (RECOMMENDED)

```bash
ssh root@109.71.252.128
cd /root/findnow-bot
./restart.sh
```

This script will:
1. Kill ALL existing bot processes
2. Wait for them to fully terminate
3. Start a fresh bot instance
4. Verify it started successfully

## Option 2: Manual Restart

```bash
ssh root@109.71.252.128

# Kill all bot processes
pkill -9 -f "node index.js"
sleep 2

# Start bot
cd /root/findnow-bot
git pull
nohup npm start > bot.log 2>&1 &

# Check logs
tail -f bot.log
```

## Option 3: Update and Restart

```bash
ssh root@109.71.252.128
cd /root/findnow-bot

# Kill existing
pkill -9 -f "node index.js"
sleep 2

# Update code
git pull

# Start fresh
nohup npm start > bot.log 2>&1 &
tail -f bot.log
```

## Check if Bot is Running

```bash
ps aux | grep "node index.js"
```

## View Logs

```bash
tail -f /root/findnow-bot/bot.log
```

## If Bot Shows "409 Conflict" Error

This means another instance is running. Kill ALL instances:

```bash
pkill -9 -f "node index.js"
pkill -9 -f "node.*index"
sleep 3
cd /root/findnow-bot
nohup npm start > bot.log 2>&1 &
```
