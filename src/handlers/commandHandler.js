const osintService = require('../services/osintService');

class CommandHandler {
  handleStart(bot, msg) {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'there';
    
    const welcomeMessage = `
🔍 *Welcome to FindNow OSINT Bot* 🔍

Hello ${firstName}! I'm an Open Source Intelligence (OSINT) bot designed to help you gather information from publicly available sources.

━━━━━━━━━━━━━━━━━━━━━━
*📚 How It Works:*

Simply send me any query or use specific commands to search for information. I'll scan multiple public sources and provide you with relevant results.

━━━━━━━━━━━━━━━━━━━━━━
*🎯 Available Commands:*

/search <query> - General OSINT search
/username <username> - Search for a username across platforms
/email <email> - Look up information about an email
/phone <number> - Search for phone number information
/ip <address> - Get IP address information
/help - Show detailed help and examples

━━━━━━━━━━━━━━━━━━━━━━
*💡 Quick Examples:*

\`/search John Doe\` - General search
\`/username john_doe123\` - Find social profiles
\`/email example@domain.com\` - Email lookup
\`/phone +1234567890\` - Phone search
\`/ip 8.8.8.8\` - IP information

━━━━━━━━━━━━━━━━━━━━━━
*⚠️ Disclaimer:*

This bot only searches publicly available information. Always respect privacy laws and terms of service of the platforms you're researching.

Type /help for more detailed information!
    `;
    
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }

  handleHelp(bot, msg) {
    const chatId = msg.chat.id;
    
    const helpMessage = `
🔍 *FindNow OSINT Bot - Detailed Help* 🔍

━━━━━━━━━━━━━━━━━━━━━━
*🎯 Command Reference:*

*1️⃣ General Search*
\`/search <query>\`
Performs a comprehensive OSINT search
Example: \`/search Jane Smith tech\`

*2️⃣ Username Lookup*
\`/username <username>\`
Searches for username across social platforms
Platforms checked:
• Twitter/X
• Instagram
• GitHub
• Reddit
• TikTok
• LinkedIn
• And more...
Example: \`/username john_doe\`

*3️⃣ Email Investigation*
\`/email <email>\`
Checks email addresses for:
• Data breach exposure
• Social media accounts
• Domain information
Example: \`/email user@example.com\`

*4️⃣ Phone Number Lookup*
\`/phone <number>\`
Searches phone number information:
• Carrier information
• Location/country
• Number type
Example: \`/phone +1234567890\`

*5️⃣ IP Address Analysis*
\`/ip <address>\`
Provides IP information:
• Geolocation
• ISP details
• Organization
Example: \`/ip 8.8.8.8\`

━━━━━━━━━━━━━━━━━━━━━━
*📝 Tips for Better Results:*

• Be specific with your queries
• Use quotation marks for exact phrases
• Include context when possible
• Try different variations of usernames

━━━━━━━━━━━━━━━━━━━━━━
*🔐 Privacy & Ethics:*

• Only public information is searched
• No hacking or unauthorized access
• Respect privacy and legal boundaries
• Use responsibly and ethically

━━━━━━━━━━━━━━━━━━━━━━

Need more help? Just send me a message describing what you're looking for!
    `;
    
    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  async handleSearch(bot, msg, match) {
    const chatId = msg.chat.id;
    const query = match[1];
    
    bot.sendMessage(chatId, `🔍 Searching for: *${query}*\n\nPlease wait...`, { parse_mode: 'Markdown' });
    
    try {
      const results = await osintService.generalSearch(query);
      bot.sendMessage(chatId, results, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } catch (error) {
      bot.sendMessage(chatId, `❌ An error occurred during the search. Please try again.`);
    }
  }

  async handleUsername(bot, msg, match) {
    const chatId = msg.chat.id;
    const username = match[1];
    
    bot.sendMessage(chatId, `🔍 Looking up username: *${username}*\n\nScanning platforms...`, { parse_mode: 'Markdown' });
    
    try {
      const results = await osintService.usernameSearch(username);
      bot.sendMessage(chatId, results, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } catch (error) {
      bot.sendMessage(chatId, `❌ An error occurred during username lookup. Please try again.`);
    }
  }

  async handleEmail(bot, msg, match) {
    const chatId = msg.chat.id;
    const email = match[1];
    
    bot.sendMessage(chatId, `🔍 Investigating email: *${email}*\n\nSearching databases...`, { parse_mode: 'Markdown' });
    
    try {
      const results = await osintService.emailSearch(email);
      bot.sendMessage(chatId, results, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } catch (error) {
      bot.sendMessage(chatId, `❌ An error occurred during email investigation. Please try again.`);
    }
  }

  async handlePhone(bot, msg, match) {
    const chatId = msg.chat.id;
    const phone = match[1];
    
    bot.sendMessage(chatId, `🔍 Searching phone: *${phone}*\n\nLooking up information...`, { parse_mode: 'Markdown' });
    
    try {
      const results = await osintService.phoneSearch(phone);
      bot.sendMessage(chatId, results, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } catch (error) {
      bot.sendMessage(chatId, `❌ An error occurred during phone lookup. Please try again.`);
    }
  }

  async handleIP(bot, msg, match) {
    const chatId = msg.chat.id;
    const ip = match[1];
    
    bot.sendMessage(chatId, `🔍 Analyzing IP: *${ip}*\n\nFetching data...`, { parse_mode: 'Markdown' });
    
    try {
      const results = await osintService.ipSearch(ip);
      bot.sendMessage(chatId, results, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } catch (error) {
      bot.sendMessage(chatId, `❌ An error occurred during IP analysis. Please try again.`);
    }
  }
}

module.exports = new CommandHandler();
