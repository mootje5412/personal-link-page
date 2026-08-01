const MESSAGE_LIMIT = 3900;
const PAGE_SIZE = 5;

const SKIP_VALUES = new Set(['', 'false', 'true', 'no', 'unknown', 'null', 'none', 'n/a', '0']);

function cleanValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value).trim();
  if (!text || SKIP_VALUES.has(text.toLowerCase())) {
    return '';
  }

  if (text.startsWith('<a href') || text.includes('target="_blank"')) {
    return '';
  }

  return text;
}

function formatDate(value) {
  const text = cleanValue(value);
  if (!text) {
    return '';
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getFullName(record) {
  const salutation = cleanValue(record.Salutation);
  const first = cleanValue(record.FirstName);
  const middle = cleanValue(record.MiddleName);
  const last = cleanValue(record.LastName);
  const parts = [salutation, first, middle, last].filter(Boolean);

  if (parts.length) {
    return parts.join(' ');
  }

  return cleanValue(record.Name);
}

function getPhones(record) {
  const phones = [
    ['Telefoon', record.Phone],
    ['Mobiel', record.MobilePhone],
    ['Thuis', record.HomePhone],
    ['Overig', record.OtherPhone],
  ]
    .map(([label, value]) => [label, cleanValue(value)])
    .filter(([, value]) => value);

  const seen = new Set();
  return phones.filter(([, value]) => {
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

function addSection(lines, title, items) {
  const validItems = items.filter(([, value]) => value);
  if (!validItems.length) {
    return;
  }

  lines.push(title);
  validItems.forEach(([label, value]) => {
    lines.push(`   ${label}: ${value}`);
  });
}

function formatRecordCard(record, index) {
  const lines = [];
  const name = getFullName(record);

  lines.push(`👤 RESULTAAT #${index}`);
  lines.push('');

  if (name) {
    lines.push(`Naam: ${name}`);
  }

  const topIds = [
    ['Contact ID', cleanValue(record.Id)],
    ['Account ID', cleanValue(record.AccountId)],
    ['Persoon ID', cleanValue(record.Person_ID__c)],
  ].filter(([, value]) => value);

  topIds.forEach(([label, value]) => {
    lines.push(`🆔 ${label}: ${value}`);
  });

  lines.push('');

  addSection(lines, '📋 Persoon', [
    ['Initialen', cleanValue(record.Initials__c)],
    ['Geboortedatum', formatDate(record.Birthdate || record.BirthDate__c)],
    ['Geslacht', cleanValue(record.Gender__c)],
    ['Nationaliteit', cleanValue(record.Nationality__c)],
    ['Gebruikersnaam', cleanValue(record.Receiving_Username__c)],
    ['Rol', cleanValue(record.Role__c)],
  ]);

  const phones = getPhones(record);
  if (phones.length || cleanValue(record.Email)) {
    lines.push('');
    lines.push('📞 Contact');
    phones.forEach(([label, value]) => {
      lines.push(`   ${label}: ${value}`);
    });
    if (cleanValue(record.Email)) {
      lines.push(`   E-mail: ${cleanValue(record.Email)}`);
    }
  }

  addSection(lines, '🪪 Identiteitsbewijs', [
    ['ID-nummer', cleanValue(record.ID_number__c)],
    ['ID-type', cleanValue(record.ID_type__c)],
    ['Geldig tot', formatDate(record.ID_valid__c)],
  ]);

  addSection(lines, '🏢 Odido', [
    ['Merk', cleanValue(record.Brand__c)],
    ['Status', cleanValue(record.vlocity_cmt__Status__c)],
    ['Segment', cleanValue(record.Account_Segment_Indicator__c)],
    ['Taal', cleanValue(record.COPS_Language__c)],
    ['Commercieel aanbod', cleanValue(record.Commercial_offering__c)],
    ['Nieuwsbrief', cleanValue(record.Newsletter__c)],
    ['Persoonsgegevens', cleanValue(record.Use_Personal_Data__c)],
  ]);

  if (lines.length <= 3) {
    lines.push('');
    lines.push('ℹ️ Geen extra gegevens beschikbaar');
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
    `📦 ${PAGE_SIZE} resultaten per pagina`,
  ];

  if (options.broad) {
    headerLines.push('ℹ️ Geen exacte match — vergelijkbare resultaten');
  }

  headerLines.push('');
  const header = headerLines.join('\n');

  const cards = pageResults
    .map((record, index) => {
      const card = formatRecordCard(record, start + index + 1);
      return `━━━━━━━━━━━━━━━━━━━━\n${card}`;
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
• Naam: Hoenson
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
