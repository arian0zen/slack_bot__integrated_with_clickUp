const mongoose = require("mongoose");
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

const replyhey = async ({ message, ack, say }) => {
  await ack();
  try {
    if (message.text === "hey slackup") {
      await say(`hey <@${message.user}>!!! I hope you are doing well..`);
      await say(
        `you can say` +
          " `hey slackup help`" +
          "to learn about the commands you can order me"
      );
    } else if (
      message.text.startsWith("hey slackup") &&
      message.text.includes("help")
    ) {
      await say(
        "well, you can use these commands to ask slackup to connect with your clickUp profile"
      );

      await say(
        "`hey slackup show tasks` : *this command will show all the tasks available in your account with due date*"
      );
      await say(
        "`hey slackup show <mention priority here>` : *this will show tasks of a particular priority*"
      );
      await say(
        "`hey slackup show latest` : *this will show you last 5 added tasks*"
      );
      await say(
        "`hey slackup show this week` : *this will show you tasks that are due this week*"
      );
      await say("*note that: commands must start with `hey slackup`*");
    }
  } catch (error) {
    console.error(error);
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

const showtasks = async ({ message, ack, say }) => {
  try {
    await ack();
    if (message.text === "hey slackup show tasks") {
      const collection = connection.db.collection("users");
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
              var taskArray = await getTasks(team, tokenId, clickUp_user);
              Array.from(taskArray).forEach(async (task) => {
                var dueDate = new Date(
                  parseInt(task.due_date)
                ).toLocaleDateString(
                  "en-IN",
                  { year: "numeric", month: "short", day: "numeric" },
                  { timeZone: "Asia/Kolkata" }
                );
                var assignees = task.assignees.map(a => a.id);
                if (!assignees.includes(clickUp_user)){
                  return;
                }
                if (dueDate == "Invalid Date"){
                  await say("*task name:* `"+task.name+"`");
                } else{
                  await say("*task name:* `"+task.name+"` || "+"*Due Date:* `"+dueDate+"`");
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
    console.error(error);
  }
};

module.exports = { replyhey, clickuplogin, showtasks };

var getTasks = async (oneTeam, tokenId, clickUp_user) => {
  const header_config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: tokenId,
    },
  };
  const getTask = await axios
    .get(
      `https://api.clickup.com/api/v2/team/${oneTeam.id}/task`,
      header_config
    )
    .catch(Error);
  allTasks = getTask.data.tasks;
  return allTasks;
};
