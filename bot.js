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

const SCHEDULE = ["21:25"];
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
  }, 30000);
});

client.login(TOKEN);
