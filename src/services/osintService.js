const apiService = require('./apiService');

class OSINTService {
  async generalSearch(query) {
    const results = [];
    
    const dbResults = await apiService.searchDatabase(query);
    
    if (dbResults && dbResults.error) {
      results.push(`API Error: ${dbResults.message}\n\nThe OSINT Cat API requires IP whitelisting. Please whitelist your server IP to use this feature.`);
      return results;
    }
    
    if (dbResults && dbResults.results && dbResults.results.length > 0) {
      dbResults.results.forEach((item, index) => {
        // Log first item to see structure
        if (index === 0) {
          console.log('Sample item structure:', JSON.stringify(item));
        }
        
        // Try all possible field combinations
        let itemText = item.name || item.title || item.username || item.email || item.value || item.data || JSON.stringify(item);
        
        // Add all available fields
        Object.keys(item).forEach((key) => {
          if (key !== 'name' && key !== 'title' && item[key] && typeof item[key] === 'string' && item[key].length < 200) {
            itemText += `\n${key}: ${item[key]}`;
          }
        });
        
        results.push(itemText);
      });
    } else if (!dbResults || !dbResults.results) {
      results.push('No results found from API');
    }
    
    return results;
  }

  async usernameSearch(username) {
    const results = [];
    
    const dbResults = await apiService.searchDatabase(username);
    
    if (dbResults && dbResults.error) {
      results.push(`API Error: ${dbResults.message}\n\nThe OSINT Cat API requires IP whitelisting. Please whitelist your server IP to use this feature.`);
      return results;
    }
    
    if (dbResults && dbResults.results && dbResults.results.length > 0) {
      dbResults.results.forEach((item) => {
        let itemText = item.name || item.username || item.title || 'Found';
        if (item.platform) {
          itemText += `\nPlatform: ${item.platform}`;
        }
        if (item.description) {
          itemText += `\n${item.description}`;
        }
        if (item.url) {
          itemText += `\n${item.url}`;
        }
        results.push(itemText);
      });
    } else {
      results.push('No results found from API');
    }
    
    return results;
  }

  async emailSearch(email) {
    const results = [];
    
    const breachData = await apiService.searchBreach(email);
    
    if (breachData && breachData.error) {
      results.push(`API Error: ${breachData.message}\n\nThe OSINT Cat API requires IP whitelisting. Please whitelist your server IP to use this feature.`);
      return results;
    }
    
    if (breachData) {
      if (breachData.breaches && breachData.breaches.length > 0) {
        breachData.breaches.forEach((breach, index) => {
          if (index === 0) {
            console.log('Sample breach structure:', JSON.stringify(breach));
          }
          
          let itemText = breach.name || breach.title || breach.source || 'Breach';
          
          // Add all breach fields
          Object.keys(breach).forEach((key) => {
            if (key !== 'name' && key !== 'title' && breach[key] && typeof breach[key] === 'string' && breach[key].length < 200) {
              itemText += `\n${key}: ${breach[key]}`;
            }
          });
          
          results.push(itemText);
        });
      }
    }
    
    const dbResults = await apiService.searchDatabase(email);
    if (dbResults && !dbResults.error && dbResults.results && dbResults.results.length > 0) {
      dbResults.results.forEach((item, index) => {
        if (index === 0 && results.length === 0) {
          console.log('Sample email result structure:', JSON.stringify(item));
        }
        
        let itemText = item.name || item.title || item.username || item.email || item.value || item.data || JSON.stringify(item);
        
        // Add all available fields
        Object.keys(item).forEach((key) => {
          if (key !== 'name' && key !== 'title' && item[key] && typeof item[key] === 'string' && item[key].length < 200) {
            itemText += `\n${key}: ${item[key]}`;
          }
        });
        
        results.push(itemText);
      });
    }
    
    if (results.length === 0) {
      results.push('No results found from API');
    }
    
    return results;
  }

  async phoneSearch(phone) {
    const results = [];
    
    const dbResults = await apiService.searchDatabase(phone);
    
    if (dbResults && dbResults.error) {
      results.push(`API Error: ${dbResults.message}\n\nThe OSINT Cat API requires IP whitelisting. Please whitelist your server IP to use this feature.`);
      return results;
    }
    
    if (dbResults && dbResults.results && dbResults.results.length > 0) {
      dbResults.results.forEach((item) => {
        let itemText = item.name || item.title || 'Result';
        if (item.description) {
          itemText += `\n${item.description}`;
        }
        if (item.url) {
          itemText += `\n${item.url}`;
        }
        results.push(itemText);
      });
    } else {
      results.push('No results found from API');
    }
    
    return results;
  }

  async ipSearch(ip) {
    const results = [];
    
    const dbResults = await apiService.searchDatabase(ip);
    
    if (dbResults && dbResults.error) {
      results.push(`API Error: ${dbResults.message}\n\nThe OSINT Cat API requires IP whitelisting. Please whitelist your server IP to use this feature.`);
      return results;
    }
    
    if (dbResults && dbResults.results && dbResults.results.length > 0) {
      dbResults.results.forEach((item) => {
        let itemText = item.name || item.title || 'Result';
        if (item.description) {
          itemText += `\n${item.description}`;
        }
        if (item.url) {
          itemText += `\n${item.url}`;
        }
        results.push(itemText);
      });
    } else {
      results.push('No results found from API');
    }
    
    return results;
  }

}

module.exports = new OSINTService();
