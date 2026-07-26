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

  const candidates = [
    data.results,
    data.result,
    data.data,
    data.records,
    data.items,
    data.hits,
    data.matches,
    data.people,
    data.persons,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
    if (candidate && typeof candidate === 'object') {
      if (Array.isArray(candidate.results)) {
        return candidate.results;
      }
      if (Array.isArray(candidate.items)) {
        return candidate.items;
      }
    }
  }

  if (Object.keys(data).some((key) => !['success', 'error', 'message', 'query', 'found', 'count', 'total', 'ms', 'credit', 'version', 'ok', 'status'].includes(key))) {
    return [data];
  }

  return [];
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
    return `Geen resultaten gevonden voor: ${query}\n\nProbeer een andere naam, telefoonnummer of zoekterm.`;
  }

  const total = results.length;
  const header = `Gevonden: ${total} resultaat${total === 1 ? '' : 'en'} voor "${query}"\n\n`;
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
