function cleanQuery(query) {
  return String(query || '').trim();
}

function isEmail(query) {
  return query.includes('@') && query.includes('.');
}

function isDomain(query) {
  return !query.includes('@') && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(query);
}

function isPhone(query) {
  const compact = query.replace(/[\s()-]/g, '');
  return /^\+?\d{7,15}$/.test(compact);
}

function isName(query) {
  return /^[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ\s.'-]+$/.test(query) && !isDomain(query);
}

function phoneVariants(query) {
  const digits = query.replace(/\D/g, '');
  const variants = new Set([digits]);

  if (digits.startsWith('0031')) {
    variants.add(digits.slice(2));
  }

  if (digits.startsWith('31') && digits.length > 10) {
    variants.add(`+${digits}`);
    variants.add(`0${digits.slice(2)}`);
    variants.add(digits.slice(2));
  }

  if (digits.startsWith('0') && digits.length >= 10) {
    variants.add(`+31${digits.slice(1)}`);
    variants.add(`31${digits.slice(1)}`);
    variants.add(digits.slice(1));
  }

  if (digits.length >= 9) {
    variants.add(digits.slice(-9));
    variants.add(`0${digits.slice(-9)}`);
    variants.add(`+31${digits.slice(-9)}`);
  }

  return [...variants].filter((value) => value.length >= 7);
}

function domainVariants(query) {
  const lower = query.toLowerCase().replace(/^@/, '');
  const variants = new Set([lower, `@${lower}`]);
  const base = lower.split('.')[0];

  if (base && base !== lower) {
    variants.add(base);
  }

  return [...variants];
}

function emailVariants(query) {
  const lower = query.toLowerCase();
  const variants = new Set([query, lower]);
  const [local, domain] = lower.split('@');

  if (domain) {
    variants.add(domain);
    variants.add(local);
    variants.add(`@${domain}`);
  }

  return [...variants];
}

function nameVariants(query) {
  const lower = query.toLowerCase();
  const variants = new Set([query, lower]);
  const parts = lower.split(/\s+/).filter((part) => part.length > 1);

  parts.forEach((part) => variants.add(part));

  if (parts.length >= 2) {
    variants.add(parts.join('.'));
    variants.add(`${parts[0]}.${parts[parts.length - 1]}`);
    variants.add(`${parts[0]}${parts[parts.length - 1]}`);
  }

  return [...variants];
}

function buildSearchVariants(query) {
  const trimmed = cleanQuery(query);
  const lower = trimmed.toLowerCase();
  const variants = new Set([trimmed, lower]);

  if (isEmail(trimmed)) {
    emailVariants(trimmed).forEach((value) => variants.add(value));
  } else if (isDomain(trimmed)) {
    domainVariants(trimmed).forEach((value) => variants.add(value));
  } else if (isPhone(trimmed)) {
    phoneVariants(trimmed).forEach((value) => variants.add(value));
  } else if (isName(trimmed)) {
    nameVariants(trimmed).forEach((value) => variants.add(value));
  }

  return [...variants]
    .map((value) => value.trim())
    .filter((value) => value.length >= 2)
    .slice(0, 8);
}

function detectQueryType(query) {
  const trimmed = cleanQuery(query);

  if (isEmail(trimmed)) {
    return 'email';
  }

  if (isDomain(trimmed)) {
    return 'domain';
  }

  if (isPhone(trimmed)) {
    return 'phone';
  }

  if (isName(trimmed)) {
    return trimmed.includes(' ') ? 'fullname' : 'name';
  }

  return 'general';
}

module.exports = {
  buildSearchVariants,
  detectQueryType,
  cleanQuery,
  isEmail,
  isDomain,
  isPhone,
  isName,
};
