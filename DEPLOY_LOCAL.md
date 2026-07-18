# Run FindNow Bot Locally

Follow these steps to run the bot on your own machine with your own IP address.

## Prerequisites

- Node.js installed (download from https://nodejs.org)
- Git installed

## Steps

### 1. Clone the Repository

```bash
git clone https://github.com/mootje5412/personal-link-page.git
cd personal-link-page
git checkout cursor/telegram-bot-649a
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Whitelist Your IP

1. Find your IP address: Go to https://whatismyipaddress.com
2. Go to https://www.osintcat.net
3. Login to your account
4. Navigate to API settings
5. Add your IP address to the whitelist

### 4. Start the Bot

```bash
npm start
```

The bot will now run on your machine using your IP address!

## Keep It Running

To keep the bot running:

**Windows:**
```bash
npm start
```
Keep the terminal window open.

**Mac/Linux:**
```bash
nohup npm start &
```
This runs it in the background.

**Or use PM2 (recommended):**
```bash
npm install -g pm2
pm2 start index.js --name findnow-bot
pm2 save
pm2 startup
```

## Bot is Already Configured

- Bot Token: Already set in config/config.js
- API Key: Already set in config/config.js
- Everything ready to go!

Just start it and the bot will work with your stable IP address.
