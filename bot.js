const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1295247108001103974";
const ROLE_ID = "1301948099958280303";

const SCHEDULE = [
  "00:04","00:
