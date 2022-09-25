
const commands = require('./commands');
const messages = require('./messages');

module.exports.registerListeners = (app) => {
  commands.register(app);
  messages.replytohey(app);
  messages.requesttologin(app);
  messages.replyshow(app);
  // messages.register3(app);
  // messages.register4(app);
};