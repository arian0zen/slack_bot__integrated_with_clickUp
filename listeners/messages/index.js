const { sampleMessageCallback } = require('./sample-message');

module.exports.register = (app) => {
  app.message("hey", sampleMessageCallback);
};