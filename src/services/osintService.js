class OSINTService {
  async generalSearch(query) {
    const sources = this.getSearchSources(query);
    
    let result = `Search results for: ${query}\n\n`;
    
    sources.forEach((source) => {
      result += `${source.name}\n${source.url}\n\n`;
    });
    
    return result;
  }

  async usernameSearch(username) {
    const platforms = this.getUsernamePlatforms(username);
    
    let result = `Username search: ${username}\n\n`;
    
    for (const platform of platforms) {
      result += `${platform.name}\n${platform.url}\n\n`;
    }
    
    return result;
  }

  async emailSearch(email) {
    let result = `Email search: ${email}\n\n`;
    
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
