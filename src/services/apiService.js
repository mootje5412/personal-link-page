const https = require('https');
const config = require('../../config/config');

const API_TIMEOUT_MS = config.apiTimeoutMs || 8000;

class APIService {
  requestJson(url, options = {}, body = null, timeoutMs = API_TIMEOUT_MS) {
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      const payload = body === null ? null : JSON.stringify(body);
      const headers = { ...(options.headers || {}) };

      if (payload !== null) {
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = https.request({
        hostname: urlObj.hostname,
        path: `${urlObj.pathname}${urlObj.search}`,
        method: options.method || 'GET',
        headers,
        timeout: timeoutMs
      }, (res) => {
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

          if (typeof parsed === 'string' && (parsed.includes('Just a moment') || parsed.includes('cf-mitigated'))) {
            resolve({
              error: true,
              statusCode: res.statusCode,
              message: 'Cloudflare blocked the request. Use a whitelisted static IP server.',
              data: parsed
            });
            return;
          }

          if (res.statusCode < 200 || res.statusCode >= 300) {
            resolve({
              error: true,
              statusCode: res.statusCode,
              message: (parsed && (parsed.message || parsed.error)) || `HTTP ${res.statusCode}`,
              data: parsed
            });
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
        resolve({ error: true, message: error.message });
      });

      if (payload !== null) {
        req.write(payload);
      }
      req.end();
    });
  }

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

  async osintCatGet(endpoint, query, extraParams = {}, timeoutMs = API_TIMEOUT_MS) {
    try {
      const params = new URLSearchParams({ query, ...extraParams });
      const url = `${config.osintCatBaseUrl}${endpoint}?${params.toString()}`;
      const headers = {
        'X-API-KEY': config.osintCatApiKey
      };

      const data = await this.makeRequest(url, headers, timeoutMs);

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
    // GET https://www.osintcat.net/api/breach?query=... with X-API-KEY header (OsintCat docs)
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
    const attempts = this.buildMachineSearchAttempts(query);
    const timeoutMs = config.machineSearchTimeoutMs || 45000;
    let lastError = null;
    let collected = [];

    for (const attempt of attempts) {
      console.log(`Machine viewer search attempt: "${attempt}"`);
      const data = await this.osintCatGet('/machine_viewer/search', attempt, {}, timeoutMs);

      if (data && data.error === true) {
        lastError = data.message;
        if (this.isRetryableMachineError(data)) {
          continue;
        }
        continue;
      }

      if (data && typeof data.error === 'string') {
        const lower = data.error.toLowerCase();
        if (lower.includes('no matches') || lower.includes('not found') || lower.includes('no results')) {
          continue;
        }

        lastError = data.error;
        if (this.isRetryableMachineError(data)) {
          continue;
        }
        continue;
      }

      const found = data.machines || data.results || [];
      collected = this.dedupeMachines([...collected, ...found]);
    }

    if (collected.length > 0) {
      return { query, total: collected.length, machines: collected };
    }

    return { error: true, message: lastError || 'No infected machines found.' };
  }

  buildMachineSearchAttempts(query) {
    const trimmed = String(query || '').trim();
    const attempts = [trimmed];

    if (trimmed.includes(' ')) {
      const parts = trimmed.split(/\s+/).filter(Boolean);
      attempts.push(parts[0], parts[parts.length - 1], parts.join(''));
    }

    return [...new Set(attempts.filter(Boolean))];
  }

  isRetryableMachineError(data) {
    const message = String((data && (data.message || data.error)) || '').toUpperCase();
    return message.includes('DB_ERROR') ||
      message.includes('TIMEOUT') ||
      message.includes('TIMED OUT');
  }

  dedupeMachines(machines) {
    const seen = new Set();

    return machines.filter((machine) => {
      const id = machine.id || machine.machine_id || machine.uuid || machine.name;
      if (!id || seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
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

  async lookupRobloxProfile(username) {
    const resolved = await this.requestJson(
      'https://users.roblox.com/v1/usernames/users',
      { method: 'POST' },
      { usernames: [username], excludeBannedUsers: false }
    );

    if (resolved.error || !Array.isArray(resolved.data) || resolved.data.length === 0) {
      return { error: true, message: resolved.message || 'Roblox user not found' };
    }

    const base = resolved.data[0];
    const [details, thumbnail] = await Promise.all([
      this.requestJson(`https://users.roblox.com/v1/users/${base.id}`),
      this.requestJson(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${base.id}&size=180x180&format=Png&isCircular=false`
      )
    ]);

    const avatar = !thumbnail.error && Array.isArray(thumbnail.data)
      ? thumbnail.data[0] && thumbnail.data[0].imageUrl
      : null;

    return {
      id: base.id,
      username: (details && details.name) || base.name,
      display_name: (details && details.displayName) || base.displayName,
      description: details && details.description,
      created_at: details && details.created,
      is_banned: details && details.isBanned,
      verified: base.hasVerifiedBadge,
      avatar,
      profile_url: `https://www.roblox.com/users/${base.id}/profile`
    };
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

  getSeekAfHeaders() {
    return {
      'X-API-Key': config.seekAfApiKey,
      Accept: 'application/json',
      'User-Agent': config.seekAfUserAgent || 'FindNow-OSINT-Bot/1.0'
    };
  }

  logSeekAfResponse(path, statusCode, parsed, rawData) {
    if (statusCode >= 200 && statusCode < 300 && parsed && typeof parsed === 'object') {
      console.log(
        `SeekAF ${path} OK | query=${parsed.query || 'n/a'} | total=${parsed.total ?? parsed.results?.length ?? 0} | credits=${parsed.credits_remaining ?? 'n/a'} | search_id=${parsed.search_id || parsed.id || 'n/a'}`
      );
      return;
    }

    const preview = typeof parsed === 'string'
      ? parsed.substring(0, 160)
      : JSON.stringify(parsed || {}).substring(0, 300);

    console.error(`SeekAF ${path} HTTP ${statusCode}: ${preview}`);
  }

  async seekAfPost(path, body, timeoutMs = config.seekAfTimeoutFast) {
    if (!config.seekAfEnabled || !config.seekAfApiKey) {
      return { error: true, message: 'SeekAF is not configured' };
    }

    const url = `${config.seekAfBaseUrl}${path}`;
    console.log(`SeekAF request POST ${url}: ${JSON.stringify(body)}`);

    const response = await this.requestJson(url, {
      method: 'POST',
      headers: this.getSeekAfHeaders()
    }, body, timeoutMs);

    if (response && response.error) {
      console.error(`SeekAF ${path} failed: ${response.message}`);
    } else {
      this.logSeekAfResponse(path, 200, response);
    }

    return response;
  }

  async seekAfSearch(query, type, limit = config.seekAfSearchLimit) {
    const body = { query, limit };
    if (type) {
      body.type = type;
    }
    return this.seekAfPost('/search', body, config.seekAfTimeoutFast);
  }

  async seekAfSearchDeep(query, type, limit = config.seekAfSearchLimit) {
    const body = { query, limit };
    if (type) {
      body.type = type;
    }
    return this.seekAfPost('/search/deep', body, config.seekAfTimeoutDeep);
  }

  async seekAfStealer(query, deep = config.seekAfStealerDeep, limit = config.seekAfStealerLimit) {
    return this.seekAfPost('/stealer', {
      query,
      deep,
      limit
    }, config.seekAfTimeoutStealer);
  }
}

module.exports = new APIService();
