const mongoose = require("mongoose");
const fetch = require('node-fetch');
var cron = require('node-cron');
const express = require('express');
const app = express();
const axios = require("axios");
const { ContextMissingPropertyError } = require("@slack/bolt");
const connection = mongoose.createConnection(
  "mongodb+srv://" +
    process.env.DB_USERNAME +
    ":" +
    process.env.DB_PASSWORD +
    "@cluster0.q9xcxma.mongodb.net/" +
    process.env.DB_NAME_CU
);

const replyhey = async ({ message, say }) => {
  try {
    if (message.text === "-slackupp") {
      await say(`hey <@${message.user}>!!! I hope you are doing well..`);
      await say(
        `you can say` +
          " `-slackupp help`" +
          "to learn about the commands you can order me"
      );
    } else if (
      message.text.startsWith("-slackupp") &&
      message.text.includes("help")
    ) {
      await say(
        "well, you can use these commands to ask slackupp to connect with your ClickUp profile"
      );

      await say(
        "`-slackupp show tasks` : *this command will show all the tasks available in your account with due date*"
      );
      await say(
        "`-slackupp show priority <mention priority here>` : *this will show tasks of a particular priority*"
      );
      await say(
        "`-slackupp show latest` : *this will show you last 5 added tasks*"
      );
      await say(
        "`-slackupp show this week` : *this will show you tasks that are due this week*"
      );
      await say (
        "`-slackupp add <task name>, due: <MM/DD/YYYY>` : *this will create and add a task to your ClickUp*"
      );
      await say("*mind that 'comma', and date should be strictly in that format*")
      await say (
        "`-slackupp update <task id>, name: <update name>, due: <MM/DD/YYYY>` : *this will update the taskName and Due Date to your ClickUp*"
      );
      await say ("`-slackupp update <task id>, due: <MM/DD/YYYY>` : *use this command to update only the due date*")
      await say (
        "`-slackupp update <task id>, name: <update name>` : *use this command to update only the task Name*"
      );
      await say("*to get the task id, use show task commands and get the id of desired tasks from there*")

      await say (
        "`-slackupp comment on <task id>, comment text: <your comment here>` : *this will add a comment to that particular task*"
      );
      await say("*mind that 'comma'*")
      await say (
        "`-slackupp view-comments of <task id>` : *this will display all the comments under a particular task with their current status and id*"
      );
      await say (
        "`-slackupp edit-comment <comment id>, comment: <update comment text>, status: <resolved or unsolved>` : *this will update/edit the comment and its status to your ClickUp, keep in mind the status must be 'resolved' or 'unsolved'*"
      );
      await say ("`-slackupp edit-comment <comment id>, status: <resolved or unsolved>` : *use this command to update only the status, keep in mind the status must be 'resolved' or 'unsolved'*")
      await say (
        "`-slackupp update <comment id>, comment: <update comment>` : *use this command to update only the comment text*"
      );
      await say (
        "`-slackupp notify` : *use this command to get notified about new tasks, you can only use this task on DM with the bot*"
      );
      await say (
        "`-slackupp notify stop` : *use this command to stop getting notified about new tasks, you can only use this task on DM with the bot*"
      );
      await say("*to get the comment id, first use view comments commands and get the id of desired comments from there*")


      await say("*note that: commands must start with `-slackupp`*");
    }
  } catch (error) {
    console.error(error);
    logger.error(error);
  }
};

const clickuplogin = async ({ message, say }) => {
  try {
    const collection = connection.db.collection("users");
    collection
      .find({ name: message.user }, { $exists: true })
      .toArray(async function (err, data) {
        
        if (data.length > 0) {
          await say("okay, i see.. you are already authorized to ClickUp");
        } else {
          await say(
            `ohh hooo <@${message.user}>.. you are not authorized to ClickUp, go to the link below to login`
          );
          await say(
            `https://slackauthclickup.vercel.app/clickuplogin/${message.user}`
          );
        }
      });
  } catch (error) {
    console.error(error);
  }
};

const showtasks = async ({ message, say }) => {
  const collection = connection.db.collection("users");
  try {
    if (message.text === "-slackupp show tasks") {
      collection
        .find({ name: message.user }, { $exists: true })
        .toArray(async function (err, data) {
          if (data.length > 0) {
            const tokenId = data[0].token;
            const clickUp_user = parseInt(data[0].clickup_name);

            const header_config = {
              headers: {
                "Content-Type": "application/json",
                Authorization: tokenId,
              },
            };
            const getTeam = await axios
              .get(`https://api.clickup.com/api/v2/team`, header_config)
              .catch(Error);
            var allTeams = getTeam.data.teams;
            Array.from(allTeams).forEach(async (team) => {
              var taskArray = await getTasks(team, tokenId, clickUp_user, 0);
              Array.from(taskArray).forEach(async (task) => {
                var dueDate = new Date(
                  parseInt(task.due_date)
                ).toLocaleDateString(
                  "en-IN",
                  { year: "numeric", month: "short", day: "numeric" },
                  { timeZone: "Asia/Kolkata" }
                );
                var assignees = task.assignees.map((a) => a.id);
                if (!assignees.includes(clickUp_user)) {
                  return;
                }
                if (dueDate == "Invalid Date") {
                  await say("*task name:* `" + task.name + "` || " +
                  "*task id:* " +
                  task.id + "");
                } else {
                  await say(
                    "*task name:* `" +
                      task.name +
                      "` || " +
                      "*Due Date:* `" +
                      dueDate +
                      "` || " +
                      "*task id:* " +
                      task.id + ""
                  );
                }
              });
            });
          } else {
            await say(
              `ohh hooo <@${message.user}>.. you are not authorized to ClickUp, go to the link below to login`
            );
            await say(
              `https://slackauthclickup.vercel.app/clickuplogin/${message.user}`
            );
          }
        });
    } else if (message.text === "-slackupp show latest") {
      const now = Date.now();

      var threedays = 259200000;
      var latest = now - threedays;

      collection
        .find({ name: message.user }, { $exists: true })
        .toArray(async function (err, data) {
          if (data.length > 0) {
            const tokenId = data[0].token;
            const clickUp_user = parseInt(data[0].clickup_name);

            const header_config = {
              headers: {
                "Content-Type": "application/json",
                Authorization: tokenId,
              },
            };
            const getTeam = await axios
              .get(`https://api.clickup.com/api/v2/team`, header_config)
              .catch(Error);
            var allTeams = getTeam.data.teams;
            Array.from(allTeams).forEach(async (team) => {
              var taskArray = await getTasks(
                team,
                tokenId,
                clickUp_user,
                latest
              );
              Array.from(taskArray).forEach(async (task) => {
                var dueDate = new Date(
                  parseInt(task.due_date)
                ).toLocaleDateString(
                  "en-IN",
                  { year: "numeric", month: "short", day: "numeric" },
                  { timeZone: "Asia/Kolkata" }
                );
                var assignees = task.assignees.map((a) => a.id);
                if (!assignees.includes(clickUp_user)) {
                  return;
                }

                if (dueDate == "Invalid Date") {
                  await say("*task name:* `" + task.name + "` || " +
                  "*task id:* " +
                  task.id + "");
                } else {
                  await say(
                    "*task name:* `" +
                      task.name +
                      "` || " +
                      "*Due Date:* `" +
                      dueDate +
                      "` || " +
                      "*task id:* " +
                      task.id + ""
                  );
                }
              });
            });
          } else {
            await say(
              `ohh hooo <@${message.user}>.. you are not authorized to ClickUp, go to the link below to login`
            );
            await say(
              `https://slackauthclickup.vercel.app/clickuplogin/${message.user}`
            );
          }
        });
    } else if (message.text === "-slackupp show last week"){
      const now = Date.now();

      var lastweek = 604800000;
      var oneweek = now - lastweek;

      collection
        .find({ name: message.user }, { $exists: true })
        .toArray(async function (err, data) {
          if (data.length > 0) {
            const tokenId = data[0].token;
            const clickUp_user = parseInt(data[0].clickup_name);

            const header_config = {
              headers: {
                "Content-Type": "application/json",
                Authorization: tokenId,
              },
            };
            const getTeam = await axios
              .get(`https://api.clickup.com/api/v2/team`, header_config)
              .catch(Error);
            var allTeams = getTeam.data.teams;
            Array.from(allTeams).forEach(async (team) => {
              var taskArray = await getTasks(
                team,
                tokenId,
                clickUp_user,
                oneweek
              );
              Array.from(taskArray).forEach(async (task) => {
                var dueDate = new Date(
                  parseInt(task.due_date)
                ).toLocaleDateString(
                  "en-IN",
                  { year: "numeric", month: "short", day: "numeric" },
                  { timeZone: "Asia/Kolkata" }
                );
                var assignees = task.assignees.map((a) => a.id);
                if (!assignees.includes(clickUp_user)) {
                  return;
                }

                if (dueDate == "Invalid Date") {
                  await say("*task name:* `" + task.name + "` || " +
                  "*task id:* " +
                  task.id + "");
                } else {
                  await say(
                    "*task name:* `" +
                      task.name +
                      "` || " +
                      "*Due Date:* `" +
                      dueDate +
                      "` || " +
                      "*task id:* " +
                      task.id + ""
                  );
                }
              });
            });
          } else {
            await say(
              `ohh hooo <@${message.user}>.. you are not authorized to ClickUp, go to the link below to login`
            );
            await say(
              `https://slackauthclickup.vercel.app/clickuplogin/${message.user}`
            );
          }
        });
    } else if (message.text.includes("-slackupp show priority")){
      var mentionedPriority = message.text.split("-slackupp show priority ");

      collection
        .find({ name: message.user }, { $exists: true })
        .toArray(async function (err, data) {
          if (data.length > 0) {
            const tokenId = data[0].token;
            const clickUp_user = parseInt(data[0].clickup_name);

            const header_config = {
              headers: {
                "Content-Type": "application/json",
                Authorization: tokenId,
              },
            };
            const getTeam = await axios
              .get(`https://api.clickup.com/api/v2/team`, header_config)
              .catch(Error);
            var allTeams = getTeam.data.teams;
            Array.from(allTeams).forEach(async (team) => {
              var taskArray = await getTasks(
                team,
                tokenId,
                clickUp_user,
                0
              );
              Array.from(taskArray).forEach(async (task) => {
                var dueDate = new Date(
                  parseInt(task.due_date)
                ).toLocaleDateString(
                  "en-IN",
                  { year: "numeric", month: "short", day: "numeric" },
                  { timeZone: "Asia/Kolkata" }
                );
                var assignees = task.assignees.map((a) => a.id);
                if (!assignees.includes(clickUp_user)) {
                  return;
                }
                if(task.priority == null){
                  return;
                }
                if(task.priority.priority != mentionedPriority[1]){
                  return;
                }

                if (dueDate == "Invalid Date") {
                  await say("*task name:* `" + task.name + "` || " +
                  "*task id:* " +
                  task.id + "");
                } else {
                  await say(
                    "*task name:* `" +
                      task.name +
                      "` || " +
                      "*Due Date:* `" +
                      dueDate +
                      "` || " +
                      "*task id:* " +
                      task.id + ""
                  );
                }
              });
            });
          } else {
            await say(
              `ohh hooo <@${message.user}>.. you are not authorized to ClickUp, go to the link below to login`
            );
            await say(
              `https://slackauthclickup.vercel.app/clickuplogin/${message.user}`
            );
          }
        });
    }
  } catch (error) {
    await say (error);
  }
};

const addTask = async ({ message, say }) => {
  const collectionv2 = connection.db.collection("users");
  try {
    collectionv2
        .find({ name: message.user }, { $exists: true })
        .toArray(async function (err, data) {
          if (data.length > 0) {
            const tokenId = data[0].token;
            const clickUp_user = parseInt(data[0].clickup_name);
            const listToAdd = data[0].slackList_id;
            const taskText = message.text.split('add ')[1];
            var assignee = [clickUp_user];
            var dueDate = new Date(taskText.split(', due: ')[1]).getTime();
            var taskName = taskText.split(', due: ')[0];
            
            var body_addTask = {
              name: taskName,
              assignees: assignee,
              due_date: dueDate
            }
            var headers =  {
              'Content-Type': 'application/json',
              Authorization: tokenId
            }
            var addTask = await axios
            .post(`https://api.clickup.com/api/v2/list/${listToAdd}/task`,
            body_addTask,
            {headers})
              .catch(error => {
                console.error(error);
              });
            if(addTask){
              await say('Task added successfully');
            }else{
              await say('something went wrong, can not add task');
            }
          
          } else {
            await say(
              `ohh hooo <@${message.user}>.. you are not authorized to ClickUp, go to the link below to login`
            );
            await say(
              `https://slackauthclickup.vercel.app/clickuplogin/${message.user}`
            );
          }
        });
  } catch (error) {
    console.error(error);
  }
};

const editTask = async({message, say }) => {
  const collectionv2 = connection.db.collection("users");
  try {
    collectionv2
        .find({ name: message.user }, { $exists: true })
        .toArray(async function (err, data) {
          if (data.length > 0) {
            var tokenId = data[0].token;
            var clickUp_user = parseInt(data[0].clickup_name);
            var taskText = message.text.split('update ')[1];
            
            if(message.text.includes("name: ") && !message.text.includes("due: ")) {
              var taskId = taskText.split(", name: ")[0];
              var updatedName = taskText.split(', name: ')[1];
              var body_updateTask = {
                name: updatedName
              }

            } else if (!message.text.includes("name: ") && message.text.includes("due: ")){
              var taskId = taskText.split(", due: ")[0];
              var updatedDate = new Date(taskText.split(", due: ")[1]).getTime();
              var body_updateTask = {
                due_date: updatedDate
              }
            } else{
                var taskId = taskText.split(", name: ")[0];
                var updateInfo = taskText.split(', name: ')[1];
                const updatedName = updateInfo.split(', due: ')[0];
                const updatedDate = new Date(updateInfo.split(', due: ')[1]).getTime();
                var body_updateTask = {
                  name: updatedName,
                  due_date: updatedDate
                }
                
            }
            
            var headers =  {
              'Content-Type': 'application/json',
              Authorization: tokenId
            }
            var editTask = await axios
            .put(`https://api.clickup.com/api/v2/task/${taskId}`,
            body_updateTask,
            {headers})
              .catch(error => {
                console.error(error);
              });
            if(editTask){
              await say('Task updated successfully');
            }else{
              await say('something went wrong, can not update task');
            }
          
          } else {
            await say(
              `ohh hooo <@${message.user}>.. you are not authorized to ClickUp, go to the link below to login`
            );
            await say(
              `https://slackauthclickup.vercel.app/clickuplogin/${message.user}`
            );
          }
        });
  } catch (error) {
    console.error(error);
  }
}
const addComment = async({message, say }) => {
  const collectionv2 = connection.db.collection("users");
  try {
    collectionv2
        .find({ name: message.user }, { $exists: true })
        .toArray(async function (err, data) {
          if (data.length > 0) {
            var tokenId = data[0].token;
            const clickUp_user = parseInt(data[0].clickup_name);
            var assignee = [clickUp_user];
            var commentInfo = message.text.split('comment on ')[1];
            var commentText = commentInfo.split(', comment text: ')[1];
            var taskId = commentInfo.split(', comment text: ')[0];
            
            var body_addComment = {
              comment_text: commentText,
              assignee: assignee,
              notify_all: true
              
            }
            var headers =  {
              'Content-Type': 'application/json',
              Authorization: tokenId
            }
            var addComment = await axios
            .post(`https://api.clickup.com/api/v2/task/${taskId}/comment`,
            body_addComment,
            {headers})
              .catch(error => {
                console.error(error);
              });
            if(addComment){
              await say('Comment added successfully');
            }else{
              await say('something went wrong, can not add comment');
            }
            
          
          } else {
            await say(
              `ohh hooo <@${message.user}>.. you are not authorized to ClickUp, go to the link below to login`
            );
            await say(
              `https://slackauthclickup.vercel.app/clickuplogin/${message.user}`
            );
          }
        });
  } catch (error) {
    console.error(error);
  }
}
const viewComments = async({message, say}) =>{
  const collectionv2 = connection.db.collection("users");
  try {
    collectionv2
        .find({ name: message.user }, { $exists: true })
        .toArray(async function (err, data) {
          if (data.length > 0) {
            var tokenId = data[0].token;
            const clickUp_user = parseInt(data[0].clickup_name);
            const taskId = message.text.split('of ')[1];
            
            var headers =  {
              "Content-Type": "application/json",
              Authorization: tokenId
            }
            var viewComment = await axios
            .get(`https://api.clickup.com/api/v2/task/${taskId}/comment`,
            {headers})
              .catch(error => {
                console.error(error);
              });
            if(viewComment){
              var allComments = viewComment.data.comments
              Array.from(allComments).forEach(async (comment) => {
                var status = comment.resolved;
                if(status == false){
                  status = 'not resolved yet'
                } else{
                  status = 'resolved'
                }
                await say("*Comment Text:* `" +
                comment.comment_text +
                "` || " +
                "*Status:* `" +
                status +
                "` || " +
                "*Comment id:* " +
                comment.id + "")
              });
            }else{
              await say('something went wrong, can not show comments');
            }
            
          
          } else {
            await say(
              `ohh hooo <@${message.user}>.. you are not authorized to ClickUp, go to the link below to login`
            );
            await say(
              `https://slackauthclickup.vercel.app/clickuplogin/${message.user}`
            );
          }
        });
  } catch (error) {
    console.error(error);
  }
}

const editComments = async({message, say}) =>{
  const collectionv2 = connection.db.collection("users");
  try {
    collectionv2
        .find({ name: message.user }, { $exists: true })
        .toArray(async function (err, data) {
          if (data.length > 0) {
            var tokenId = data[0].token;
            var clickUp_user = parseInt(data[0].clickup_name);
            var commentText = message.text.split('edit-comment ')[1];
            
            if(message.text.includes("comment: ") && !message.text.includes("status: ")) {
              var commentId = commentText.split(", comment: ")[0];
              var updatedComment = commentText.split(', comment: ')[1];
              var body_updateComment = {
                comment_text: updatedComment
              }

            } else if (!message.text.includes("comment: ") && message.text.includes("status: ")){
              var commentId = commentText.split(", status: ")[0];
              var updatedStatus = commentText.split(", status: ")[1];
              if(updatedStatus == 'resolved'){
                updatedStatus = true
              } else if(updatedStatus == 'unsolved'){
                updatedStatus = false
              }
              var body_updateComment = {
                resolved: updatedStatus
              }
            } else{
                var commentId = commentText.split(", comment: ")[0];
                var updateInfo = commentText.split(', comment: ')[1];
                var updatedComment = updateInfo.split(', status: ')[0];
                var updatedStatus = updateInfo.split(', status: ')[1];
                if(updatedStatus == 'resolved'){
                  updatedStatus = true
                } else if(updatedStatus == 'unsolved'){
                  updatedStatus = false
                }
                var body_updateComment = {
                  comment_text: updatedComment,
                  resolved: updatedStatus
                }
                
            }
            
            var headers =  {
              'Content-Type': 'application/json',
              Authorization: tokenId
            }
            var editComment = await axios
            .put(`https://api.clickup.com/api/v2/comment/${commentId}`,
            body_updateComment,
            {headers})
              .catch(error => {
                console.error(error);
              });
            if(editComment){
              await say('Comment updated successfully');
            }else{
              await say('something went wrong, can not update comment at this time');
            }
          
          } else {
            await say(
              `ohh hooo <@${message.user}>.. you are not authorized to ClickUp, go to the link below to login`
            );
            await say(
              `https://slackauthclickup.vercel.app/clickuplogin/${message.user}`
            );
          }
        });
  } catch (error) {
    console.error(error);
  }
}




var getTasks = async (oneTeam, tokenId, clickUp_user, dateCreated) => {
  const header_config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: tokenId,
    },
  };
  const getTask = await axios
  .get(
    `https://api.clickup.com/api/v2/team/${oneTeam.id}/task?date_created_gt=${dateCreated}`,
    header_config
    )
    .catch(Error);
    allTasks = getTask.data.tasks;
    return allTasks; 
  };
  
  module.exports = { replyhey, clickuplogin, showtasks, addTask, editTask, addComment, viewComments, editComments, getTasks};


setInterval(function() {
  // do something here
  console.log('INTERVAL',new Date().toLocaleString());
  fetch('https://slackintegratedclickup.onrender.com/inactive')
}, 300000);



