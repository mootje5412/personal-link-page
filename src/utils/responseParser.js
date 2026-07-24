const METADATA_KEYS = new Set([
  '_meta', 'api', 'elapsed_ms', 'timestamp', 'results_count',
  'execution_time', 'query', 'total', 'success', 'message', 'mode',
  'Count', 'Message', 'SearchCriteria', 'count', 'status', 'type',
  'error', 'errors', 'ok', 'took', 'took_ms'
]);

const RECORD_ARRAY_KEYS = [
  'breach_data', 'results', 'data', 'records', 'hits', 'items',
  'leaks', 'logs', 'entries', 'rows', 'stealer_logs', 'stealer_data',
  'matches', 'found', 'compromises'
];

const IP_INFO_KEYS = [
  'ip', 'ip_address', 'query', 'country', 'country_code', 'region',
  'region_name', 'city', 'zip', 'postal', 'latitude', 'longitude',
  'lat', 'lon', 'timezone', 'isp', 'org', 'asn', 'as', 'hostname',
  'company', 'continent', 'continent_code', 'currency', 'calling_code'
];

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function isUsefulRecord(item) {
  if (!item) {
    return false;
  }
  if (typeof item === 'string') {
    return item.trim().length > 0;
  }
  if (!isPlainObject(item)) {
    return false;
  }

  const keys = Object.keys(item).filter((key) => {
    if (METADATA_KEYS.has(key)) {
      return false;
    }

    const value = item[key];
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    if (isPlainObject(value) && Object.keys(value).length === 0) {
      return false;
    }
    if (value === null || value === undefined || value === '') {
      return false;
    }

    return true;
  });

  return keys.length > 0;
}

function flattenObjectLines(obj, prefix = '') {
  const lines = [];

  Object.entries(obj).forEach(([key, value]) => {
    if (METADATA_KEYS.has(key) || value === null || value === undefined || value === '') {
      return;
    }

    const label = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${label}: ${value}`);
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        lines.push(`${label}: ${value.join(', ')}`);
      }
    } else if (isPlainObject(value)) {
      lines.push(...flattenObjectLines(value, label));
    }
  });

  return lines;
}

function formatIpInfo(response) {
  if (!isPlainObject(response)) {
    return null;
  }

  const lines = [];

  IP_INFO_KEYS.forEach((key) => {
    if (response[key] !== undefined && response[key] !== null && response[key] !== '') {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
      lines.push(`${label}: ${response[key]}`);
    }
  });

  ['ip_info', 'geo', 'location', 'geolocation', 'whois', 'network'].forEach((key) => {
    if (isPlainObject(response[key])) {
      flattenObjectLines(response[key], key.replace(/_/g, ' ')).forEach((line) => lines.push(line));
    }
  });

  return lines.length > 0 ? lines.join('\n') : null;
}

function extractRecordsFromArray(items, source) {
  const records = [];

  if (!Array.isArray(items)) {
    return records;
  }

  items.forEach((item, index) => {
    if (isUsefulRecord(item)) {
      records.push({ item, source, index });
    }
  });

  return records;
}

function extractRecordsFromObjectMap(map, source) {
  const records = [];

  if (!isPlainObject(map)) {
    return records;
  }

  Object.entries(map).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      records.push(...extractRecordsFromArray(value, `${source}.${key}`));
    } else if (isUsefulRecord(value)) {
      records.push({ item: { ...value, _key: key }, source, index: key });
    }
  });

  return records;
}

function extractAllRecords(response) {
  const records = [];

  if (!isPlainObject(response)) {
    return records;
  }

  RECORD_ARRAY_KEYS.forEach((key) => {
    const value = response[key];

    if (Array.isArray(value)) {
      records.push(...extractRecordsFromArray(value, key));
    } else if (isPlainObject(value)) {
      records.push(...extractRecordsFromObjectMap(value, key));
    }
  });

  Object.entries(response).forEach(([key, value]) => {
    if (RECORD_ARRAY_KEYS.includes(key) || METADATA_KEYS.has(key)) {
      return;
    }

    if (Array.isArray(value) && value.length > 0 && isPlainObject(value[0])) {
      records.push(...extractRecordsFromArray(value, key));
    }
  });

  return records;
}

function hasOnlyMetadata(response) {
  if (!isPlainObject(response)) {
    return true;
  }

  const keys = Object.keys(response).filter((key) => !METADATA_KEYS.has(key));
  return keys.every((key) => {
    const value = response[key];
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    if (isPlainObject(value)) {
      return Object.keys(value).length === 0;
    }
    return value === null || value === undefined || value === '';
  });
}

function extractIpSections(response) {
  const sections = [];
  const ipInfo = formatIpInfo(response);

  if (ipInfo) {
    sections.push({ text: ipInfo, key: `ip:${response.ip || response.query || 'info'}` });
  }

  return sections;
}

function extractSnusbaseRecords(response) {
  const records = [];
  const payload = response.data || response;
  const resultsObj = payload.results || response.results;

  if (resultsObj && isPlainObject(resultsObj)) {
    Object.entries(resultsObj).forEach(([dbName, items]) => {
      if (Array.isArray(items)) {
        items.forEach((item, index) => {
          if (isUsefulRecord(item)) {
            records.push({ item: { ...item, source: dbName }, source: `snusbase:${dbName}`, index });
          }
        });
      }
    });
  }

  if (Array.isArray(payload)) {
    payload.forEach((item, index) => {
      if (isUsefulRecord(item)) {
        records.push({ item, source: 'snusbase', index });
      }
    });
  }

  return records;
}

function extractSeekAfRecords(response) {
  if (!response || response.error) {
    return [];
  }

  if (response.success === false) {
    return [];
  }

  const candidates = [
    response.results,
    response.data && response.data.results,
    response.data && response.data.data,
    response.data,
    response.items,
    response.hits
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function extractSnusbaseWhois(response, query) {
  const payload = response.data || response;
  const sections = [];

  if (payload.results && isPlainObject(payload.results)) {
    Object.entries(payload.results).forEach(([ip, info]) => {
      if (!isPlainObject(info)) {
        return;
      }

      const text = formatIpInfo({ ip, ...info });
      if (text) {
        sections.push({ text, key: `whois:${ip}` });
      }
    });
  } else if (isPlainObject(payload)) {
    const text = formatIpInfo({ ip: query, ...payload });
    if (text) {
      sections.push({ text, key: `whois:${query}` });
    }
  }

  return sections;
}

module.exports = {
  METADATA_KEYS,
  isUsefulRecord,
  formatIpInfo,
  extractAllRecords,
  hasOnlyMetadata,
  extractIpSections,
  extractSnusbaseRecords,
  extractSnusbaseWhois,
  extractSeekAfRecords
};
