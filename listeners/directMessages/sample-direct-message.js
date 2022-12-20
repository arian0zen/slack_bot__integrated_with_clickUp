const { HTTPResponseAck, ContextMissingPropertyError } = require("@slack/bolt");
const { getTasks } = require("../messages/sample-message");
const mongoose = require("mongoose");
const axios = require("axios");
const connection = mongoose.createConnection(
  "mongodb+srv://" +
    process.env.DB_USERNAME +
    ":" +
    process.env.DB_PASSWORD +
    "@cluster0.q9xcxma.mongodb.net/" +
    process.env.DB_NAME
);
const connection_taskCheck = mongoose.createConnection(
  "mongodb+srv://" +
    process.env.DB_USERNAME +
    ":" +
    process.env.DB_PASSWORD +
    "@cluster0.q9xcxma.mongodb.net/" +
    process.env.DB_NAME_CU
);
const subscribersSchema = mongoose.Schema({
  slackID: String,
  slackChannelID: String,
});
const Subscriber = mongoose.model("Subscriber", subscribersSchema);
semaphore = 1;
flag = 1;
const directMessageSubscription = async ({ message, client, say }) => {
  let credential = await credentials(message.user);
  let credential_array = [
    credential[0].token,
    parseInt(credential[0].clickup_name),
  ];
  let tokenId = credential_array[0];
  let clickUp_user = credential_array[1];
  let allTeams = await getAllteams(message.user);
  const collection = connection.db.collection("subscribers");
  semaphore = 1;
  if (
    message.channel_type == "im" &&
    message.text === "-slackupp notify stop"
  ) {
    collection.deleteOne(
      { slackID: message.user },
      { $exists: true },
      function (err) {
        if (err) console.log(err);
        client.chat.postMessage({
          channel: message.channel,
          text: `Successfully unsubscribed from the notifications, you may receive one last notification`,
        });
      }
    );
    flag = 0;
  } else if (
    message.channel_type == "im" &&
    message.text === "-slackupp notify"
  ) {
    
    let newUserSub = new Subscriber({
      slackID: message.user,
      slackChannelID: message.channel,
    });
    flag = 1;
    collection
      .find({ slackID: message.user }, { $exists: true })
      .toArray(async function (err, data) {
        if (data.length == 0) {
          try {
            
            
            var interval = setInterval(async () => {
              let now = Date.now();

              var lastHour = 3600000 ;
              var oneHour = now - lastHour;
              Array.from(allTeams).forEach(async (team) => {
                var taskArray = await getTasks(
                  team,
                  tokenId,
                  clickUp_user,
                  oneHour
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
                  await client.chat.postMessage({
                    channel: message.channel,
                    text: `Hey <@${message.user}>, a new task has been creaeted by *${task.creator.username}* and you have been assigned`,
                  });
  
                  if (dueDate == "Invalid Date") {
                    let taskShowingText = "*task name:* `" + task.name + "` || " +
                    "*task id:* " +
                    task.id + "";
                    await client.chat.postMessage({
                      channel: message.channel,
                      text: taskShowingText,
                    });
                  } else {
                    let taskShowingText = 
                      "*task name:* `" +
                        task.name +
                        "` || " +
                        "*Due Date:* `" +
                        dueDate +
                        "` || " +
                        "*task id:* " +
                        task.id + ""
                    ;
                    await client.chat.postMessage({
                      channel: message.channel,
                      text: taskShowingText,
                    });
                  }
                  
                });
              });

              if (flag == 0) {
                clearInterval(interval);
              }
            }, 3600000);
          } catch (error) {
            console.error(error);
          }
          await newUserSub.save().then((item) => {
            // console.log(item);
          });
        }
      });
  }
};

//creating a function for counting all the tasks

let getAllteams = async (name) => {

  let credential = await credentials(name);
  let credential_array = [
    credential[0].token,
    parseInt(credential[0].clickup_name),
  ];
  let tokenID = credential_array[0];
  let clickUpName = credential_array[1];
  const header_config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: tokenID,
    },
  };
  const getTeam = await axios
    .get(`https://api.clickup.com/api/v2/team`, header_config)
    .catch(Error);
  var allTeams = getTeam.data.teams;
  return allTeams;
};
// console.log(allTeams);
// return allTeams

// creating a function to get credentials
let credentials = async (name) => {
  let collection_taskCheck = connection_taskCheck.db.collection("users");
  let array = collection_taskCheck
    .find({ name: name }, { $exists: true })
    .toArray();
  return array;
};

module.exports = { directMessageSubscription };
