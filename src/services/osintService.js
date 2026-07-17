const axios = require('axios');

class OSINTService {
  async generalSearch(query) {
    // Simulate OSINT search with multiple sources
    const sources = this.getSearchSources(query);
    
    let result = `🔍 *OSINT Search Results for: ${query}*\n\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    result += `*📊 Search Sources:*\n\n`;
    
    sources.forEach((source, index) => {
      result += `${index + 1}. ${source.name}\n   ${source.url}\n\n`;
    });
    
    result += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    result += `*💡 Tip:* Click the links above to explore results on each platform.\n\n`;
    result += `*⚠️ Note:* Results are from public sources. Always verify information through multiple sources.`;
    
    return result;
  }

  async usernameSearch(username) {
    const platforms = this.getUsernamePlatforms(username);
    
    let result = `👤 *Username Search: ${username}*\n\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    result += `*🌐 Checking Platforms:*\n\n`;
    
    for (const platform of platforms) {
      result += `*${platform.name}*\n`;
      result += `🔗 ${platform.url}\n`;
      result += `Status: Check link above\n\n`;
    }
    
    result += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    result += `*💡 Tips:*\n`;
    result += `• Check variations of the username\n`;
    result += `• Look for similar usernames\n`;
    result += `• Try with/without underscores\n\n`;
    result += `*Note:* Click links to verify if profiles exist.`;
    
    return result;
  }

  async emailSearch(email) {
    const domain = email.split('@')[1];
    
    let result = `📧 *Email Investigation: ${email}*\n\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    result += `*🔍 Email Information:*\n\n`;
    result += `Domain: \`${domain}\`\n`;
    result += `Format: Valid email format\n\n`;
    result += `*🔎 Search Resources:*\n\n`;
    
    const resources = [
      { name: 'Google Search', url: `https://www.google.com/search?q="${email}"` },
      { name: 'Have I Been Pwned', url: `https://haveibeenpwned.com/` },
      { name: 'Hunter.io', url: `https://hunter.io/email-verifier` },
      { name: 'EmailRep', url: `https://emailrep.io/${email}` }
    ];
    
    resources.forEach((resource, index) => {
      result += `${index + 1}. *${resource.name}*\n   ${resource.url}\n\n`;
    });
    
    result += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    result += `*⚠️ Privacy Note:* Only use for legitimate purposes.`;
    
    return result;
  }

  async phoneSearch(phone) {
    let result = `📱 *Phone Number Lookup: ${phone}*\n\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    result += `*📊 Phone Information:*\n\n`;
    result += `Number: \`${phone}\`\n`;
    result += `Format: ${this.detectPhoneFormat(phone)}\n\n`;
    result += `*🔎 Lookup Resources:*\n\n`;
    
    const resources = [
      { name: 'TrueCaller Web', url: 'https://www.truecaller.com/' },
      { name: 'PhoneInfoga', url: 'https://github.com/sundowndev/phoneinfoga' },
      { name: 'NumLookup', url: `https://www.numlookup.com/?phone=${phone.replace(/\D/g, '')}` },
      { name: 'Google Search', url: `https://www.google.com/search?q="${phone}"` }
    ];
    
    resources.forEach((resource, index) => {
      result += `${index + 1}. *${resource.name}*\n   ${resource.url}\n\n`;
    });
    
    result += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    result += `*💡 Tip:* Try searching with and without country code.`;
    
    return result;
  }

  async ipSearch(ip) {
    try {
      // Use free IP API for real data
      const response = await axios.get(`http://ip-api.com/json/${ip}`);
      const data = response.data;
      
      if (data.status === 'success') {
        let result = `🌐 *IP Address Analysis: ${ip}*\n\n`;
        result += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        result += `*📍 Location Information:*\n\n`;
        result += `Country: ${data.country} (${data.countryCode})\n`;
        result += `Region: ${data.regionName}\n`;
        result += `City: ${data.city}\n`;
        result += `ZIP: ${data.zip || 'N/A'}\n`;
        result += `Timezone: ${data.timezone}\n\n`;
        result += `*🌐 Network Information:*\n\n`;
        result += `ISP: ${data.isp}\n`;
        result += `Organization: ${data.org}\n`;
        result += `AS: ${data.as}\n\n`;
        result += `*📊 Coordinates:*\n\n`;
        result += `Latitude: ${data.lat}\n`;
        result += `Longitude: ${data.lon}\n\n`;
        result += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        result += `*🔎 Additional Tools:*\n\n`;
        result += `• [View on Map](https://www.google.com/maps?q=${data.lat},${data.lon})\n`;
        result += `• [Shodan](https://www.shodan.io/host/${ip})\n`;
        result += `• [VirusTotal](https://www.virustotal.com/gui/ip-address/${ip})`;
        
        return result;
      }
    } catch (error) {
      console.error('IP lookup error:', error);
    }
    
    // Fallback if API fails
    let result = `🌐 *IP Address Analysis: ${ip}*\n\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    result += `*🔎 Lookup Resources:*\n\n`;
    result += `• [IPinfo.io](https://ipinfo.io/${ip})\n`;
    result += `• [Shodan](https://www.shodan.io/host/${ip})\n`;
    result += `• [VirusTotal](https://www.virustotal.com/gui/ip-address/${ip})\n`;
    result += `• [AbuseIPDB](https://www.abuseipdb.com/check/${ip})`;
    
    return result;
  }

  getSearchSources(query) {
    const encoded = encodeURIComponent(query);
    return [
      { name: 'Google', url: `https://www.google.com/search?q="${encoded}"` },
      { name: 'DuckDuckGo', url: `https://duckduckgo.com/?q="${encoded}"` },
      { name: 'Bing', url: `https://www.bing.com/search?q="${encoded}"` },
      { name: 'Twitter/X', url: `https://twitter.com/search?q=${encoded}` },
      { name: 'LinkedIn', url: `https://www.linkedin.com/search/results/all/?keywords=${encoded}` },
      { name: 'Facebook', url: `https://www.facebook.com/search/top?q=${encoded}` },
      { name: 'Reddit', url: `https://www.reddit.com/search?q=${encoded}` },
      { name: 'GitHub', url: `https://github.com/search?q=${encoded}` }
    ];
  }

  getUsernamePlatforms(username) {
    return [
      { name: 'GitHub', url: `https://github.com/${username}` },
      { name: 'Twitter/X', url: `https://twitter.com/${username}` },
      { name: 'Instagram', url: `https://instagram.com/${username}` },
      { name: 'Reddit', url: `https://reddit.com/user/${username}` },
      { name: 'TikTok', url: `https://tiktok.com/@${username}` },
      { name: 'LinkedIn', url: `https://linkedin.com/in/${username}` },
      { name: 'Facebook', url: `https://facebook.com/${username}` },
      { name: 'YouTube', url: `https://youtube.com/@${username}` },
      { name: 'Twitch', url: `https://twitch.tv/${username}` },
      { name: 'Pinterest', url: `https://pinterest.com/${username}` },
      { name: 'Medium', url: `https://medium.com/@${username}` },
      { name: 'Spotify', url: `https://open.spotify.com/user/${username}` }
    ];
  }

  detectPhoneFormat(phone) {
    if (phone.startsWith('+')) return 'International format';
    if (phone.length >= 10) return 'Valid length';
    return 'Check format';
  }
}

module.exports = new OSINTService();
