const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

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

  for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
    const baseDate = new Date(now);
    baseDate.setDate(now.getDate() + dayOffset);

    for (const time of SCHEDULE) {
      const [hour, minute] = time.split(":").map(Number);

      const target = new Date(baseDate);
      target.setHours(hour, minute, 0, 0);

      if (target > now) {
        return target;
      }
    }
  }

  return null;
}
function buildDateEmbed() {
  return new EmbedBuilder()
    .setColor("#ff2ea6")
    .setTitle("✨🖤 𝐆𝐎𝐎𝐒 𝐃𝐀𝐓𝐄! 🖤✨") // 👈 BIG text restored
    .setDescription(
      "‎\n" + // 👈 invisible spacer (adds gap under title)

      "**ᴛʏᴘᴇ ?ᴅᴀᴛᴇ ᴛᴏ ᴄʟᴀɪᴍ ʏᴏᴜʀ ɢᴏᴏs ᴡɪᴛʜɪɴ 1 ᴍɪɴᴜᴛᴇ!** <:PinkGoos:1496723632288694314>\n\n\n\n"
    )
    .setFooter({ text: "ᴄʜᴇᴄᴋ ɴᴇxᴛ ᴅᴀᴛᴇ ᴡɪᴛʜ '/ɴᴇxᴛᴅᴀᴛᴇ'" });
}
async function sendDateAlert() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  const embed = buildDateEmbed();

  await channel.send({
    content: `<@&${ROLE_ID}>\n\n\n`,
    embeds: [embed],
    allowedMentions: { parse: ["roles"] }
  });
}

let nextTimer = null;

function clearExistingTimer() {
  if (nextTimer) {
    clearTimeout(nextTimer);
    nextTimer = null;
  }
}

function scheduleNextMessage() {
  clearExistingTimer();

  const nextTime = getNextScheduledTime();

  if (!nextTime) {
    console.log("No next scheduled time found.");
    nextTimer = setTimeout(scheduleNextMessage, 60000);
    return;
  }

  const now = getESTNow();
  const delay = nextTime.getTime() - now.getTime();

  console.log("Current EST:", now.toLocaleString("en-US"));
  console.log("Next send scheduled for:", nextTime.toLocaleString("en-US"));
  console.log("Delay in ms:", delay);

  nextTimer = setTimeout(async () => {
    try {
      await sendDateAlert();
      console.log("Sent at:", getESTNow().toLocaleString("en-US"));
    } catch (err) {
      console.error("SEND ERROR:", err);
    }

    scheduleNextMessage();
  }, Math.max(delay, 0));
}

const commands = [
  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Shows bot status and the next scheduled date."),
  new SlashCommandBuilder()
    .setName("testping")
    .setDescription("Sends a test Goos Date ping in the configured channel."),
  new SlashCommandBuilder()
    .setName("nextdate")
    .setDescription("Shows the next scheduled Goos Date time.")
].map(command => command.toJSON());

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("Slash commands registered.");
}

client.once("ready", async () => {
  console.log("Logged in as:", client.user.tag);

  try {
    await registerCommands();
  } catch (err) {
    console.error("COMMAND REGISTER ERROR:", err);
  }

  scheduleNextMessage();
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "status") {
    const nextTime = getNextScheduledTime();

    const embed = new EmbedBuilder()
      .setColor("#ff2ea6")
      .setTitle("Bot Status")
      .addFields(
        { name: "Status", value: "Online", inline: true },
        { name: "Channel ID", value: CHANNEL_ID, inline: false },
        { name: "Role ID", value: ROLE_ID, inline: false },
        {
          name: "Next Date",
          value: nextTime ? nextTime.toLocaleString("en-US") : "Not found",
          inline: false
        }
      );

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
    return;
  }

  if (interaction.commandName === "testping") {
    try {
      await sendDateAlert();
      await interaction.reply({
        content: "Test ping sent.",
        ephemeral: true
      });
    } catch (err) {
      console.error("TESTPING ERROR:", err);
      await interaction.reply({
        content: "Test ping failed. Check Railway logs.",
        ephemeral: true
      });
    }
    return;
  }

  if (interaction.commandName === "nextdate") {
    const nextTime = getNextScheduledTime();

    await interaction.reply({
      content: nextTime
        ? `Next Goos Date is **${nextTime.toLocaleString("en-US")}**`
        : "No next date found.",
      ephemeral: false
    });
  }
});

client.on("error", console.error);
process.on("unhandledRejection", console.error);

client.login(TOKEN);
