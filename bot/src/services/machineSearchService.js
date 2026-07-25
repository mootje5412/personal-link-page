const intelligenceService = require('./intelligenceService');

async function searchMachines(query) {
  const result = await intelligenceService.searchMachines(query);
  return result.machines || [];
}

module.exports = { searchMachines };
