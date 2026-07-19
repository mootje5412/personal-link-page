const https = require('https');
const config = require('../../config/config');

const API_TIMEOUT_MS = config.apiTimeoutMs || 8000;

class APIService {
  makeRequest(url, headers, timeoutMs = API_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, { headers, timeout: timeoutMs }, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (error) {
            parsed = data;
          }

          if (res.statusCode !== 200) {
            const message = (parsed && (parsed.message || parsed.error)) || `HTTP ${res.statusCode}`;
            console.error(`OSINT Cat API HTTP ${res.statusCode}: ${message}`);
            resolve({ error: true, statusCode: res.statusCode, message, data: parsed });
            return;
          }

          resolve(parsed);
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ error: true, message: 'Request timed out' });
      });

      req.on('error', (error) => {
        if (error.message !== 'Request timed out') {
          reject(error);
        }
      });
    });
  }

  async osintCatGet(endpoint, query, extraParams = {}) {
    try {
      const params = new URLSearchParams({ query, ...extraParams });
      const url = `${config.osintCatBaseUrl}${endpoint}?${params.toString()}`;
      const headers = {
        'X-API-KEY': config.osintCatApiKey
      };

      const data = await this.makeRequest(url, headers);

      if (data && data.error === true) {
        return data;
      }

      if (data && typeof data.error === 'string') {
        const lower = data.error.toLowerCase();
        if (lower.includes('no matches') || lower.includes('not found') || lower.includes('no results')) {
          return data;
        }
        console.error('API Error:', data.error, data.message);
        return { error: true, message: data.error };
      }

      return data;
    } catch (error) {
      console.error(`OSINT Cat ${endpoint} error:`, error.message);
      return { error: true, message: error.message };
    }
  }

  async searchBreach(query) {
    return this.osintCatGet('/breach', query);
  }

  async searchStealerLogs(query, type) {
    const extraParams = type ? { type } : {};
    return this.osintCatGet('/database-search', query, extraParams);
  }

  async searchIP(query) {
    return this.osintCatGet('/ip', query);
  }

  async searchMachines(query) {
    return this.osintCatGet('/machine_viewer/search', query);
  }

  downloadMachine(machineId) {
    return new Promise((resolve) => {
      const url = `${config.osintCatBaseUrl}/machine_viewer/machines/${encodeURIComponent(machineId)}/download`;
      const headers = {
        'X-API-KEY': config.osintCatApiKey
      };

      const req = https.get(url, { headers, timeout: 60000 }, (res) => {
        const chunks = [];

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const buffer = Buffer.concat(chunks);

          if (res.statusCode !== 200) {
            let message = `HTTP ${res.statusCode}`;
            try {
              const parsed = JSON.parse(buffer.toString('utf8'));
              message = parsed.message || parsed.error || message;
            } catch (error) {
              message = buffer.toString('utf8').substring(0, 200) || message;
            }
            resolve({ error: true, message });
            return;
          }

          resolve({
            buffer,
            contentType: res.headers['content-type'] || 'application/zip',
            filename: `machine_${machineId}.zip`
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ error: true, message: 'Download timed out' });
      });

      req.on('error', (error) => {
        console.error('Machine download error:', error.message);
        resolve({ error: true, message: error.message });
      });
    });
  }

  async searchDiscord(query) {
    return this.osintCatGet('/discord', query);
  }

  async searchRoblox(query) {
    return this.osintCatGet('/roblox', query);
  }

  async searchDiscordToRoblox(query) {
    return this.osintCatGet('/discord-to-roblox', query);
  }

  async searchPhoneOSINT(query) {
    return this.osintCatGet('/phone-osint', query);
  }

  async searchVIN(query) {
    return this.osintCatGet('/vin', query, { type: 'decode' });
  }

  async snusbasePost(path, payload) {
    try {
      const url = `${config.snusbaseBaseUrl}${path}`;
      const headers = {
        Auth: config.snusbaseApiKey,
        'Content-Type': 'application/json'
      };
      const postData = JSON.stringify(payload);

      return new Promise((resolve) => {
        const urlObj = new URL(url);
        const options = {
          hostname: urlObj.hostname,
          path: urlObj.pathname,
          method: 'POST',
          headers: {
            ...headers,
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: API_TIMEOUT_MS
        };

        const req = https.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);

              if (res.statusCode !== 200) {
                resolve({ error: true, message: parsed.message || parsed.error || `HTTP ${res.statusCode}`, data: parsed });
              } else {
                resolve(parsed);
              }
            } catch (error) {
              resolve({ error: true, message: 'Failed to parse Snusbase response', data });
            }
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ error: true, message: 'Request timed out' });
        });

        req.on('error', (error) => {
          resolve({ error: true, message: error.message });
        });

        req.write(postData);
        req.end();
      });
    } catch (error) {
      return { error: true, message: error.message };
    }
  }

  async snusbaseSearch(query, searchType = 'email') {
    return this.snusbasePost('/data/search', {
      terms: [query],
      types: [searchType],
      wildcard: false,
      group_by: false
    });
  }

  async snusbaseIpWhois(query) {
    return this.snusbasePost('/tools/ip-whois', {
      terms: [query]
    });
  }
}

module.exports = new APIService();
