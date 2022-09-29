const { replyhey, clickuplogin, showtasks } = require('./sample-message');

module.exports.replytohey = (app) => {
  app.message('-slackup', replyhey);
};
module.exports.requesttologin = (app) => {
  app.message("-slackup login", clickuplogin);
};
module.exports.replyshow = (app) => {
  app.message("-slackup show", showtasks);
};