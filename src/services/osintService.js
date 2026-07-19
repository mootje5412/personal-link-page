const apiService = require('./apiService');

class OSINTService {
  extractOsintCatResults(response) {
    if (!response || typeof response !== 'object' || response.error) {
      return [];
    }

    const items = [];
    const skipKeys = new Set([
      '_meta', 'api', 'elapsed_ms', 'timestamp', 'results_count',
      'execution_time', 'query', 'total', 'success', 'error', 'message', 'mode'
    ]);

    const pushItem = (item) => {
      if (item === null || item === undefined) return;
      if (typeof item === 'object' && Object.keys(item).length === 0) return;
      items.push(item);
    };

    ['results', 'machines', 'breach_data', 'data', 'Results'].forEach((key) => {
      const value = response[key];
      if (Array.isArray(value)) {
        value.forEach(pushItem);
      } else if (value && typeof value === 'object' && key !== 'Results') {
        pushItem(value);
      }
    });

    if (response.user_info && typeof response.user_info === 'object') {
      pushItem(response.user_info);
    }

    if (items.length === 0) {
      const keys = Object.keys(response).filter((key) => !skipKeys.has(key));
      const looksLikeRecord = keys.some((key) => [
        'username', 'user_id', 'email', 'password', 'id', 'name', 'vin',
        'make', 'model', 'display_name', 'discriminator', 'created_at',
        'file_count', 'total_size', 'imported_at', 'profile_url'
      ].includes(key));

      if (looksLikeRecord) {
        pushItem(response);
      }
    }

    return items;
  }

  appendOsintCatResponse(results, response) {
    const items = this.extractOsintCatResults(response);
    items.forEach((item, index) => {
      results.push(this.formatItem(item, results.length === 0 ? index : index));
    });
    return items.length;
  }

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
    
    return results;
  }

  async usernameSearch(username) {
    const results = [];
    
    // Try Snusbase
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
      this.appendOsintCatResponse(results, breachData);
    } catch (error) {
      console.error('Breach search failed:', error.message);
    }
    
    // Try OSINT Cat Database Search
    try {
      const dbResults = await apiService.searchDatabase(username);
      this.appendOsintCatResponse(results, dbResults);
    } catch (error) {
      console.error('Database search failed:', error.message);
    }
    
    // Try OSINT Cat Stealer Logs
    try {
      const stealerResults = await apiService.searchStealerLogs(username, 'domain');
      this.appendOsintCatResponse(results, stealerResults);
    } catch (error) {
      console.error('Stealer logs search failed:', error.message);
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
    
    return results;
  }

  async phoneSearch(phone) {
    const results = [];
    
    // Try Snusbase
    try {
      const snusbaseData = await apiService.snusbaseSearch(phone, 'phone');
      console.log('Snusbase data received:', JSON.stringify(snusbaseData).substring(0, 500));
      
      if (snusbaseData && !snusbaseData.error && snusbaseData.results) {
        Object.keys(snusbaseData.results).forEach((dbName) => {
          const dbResults = snusbaseData.results[dbName];
          if (dbResults && Array.isArray(dbResults) && dbResults.length > 0) {
            dbResults.forEach((item, index) => {
              results.push(this.formatItem(item, index));
            });
          }
        });
      }
    } catch (error) {
      console.error('Snusbase phone search failed:', error.message);
    }
    
    // Try OSINT Cat Phone OSINT
    try {
      const phoneOsintData = await apiService.searchPhoneOSINT(phone);
      this.appendOsintCatResponse(results, phoneOsintData);
    } catch (error) {
      console.error('Phone OSINT search failed:', error.message);
    }
    
    // Try OSINT Cat Database
    try {
      const dbResults = await apiService.searchDatabase(phone);
      this.appendOsintCatResponse(results, dbResults);
    } catch (error) {
      console.error('Database search failed:', error.message);
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
    
    return results;
  }

  async machineSearch(query) {
    const results = [];
    
    const machineResults = await apiService.searchMachines(query);
    
    if (machineResults && machineResults.error) {
      console.log('Machine search error:', machineResults.message);
      return results;
    }
    
    const machines = machineResults.machines || machineResults.results || [];
    
    if (machines.length > 0) {
      machines.forEach((machine, index) => {
        let machineInfo = this.formatItem(machine, index);
        
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
    
    try {
      const discordData = await apiService.searchDiscord(discordId);
      this.appendOsintCatResponse(results, discordData);
    } catch (error) {
      console.error('Discord search failed:', error.message);
    }
    
    try {
      const d2rData = await apiService.searchDiscordToRoblox(discordId);
      this.appendOsintCatResponse(results, d2rData);
    } catch (error) {
      console.error('Discord-to-Roblox search failed:', error.message);
    }
    
    try {
      const dbResults = await apiService.searchDatabase(discordId);
      this.appendOsintCatResponse(results, dbResults);
    } catch (error) {
      console.error('Database search failed:', error.message);
    }
    
    return results;
  }

  async robloxSearch(username) {
    const results = [];
    
    console.log(`Roblox username detected: ${username}`);
    
    try {
      const robloxData = await apiService.searchRoblox(username);
      this.appendOsintCatResponse(results, robloxData);
    } catch (error) {
      console.error('Roblox search failed:', error.message);
    }
    
    try {
      const snusbaseData = await apiService.snusbaseSearch(username, 'username');
      
      if (snusbaseData && !snusbaseData.error && snusbaseData.results) {
        Object.keys(snusbaseData.results).forEach((dbName) => {
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
    
    return results;
  }

  async vinSearch(vin) {
    const results = [];
    
    console.log(`VIN detected: ${vin}`);
    
    try {
      const vinData = await apiService.searchVIN(vin);
      this.appendOsintCatResponse(results, vinData);
    } catch (error) {
      console.error('VIN search failed:', error.message);
    }
    
    return results;
  }

}

module.exports = new OSINTService();
