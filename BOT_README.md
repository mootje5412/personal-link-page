# Telegram Bot

A simple Telegram bot built with Node.js that responds to messages and commands.

## Features

- Responds to any text message by echoing it back
- Handles common commands:
  - `/start` - Welcome message
  - `/help` - Display help information
  - `/info` - Show bot information
- Easy to customize and extend

## Setup Instructions

### 1. Create Your Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` to create a new bot
3. Follow the instructions to choose a name and username for your bot
4. Copy the bot token that BotFather gives you

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Your Bot Token

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your bot token:

```
TELEGRAM_BOT_TOKEN=your_actual_bot_token_here
```

Alternatively, you can directly edit `bot.js` and replace `YOUR_TELEGRAM_BOT_TOKEN` with your token.

### 4. Run the Bot

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

## Usage

1. Open Telegram and search for your bot by username
2. Send `/start` to begin
3. Try sending any message - the bot will echo it back
4. Use `/help` to see available commands

## Customization

Edit `bot.js` to add your own commands and functionality:

```javascript
// Add a new command
bot.onText(/\/mycommand/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Response to my command!');
});
```

## Technologies Used

- Node.js
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)

## Troubleshooting

- **Bot not responding**: Make sure your bot token is correct and the bot is running
- **Polling errors**: Check your internet connection and token validity
- **Module not found**: Run `npm install` to install dependencies

## Security Note

Never commit your `.env` file or expose your bot token publicly. The `.gitignore` file is configured to exclude it.
