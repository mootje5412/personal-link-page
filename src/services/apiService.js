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
      console.log('Breach API response:', JSON.stringify(data));
      
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
      console.log('Database API response:', JSON.stringify(data));
      
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
}

module.exports = new APIService();
