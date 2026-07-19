const https = require('https');
const config = require('../../config/config');

class APIService {
  makeRequest(url, headers) {
    return new Promise((resolve, reject) => {
      https.get(url, { headers }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            resolve(data);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  async searchBreach(query) {
    try {
      const url = `${config.osintCatBaseUrl}/breach?query=${encodeURIComponent(query)}`;
      const headers = {
        'X-API-KEY': config.osintCatApiKey
      };
      
      console.log(`Calling breach API: ${url}`);
      const data = await this.makeRequest(url, headers);
      console.log('Breach API response:', JSON.stringify(data).substring(0, 1000));
      
      if (data && data.error) {
        console.error('API Error:', data.error, data.message);
        return { error: true, message: data.message };
      }
      
      return data;
    } catch (error) {
      console.error('Breach search error:', error.message);
      return { error: true, message: error.message };
    }
  }

  async searchDatabase(query) {
    try {
      const url = `${config.osintCatBaseUrl}/database-search?query=${encodeURIComponent(query)}`;
      const headers = {
        'X-API-KEY': config.osintCatApiKey
      };
      
      console.log(`Calling database API: ${url}`);
      const data = await this.makeRequest(url, headers);
      console.log('Database API response:', JSON.stringify(data).substring(0, 1000));
      
      if (data && data.error) {
        console.error('API Error:', data.error, data.message);
        return { error: true, message: data.message };
      }
      
      return data;
    } catch (error) {
      console.error('Database search error:', error.message);
      return { error: true, message: error.message };
    }
  }

  async snusbaseSearch(query, searchType = 'email') {
    try {
      const url = `${config.snusbaseBaseUrl}/data/search`;
      const headers = {
        'Auth': config.snusbaseApiKey,
        'Content-Type': 'application/json'
      };
      
      const postData = JSON.stringify({
        terms: [query],
        types: [searchType],
        wildcard: false
      });
      
      console.log(`Searching for ${searchType}: ${query}`);
      console.log('Request payload:', postData);
      
      return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
          hostname: urlObj.hostname,
          path: urlObj.pathname,
          method: 'POST',
          headers: {
            ...headers,
            'Content-Length': Buffer.byteLength(postData)
          }
        };
        
        const req = https.request(options, (res) => {
          let data = '';
          
          console.log(`Response status code: ${res.statusCode}`);
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              console.log('Search response:', JSON.stringify(parsed).substring(0, 1000));
              
              if (res.statusCode !== 200) {
                console.error('Search error:', parsed);
                resolve({ error: true, message: parsed.message || `HTTP ${res.statusCode}`, data: parsed });
              } else {
                resolve(parsed);
              }
            } catch (error) {
              console.error('Failed to parse response:', data.substring(0, 500));
              resolve({ error: true, message: 'Failed to parse response', data });
            }
          });
        });
        
        req.on('error', (error) => {
          console.error('Request error:', error);
          resolve({ error: true, message: error.message });
        });
        
        req.write(postData);
        req.end();
      });
    } catch (error) {
      console.error('Search error:', error.message);
      return { error: true, message: error.message };
    }
  }

  async searchMachines(query) {
    try {
      const url = `${config.osintCatBaseUrl}/machine_viewer/search?query=${encodeURIComponent(query)}`;
      const headers = {
        'X-API-KEY': config.osintCatApiKey
      };
      
      console.log(`Calling machine viewer API: ${url}`);
      const data = await this.makeRequest(url, headers);
      console.log('Machine viewer API response:', JSON.stringify(data).substring(0, 500));
      
      if (data && data.error) {
        console.error('API Error:', data.error, data.message);
        return { error: true, message: data.message };
      }
      
      return data;
    } catch (error) {
      console.error('Machine search error:', error.message);
      return { error: true, message: error.message };
    }
  }

  async downloadMachine(machineId) {
    try {
      const url = `${config.osintCatBaseUrl}/machine_viewer/download/${machineId}`;
      const headers = {
        'X-API-KEY': config.osintCatApiKey
      };
      
      console.log(`Downloading machine: ${machineId}`);
      const data = await this.makeRequest(url, headers);
      
      return data;
    } catch (error) {
      console.error('Machine download error:', error.message);
      return { error: true, message: error.message };
    }
  }

  async searchStealerLogs(query, type = 'email') {
    try {
      const url = `${config.osintCatBaseUrl}/database-search?query=${encodeURIComponent(query)}&type=${type}`;
      const headers = {
        'X-API-KEY': config.osintCatApiKey
      };
      
      console.log(`Calling stealer logs API: ${url}`);
      const data = await this.makeRequest(url, headers);
      console.log('Stealer logs API response:', JSON.stringify(data).substring(0, 1000));
      
      if (data && data.error) {
        console.error('API Error:', data.error, data.message);
        return { error: true, message: data.message };
      }
      
      return data;
    } catch (error) {
      console.error('Stealer logs search error:', error.message);
      return { error: true, message: error.message };
    }
  }

  async searchDiscord(query) {
    try {
      const url = `${config.osintCatBaseUrl}/discord?query=${encodeURIComponent(query)}`;
      const headers = {
        'X-API-KEY': config.osintCatApiKey
      };
      
      console.log(`Calling Discord API: ${url}`);
      const data = await this.makeRequest(url, headers);
      console.log('Discord API response:', JSON.stringify(data).substring(0, 1000));
      
      if (data && data.error) {
        console.error('API Error:', data.error, data.message);
        return { error: true, message: data.message };
      }
      
      return data;
    } catch (error) {
      console.error('Discord search error:', error.message);
      return { error: true, message: error.message };
    }
  }

  async searchRoblox(query) {
    try {
      const url = `${config.osintCatBaseUrl}/roblox?query=${encodeURIComponent(query)}`;
      const headers = {
        'X-API-KEY': config.osintCatApiKey
      };
      
      console.log(`Calling Roblox API: ${url}`);
      const data = await this.makeRequest(url, headers);
      console.log('Roblox API response:', JSON.stringify(data).substring(0, 1000));
      
      if (data && data.error) {
        console.error('API Error:', data.error, data.message);
        return { error: true, message: data.message };
      }
      
      return data;
    } catch (error) {
      console.error('Roblox search error:', error.message);
      return { error: true, message: error.message };
    }
  }

  async searchDiscordToRoblox(query) {
    try {
      const url = `${config.osintCatBaseUrl}/discord-to-roblox?query=${encodeURIComponent(query)}`;
      const headers = {
        'X-API-KEY': config.osintCatApiKey
      };
      
      console.log(`Calling Discord-to-Roblox API: ${url}`);
      const data = await this.makeRequest(url, headers);
      console.log('Discord-to-Roblox API response:', JSON.stringify(data).substring(0, 1000));
      
      if (data && data.error) {
        console.error('API Error:', data.error, data.message);
        return { error: true, message: data.message };
      }
      
      return data;
    } catch (error) {
      console.error('Discord-to-Roblox search error:', error.message);
      return { error: true, message: error.message };
    }
  }

  async searchPhoneOSINT(query) {
    try {
      const url = `${config.osintCatBaseUrl}/phone-osint?query=${encodeURIComponent(query)}`;
      const headers = {
        'X-API-KEY': config.osintCatApiKey
      };
      
      console.log(`Calling Phone OSINT API: ${url}`);
      const data = await this.makeRequest(url, headers);
      console.log('Phone OSINT API response:', JSON.stringify(data).substring(0, 1000));
      
      if (data && data.error) {
        console.error('API Error:', data.error, data.message);
        return { error: true, message: data.message };
      }
      
      return data;
    } catch (error) {
      console.error('Phone OSINT search error:', error.message);
      return { error: true, message: error.message };
    }
  }

  async searchVIN(query) {
    try {
      const url = `${config.osintCatBaseUrl}/vin?query=${encodeURIComponent(query)}`;
      const headers = {
        'X-API-KEY': config.osintCatApiKey
      };
      
      console.log(`Calling VIN API: ${url}`);
      const data = await this.makeRequest(url, headers);
      console.log('VIN API response:', JSON.stringify(data).substring(0, 1000));
      
      if (data && data.error) {
        console.error('API Error:', data.error, data.message);
        return { error: true, message: data.message };
      }
      
      return data;
    } catch (error) {
      console.error('VIN search error:', error.message);
      return { error: true, message: error.message };
    }
  }
}

module.exports = new APIService();
