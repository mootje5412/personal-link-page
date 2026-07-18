const apiService = require('./apiService');

class OSINTService {
  formatItem(item, index = 0) {
    if (index === 0) {
      console.log('Sample item structure:', JSON.stringify(item));
    }
    
    // If item is a string, return it directly
    if (typeof item === 'string') {
      return item;
    }
    
    // Build formatted output
    let lines = [];
    
    Object.keys(item).forEach((key) => {
      const value = item[key];
      
      if (value === null || value === undefined) return;
      
      if (typeof value === 'string') {
        lines.push(`${key}: ${value}`);
      } else if (typeof value === 'number') {
        lines.push(`${key}: ${value}`);
      } else if (typeof value === 'boolean') {
        lines.push(`${key}: ${value}`);
      } else if (Array.isArray(value)) {
        lines.push(`${key}: ${value.join(', ')}`);
      } else if (typeof value === 'object') {
        lines.push(`${key}: ${JSON.stringify(value)}`);
      }
    });
    
    return lines.length > 0 ? lines.join('\n') : JSON.stringify(item);
  }

  async generalSearch(query) {
    const results = [];
    
    try {
      const dbResults = await apiService.searchDatabase(query);
      
      if (dbResults && dbResults.error) {
        results.push(`API Error: ${dbResults.message}\n\nThe OSINT Cat API requires IP whitelisting. Please whitelist your server IP to use this feature.`);
        return results;
      }
      
      if (dbResults && dbResults.results && dbResults.results.length > 0) {
        dbResults.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      } else if (!dbResults || !dbResults.results) {
        results.push('No results found from API');
      }
    } catch (error) {
      console.error('General search failed:', error.message);
      results.push('Search failed. Please try again.');
    }
    
    return results;
  }

  async usernameSearch(username) {
    const results = [];
    
    // Try Snusbase
    try {
      const snusbaseData = await apiService.snusbaseSearch(username, 'username');
      if (snusbaseData && !snusbaseData.error && snusbaseData.results) {
        Object.keys(snusbaseData.results).forEach((dbName) => {
          const dbResults = snusbaseData.results[dbName];
          if (dbResults && dbResults.length > 0) {
            dbResults.forEach((item, index) => {
              results.push(`Source: ${dbName}\n${this.formatItem(item, index)}`);
            });
          }
        });
      }
    } catch (error) {
      console.error('Snusbase username search failed:', error.message);
    }
    
    // Try OSINT Cat
    try {
      const dbResults = await apiService.searchDatabase(username);
      
      if (dbResults && dbResults.error && results.length === 0) {
        results.push(`API Error: ${dbResults.message}\n\nThe OSINT Cat API requires IP whitelisting. Please whitelist your server IP to use this feature.`);
        return results;
      }
      
      if (dbResults && dbResults.results && dbResults.results.length > 0) {
        dbResults.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      }
    } catch (error) {
      console.error('Database search failed:', error.message);
    }
    
    if (results.length === 0) {
      results.push('No results found from any API');
    }
    
    return results;
  }

  async emailSearch(email) {
    const results = [];
    
    // Try Snusbase first
    try {
      const snusbaseData = await apiService.snusbaseSearch(email, 'email');
      if (snusbaseData && !snusbaseData.error && snusbaseData.results) {
        Object.keys(snusbaseData.results).forEach((dbName) => {
          const dbResults = snusbaseData.results[dbName];
          if (dbResults && dbResults.length > 0) {
            dbResults.forEach((item, index) => {
              results.push(`Source: ${dbName}\n${this.formatItem(item, index)}`);
            });
          }
        });
      }
    } catch (error) {
      console.error('Snusbase email search failed:', error.message);
    }
    
    // Try OSINT Cat breach API
    try {
      const breachData = await apiService.searchBreach(email);
      
      if (breachData && breachData.error && results.length === 0) {
        results.push(`API Error: ${breachData.message}\n\nThe OSINT Cat API requires IP whitelisting. Please whitelist your server IP to use this feature.`);
        return results;
      }
      
      if (breachData) {
        if (breachData.breach_data && breachData.breach_data.length > 0) {
          breachData.breach_data.forEach((breach, index) => {
            results.push(this.formatItem(breach, index));
          });
        }
      }
    } catch (error) {
      console.error('Breach search failed:', error.message);
    }
    
    // Try OSINT Cat database search
    try {
      const dbResults = await apiService.searchDatabase(email);
      if (dbResults && !dbResults.error && dbResults.results && dbResults.results.length > 0) {
        dbResults.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      }
    } catch (error) {
      console.error('Database search failed:', error.message);
    }
    
    if (results.length === 0) {
      results.push('No results found from any API');
    }
    
    return results;
  }

  async phoneSearch(phone) {
    const results = [];
    
    try {
      const dbResults = await apiService.searchDatabase(phone);
      
      if (dbResults && dbResults.error) {
        results.push(`API Error: ${dbResults.message}\n\nThe OSINT Cat API requires IP whitelisting. Please whitelist your server IP to use this feature.`);
        return results;
      }
      
      if (dbResults && dbResults.results && dbResults.results.length > 0) {
        dbResults.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      } else {
        results.push('No results found from API');
      }
    } catch (error) {
      console.error('Phone search failed:', error.message);
      results.push('Search failed. Please try again.');
    }
    
    return results;
  }

  async ipSearch(ip) {
    const results = [];
    
    try {
      const dbResults = await apiService.searchDatabase(ip);
      
      if (dbResults && dbResults.error) {
        results.push(`API Error: ${dbResults.message}\n\nThe OSINT Cat API requires IP whitelisting. Please whitelist your server IP to use this feature.`);
        return results;
      }
      
      if (dbResults && dbResults.results && dbResults.results.length > 0) {
        dbResults.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      } else {
        results.push('No results found from API');
      }
    } catch (error) {
      console.error('IP search failed:', error.message);
      results.push('Search failed. Please try again.');
    }
    
    return results;
  }

  async machineSearch(query) {
    const results = [];
    
    const machineResults = await apiService.searchMachines(query);
    
    if (machineResults && machineResults.error) {
      console.log('Machine search error:', machineResults.message);
      return results;
    }
    
    if (machineResults && machineResults.results && machineResults.results.length > 0) {
      machineResults.results.forEach((machine, index) => {
        let machineInfo = `Machine Found\n${this.formatItem(machine, index)}`;
        
        if (machine.id || machine.machine_id) {
          const machineId = machine.id || machine.machine_id;
          machineInfo += `\n\nDownload: /download_${machineId}`;
        }
        
        results.push(machineInfo);
      });
    }
    
    return results;
  }

}

module.exports = new OSINTService();
