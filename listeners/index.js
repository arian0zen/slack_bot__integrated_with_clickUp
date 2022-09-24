
const commands = require('./commands');
const messages = require('./messages');

module.exports.registerListeners = (app) => {
  commands.register(app);
  messages.register(app);
  messages.register2(app);
  // messages.register3(app);
  // messages.register4(app);
};