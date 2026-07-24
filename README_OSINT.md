# 🔍 FindNow - OSINT Telegram Bot

A comprehensive Open Source Intelligence (OSINT) bot for Telegram that helps gather publicly available information across multiple platforms and sources.

## 🎯 Features

### Intelligence Gathering
- **General Search**: Multi-platform search across Google, DuckDuckGo, social media, etc.
- **Username Lookup**: Check username availability across 12+ social platforms
- **Email Investigation**: Email validation, breach checking, and domain lookup
- **Phone Number Search**: Carrier info, location, and number type detection
- **IP Address Analysis**: Real-time geolocation, ISP, and network information

### Smart Detection
- Automatically detects input type (email, IP, phone, username)
- Intelligent search suggestions
- Multiple search sources for comprehensive results

### User Experience
- Clean, organized command structure
- Detailed help documentation
- Real-time search status updates
- Markdown-formatted results

## 📁 Project Structure

```
findnow-osint-bot/
├── config/
│   └── config.js              # Bot configuration
├── src/
│   ├── bot.js                 # Main bot class
│   ├── handlers/
│   │   ├── commandHandler.js  # Command processing
│   │   └── messageHandler.js  # Message processing & auto-detection
│   └── services/
│       └── osintService.js    # OSINT search logic
├── index.js                   # Entry point
├── package.json               # Dependencies
└── README_OSINT.md           # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Bot Token

The bot token is already configured in `config/config.js`:
```
8805558047:AAEl9ldSVfLsCPXIjAQwhiiBCI_HotIt1R0
```

Alternatively, set it as an environment variable:
```bash
export TELEGRAM_BOT_TOKEN="8805558047:AAEl9ldSVfLsCPXIjAQwhiiBCI_HotIt1R0"
```

### 3. Run the Bot

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## 📚 Commands

### Core Commands

**`/start`** - Welcome message and bot overview
- Shows how the bot works
- Lists all available commands
- Provides quick examples

**`/help`** - Detailed help documentation
- Command reference with examples
- Platform coverage information
- Search tips and best practices

### Search Commands

**`/search <query>`** - General OSINT search
```
/search John Doe cybersecurity
```
Returns: Links to search results across multiple platforms

**`/username <username>`** - Username lookup
```
/username john_doe
```
Returns: Links to check username on GitHub, Twitter, Instagram, etc.

**`/email <email>`** - Email investigation
```
/email example@domain.com
```
Returns: Email validation, breach check links, domain info

**`/phone <number>`** - Phone number search
```
/phone +1234567890
```
Returns: Carrier info, lookup tools, search resources

**`/ip <address>`** - IP address analysis
```
/ip 8.8.8.8
```
Returns: Geolocation, ISP, organization, network details

### Smart Auto-Detection

Just type or paste any of these, and the bot will detect the type:
- **Email**: `user@example.com` → Auto-runs email search
- **IP Address**: `192.168.1.1` → Auto-runs IP analysis
- **Phone**: `+1234567890` → Auto-runs phone lookup
- **Username**: `john_doe` → Auto-runs username search
- **General text**: `John Doe` → Auto-runs general search

## 🔍 OSINT Sources

### Username Platforms Checked
- GitHub
- Twitter/X
- Instagram
- Reddit
- TikTok
- LinkedIn
- Facebook
- YouTube
- Twitch
- Pinterest
- Medium
- Spotify

### Search Engines Used
- Google
- DuckDuckGo
- Bing

### IP Information Sources
- IP-API (real-time data)
- Shodan
- VirusTotal
- AbuseIPDB

## 🛠️ Technical Details

### Dependencies
- `node-telegram-bot-api` - Telegram Bot API wrapper
- `axios` - HTTP client for API requests

### Architecture
- **Modular Design**: Separated handlers and services
- **Command Pattern**: Clean command routing
- **Service Layer**: Isolated OSINT logic
- **Error Handling**: Graceful error management
- **Auto-detection**: Smart input type recognition

## ⚠️ Legal & Ethical Use

This bot is designed for legitimate OSINT research only:
- ✅ Only searches publicly available information
- ✅ No hacking or unauthorized access
- ✅ Respects platform terms of service
- ⚠️ Always verify information from multiple sources
- ⚠️ Respect privacy laws and regulations
- ⚠️ Use responsibly and ethically

## 🔐 Security Notes

- Bot token is included in config for convenience
- For production, use environment variables
- Never commit tokens to public repositories
- Consider implementing rate limiting for production use

## 📝 Logging

The bot logs all messages to console:
```
📨 Message from Username (123456789): search query
```

## 🐛 Troubleshooting

**Bot not responding**
- Check bot token is correct
- Verify bot is running (`npm start`)
- Check internet connection

**Polling errors**
- Token might be invalid
- Another instance might be running
- Check firewall settings

**Search results incomplete**
- Some platforms may block automated access
- Try manual verification via provided links
- API rate limits may apply

## 🚀 Future Enhancements

Potential additions:
- Database integration for search history
- Advanced breach checking APIs
- Blockchain address analysis
- Domain WHOIS lookups
- Image reverse search
- Social media scraping (where legal)
- Export results to PDF/JSON

## 📞 Support

For issues or questions:
- Check `/help` command in bot
- Review this documentation
- Test with example queries

## 📄 License

ISC License - Use responsibly and ethically.
