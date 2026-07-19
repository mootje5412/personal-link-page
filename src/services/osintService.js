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
    
    // Try Snusbase with lastip type for general searches
    try {
      const snusbaseData = await apiService.snusbaseSearch(query, 'lastip');
      console.log('Snusbase data received:', JSON.stringify(snusbaseData).substring(0, 500));
      
      if (snusbaseData && !snusbaseData.error) {
        if (snusbaseData.results && typeof snusbaseData.results === 'object') {
          const dbNames = Object.keys(snusbaseData.results);
          console.log(`Snusbase returned ${dbNames.length} databases:`, dbNames.join(', '));
          
          dbNames.forEach((dbName) => {
            const dbResults = snusbaseData.results[dbName];
            if (dbResults && Array.isArray(dbResults) && dbResults.length > 0) {
              console.log(`Database ${dbName} has ${dbResults.length} results`);
              dbResults.forEach((item, index) => {
                results.push(this.formatItem(item, index));
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('Snusbase general search failed:', error.message);
    }
    
    // Try OSINT Cat Database
    try {
      const dbResults = await apiService.searchDatabase(query);
      
      if (dbResults && dbResults.error) {
        console.error('OSINT Cat database API error:', dbResults.message);
      }
      
      if (dbResults && dbResults.results && dbResults.results.length > 0) {
        dbResults.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      }
    } catch (error) {
      console.error('General search failed:', error.message);
    }
    
    if (results.length === 0) {
      results.push('No results found');
    }
    
    return results;
  }

  async nameSearch(name) {
    const results = [];
    
    // Split name into parts for Snusbase
    const nameParts = name.trim().split(' ');
    const searchTypes = nameParts.length === 2 ? ['name'] : ['name'];
    
    // Try Snusbase with name search
    try {
      const snusbaseData = await apiService.snusbaseSearch(name, 'name');
      console.log('Snusbase name search data received:', JSON.stringify(snusbaseData).substring(0, 500));
      
      if (snusbaseData && !snusbaseData.error) {
        if (snusbaseData.results && typeof snusbaseData.results === 'object') {
          const dbNames = Object.keys(snusbaseData.results);
          console.log(`Snusbase returned ${dbNames.length} databases:`, dbNames.join(', '));
          
          dbNames.forEach((dbName) => {
            const dbResults = snusbaseData.results[dbName];
            if (dbResults && Array.isArray(dbResults) && dbResults.length > 0) {
              console.log(`Database ${dbName} has ${dbResults.length} results`);
              dbResults.forEach((item, index) => {
                results.push(this.formatItem(item, index));
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('Snusbase name search failed:', error.message);
    }
    
    // Try OSINT Cat Breach API
    try {
      const breachData = await apiService.searchBreach(name);
      
      if (breachData && !breachData.error) {
        if (breachData.breach_data && breachData.breach_data.length > 0) {
          breachData.breach_data.forEach((breach, index) => {
            results.push(this.formatItem(breach, index));
          });
        }
      }
    } catch (error) {
      console.error('Breach search failed:', error.message);
    }
    
    // Try OSINT Cat Database Search
    try {
      const dbResults = await apiService.searchDatabase(name);
      
      if (dbResults && !dbResults.error && dbResults.results && dbResults.results.length > 0) {
        dbResults.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      }
    } catch (error) {
      console.error('Database search failed:', error.message);
    }
    
    // Try OSINT Cat Stealer Logs
    try {
      const stealerResults = await apiService.searchStealerLogs(name, 'domain');
      
      if (stealerResults && !stealerResults.error && stealerResults.results && stealerResults.results.length > 0) {
        stealerResults.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      }
    } catch (error) {
      console.error('Stealer logs search failed:', error.message);
    }
    
    if (results.length === 0) {
      results.push('No results found');
    }
    
    return results;
  }

  async usernameSearch(username) {
    const results = [];
    
    // Try SeekAF Universal Search (Fast) first
    try {
      const seekafData = await apiService.seekafSearch(username, 'username', 100);
      console.log('SeekAF search data received:', JSON.stringify(seekafData).substring(0, 500));
      
      if (seekafData && seekafData.success && seekafData.results) {
        console.log(`SeekAF returned ${seekafData.total} results`);
        seekafData.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      }
    } catch (error) {
      console.error('SeekAF search failed:', error.message);
    }
    
    // Try SeekAF Stealer Logs
    try {
      const seekafStealerData = await apiService.seekafStealerSearch(username, false, 100);
      console.log('SeekAF Stealer data received:', JSON.stringify(seekafStealerData).substring(0, 500));
      
      if (seekafStealerData && seekafStealerData.success && seekafStealerData.results) {
        console.log(`SeekAF Stealer returned ${seekafStealerData.total} results`);
        seekafStealerData.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      }
    } catch (error) {
      console.error('SeekAF Stealer search failed:', error.message);
    }
    
    // Try Snusbase - merge all results
    try {
      const snusbaseData = await apiService.snusbaseSearch(username, 'username');
      console.log('Snusbase data received:', JSON.stringify(snusbaseData).substring(0, 500));
      
      if (snusbaseData && !snusbaseData.error) {
        if (snusbaseData.results && typeof snusbaseData.results === 'object') {
          const dbNames = Object.keys(snusbaseData.results);
          console.log(`Snusbase returned ${dbNames.length} databases:`, dbNames.join(', '));
          
          dbNames.forEach((dbName) => {
            const dbResults = snusbaseData.results[dbName];
            if (dbResults && Array.isArray(dbResults) && dbResults.length > 0) {
              console.log(`Database ${dbName} has ${dbResults.length} results`);
              dbResults.forEach((item, index) => {
                results.push(this.formatItem(item, index));
              });
            }
          });
        } else {
          console.log('Snusbase returned no results or invalid format');
        }
      } else if (snusbaseData && snusbaseData.error) {
        console.error('Snusbase API error:', snusbaseData.message);
      }
    } catch (error) {
      console.error('Snusbase username search failed:', error.message);
    }
    
    // Try OSINT Cat Breach API for username
    try {
      const breachData = await apiService.searchBreach(username);
      
      if (breachData && !breachData.error) {
        if (breachData.breach_data && breachData.breach_data.length > 0) {
          breachData.breach_data.forEach((breach, index) => {
            results.push(this.formatItem(breach, index));
          });
        }
      }
    } catch (error) {
      console.error('Breach search failed:', error.message);
    }
    
    // Try OSINT Cat Database Search
    try {
      const dbResults = await apiService.searchDatabase(username);
      
      if (dbResults && dbResults.error) {
        console.error('OSINT Cat database API error:', dbResults.message);
      }
      
      if (dbResults && dbResults.results && dbResults.results.length > 0) {
        dbResults.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      }
    } catch (error) {
      console.error('Database search failed:', error.message);
    }
    
    // Try OSINT Cat Stealer Logs
    try {
      const stealerResults = await apiService.searchStealerLogs(username, 'domain');
      
      if (stealerResults && !stealerResults.error && stealerResults.results && stealerResults.results.length > 0) {
        stealerResults.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      }
    } catch (error) {
      console.error('Stealer logs search failed:', error.message);
    }
    
    if (results.length === 0) {
      results.push('No results found');
    }
    
    return results;
  }

  async emailSearch(email) {
    const results = [];
    
    // Try Snusbase - merge all results without source labels
    try {
      const snusbaseData = await apiService.snusbaseSearch(email, 'email');
      console.log('Search data received:', JSON.stringify(snusbaseData).substring(0, 500));
      
      if (snusbaseData && !snusbaseData.error) {
        if (snusbaseData.results && typeof snusbaseData.results === 'object') {
          const dbNames = Object.keys(snusbaseData.results);
          console.log(`Found ${dbNames.length} sources:`, dbNames.join(', '));
          
          dbNames.forEach((dbName) => {
            const dbResults = snusbaseData.results[dbName];
            if (dbResults && Array.isArray(dbResults) && dbResults.length > 0) {
              console.log(`Source ${dbName} has ${dbResults.length} results`);
              dbResults.forEach((item, index) => {
                results.push(this.formatItem(item, index));
              });
            }
          });
        } else {
          console.log('No results or invalid format');
        }
      } else if (snusbaseData && snusbaseData.error) {
        console.error('Search error:', snusbaseData.message);
      }
    } catch (error) {
      console.error('Email search failed:', error.message);
    }
    
    // Try OSINT Cat breach API
    try {
      const breachData = await apiService.searchBreach(email);
      
      if (breachData && breachData.error && results.length === 0) {
        console.error('OSINT Cat breach API error:', breachData.message);
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
      results.push('No results found');
    }
    
    return results;
  }

  async phoneSearch(phone) {
    const results = [];
    
    // Try Snusbase
    try {
      const snusbaseData = await apiService.snusbaseSearch(phone, 'phone');
      console.log('Snusbase data received:', JSON.stringify(snusbaseData).substring(0, 500));
      
      if (snusbaseData && !snusbaseData.error) {
        if (snusbaseData.results && typeof snusbaseData.results === 'object') {
          const dbNames = Object.keys(snusbaseData.results);
          console.log(`Snusbase returned ${dbNames.length} databases:`, dbNames.join(', '));
          
          dbNames.forEach((dbName) => {
            const dbResults = snusbaseData.results[dbName];
            if (dbResults && Array.isArray(dbResults) && dbResults.length > 0) {
              console.log(`Database ${dbName} has ${dbResults.length} results`);
              dbResults.forEach((item, index) => {
                results.push(this.formatItem(item, index));
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('Snusbase phone search failed:', error.message);
    }
    
    // Try OSINT Cat
    try {
      const dbResults = await apiService.searchDatabase(phone);
      
      if (dbResults && dbResults.error) {
        console.error('OSINT Cat database API error:', dbResults.message);
      }
      
      if (dbResults && dbResults.results && dbResults.results.length > 0) {
        dbResults.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      }
    } catch (error) {
      console.error('Phone search failed:', error.message);
    }
    
    if (results.length === 0) {
      results.push('No results found');
    }
    
    return results;
  }

  async ipSearch(ip) {
    const results = [];
    
    // Try OSINT Cat
    try {
      const dbResults = await apiService.searchDatabase(ip);
      
      if (dbResults && dbResults.error) {
        console.error('OSINT Cat database API error:', dbResults.message);
      }
      
      if (dbResults && dbResults.results && dbResults.results.length > 0) {
        dbResults.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      }
    } catch (error) {
      console.error('IP search failed:', error.message);
    }
    
    if (results.length === 0) {
      results.push('No results found');
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

  async discordSearch(discordId) {
    const results = [];
    
    console.log(`Discord ID detected: ${discordId}`);
    
    // Try OSINT Cat Discord API
    try {
      const discordData = await apiService.searchDiscord(discordId);
      
      if (discordData && !discordData.error) {
        if (discordData.data) {
          results.push(this.formatItem(discordData.data, 0));
        } else if (discordData.results) {
          discordData.results.forEach((item, index) => {
            results.push(this.formatItem(item, index));
          });
        }
      }
    } catch (error) {
      console.error('Discord search failed:', error.message);
    }
    
    // Try Discord-to-Roblox link
    try {
      const d2rData = await apiService.searchDiscordToRoblox(discordId);
      
      if (d2rData && !d2rData.error) {
        if (d2rData.data) {
          results.push(this.formatItem(d2rData.data, 0));
        } else if (d2rData.results) {
          d2rData.results.forEach((item, index) => {
            results.push(this.formatItem(item, index));
          });
        }
      }
    } catch (error) {
      console.error('Discord-to-Roblox search failed:', error.message);
    }
    
    // Also search in regular databases
    try {
      const dbResults = await apiService.searchDatabase(discordId);
      
      if (dbResults && !dbResults.error && dbResults.results && dbResults.results.length > 0) {
        dbResults.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      }
    } catch (error) {
      console.error('Database search failed:', error.message);
    }
    
    if (results.length === 0) {
      results.push('No results found');
    }
    
    return results;
  }

  async robloxSearch(username) {
    const results = [];
    
    console.log(`Roblox username detected: ${username}`);
    
    // Try OSINT Cat Roblox API
    try {
      const robloxData = await apiService.searchRoblox(username);
      
      if (robloxData && !robloxData.error) {
        if (robloxData.data) {
          results.push(this.formatItem(robloxData.data, 0));
        } else if (robloxData.results) {
          robloxData.results.forEach((item, index) => {
            results.push(this.formatItem(item, index));
          });
        }
      }
    } catch (error) {
      console.error('Roblox search failed:', error.message);
    }
    
    // Also search as username in other databases
    try {
      const snusbaseData = await apiService.snusbaseSearch(username, 'username');
      
      if (snusbaseData && !snusbaseData.error && snusbaseData.results) {
        const dbNames = Object.keys(snusbaseData.results);
        dbNames.forEach((dbName) => {
          const dbResults = snusbaseData.results[dbName];
          if (dbResults && Array.isArray(dbResults) && dbResults.length > 0) {
            dbResults.forEach((item, index) => {
              results.push(this.formatItem(item, index));
            });
          }
        });
      }
    } catch (error) {
      console.error('Snusbase search failed:', error.message);
    }
    
    if (results.length === 0) {
      results.push('No results found');
    }
    
    return results;
  }

  async vinSearch(vin) {
    const results = [];
    
    console.log(`VIN detected: ${vin}`);
    
    // Try OSINT Cat VIN API
    try {
      const vinData = await apiService.searchVIN(vin);
      
      if (vinData && !vinData.error) {
        if (vinData.data) {
          results.push(this.formatItem(vinData.data, 0));
        } else if (vinData.results) {
          vinData.results.forEach((item, index) => {
            results.push(this.formatItem(item, index));
          });
        }
      }
    } catch (error) {
      console.error('VIN search failed:', error.message);
    }
    
    if (results.length === 0) {
      results.push('No results found');
    }
    
    return results;
  }

}

module.exports = new OSINTService();
