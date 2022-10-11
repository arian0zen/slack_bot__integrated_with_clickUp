const { replyhey, clickuplogin, showtasks, addTask } = require('./sample-message');

module.exports.replytohey = (app) => {
  app.message('-slackup', replyhey);
};
module.exports.requesttologin = (app) => {
  app.message("-slackup login", clickuplogin);
};
module.exports.replyshow = (app) => {
  app.message("-slackup show", showtasks);
};
module.exports.replyAdd = (app) => {
  app.message("-slackup add", addTask);
};