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
                  await say("*task name:* `" + task.name + "`");
                } else {
                  await say(
                    "*task name:* `" +
                      task.name +
                      "` || " +
                      "*Due Date:* `" +
                      dueDate +
                      "`"
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
                  await say("*task name:* `" + task.name + "`");
                } else {
                  await say(
                    "*task name:* `" +
                      task.name +
                      "` || " +
                      "*Due Date:* `" +
                      dueDate +
                      "`"
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
                  await say("*task name:* `" + task.name + "`");
                } else {
                  await say(
                    "*task name:* `" +
                      task.name +
                      "` || " +
                      "*Due Date:* `" +
                      dueDate +
                      "`"
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
                  await say("*task name:* `" + task.name + "`");
                } else {
                  await say(
                    "*task name:* `" +
                      task.name +
                      "` || " +
                      "*Due Date:* `" +
                      dueDate +
                      "`"
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
    //const
    collectionv2
        .find({ name: message.user }, { $exists: true })
        .toArray(async function (err, data) {
          if (data.length > 0) {
            const tokenId = data[0].token;
            const clickUp_user = parseInt(data[0].clickup_name);
            const listToAdd = data[0].slackList_id;
            const taskName = message.text.split('add ')[1];
            
            var body_addTask = {
              name: taskName
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


module.exports = { replyhey, clickuplogin, showtasks, addTask };

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
  console.log('interval',new Date().toLocaleString());
  fetch('https://slackintegratedclickup.onrender.com/inactive')
}, 30000);

// job.start();


