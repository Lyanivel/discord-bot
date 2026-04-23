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

function getESTNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
}

function getNextScheduledTime() {
  const now = getESTNow();

  for (let i = 0; i < 2; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + i);

    for (const time of SCHEDULE) {
      const [hour, minute] = time.split(":").map(Number);

      const target = new Date(checkDate);
      target.setHours(hour, minute, 0, 0);

      if (target > now) {
        return target;
      }
    }
  }

  return null;
}

async function scheduleNextMessage() {
  const nextTime = getNextScheduledTime();

  if (!nextTime) {
    console.log("No next scheduled time found.");
    setTimeout(scheduleNextMessage, 60000);
    return;
  }

  const now = getESTNow();
  const delay = nextTime.getTime() - now.getTime();

  console.log("Next send scheduled for:", nextTime.toLocaleString("en-US"));

  setTimeout(async () => {
    try {
      const channel = await client.channels.fetch(CHANNEL_ID);

      if (channel) {
 const { EmbedBuilder } = require("discord.js");

const embed = new EmbedBuilder()
  .setColor("#ff2ea6")
  .setTitle("✨ GOOS DATE! 🖤")

  .setDescription(
    "**TYPE `?DATE` TO CLAIM YOUR GOOS WITHIN 1 MINUTE!** <:YOUR_EMOJI_NAME:YOUR_EMOJI_ID>"

    "🖤 **@Test**"
  )
  .setFooter({
    text: "@Goos Date 🤑"
  });

await channel.send({
  content: `<@&${ROLE_ID}>`,
  embeds: [embed]
});
      }
    } catch (err) {
      console.error("Send error:", err);
    }

    scheduleNextMessage();
  }, delay);
}

client.once("ready", () => {
  console.log("BOT CONNECTED");
  scheduleNextMessage();
});

client.login(TOKEN);
