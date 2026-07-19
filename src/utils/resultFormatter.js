const CATEGORY_LABELS = {
  breach: 'BREACH',
  database: 'STEALER',
  stealer: 'STEALER',
  snusbase: 'SNUSBASE',
  discord: 'DISCORD',
  roblox: 'ROBLOX',
  'discord-to-roblox': 'DISCORD→ROBLOX',
  ip: 'IP',
  vin: 'VIN',
  phone: 'PHONE',
  'phone-osint': 'PHONE',
  machine: 'MACHINE'
};

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value)) {
    return String(bytes);
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeRecord(item) {
  if (!item || typeof item !== 'object') {
    return item;
  }

  return {
    ...item,
    email: item.email || item.mail || item.e_mail,
    username: item.username || item.login || item.user || item.user_name,
    password: item.password || item.pass || item.passwd || item.pwd,
    phone: item.phone || item.phone_number || item.mobile,
    ip: item.ip || item.ip_address || item.last_ip,
    name: item.name || item.full_name || item.first_name,
    url: item.url || item.site || item.host || item.domain || item.website,
    source: item.source || item.database || item.breach || item.origin,
    country: item.country || item.country_code,
    hash: item.hash || item.password_hash || item.hashed_password
  };
}

function buildHeader(query, page, totalPages, totalResults, title = 'FindNow OSINT') {
  return [
    `━━ ${title} ━━`,
    `Query: ${query}`,
    `Page ${page + 1}/${totalPages} · ${totalResults} result${totalResults === 1 ? '' : 's'}`,
    '────────────────────'
  ].join('\n');
}

function buildMachineHeader(query, page, totalPages, totalResults) {
  return buildHeader(query, page, totalPages, totalResults, 'Machine Viewer');
}

function formatCategoryBlock(index, category, text) {
  const label = CATEGORY_LABELS[category] || String(category || 'RESULT').toUpperCase();
  return `[${index}] ${label}\n${text}`;
}

function formatMachineCard(index, machine) {
  const lines = [
    `[${index}] ${machine.name || 'Unknown Machine'}`,
    `Files: ${machine.file_count ?? '?'} · Size: ${formatBytes(machine.total_size)}`
  ];

  if (machine.imported_at) {
    lines.push(`Imported: ${machine.imported_at}`);
  }
  if (machine.id) {
    lines.push(`ID: ${machine.id}`);
  }

  return lines.join('\n');
}

function formatRecordFields(item) {
  if (!item) {
    return null;
  }
  if (typeof item === 'string') {
    return item;
  }
  if (typeof item !== 'object') {
    return null;
  }

  const normalized = normalizeRecord(item);
  const skipKeys = new Set([
    '_meta', 'api', 'elapsed_ms', 'timestamp', 'results_count',
    'execution_time', 'query', 'total', 'success', 'message', 'mode',
    'Count', 'Message', 'SearchCriteria', 'count', 'id', 'user_id',
    'avatar', 'banner', 'badges', 'premium_type', 'public_flags', 'profile_url',
    'roblox_name', 'discord_id', 'discord_username', 'discord_avatar', 'discriminator',
    'display_name', 'global_name', 'created_at', 'bio', 'nick'
  ]);

  const priority = [
    ['email', 'Email'],
    ['username', 'Username'],
    ['password', 'Password'],
    ['hash', 'Hash'],
    ['phone', 'Phone'],
    ['name', 'Name'],
    ['ip', 'IP'],
    ['url', 'URL'],
    ['source', 'Database'],
    ['country', 'Country'],
    ['breach_date', 'Breach Date'],
    ['domain', 'Domain'],
    ['host', 'Host'],
    ['application', 'App'],
    ['computer_name', 'Computer'],
    ['machine', 'Machine'],
    ['address', 'Address'],
    ['dob', 'DOB']
  ];

  const lines = [];
  const usedKeys = new Set();

  priority.forEach(([key, label]) => {
    const value = normalized[key];
    if (value !== null && value !== undefined && value !== '') {
      lines.push(`${label}: ${value}`);
      usedKeys.add(key);
    }
  });

  Object.keys(normalized).forEach((key) => {
    if (skipKeys.has(key) || usedKeys.has(key)) {
      return;
    }

    const value = normalized[key];
    if (value === null || value === undefined || value === '') {
      return;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (Array.isArray(value)) {
      lines.push(`${key}: ${value.join(', ')}`);
    }
  });

  if (lines.length === 0) {
    return null;
  }

  return lines.join('\n');
}

module.exports = {
  CATEGORY_LABELS,
  formatBytes,
  normalizeRecord,
  buildHeader,
  buildMachineHeader,
  formatCategoryBlock,
  formatMachineCard,
  formatRecordFields
};
