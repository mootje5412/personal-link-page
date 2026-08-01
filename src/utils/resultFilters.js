const { cleanQuery, detectQueryType, isDomain, isEmail, isPhone } = require('./queryVariants');

function recordText(record) {
  return [
    record.Name,
    record.FirstName,
    record.LastName,
    record.Email,
    record.Phone,
    record.MobilePhone,
    record.HomePhone,
    record.OtherPhone,
    record.Receiving_Username__c,
    record.E_mail_user_formula__c,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function matchesNameQuery(record, query) {
  const parts = cleanQuery(query).toLowerCase().split(/\s+/).filter((part) => part.length > 1);
  if (!parts.length) {
    return true;
  }

  const haystack = recordText(record);
  return parts.every((part) => haystack.includes(part));
}

function matchesDomainQuery(record, query) {
  const domain = cleanQuery(query).toLowerCase().replace(/^@/, '');
  const email = String(record.Email || record.E_mail_user_formula__c || '').toLowerCase();

  if (!email) {
    return false;
  }

  return email.includes(domain) || email.endsWith(`@${domain}`) || email.split('@')[1] === domain;
}

function matchesPhoneQuery(record, query) {
  const target = phoneDigits(query);
  if (!target) {
    return true;
  }

  const fields = [record.Phone, record.MobilePhone, record.HomePhone, record.OtherPhone];
  return fields.some((field) => {
    const digits = phoneDigits(field);
    return digits.includes(target) || target.includes(digits);
  });
}

function matchesEmailQuery(record, query) {
  const target = cleanQuery(query).toLowerCase();
  const email = String(record.Email || record.E_mail_user_formula__c || '').toLowerCase();
  return email.includes(target);
}

function dedupeResults(results) {
  const seen = new Set();
  const unique = [];

  for (const record of results) {
    const key = record.Id || JSON.stringify(record);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(record);
  }

  return unique;
}

function refineResults(query, results, options = {}) {
  const { strict = true } = options;
  const type = detectQueryType(query);
  let refined = dedupeResults(results);

  if (!strict) {
    return refined;
  }

  if (type === 'fullname' || type === 'name') {
    refined = refined.filter((record) => matchesNameQuery(record, query));
  } else if (type === 'domain') {
    refined = refined.filter((record) => matchesDomainQuery(record, query));
  } else if (type === 'phone') {
    refined = refined.filter((record) => matchesPhoneQuery(record, query));
  } else if (type === 'email') {
    refined = refined.filter((record) => matchesEmailQuery(record, query));
  }

  return refined;
}

module.exports = {
  dedupeResults,
  refineResults,
};
