const apiService = require('./apiService');
const { getMachineId, getDownloadCommand } = require('../utils/machineUtils');

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
      return types;
    }

    if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(trimmed) && /[A-Z]/i.test(trimmed)) {
      types.push('vin');
      return types;
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

  buildSearchTasks(query, types) {
    const tasks = [];
    const stealerType = query.includes('@') ? 'email' : 'domain';

    tasks.push({ name: 'breach', run: () => apiService.searchBreach(query) });
    tasks.push({ name: 'stealer', run: () => apiService.searchStealerLogs(query, stealerType) });

    if (types.includes('discord')) {
      tasks.push({ name: 'discord', run: () => apiService.searchDiscord(query) });
      tasks.push({ name: 'discord-to-roblox', run: () => apiService.searchDiscordToRoblox(query) });
      return tasks;
    }

    if (types.includes('vin')) {
      tasks.push({ name: 'vin', run: () => apiService.searchVIN(query) });
      return tasks;
    }

    if (types.includes('ip')) {
      tasks.push({ name: 'ip', run: () => apiService.searchIP(query) });
    }

    if (types.includes('phone')) {
      tasks.push({ name: 'snusbase', run: () => apiService.snusbaseSearch(query, 'phone') });
      tasks.push({ name: 'phone-osint', run: () => apiService.searchPhoneOSINT(query) });
    } else if (types.includes('email')) {
      tasks.push({ name: 'snusbase', run: () => apiService.snusbaseSearch(query, 'email') });
    } else if (types.includes('username')) {
      tasks.push({ name: 'snusbase', run: () => apiService.snusbaseSearch(query, 'username') });
    } else if (types.includes('name')) {
      tasks.push({ name: 'snusbase', run: () => apiService.snusbaseSearch(query, 'name') });
    } else if (types.includes('roblox')) {
      tasks.push({ name: 'snusbase', run: () => apiService.snusbaseSearch(query, 'username') });
    } else {
      tasks.push({ name: 'snusbase', run: () => apiService.snusbaseSearch(query, 'email') });
    }

    if (types.includes('roblox') || types.includes('username')) {
      tasks.push({ name: 'roblox', run: () => apiService.searchRoblox(query) });
    }

    return tasks;
  }

  addUniqueResult(results, seen, formatted, key) {
    const dedupeKey = key || formatted;
    if (!dedupeKey || seen.has(dedupeKey)) {
      return false;
    }
    seen.add(dedupeKey);
    results.push(formatted);
    return true;
  }

  formatDiscordUsername(info) {
    if (!info.username) {
      return null;
    }
    if (info.discriminator && info.discriminator !== '0') {
      return `${info.username}#${info.discriminator}`;
    }
    return `@${info.username}`;
  }

  formatDiscordAvatar(info) {
    const userId = info.id || info.user_id;
    if (!info.avatar) {
      return null;
    }
    if (String(info.avatar).startsWith('http')) {
      return info.avatar;
    }
    if (userId) {
      return `https://cdn.discordapp.com/avatars/${userId}/${info.avatar}.png?size=256`;
    }
    return info.avatar;
  }

  formatDiscordProfile(info) {
    if (!info || typeof info !== 'object') {
      return null;
    }

    const lines = ['Discord Profile'];
    const username = this.formatDiscordUsername(info);
    const displayName = info.display_name || info.global_name || info.nick;

    if (displayName) {
      lines.push(`Display Name: ${displayName}`);
    }
    if (username) {
      lines.push(`Username: ${username}`);
    }
    if (info.id || info.user_id) {
      lines.push(`User ID: ${info.id || info.user_id}`);
    }

    const avatar = this.formatDiscordAvatar(info);
    if (avatar) {
      lines.push(`Avatar: ${avatar}`);
    }
    if (info.banner) {
      lines.push(`Banner: ${info.banner}`);
    }
    if (info.bio) {
      lines.push(`Bio: ${info.bio}`);
    }
    if (info.premium_type) {
      const nitro = info.premium_type === 2 ? 'Nitro' : info.premium_type === 1 ? 'Nitro Classic' : 'None';
      lines.push(`Nitro: ${nitro}`);
    }
    if (info.badges && info.badges.length) {
      lines.push(`Badges: ${Array.isArray(info.badges) ? info.badges.join(', ') : info.badges}`);
    }
    if (info.created_at) {
      lines.push(`Created: ${info.created_at}`);
    }
    if (info.profile_url) {
      lines.push(`Profile: ${info.profile_url}`);
    }
    if (info.public_flags !== undefined && info.public_flags !== null) {
      lines.push(`Public Flags: ${info.public_flags}`);
    }

    return lines.length > 1 ? lines.join('\n') : null;
  }

  formatRobloxProfile(item) {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const lines = ['Roblox Profile'];
    const robloxName = item.roblox_name || item.roblox_username || item.username || item.name;
    const robloxId = item.roblox_id || item.user_id || item.id;

    if (robloxName) {
      lines.push(`Roblox Username: ${robloxName}`);
    }
    if (robloxId && !String(robloxId).match(/^\d{17,19}$/)) {
      lines.push(`Roblox ID: ${robloxId}`);
    }

    if (item.discord_id) {
      lines.push(`Linked Discord ID: ${item.discord_id}`);
      if (item.discord_username) {
        lines.push(`Discord Username: @${item.discord_username}`);
      }
      if (item.discord_avatar) {
        lines.push(`Discord Avatar: ${item.discord_avatar}`);
      }
    } else if (item.discord_username) {
      lines.push(`Discord Username: @${item.discord_username}`);
    } else if (robloxName) {
      lines.push('Linked Discord: Not found');
    }

    return lines.length > 1 ? lines.join('\n') : null;
  }

  formatDiscordToRobloxProfile(response) {
    if (!response || typeof response !== 'object' || response.error) {
      return null;
    }

    const lines = ['Discord to Roblox Link'];
    const robloxName = response.roblox_username || response.roblox_name || response.username;
    const robloxId = response.roblox_id || response.user_id;
    const discordId = response.discord_id || response.query;

    if (robloxName) {
      lines.push(`Roblox Username: ${robloxName}`);
    }
    if (robloxId) {
      lines.push(`Roblox ID: ${robloxId}`);
    }
    if (discordId) {
      lines.push(`Discord ID: ${discordId}`);
    }
    if (response.profile_url) {
      lines.push(`Profile: ${response.profile_url}`);
    }

    return lines.length > 1 ? lines.join('\n') : null;
  }

  formatBreachRecord(item, sourceLabel) {
    if (!item || typeof item !== 'object') {
      return typeof item === 'string' ? item : null;
    }

    const lines = [];
    if (sourceLabel) {
      lines.push(`Source: ${sourceLabel}`);
    }
    if (item.source) {
      lines.push(`Database: ${item.source}`);
    }
    if (item.email) {
      lines.push(`Email: ${item.email}`);
    }
    if (item.username) {
      lines.push(`Username: ${item.username}`);
    }
    if (item.password) {
      lines.push(`Password: ${item.password}`);
    }
    if (item.phone) {
      lines.push(`Phone: ${item.phone}`);
    }
    if (item.ip) {
      lines.push(`IP: ${item.ip}`);
    }
    if (item.name && !item.roblox_name) {
      lines.push(`Name: ${item.name}`);
    }
    if (item.breach_date) {
      lines.push(`Breach Date: ${item.breach_date}`);
    }
    if (item.url) {
      lines.push(`URL: ${item.url}`);
    }

    if (lines.length === 0) {
      return this.formatGenericRecord(item);
    }

    return lines.join('\n');
  }

  formatGenericRecord(item) {
    if (typeof item === 'string') {
      return item;
    }

    const skipKeys = new Set([
      '_meta', 'api', 'elapsed_ms', 'timestamp', 'results_count',
      'execution_time', 'query', 'total', 'success', 'message', 'mode',
      'Count', 'Message', 'SearchCriteria', 'count'
    ]);

    const lines = [];
    Object.keys(item).forEach((key) => {
      if (skipKeys.has(key)) {
        return;
      }

      const value = item[key];
      if (value === null || value === undefined || value === '') {
        return;
      }

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        lines.push(`${key}: ${value}`);
      } else if (Array.isArray(value)) {
        lines.push(`${key}: ${value.join(', ')}`);
      }
    });

    return lines.length > 0 ? lines.join('\n') : JSON.stringify(item);
  }

  formatVinResults(response) {
    if (!response || !Array.isArray(response.Results)) {
      return null;
    }

    const lines = ['VIN Decode'];
    if (response.SearchCriteria) {
      lines.push(`VIN: ${response.SearchCriteria}`);
    }

    response.Results.forEach((row) => {
      if (row && row.Variable && row.Value && row.Value !== 'Not Applicable' && row.Value !== '') {
        lines.push(`${row.Variable}: ${row.Value}`);
      }
    });

    return lines.length > 1 ? lines.join('\n') : null;
  }

  formatMachineRecord(machine) {
    const lines = ['Machine Record'];
    if (machine.name) {
      lines.push(`Name: ${machine.name}`);
    }
    if (machine.id || machine.machine_id) {
      lines.push(`ID: ${machine.id || machine.machine_id}`);
    }
    if (machine.file_count !== undefined) {
      lines.push(`Files: ${machine.file_count}`);
    }
    if (machine.total_size !== undefined) {
      lines.push(`Size: ${machine.total_size} bytes`);
    }
    if (machine.imported_at) {
      lines.push(`Imported: ${machine.imported_at}`);
    }

    const machineId = getMachineId(machine);
    if (machineId) {
      lines.push(`Download: ${getDownloadCommand(machineId)}`);
    }

    return lines.join('\n');
  }

  appendDiscordResults(results, response, seen) {
    if (!response || response.error === true) {
      return;
    }
    if (response.error && typeof response.error === 'string') {
      return;
    }

    if (response.user_info) {
      const profile = this.formatDiscordProfile(response.user_info);
      if (profile) {
        const userId = response.user_info.id || response.user_info.user_id || 'profile';
        this.addUniqueResult(results, seen, profile, `discord-profile:${userId}`);
      }
    }

    const collections = [
      response.breach_data,
      response.results,
      response.data,
      response.leaks
    ];

    collections.forEach((collection) => {
      if (!Array.isArray(collection)) {
        return;
      }

      collection.forEach((item, index) => {
        if (item && item.username && (item.id || item.user_id) && !item.email && !item.password) {
          const profile = this.formatDiscordProfile(item);
          if (profile) {
            this.addUniqueResult(results, seen, profile, `discord-item-profile:${item.id || item.user_id || index}`);
            return;
          }
        }

        const formatted = this.formatBreachRecord(item, 'Discord Leak');
        if (formatted) {
          const key = `discord-leak:${item.email || ''}:${item.username || ''}:${item.password || ''}:${item.source || index}`;
          this.addUniqueResult(results, seen, formatted, key);
        }
      });
    });

    if (results.length === 0 || !response.user_info) {
      const profile = this.formatDiscordProfile(response);
      if (profile) {
        this.addUniqueResult(results, seen, profile, `discord-root:${response.id || response.user_id || 'root'}`);
      }
    }
  }

  appendRobloxResults(results, response, seen, sourceName) {
    if (!response || response.error === true) {
      return;
    }
    if (response.error && typeof response.error === 'string') {
      return;
    }

    if (sourceName === 'discord-to-roblox') {
      const linked = this.formatDiscordToRobloxProfile(response);
      if (linked) {
        this.addUniqueResult(results, seen, linked, `d2r:${response.roblox_id || response.roblox_username || response.query}`);
      }
    }

    const matches = Array.isArray(response.results) ? response.results : [];
    matches.forEach((item, index) => {
      const profile = this.formatRobloxProfile(item);
      if (profile) {
        const key = `roblox:${item.roblox_name || item.roblox_username || item.discord_id || index}`;
        this.addUniqueResult(results, seen, profile, key);
      }
    });

    if (matches.length === 0) {
      const profile = this.formatRobloxProfile(response) || this.formatDiscordToRobloxProfile(response);
      if (profile) {
        this.addUniqueResult(results, seen, profile, `roblox-root:${response.roblox_name || response.query || 'root'}`);
      }
    }
  }

  appendOsintCatResponse(results, response, seen, sourceName) {
    if (!response || response.error === true) {
      return;
    }
    if (response.error && typeof response.error === 'string') {
      return;
    }

    const vinFormatted = this.formatVinResults(response);
    if (vinFormatted) {
      this.addUniqueResult(results, seen, vinFormatted, `vin:${response.SearchCriteria || 'decode'}`);
      return;
    }

    const collections = [
      { items: response.breach_data, label: 'Breach' },
      { items: response.results, label: sourceName || 'Result' },
      { items: response.data, label: sourceName || 'Data' },
      { items: response.machines, label: 'Machine' }
    ];

    collections.forEach(({ items, label }) => {
      if (!Array.isArray(items)) {
        return;
      }

      items.forEach((item, index) => {
        let formatted;
        if (label === 'Machine') {
          formatted = this.formatMachineRecord(item);
        } else {
          formatted = this.formatBreachRecord(item, label);
        }

        if (formatted) {
          const key = `${label}:${item.email || ''}:${item.username || ''}:${item.password || ''}:${item.id || item.name || index}`;
          this.addUniqueResult(results, seen, formatted, key);
        }
      });
    });

    if (response.user_info) {
      const profile = this.formatDiscordProfile(response.user_info);
      if (profile) {
        this.addUniqueResult(results, seen, profile, `profile:${response.user_info.id || response.user_info.user_id}`);
      }
    }

    if (Array.isArray(response.Results) && response.Results[0] && response.Results[0].Variable) {
      return;
    }

    const generic = this.formatGenericRecord(response);
    if (generic && !generic.startsWith('{')) {
      this.addUniqueResult(results, seen, generic, `generic:${sourceName}:${response.query || generic.substring(0, 80)}`);
    }
  }

  appendSnusbaseResults(results, response, seen) {
    if (!response || response.error || !response.results) {
      return;
    }

    Object.keys(response.results).forEach((dbName) => {
      const dbResults = response.results[dbName];
      if (!Array.isArray(dbResults)) {
        return;
      }

      dbResults.forEach((item, index) => {
        const formatted = this.formatBreachRecord({ ...item, source: dbName }, 'Snusbase');
        const key = `snusbase:${dbName}:${item.email || ''}:${item.username || ''}:${item.password || ''}:${index}`;
        this.addUniqueResult(results, seen, formatted, key);
      });
    });
  }

  processTaskResult(name, data, results, seen) {
    if (name === 'snusbase') {
      this.appendSnusbaseResults(results, data, seen);
      return;
    }

    if (name === 'discord') {
      this.appendDiscordResults(results, data, seen);
      return;
    }

    if (name === 'roblox') {
      this.appendRobloxResults(results, data, seen, 'roblox');
      return;
    }

    if (name === 'discord-to-roblox') {
      this.appendRobloxResults(results, data, seen, 'discord-to-roblox');
      return;
    }

    this.appendOsintCatResponse(results, data, seen, name);
  }

  async search(query, onProgress) {
    const results = [];
    const seen = new Set();
    const types = this.detectQueryTypes(query);
    const tasks = this.buildSearchTasks(query, types);

    console.log(`Search: ${query} | Types: ${types.join(', ')} | APIs: ${tasks.map((task) => task.name).join(', ')}`);

    const notify = () => {
      if (typeof onProgress === 'function') {
        onProgress([...results], tasks.length);
      }
    };

    await Promise.all(tasks.map(async ({ name, run }) => {
      try {
        const data = await run();
        this.processTaskResult(name, data, results, seen);
        notify();
      } catch (error) {
        console.error(`Search task ${name} failed:`, error.message);
      }
    }));

    return results;
  }

  async machineSearch(query) {
    const results = [];
    const seen = new Set();
    const data = await apiService.searchMachines(query);

    if (data && !data.error) {
      const machines = data.machines || data.results || [];
      machines.forEach((machine, index) => {
        const formatted = this.formatMachineRecord(machine);
        this.addUniqueResult(results, seen, formatted, `machine:${getMachineId(machine) || machine.name || index}`);
      });
    }

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
}

module.exports = new OSINTService();
