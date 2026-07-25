const https = require('https');
const config = require('../../config/config');

class ApiClient {
  get(endpoint, query, extraParams = {}, timeoutMs = config.apiTimeoutMs) {
    const params = new URLSearchParams({ query, ...extraParams });
    const url = `${config.intelBaseUrl}${endpoint}?${params.toString()}`;
    return this.request(url, { method: 'GET' }, timeoutMs);
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

      req.end();
    });
  }

  breach(query) { return this.get('/breach', query); }
  discord(query) { return this.get('/discord', query); }
  roblox(query) { return this.get('/roblox', query); }
  discordToRoblox(query) { return this.get('/discord-to-roblox', query); }
  phone(query) { return this.get('/phone-osint', query); }
  ip(query) { return this.get('/ip', query); }
  vin(query) { return this.get('/vin', query, { type: 'decode' }); }
  domain(query) { return this.get('/domain', query); }
  stealer(query, type) { return this.get('/database-search', query, type ? { type } : {}); }
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
}

module.exports = new ApiClient();
