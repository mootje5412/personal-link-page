const apiService = require('./apiService');

class OSINTService {
  detectQueryTypes(query) {
    const types = [];
    const trimmed = query.trim();

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      types.push('email');
    }

    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed)) {
      types.push('ip');
    }

    if (/^\d{17,19}$/.test(trimmed)) {
      types.push('discord');
    }

    if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(trimmed) && /[A-Z]/i.test(trimmed)) {
      types.push('vin');
    }

    if (!/^\d{17,}$/.test(trimmed.replace(/\s/g, ''))) {
      const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
      if (phoneRegex.test(trimmed.replace(/\s/g, ''))) {
        types.push('phone');
      }
    }

    if (/^[a-zA-Z0-9_]{3,20}$/.test(trimmed) && !/^\d{17,19}$/.test(trimmed)) {
      types.push('roblox');
      types.push('username');
    } else if (/^[a-zA-Z0-9._-]{3,30}$/.test(trimmed) && !trimmed.includes(' ')) {
      types.push('username');
    }

    if (/^[a-zA-Z]{2,}(\s[a-zA-Z]{2,})?$/.test(trimmed)) {
      types.push('name');
    }

    if (types.length === 0) {
      types.push('general');
    }

    return types;
  }

  formatItem(item, index = 0) {
    if (index === 0) {
      console.log('Sample item structure:', JSON.stringify(item));
    }

    if (typeof item === 'string') {
      return item;
    }

    const lines = [];

    Object.keys(item).forEach((key) => {
      const value = item[key];

      if (value === null || value === undefined) return;

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        lines.push(`${key}: ${value}`);
      } else if (Array.isArray(value)) {
        lines.push(`${key}: ${value.join(', ')}`);
      } else if (typeof value === 'object') {
        lines.push(`${key}: ${JSON.stringify(value)}`);
      }
    });

    return lines.length > 0 ? lines.join('\n') : JSON.stringify(item);
  }

  formatVinResults(response) {
    if (!response || !Array.isArray(response.Results)) {
      return null;
    }

    const lines = [];
    if (response.SearchCriteria) lines.push(`SearchCriteria: ${response.SearchCriteria}`);

    response.Results.forEach((row) => {
      if (row && row.Variable && row.Value && row.Value !== 'Not Applicable' && row.Value !== '') {
        lines.push(`${row.Variable}: ${row.Value}`);
      }
    });

    return lines.length > 0 ? lines.join('\n') : null;
  }

  extractOsintCatResults(response) {
    if (!response || typeof response !== 'object') {
      return [];
    }

    if (response.error && typeof response.error === 'string') {
      return [];
    }

    const items = [];
    const skipKeys = new Set([
      '_meta', 'api', 'elapsed_ms', 'timestamp', 'results_count',
      'execution_time', 'query', 'total', 'success', 'message', 'mode',
      'Count', 'Message', 'SearchCriteria'
    ]);

    const pushItem = (item) => {
      if (item === null || item === undefined) return;
      if (typeof item === 'object' && Object.keys(item).length === 0) return;
      items.push(item);
    };

    const vinFormatted = this.formatVinResults(response);
    if (vinFormatted) {
      items.push(vinFormatted);
      return items;
    }

    ['results', 'machines', 'breach_data', 'data'].forEach((key) => {
      const value = response[key];
      if (Array.isArray(value)) {
        value.forEach(pushItem);
      } else if (value && typeof value === 'object') {
        pushItem(value);
      }
    });

    if (response.user_info && typeof response.user_info === 'object') {
      pushItem(response.user_info);
    }

    if (Array.isArray(response.Results) && response.Results[0] && response.Results[0].Variable) {
      response.Results.forEach((row) => {
        if (row && row.Variable && row.Value) {
          pushItem({ [row.Variable]: row.Value });
        }
      });
      return items;
    }

    if (items.length === 0) {
      const keys = Object.keys(response).filter((key) => !skipKeys.has(key));
      const looksLikeRecord = keys.some((key) => [
        'username', 'user_id', 'email', 'password', 'id', 'name', 'vin',
        'make', 'model', 'display_name', 'discriminator', 'created_at',
        'file_count', 'total_size', 'imported_at', 'profile_url', 'bio',
        'avatar', 'banner', 'premium_type', 'badges'
      ].includes(key));

      if (looksLikeRecord) {
        pushItem(response);
      }
    }

    return items;
  }

  appendOsintCatResponse(results, response, seen) {
    const items = this.extractOsintCatResults(response);

    items.forEach((item) => {
      const formatted = typeof item === 'string' ? item : this.formatItem(item);
      if (!seen.has(formatted)) {
        seen.add(formatted);
        results.push(formatted);
      }
    });

    return items.length;
  }

  appendSnusbaseResults(results, response, seen) {
    if (!response || response.error || !response.results) {
      return;
    }

    Object.keys(response.results).forEach((dbName) => {
      const dbResults = response.results[dbName];
      if (Array.isArray(dbResults)) {
        dbResults.forEach((item) => {
          const formatted = this.formatItem(item);
          if (!seen.has(formatted)) {
            seen.add(formatted);
            results.push(formatted);
          }
        });
      }
    });
  }

  async search(query) {
    const results = [];
    const seen = new Set();
    const types = this.detectQueryTypes(query);

    console.log(`Unified search for: ${query}`);
    console.log(`Detected types: ${types.join(', ')}`);

    const tasks = [
      apiService.searchBreach(query).then((data) => ({ name: 'breach', data })),
      apiService.searchDatabase(query).then((data) => ({ name: 'database', data }))
    ];

    if (types.includes('email')) {
      tasks.push(apiService.snusbaseSearch(query, 'email').then((data) => ({ name: 'snusbase', data })));
    } else if (types.includes('phone')) {
      tasks.push(apiService.snusbaseSearch(query, 'phone').then((data) => ({ name: 'snusbase', data })));
      tasks.push(apiService.searchPhoneOSINT(query).then((data) => ({ name: 'phone-osint', data })));
    } else if (types.includes('username')) {
      tasks.push(apiService.snusbaseSearch(query, 'username').then((data) => ({ name: 'snusbase', data })));
    } else if (types.includes('name')) {
      tasks.push(apiService.snusbaseSearch(query, 'name').then((data) => ({ name: 'snusbase', data })));
    } else {
      tasks.push(apiService.snusbaseSearch(query, 'email').then((data) => ({ name: 'snusbase', data })));
    }

    if (types.includes('discord')) {
      tasks.push(apiService.searchDiscord(query).then((data) => ({ name: 'discord', data })));
      tasks.push(apiService.searchDiscordToRoblox(query).then((data) => ({ name: 'discord-to-roblox', data })));
    }

    if (types.includes('vin')) {
      tasks.push(apiService.searchVIN(query).then((data) => ({ name: 'vin', data })));
    }

    if (types.includes('roblox')) {
      tasks.push(apiService.searchRoblox(query).then((data) => ({ name: 'roblox', data })));
    }

    if (types.includes('username') && !types.includes('roblox')) {
      tasks.push(apiService.searchRoblox(query).then((data) => ({ name: 'roblox', data })));
    }

    tasks.push(apiService.searchStealerLogs(query, types.includes('email') ? 'email' : 'domain').then((data) => ({ name: 'stealer', data })));
    tasks.push(apiService.searchMachines(query).then((data) => ({ name: 'machine', data })));

    const settled = await Promise.allSettled(tasks);

    settled.forEach((result) => {
      if (result.status !== 'fulfilled') {
        console.error('Search task failed:', result.reason);
        return;
      }

      const { name, data } = result.value;
      console.log(`Processing ${name} response`);

      if (name === 'snusbase') {
        this.appendSnusbaseResults(results, data, seen);
        return;
      }

      if (name === 'machine') {
        if (data && !data.error) {
          const machines = data.machines || data.results || [];
          machines.forEach((machine) => {
            let formatted = this.formatItem(machine);
            if (machine.id || machine.machine_id) {
              formatted += `\n\nDownload: /download_${machine.id || machine.machine_id}`;
            }
            if (!seen.has(formatted)) {
              seen.add(formatted);
              results.push(formatted);
            }
          });
        }
        return;
      }

      this.appendOsintCatResponse(results, data, seen);
    });

    return results;
  }

  async emailSearch(query) {
    return this.search(query);
  }

  async usernameSearch(query) {
    return this.search(query);
  }

  async phoneSearch(query) {
    return this.search(query);
  }

  async ipSearch(query) {
    return this.search(query);
  }

  async nameSearch(query) {
    return this.search(query);
  }

  async generalSearch(query) {
    return this.search(query);
  }

  async discordSearch(query) {
    return this.search(query);
  }

  async robloxSearch(query) {
    return this.search(query);
  }

  async vinSearch(query) {
    return this.search(query);
  }

  async machineSearch(query) {
    return this.search(query);
  }
}

module.exports = new OSINTService();
