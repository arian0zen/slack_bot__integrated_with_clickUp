
const commands = require('./commands');
const messages = require('./messages');

module.exports.registerListeners = (app) => {
  commands.register(app);
  messages.replytohey(app);
  messages.requesttologin(app);
  messages.replyshow(app);
  messages.replyAdd(app);
  messages.replyEdit(app);
  messages.replyAddComment(app);
  // messages.register4(app);
};