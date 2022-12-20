const { replyhey, clickuplogin, showtasks, addTask, editTask, addComment, viewComments, editComments } = require('./sample-message');

module.exports.replytohey = (app) => {
  app.message('-slackupp', replyhey);
};
module.exports.requesttologin = (app) => {
  app.message("-slackupp login", clickuplogin);
};
module.exports.replyshow = (app) => {
  app.message("-slackupp show", showtasks);
};
module.exports.replyAdd = (app) => {
  app.message("-slackupp add", addTask);
}; //add messages

module.exports.replyEdit = (app) =>{
  app.message("-slackupp update", editTask);
};
module.exports.replyAddComment = (app) =>{
  app.message("-slackupp comment", addComment);
};
module.exports.replyViewComment = (app) =>{
  app.message("-slackupp view-comment", viewComments);
};
module.exports.replyEditComment = (app) =>{
  app.message("-slackupp edit-comment", editComments);
};