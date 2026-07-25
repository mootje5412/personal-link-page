const HOSTNAMES = ['DESKTOP-PC', 'LAPTOP-WIN', 'WORKSTATION', 'HOME-PC', 'GAMING-RIG'];
const OS_LIST = ['Windows 10', 'Windows 11', 'Windows 7'];

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildMachine(query, index) {
  const suffix = index > 0 ? `-${index + 1}` : '';
  return {
    name: `${query.toUpperCase()}${suffix}`,
    id: randomId(),
    file_count: 50 + Math.floor(Math.random() * 450),
    size: formatSize(1024 * (100 + Math.floor(Math.random() * 9000))),
    os: randomItem(OS_LIST),
    imported_at: '2024-11-02'
  };
}

async function mockMachineSearch(query) {
  await delay(800 + Math.random() * 1200);

  const count = 3 + Math.floor(Math.random() * 8);
  const machines = [];

  for (let i = 0; i < count; i += 1) {
    machines.push(buildMachine(query, i));
  }

  return machines;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  mockMachineSearch
};
