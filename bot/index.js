const { addContracts, handleAddContractsMessage } = require('./addContracts');
const {cleanTableContracts} = require('./clean_table_contracts');
const { runScript } = require('./run_script');

// const { showTrackingContracts } = require('./showTrackingContracts');

const registerCommands = (bot) => {
  bot.command('add', addContracts);
  bot.command('remove', cleanTableContracts);
  bot.command('run', runScript);
  bot.on('text', handleAddContractsMessage);
  console.log('Commands registered successfully.');
};

module.exports = { registerCommands };
