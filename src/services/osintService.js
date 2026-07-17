const apiService = require('./apiService');

class OSINTService {
  async generalSearch(query) {
    let result = `Search results for: ${query}\n\n`;
    
    // Try API search first
    const dbResults = await apiService.searchDatabase(query);
    if (dbResults && dbResults.results && dbResults.results.length > 0) {
      result += `Database Results:\n`;
      dbResults.results.slice(0, 5).forEach((item) => {
        result += `${item.name || item.title || 'Result'}\n`;
        if (item.description) result += `${item.description.substring(0, 100)}...\n`;
        result += `\n`;
      });
      result += `\n`;
    }
    
    const sources = this.getSearchSources(query);
    
    sources.forEach((source) => {
      result += `${source.name}\n${source.url}\n\n`;
    });
    
    return result;
  }

  async usernameSearch(username) {
    let result = `Username search: ${username}\n\n`;
    
    // Try API search
    const dbResults = await apiService.searchDatabase(username);
    if (dbResults && dbResults.results && dbResults.results.length > 0) {
      result += `Database Results:\n`;
      dbResults.results.slice(0, 3).forEach((item) => {
        result += `${item.name || item.username || 'Found'}\n`;
        if (item.url) result += `${item.url}\n`;
        result += `\n`;
      });
      result += `\n`;
    }
    
    const platforms = this.getUsernamePlatforms(username);
    
    for (const platform of platforms) {
      result += `${platform.name}\n${platform.url}\n\n`;
    }
    
    return result;
  }

  async emailSearch(email) {
    let result = `Email search: ${email}\n\n`;
    
    // Check breaches using API
    const breachData = await apiService.searchBreach(email);
    if (breachData) {
      if (breachData.breaches && breachData.breaches.length > 0) {
        result += `Breach Information:\n`;
        result += `Found in ${breachData.breaches.length} breach(es)\n\n`;
        breachData.breaches.slice(0, 5).forEach((breach) => {
          result += `${breach.name || breach.title}\n`;
          if (breach.date) result += `Date: ${breach.date}\n`;
          result += `\n`;
        });
        result += `\n`;
      } else if (breachData.message) {
        result += `${breachData.message}\n\n`;
      }
    }
    
    const resources = [
      { name: 'Google Search', url: `https://www.google.com/search?q=${email}` },
      { name: 'Have I Been Pwned', url: `https://haveibeenpwned.com/` },
      { name: 'Hunter.io', url: `https://hunter.io/email-verifier` },
      { name: 'EmailRep', url: `https://emailrep.io/${email}` }
    ];
    
    resources.forEach((resource) => {
      result += `${resource.name}\n${resource.url}\n\n`;
    });
    
    return result;
  }

  async phoneSearch(phone) {
    let result = `Phone number search: ${phone}\n\n`;
    
    const resources = [
      { name: 'TrueCaller', url: 'https://www.truecaller.com/' },
      { name: 'NumLookup', url: `https://www.numlookup.com/?phone=${phone.replace(/\D/g, '')}` },
      { name: 'Google Search', url: `https://www.google.com/search?q=${phone}` }
    ];
    
    resources.forEach((resource) => {
      result += `${resource.name}\n${resource.url}\n\n`;
    });
    
    return result;
  }

  async ipSearch(ip) {
    let result = `IP address search: ${ip}\n\n`;
    
    result += `IPinfo.io\nhttps://ipinfo.io/${ip}\n\n`;
    result += `Shodan\nhttps://www.shodan.io/host/${ip}\n\n`;
    result += `VirusTotal\nhttps://www.virustotal.com/gui/ip-address/${ip}\n\n`;
    result += `AbuseIPDB\nhttps://www.abuseipdb.com/check/${ip}\n\n`;
    result += `IP-API\nhttp://ip-api.com/#${ip}`;
    
    return result;
  }

  getSearchSources(query) {
    const encoded = query.replace(/ /g, '+');
    return [
      { name: 'Google', url: `https://www.google.com/search?q=${encoded}` },
      { name: 'DuckDuckGo', url: `https://duckduckgo.com/?q=${encoded}` },
      { name: 'Bing', url: `https://www.bing.com/search?q=${encoded}` },
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

}

module.exports = new OSINTService();
