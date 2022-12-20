
const commands = require('./commands');
const messages = require('./messages');
const directMessages = require('./directMessages');

module.exports.registerListeners = (app) => {
  commands.register(app);
  messages.replytohey(app);
  messages.requesttologin(app);
  messages.replyshow(app);
  messages.replyAdd(app);
  messages.replyEdit(app);
  messages.replyAddComment(app);
  messages.replyViewComment(app);
  messages.replyEditComment(app);
  directMessages.directMessage(app);
};