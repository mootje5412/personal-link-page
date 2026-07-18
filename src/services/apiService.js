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
      
      console.log(`Calling Snusbase API for ${searchType}: ${query}`);
      
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
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              console.log('Snusbase API response:', JSON.stringify(parsed).substring(0, 500));
              resolve(parsed);
            } catch (error) {
              resolve(data);
            }
          });
        });
        
        req.on('error', (error) => {
          console.error('Snusbase request error:', error);
          reject(error);
        });
        
        req.write(postData);
        req.end();
      });
    } catch (error) {
      console.error('Snusbase search error:', error.message);
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
}

module.exports = new APIService();
