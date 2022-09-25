const { replyhey, clickuplogin, showtasks } = require('./sample-message');

module.exports.replytohey = (app) => {
  app.message('hey slackup', replyhey);
};
module.exports.requesttologin = (app) => {
  app.message("hey slackup login", clickuplogin);
};
module.exports.replyshow = (app) => {
  app.message("hey slackup show tasks", showtasks);
};