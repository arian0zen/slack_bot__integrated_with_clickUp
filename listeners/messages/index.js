const { replyhey, clickuplogin } = require('./sample-message');

module.exports.register = (app) => {
  app.message("hii", replyhey);
};
module.exports.register2 = (app) => {
  app.message("clickup login", clickuplogin);
};