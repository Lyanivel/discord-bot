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
  "00:04","00:44","01:05","01:55","02:06","03:07","04:08","05:09",
  "06:10","07:11","08:12","08:21","09:13","09:31","09:37","10:14",
  "10:41","11:15","12:16","13:17","14:18","15:19","16:02","16:20",
  "17:12","17:21","18:22","19:23","19:32","20:00","21:01","21:11",
  "22:02","22:22","23:03","23:33"
];

let sent = new Set();

client.once("ready", () => {
  console.log("BOT CONNECTED");

  setInterval(async () => {
    try {
      const now = new Date();

      const est = new Date(
        now.toLocaleString("en-US", { timeZone: "America/New_York" })
      );

      const hours = String(est.getHours()).padStart(2, "0");
      const minutes = String(est.getMinutes()).padStart(2, "0");
      const estTime = `${hours}:${minutes}`;

      console.log("Time:", estTime);

      if (SCHEDULE.includes(estTime) && !sent.has(estTime)) {
        const channel = await client.channels.fetch(CHANNEL_ID);

        if (channel) {
          await channel.send(`<@&${ROLE_ID}> Time to run ?date!`);
          console.log("Sent at", estTime);
          sent.add(estTime);
        }
      }

      if (estTime === "00:00") {
        sent.clear();
      }
    } catch (err) {
      console.error("ERROR:", err);
    }
  }, 00000);
});

client.login(TOKEN);
