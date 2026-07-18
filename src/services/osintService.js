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
    
    // Try Snusbase with last4 type for general searches
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
    
    // Try OSINT Cat
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
    
    // Try SeekAF Universal Search (Fast) first
    try {
      const seekafData = await apiService.seekafSearch(email, 'email', 100);
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
      const seekafStealerData = await apiService.seekafStealerSearch(email, false, 100);
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
    
    // Try SeekAF Universal Search first
    try {
      const seekafData = await apiService.seekafSearch(phone, 'phone', 100);
      
      if (seekafData && seekafData.success && seekafData.results) {
        console.log(`SeekAF returned ${seekafData.total} results`);
        seekafData.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      }
    } catch (error) {
      console.error('SeekAF search failed:', error.message);
    }
    
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
    
    // Try SeekAF Universal Search first
    try {
      const seekafData = await apiService.seekafSearch(ip, 'ip', 100);
      
      if (seekafData && seekafData.success && seekafData.results) {
        console.log(`SeekAF returned ${seekafData.total} results`);
        seekafData.results.forEach((item, index) => {
          results.push(this.formatItem(item, index));
        });
      }
    } catch (error) {
      console.error('SeekAF search failed:', error.message);
    }
    
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

}

module.exports = new OSINTService();
