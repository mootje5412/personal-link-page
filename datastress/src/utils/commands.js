const config = require('../../config/config');

function attackPattern(command) {
  return new RegExp(`^/${command}(?:@[\\w_]+)?\\s+(\\S+)\\s+(\\d+)\\s+(\\d+)`, 'i');
}

function getBotCommands() {
  const base = [
    { command: 'start', description: 'Main menu' },
    { command: 'help', description: 'Help' },
    { command: 'methods', description: 'All methods' },
    { command: 'account', description: 'Your plan' }
  ];

  const attacks = config.methods.map((method) => ({
    command: method.command,
    description: `${method.name} L${method.layer} | ip port duration`
  }));

  return [...base, ...attacks];
}

function formatMethodsList() {
  const l4 = config.methods.filter((m) => m.layer === 4);
  const l7 = config.methods.filter((m) => m.layer === 7);

  const line = (m) => `/${m.command} ip port duration`;

  return `Layer 4\n${l4.map(line).join('\n')}\n\nLayer 7\n${l7.map(line).join('\n')}`;
}

function findMethodByCommand(text) {
  if (!text || !text.startsWith('/')) {
    return null;
  }

  const command = text.slice(1).split(/[@\s]/)[0].toLowerCase();
  return config.methods.find((m) => m.command.toLowerCase() === command) || null;
}

module.exports = {
  attackPattern,
  getBotCommands,
  formatMethodsList,
  findMethodByCommand
};
