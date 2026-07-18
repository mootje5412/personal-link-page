# Deploy FindNow Bot to Your Server (109.71.252.128)

## Quick Deployment Steps

### 1. Upload Bot Files to Server

From your local machine, upload the bot files:

```bash
# Download the repository
git clone https://github.com/mootje5412/personal-link-page.git
cd personal-link-page
git checkout cursor/telegram-bot-649a

# Upload to your server
scp -r config src index.js package.json root@109.71.252.128:/root/findnow-bot/
```

### 2. SSH into Your Server

```bash
ssh root@109.71.252.128
# Password: zWE2CTnItIWftvmTdxF4
```

### 3. Install Node.js (if not installed)

```bash
# Check if Node.js is installed
node --version

# If not, install it:
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

### 4. Install Bot Dependencies

```bash
cd /root/findnow-bot
npm install
```

### 5. Start the Bot

```bash
# Start in foreground (to test)
npm start

# Or start in background with nohup
nohup npm start > bot.log 2>&1 &

# Check if running
ps aux | grep "node index.js"

# View logs
tail -f bot.log
```

### 6. Whitelist Server IP

1. Go to https://www.osintcat.net
2. Login to your account  
3. Go to API settings
4. Add IP: **109.71.252.128**

Once whitelisted, the bot will return real search results!

## Bot Configuration

- **Bot Token:** Already configured in `config/config.js`
- **API Key:** Already configured (de4d6ed2-74e9-46b7-96b0-dce6a25f0e55)
- **Server IP:** 109.71.252.128 (static - needs whitelisting)

## Commands to Manage Bot

```bash
# Stop bot
pkill -f "node index.js"

# Start bot
cd /root/findnow-bot && nohup npm start > bot.log 2>&1 &

# View logs
tail -f /root/findnow-bot/bot.log

# Restart bot
pkill -f "node index.js" && sleep 1 && cd /root/findnow-bot && nohup npm start > bot.log 2>&1 &
```

## Test the Bot

1. Open Telegram
2. Search for your bot
3. Send `/start`
4. Send any email, username, or query to search

## Troubleshooting

- If bot doesn't respond: Check logs with `tail -f bot.log`
- If API returns errors: Make sure 109.71.252.128 is whitelisted in OSINT Cat
- If bot crashes: Restart with the commands above
