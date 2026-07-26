const MESSAGE_LIMIT = 3900;
const MAX_RESULTS = 15;

const FIELD_LABELS = {
  full_name: 'Naam',
  name: 'Naam',
  first_name: 'Voornaam',
  last_name: 'Achternaam',
  phone: 'Telefoon',
  mobile: 'Mobiel',
  email: 'E-mail',
  address: 'Adres',
  street: 'Straat',
  city: 'Plaats',
  postcode: 'Postcode',
  postal_code: 'Postcode',
  zip: 'Postcode',
  country: 'Land',
  dob: 'Geboortedatum',
  date_of_birth: 'Geboortedatum',
  birthdate: 'Geboortedatum',
  iban: 'IBAN',
  bsn: 'BSN',
  id: 'ID',
  customer_id: 'Klant-ID',
  subscription: 'Abonnement',
  provider: 'Provider',
  notes: 'Notities',
};

function humanizeKey(key) {
  if (FIELD_LABELS[key]) {
    return FIELD_LABELS[key];
  }

  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value).trim();
}

function flattenRecord(record, prefix = '') {
  const lines = [];

  if (record === null || record === undefined) {
    return lines;
  }

  if (Array.isArray(record)) {
    record.forEach((item, index) => {
      lines.push(...flattenRecord(item, prefix ? `${prefix} ${index + 1}` : `#${index + 1}`));
    });
    return lines;
  }

  if (typeof record !== 'object') {
    const text = formatValue(record);
    if (text) {
      lines.push(prefix ? `${prefix}: ${text}` : text);
    }
    return lines;
  }

  Object.entries(record).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return;
    }

    const label = humanizeKey(key);

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        if (value.every((item) => typeof item !== 'object')) {
          lines.push(`${label}: ${value.map(formatValue).filter(Boolean).join(', ')}`);
        } else {
          value.forEach((item, index) => {
            const nested = flattenRecord(item);
            if (nested.length) {
              lines.push(`${label} ${index + 1}:`);
              nested.forEach((line) => lines.push(`   ${line}`));
            }
          });
        }
      } else {
        const nested = flattenRecord(value);
        if (nested.length === 1 && !prefix) {
          lines.push(`${label}: ${nested[0]}`);
        } else if (nested.length) {
          lines.push(`${label}:`);
          nested.forEach((line) => lines.push(`   ${line}`));
        }
      }
      return;
    }

    const text = formatValue(value);
    if (text) {
      lines.push(`${label}: ${text}`);
    }
  });

  return lines;
}

function extractResults(data) {
  if (!data || typeof data !== 'object') {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (data.success === false) {
    return [];
  }

  const payload = data.data && typeof data.data === 'object' ? data.data : data;
  const resultsBlock = payload.results;

  if (resultsBlock && typeof resultsBlock === 'object') {
    if (resultsBlock.error === true) {
      return [];
    }

    if (Array.isArray(resultsBlock.results)) {
      return resultsBlock.results;
    }
  }

  const candidates = [
    payload.results,
    payload.result,
    payload.data,
    payload.records,
    payload.items,
    payload.hits,
    payload.matches,
    payload.people,
    payload.persons,
    data.results,
    data.result,
    data.records,
    data.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (candidate && typeof candidate === 'object') {
      if (candidate.error === true) {
        return [];
      }

      if (Array.isArray(candidate.results)) {
        return candidate.results;
      }

      if (Array.isArray(candidate.items)) {
        return candidate.items;
      }
    }
  }

  return [];
}

function getNoResultsMessage(query, data) {
  const payload = data?.data && typeof data.data === 'object' ? data.data : data;
  const resultsBlock = payload?.results;

  if (resultsBlock?.message) {
    return resultsBlock.message;
  }

  if (data?.error || data?.message) {
    return data.error || data.message;
  }

  return 'Probeer een andere naam, telefoonnummer of zoekterm.';
}

function formatSingleResult(index, record) {
  const lines = flattenRecord(record);
  if (!lines.length) {
    return `${index}. Geen leesbare gegevens`;
  }

  return `${index}. ${lines.join('\n   ')}`;
}

function formatResultsMessage(query, data) {
  if (data && data.success === false) {
    return `Geen resultaten voor: ${query}\n\n${data.error || data.message || 'De zoekopdracht gaf geen resultaat.'}`;
  }

  const results = extractResults(data);

  if (!results.length) {
    return `Geen resultaten gevonden voor: ${query}\n\n${getNoResultsMessage(query, data)}`;
  }

  const total = results.length;
  const header = `Gevonden: ${total} ${total === 1 ? 'resultaat' : 'resultaten'} voor "${query}"\n\n`;
  const body = results
    .slice(0, MAX_RESULTS)
    .map((record, index) => formatSingleResult(index + 1, record))
    .join('\n\n');

  let message = header + body;

  if (total > MAX_RESULTS) {
    message += `\n\n... en nog ${total - MAX_RESULTS} resultaat${total - MAX_RESULTS === 1 ? '' : 'en'}`;
  }

  if (message.length > MESSAGE_LIMIT) {
    message = `${message.slice(0, MESSAGE_LIMIT - 3)}...`;
  }

  return message;
}

module.exports = {
  formatResultsMessage,
};
