const intelligenceService = require('./intelligenceService');

async function search(query, onProgress) {
  return intelligenceService.search(query, onProgress);
}

module.exports = { search };
