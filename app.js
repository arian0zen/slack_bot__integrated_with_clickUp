require("dotenv").config();
const { App, ExpressReceiver} = require("@slack/bolt");
const { InstallProvider } = require('@slack/oauth');
const { registerListeners } = require("./listeners");
const orgAuth = require("./database/auth/store_user_org_install");
const workspaceAuth = require("./database/auth/store_user_workspace_install");
const db = require("./database/db");
const dbQuery = require('./database/find_user');



const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: "you-are-lucky-babe",
  scopes: ["app_mentions:read","im:history", "channels:history", "channels:read", "groups:history", "im:history", "incoming-webhook", "mpim:history", "chat:write", "commands"],
  installerOptions: {
    callbackOptions: {
      success: (installation, InstallOptions, req, res) => {
        
        app.client.chat.postMessage({
          token: installation.bot.token,
          channel: installation.user.id,
          text: ':wave: Hieee I am a bot `clickUp to Slack!` use `-slackup help` to get started.'
        });
        res.redirect("https://nidia659.softr.app/");
      }
    }
  },
  
  installationStore: {
    stateVerification: false,
    storeInstallation: async (installation) => {
      if (
        installation.isEnterpriseInstall
        && installation.enterprise !== undefined
      ) {
        return orgAuth.saveUserOrgInstall(installation);
      }
      if (installation.team !== undefined) {
        return workspaceAuth.saveUserWorkspaceInstall(installation);
      }
      throw new Error('Failed saving installation data to installationStore');
    },
    fetchInstallation: async (installQuery) => {
      if (
        installQuery.isEnterpriseInstall
        && installQuery.enterpriseId !== undefined
      ) {
        return dbQuery.findUser(installQuery.enterpriseId);
      }
      if (installQuery.teamId !== undefined) {
        return dbQuery.findUser(installQuery.teamId);
      }
      throw new Error('Failed fetching installation');
    },
  },
  port: process.env.PORT || 80
});






registerListeners(app);




(async () => {
  await app.start();

  console.log("⚡️ Bolt app is running!");
  db.connect();
  console.log("db is connected!");
})();
