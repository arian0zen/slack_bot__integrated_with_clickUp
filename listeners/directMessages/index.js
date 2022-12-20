
  const { directMessageSubscription } = require('./sample-direct-message');

  module.exports.directMessage = (app) => {
    app.message("-slackupp notify", directMessageSubscription);    
  };
  module.exports.stopDM = (app) => {
    app.message("-slackupp notify stop");    
  };
  