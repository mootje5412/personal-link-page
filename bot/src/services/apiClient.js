const https = require('https');
const config = require('../../config/config');

const NO_RESULT_PATTERNS = ['no matches', 'not found', 'no results'];

function isNoResultError(message) {
  const lower = String(message || '').toLowerCase();
  return NO_RESULT_PATTERNS.some((pattern) => lower.includes(pattern));
}

function isTimeoutError(message) {
  return String(message || '').toLowerCase().includes('timeout');
}

function isAuthError(message) {
  const lower = String(message || '').toLowerCase();
  return lower.includes('whitelist')
    || lower.includes('unauthorized')
    || lower.includes('ip_unauthorized');
}

class ApiClient {
  buildUrl(endpoint, query, extraParams = {}) {
    const params = new URLSearchParams({ query, ...extraParams });
    return `${config.intelBaseUrl}${endpoint}?${params.toString()}`;
  }

  get(endpoint, query, extraParams = {}, timeoutMs = config.apiTimeoutMs) {
    const url = this.buildUrl(endpoint, query, extraParams);
    return this.request(url, { method: 'GET' }, timeoutMs);
  }

  /**
   * curl "https://www.osintcat.net/api/breach?query=user@example.com" \
   *      -H "X-API-KEY: YOUR_API_KEY"
   */
  breach(query) {
    const url = this.buildUrl('/breach', query);
    console.log(`[API] Breach -> ${url}`);
    return this.request(url, { method: 'GET' }, config.breachTimeoutMs || config.apiTimeoutMs);
  }

  detectDatabaseSearchType(query) {
    if (query.includes('@')) {
      return 'email';
    }

    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(query)) {
      return 'domain';
    }

    return null;
  }

  /**
   * curl "https://www.osintcat.net/api/database-search?query=example@email.com&type=email" \
   *      -H "X-API-KEY: YOUR_API_KEY"
   */
  databaseSearch(query, type = null) {
    const extraParams = type ? { type } : {};
    const url = this.buildUrl('/database-search', query, extraParams);
    console.log(`[API] Database search -> ${url}`);
    return this.request(url, { method: 'GET' }, config.stealerTimeoutMs);
  }

  stealer(query, type) {
    return this.databaseSearch(query, type);
  }

  request(url, options = {}, timeoutMs = config.apiTimeoutMs) {
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      const headers = {
        'X-API-KEY': config.intelApiKey,
        Accept: 'application/json',
        ...(options.headers || {})
      };

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
          } catch {
            parsed = data;
          }

          if (typeof parsed === 'string' && parsed.includes('Just a moment')) {
            resolve({ error: true, message: 'Request blocked by protection layer.' });
            return;
          }

          if (res.statusCode < 200 || res.statusCode >= 300) {
            const message = (parsed && (parsed.message || parsed.error)) || `HTTP ${res.statusCode}`;
            console.error(`[API] HTTP ${res.statusCode} ${urlObj.pathname}: ${message}`);
            resolve({
              error: true,
              statusCode: res.statusCode,
              message,
              data: parsed
            });
            return;
          }

          if (parsed && typeof parsed.error === 'string' && !isNoResultError(parsed.error)) {
            console.error(`[API] ${urlObj.pathname}: ${parsed.error}`);
          }

          resolve(parsed);
        });
      });

      req.on('timeout', () => {
        req.destroy();
        console.error(`[API] Timeout ${urlObj.pathname} after ${timeoutMs}ms`);
        resolve({ error: true, message: 'Request timed out' });
      });

      req.on('error', (error) => {
        console.error(`[API] Error ${urlObj.pathname}: ${error.message}`);
        resolve({ error: true, message: error.message });
      });

      req.end();
    });
  }

  discord(query) { return this.get('/discord', query); }
  roblox(query) { return this.get('/roblox', query); }
  discordToRoblox(query) { return this.get('/discord-to-roblox', query); }
  phone(query) { return this.get('/phone-osint', query); }
  ip(query) { return this.get('/ip', query); }
  vin(query) { return this.get('/vin', query, { type: 'decode' }); }
  domain(query) { return this.get('/domain', query); }
  minecraft(query) { return this.get('/minecraft', query); }
  minecraftOsint(query) { return this.get('/minecraft-lookup', query); }
  dns(query) { return this.get('/dns-resolver', query); }
  chileanName(query) { return this.get('/chilean-name', query); }
  gtaPlayers(query) { return this.get('/gta/players', query); }
  gtaSpotted(query) { return this.get('/gta/spotted', query); }
  tiktok(query) { return this.get('/tiktok-resolver', query); }
  instagram(query) { return this.get('/instagram-resolver', query); }

  createFootprintTask(query, type = 'username') {
    return this.get('/footprint/create-task', query, { type });
  }

  getFootprintTask(taskId) {
    const url = `${config.intelBaseUrl}/footprint/get-task?id=${encodeURIComponent(taskId)}`;
    return this.request(url);
  }

  searchMachines(query) {
    const attempts = [query.trim()];
    if (query.includes(' ')) {
      const parts = query.trim().split(/\s+/).filter(Boolean);
      attempts.push(parts[0], parts[parts.length - 1]);
    }

    return this.runMachineAttempts([...new Set(attempts.filter(Boolean))]);
  }

  async runMachineAttempts(attempts) {
    let lastError = null;
    let collected = [];

    for (const attempt of attempts) {
      const data = await this.get('/machine_viewer/search', attempt, {}, config.machineSearchTimeoutMs);

      if (data && data.error === true) {
        lastError = data.message;
        continue;
      }

      if (data && typeof data.error === 'string') {
        const lower = data.error.toLowerCase();
        if (lower.includes('no matches') || lower.includes('not found') || lower.includes('no results')) {
          continue;
        }
        lastError = data.error;
        continue;
      }

      const found = data.machines || data.results || [];
      collected = this.dedupeMachines([...collected, ...found]);
    }

    if (collected.length > 0) {
      return { machines: collected };
    }

    return { error: true, message: lastError || 'No machines found.' };
  }

  dedupeMachines(machines) {
    const seen = new Set();
    return machines.filter((machine) => {
      const id = machine.id || machine.machine_id || machine.uuid || machine.name;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  async healthCheck() {
    const result = await this.breach('healthcheck@apexsearch.local');
    if (result?.error === true) {
      return {
        ok: false,
        message: result.message || 'API request failed'
      };
    }

    if (typeof result?.error === 'string' && !isNoResultError(result.error)) {
      return {
        ok: false,
        message: result.error
      };
    }

    return { ok: true };
  }
}

module.exports = new ApiClient();
module.exports.isAuthError = isAuthError;
module.exports.isTimeoutError = isTimeoutError;
module.exports.isNoResultError = isNoResultError;
