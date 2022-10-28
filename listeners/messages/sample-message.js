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
    if (message.text === "-slackup") {
      await say(`hey <@${message.user}>!!! I hope you are doing well..`);
      await say(
        `you can say` +
          " `-slackup help`" +
          "to learn about the commands you can order me"
      );
    } else if (
      message.text.startsWith("-slackup") &&
      message.text.includes("help")
    ) {
      await say(
        "well, you can use these commands to ask slackup to connect with your clickUp profile"
      );

      await say(
        "`-slackup show tasks` : *this command will show all the tasks available in your account with due date*"
      );
      await say(
        "`-slackup show priority <mention priority here>` : *this will show tasks of a particular priority*"
      );
      await say(
        "`-slackup show latest` : *this will show you last 5 added tasks*"
      );
      await say(
        "`-slackup show this week` : *this will show you tasks that are due this week*"
      );
      await say (
        "`-slackup add <task name>, due <MM/DD/YYYY>` : *this will add a task to your clickUp*"
      );
      await say("*mind that 'comma', and date should be strictly in that format*")
      await say (
        "`-slackup update <task id>, name: <updated name>, due: <MM/DD/YYYY>` : *this will update the taskName and Due Date to your clickUp*"
      );
      await say ("`-slackup update <task id>, due: <MM/DD/YYYY>` : *use this command to update only the due date*")
      await say (
        "`-slackup update <task id>, name: <updated name>` : *use this command to update only the task Name*"
      );
      await say("*to get the task id, use show task commands and get the id of desired tasks from there*")
      await say("*note that: commands must start with `-slackup`*");
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
        console.log(data);
        if (data.length > 0) {
          await say("okay, i see.. you are already authorized to clickUp");
        } else {
          await say(
            `ohh hooo <@${message.user}>.. you are not authorized to clickUp, go to the link below to login`
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
    if (message.text === "-slackup show tasks") {
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
              `ohh hooo <@${message.user}>.. you are not authorized to clickUp, go to the link below to login`
            );
            await say(
              `https://slackauthclickup.vercel.app/clickuplogin/${message.user}`
            );
          }
        });
    } else if (message.text === "-slackup show latest") {
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
              `ohh hooo <@${message.user}>.. you are not authorized to clickUp, go to the link below to login`
            );
            await say(
              `https://slackauthclickup.vercel.app/clickuplogin/${message.user}`
            );
          }
        });
    } else if (message.text === "-slackup show last week"){
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
              `ohh hooo <@${message.user}>.. you are not authorized to clickUp, go to the link below to login`
            );
            await say(
              `https://slackauthclickup.vercel.app/clickuplogin/${message.user}`
            );
          }
        });
    } else if (message.text.includes("-slackup show priority")){
      var mentionedPriority = message.text.split("-slackup show priority ");

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
              `ohh hooo <@${message.user}>.. you are not authorized to clickUp, go to the link below to login`
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
              `ohh hooo <@${message.user}>.. you are not authorized to clickUp, go to the link below to login`
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
              `ohh hooo <@${message.user}>.. you are not authorized to clickUp, go to the link below to login`
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
              `ohh hooo <@${message.user}>.. you are not authorized to clickUp, go to the link below to login`
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
  await say("supp")
}




module.exports = { replyhey, clickuplogin, showtasks, addTask, editTask, addComment};

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
  return allTasks; //returning an array of objects of all tasks
};



setInterval(function() {
  // do something here
  console.log('INTERVAL',new Date().toLocaleString());
  fetch('https://slackintegratedclickup.onrender.com/inactive')
}, 300000);



