const mongoose = require("mongoose");

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
    // const greeting = context.matches[0];
    await say(`how are you?`);
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
        if (data.length > 0) {
          await say("okay, i see.. you are already authorized to clickUp")
        } else {
          await say("okay, i see.. you are not authorized to clickUp, go to the link below to login")
          await say (`https://slackauthclickup.vercel.app/clickuplogin/${message.user}`)
        }
      });
  } catch (error) {
    console.error(error);
  }
};

module.exports = { replyhey, clickuplogin };
