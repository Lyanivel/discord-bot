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
const STAFF_ROLE_ID = "1240660412647866378";
const TIME_ZONE = "America/New_York";

const SCHEDULE = [
  "00:04","00:44","01:05","01:55","02:06","03:07","04:08","05:09",
  "06:10","07:11","08:12","08:21","09:13","09:31","09:37","10:14",
  "10:41","11:15","12:16","13:17","14:18","15:19","16:02","16:20",
  "17:12","17:21","18:22","19:23","19:32","20:00","21:01","21:11",
  "22:02","22:22","23:03","23:33"
];

function hasStaffRole(interaction) {
  try {
    return interaction.member.roles.cache.has(STAFF_ROLE_ID);
  } catch {
    return false;
  }
}

function getZonedParts(date, timeZone = TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });

  const parts = formatter.formatToParts(date);
  const map = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second)
  };
}

function getTimeZoneOffsetMs(date, timeZone = TIME_ZONE) {
  const parts = getZonedParts(date, timeZone);
  const asUTC = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return asUTC - date.getTime();
}

function zonedTimeToUtc(year, month, day, hour, minute, second = 0, timeZone = TIME_ZONE) {
  let utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);

  for (let i = 0; i < 4; i++) {
    const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
    const corrected = Date.UTC(year, month - 1, day, hour, minute, second) - offset;

    if (corrected === utcGuess) break;
    utcGuess = corrected;
  }

  return new Date(utcGuess);
}

function getNextScheduledTime() {
  const now = new Date();

  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    const probe = new Date(now.getTime() + dayOffset * 86400000);
    const easternDay = getZonedParts(probe, TIME_ZONE);

    for (const time of SCHEDULE) {
      const [hour, minute] = time.split(":").map(Number);

      const candidate = zonedTimeToUtc(
        easternDay.year,
        easternDay.month,
        easternDay.day,
        hour,
        minute
      );

      if (candidate > now) return candidate;
    }
  }

  return null;
}

function buildDateEmbed() {
  return new EmbedBuilder()
    .setColor("#ff2ea6")
    .setTitle("✨🖤 𝐆𝐎𝐎𝐒 𝐃𝐀𝐓𝐄! 🖤✨")
    .setDescription(
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

function scheduleNextMessage() {
  const nextTime = getNextScheduledTime();

  if (!nextTime) return setTimeout(scheduleNextMessage, 60000);

  const delay = nextTime.getTime() - Date.now();

  setTimeout(async () => {
    await sendDateAlert();
    scheduleNextMessage();
  }, Math.max(delay, 0));
}

const commands = [
  new SlashCommandBuilder().setName("status").setDescription("Bot status"),
  new SlashCommandBuilder().setName("testping").setDescription("Test ping"),
  new SlashCommandBuilder().setName("nextdate").setDescription("Next date")
].map(cmd => cmd.toJSON());

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
}

client.once("ready", async () => {
  console.log("Logged in");
  await registerCommands();
  scheduleNextMessage();
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "status") {
    if (!hasStaffRole(interaction)) {
      return interaction.reply({ content: "Staff only command.", ephemeral: true });
    }

    return interaction.reply({ content: "Bot is online.", ephemeral: true });
  }

  if (interaction.commandName === "testping") {
    if (!hasStaffRole(interaction)) {
      return interaction.reply({ content: "Staff only command.", ephemeral: true });
    }

    await sendDateAlert();
    return interaction.reply({ content: "Sent.", ephemeral: true });
  }

  if (interaction.commandName === "nextdate") {
    const next = getNextScheduledTime();
    const unix = Math.floor(next.getTime() / 1000);

    return interaction.reply({
      content: `<t:${unix}:t> (<t:${unix}:R>)`
    });
  }
});

client.login(TOKEN);
