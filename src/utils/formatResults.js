const MESSAGE_LIMIT = 3900;
const PAGE_SIZE = 10;

const DISPLAY_FIELDS = [
  { keys: ['Name', 'FirstName', 'LastName'], label: 'Naam', icon: '👤', combineName: true },
  { keys: ['Phone'], label: 'Telefoon', icon: '📱' },
  { keys: ['MobilePhone'], label: 'Mobiel', icon: '📱' },
  { keys: ['HomePhone'], label: 'Thuis', icon: '☎️' },
  { keys: ['OtherPhone'], label: 'Overig nummer', icon: '📞' },
  { keys: ['Email'], label: 'E-mail', icon: '📧' },
  { keys: ['Birthdate', 'BirthDate__c'], label: 'Geboortedatum', icon: '🎂' },
  { keys: ['Gender__c'], label: 'Geslacht', icon: '⚧️' },
  { keys: ['ID_number__c'], label: 'ID-nummer', icon: '🪪' },
  { keys: ['Initials__c'], label: 'Initialen', icon: '🔤' },
  { keys: ['Brand__c'], label: 'Merk', icon: '🏷️' },
  { keys: ['vlocity_cmt__Status__c'], label: 'Status', icon: '✅' },
  { keys: ['Account_Segment_Indicator__c'], label: 'Segment', icon: '📊' },
  { keys: ['COPS_Language__c'], label: 'Taal', icon: '🌐' },
  { keys: ['Nationality__c'], label: 'Nationaliteit', icon: '🌍' },
  { keys: ['Commercial_offering__c'], label: 'Commercieel aanbod', icon: '📣' },
  { keys: ['Newsletter__c'], label: 'Nieuwsbrief', icon: '📰' },
  { keys: ['Role__c'], label: 'Rol', icon: '💼' },
  { keys: ['Person_ID__c'], label: 'Persoon-ID', icon: '🆔' },
];

const SKIP_VALUES = new Set(['', 'false', 'true', 'no', 'unknown', 'null', 'none', 'n/a']);

function cleanValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value).trim();
  if (!text || SKIP_VALUES.has(text.toLowerCase())) {
    return '';
  }

  if (text.startsWith('<a href')) {
    return '';
  }

  return text;
}

function getCombinedName(record) {
  const first = cleanValue(record.FirstName);
  const last = cleanValue(record.LastName);
  const full = [first, last].filter(Boolean).join(' ').trim();

  if (full) {
    return full;
  }

  return cleanValue(record.Name);
}

function getFieldValue(record, fieldConfig) {
  if (fieldConfig.combineName) {
    return getCombinedName(record);
  }

  for (const key of fieldConfig.keys) {
    const value = cleanValue(record[key]);
    if (value) {
      return value;
    }
  }

  return '';
}

function getDisplayTitle(record, index) {
  const name = getCombinedName(record);
  if (name) {
    return `👤 #${index} ${name}`;
  }

  const phone = cleanValue(record.Phone) || cleanValue(record.MobilePhone) || cleanValue(record.HomePhone);
  if (phone) {
    return `📱 #${index} ${phone}`;
  }

  const email = cleanValue(record.Email);
  if (email) {
    return `📧 #${index} ${email}`;
  }

  return `👤 #${index} Onbekend`;
}

function formatRecordCard(record, index) {
  const lines = [getDisplayTitle(record, index)];
  const usedLabels = new Set(['Naam']);

  for (const field of DISPLAY_FIELDS) {
    if (field.combineName) {
      continue;
    }

    const value = getFieldValue(record, field);

    if (!value || usedLabels.has(field.label)) {
      continue;
    }

    lines.push(`${field.icon} ${field.label}: ${value}`);
    usedLabels.add(field.label);
  }

  if (lines.length === 1) {
    lines.push('ℹ️ Geen extra gegevens');
  }

  return lines.join('\n');
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
    data.results,
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
    }
  }

  return [];
}

function getNoResultsMessage(data) {
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

function getTotalPages(total, pageSize = PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}

const { detectQueryType } = require('./queryVariants');

function formatPageMessage(query, results, page = 0, options = {}) {
  const total = results.length;
  const totalPages = getTotalPages(total);
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const pageResults = results.slice(start, start + PAGE_SIZE);

  const queryType = detectQueryType(query);
  const typeLabels = {
    email: 'E-mail',
    domain: 'Domein',
    phone: 'Telefoon',
    fullname: 'Naam',
    name: 'Naam',
    general: 'Zoekterm',
  };

  const headerLines = [
    '🔍 Odido Zoeker',
    `${typeLabels[queryType] || 'Zoekterm'}: ${query}`,
    `📄 Pagina ${safePage + 1}/${totalPages} • ${total} ${total === 1 ? 'resultaat' : 'resultaten'}`,
  ];

  if (options.broad) {
    headerLines.push('ℹ️ Geen exacte match — vergelijkbare resultaten getoond');
  }

  headerLines.push('');
  const header = headerLines.join('\n');

  const cards = pageResults
    .map((record, index) => {
      const card = formatRecordCard(record, start + index + 1);
      return `━━━━━━━━━━━━━━━━\n${card}`;
    })
    .join('\n\n');

  let message = `${header}${cards}`;

  if (message.length > MESSAGE_LIMIT) {
    message = `${message.slice(0, MESSAGE_LIMIT - 3)}...`;
  }

  return {
    text: message,
    page: safePage,
    totalPages,
    total,
  };
}

function formatEmptyMessage(query) {
  return `❌ Geen resultaten voor: ${query}

Probeer bijvoorbeeld:
• Naam: Ferry Hoenson
• E-mail: test@gmail.com
• Domein: odido.nl
• Telefoon: 0612345678`;
}

module.exports = {
  PAGE_SIZE,
  extractResults,
  formatPageMessage,
  formatEmptyMessage,
};
