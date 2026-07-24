const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function isValidMachineUuid(id) {
  return UUID_REGEX.test(String(id || '').trim()) &&
    String(id).trim().length === 36;
}

function extractMachineUuid(input) {
  const match = String(input || '').trim().match(UUID_REGEX);
  return match ? match[0] : null;
}

function getMachineId(machine) {
  if (!machine || typeof machine !== 'object') {
    return null;
  }

  const candidates = [machine.id, machine.machine_id, machine.uuid];
  for (const candidate of candidates) {
    if (candidate && isValidMachineUuid(candidate)) {
      return extractMachineUuid(candidate);
    }
  }

  return null;
}

function getDownloadCommand(machineId) {
  return `/download ${machineId}`;
}

module.exports = {
  isValidMachineUuid,
  extractMachineUuid,
  getMachineId,
  getDownloadCommand
};
