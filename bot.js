const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits
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

// IMPORTANT:
// Set CHANNEL_ID in Railway Variables after you choose the main server channel.
// You can also use /setchannel while the bot is running, but Railway restarts will reset it unless CHANNEL_ID is saved in Variables.
let CHANNEL_ID = process.env.CHANNEL_ID || null;

// Main server role IDs
const ROLE_ID = "1467367287009972244";
const ADMIN_ROLE_ID = "1467556289864274012";
const OWNER_ROLE_ID = "1467292070938152960";

const TIME_ZONE = "America/New_York";

const SCHEDULE = [
  "00:04","00:44","01:05","01:55","02:06","03:07","04:08","05:09",
  "06:10","07:11","08:12","08:21","09:13","09:31","09:37","10:14",
  "10:41","11:15","12:16","13:17","14:18","15:19","16:02","16:20",
  "17:12","17:21","18:22","19:23","19:32","20:00","21:01","21:11",
  "22:02","22:22","23:03","23:33"
];

function hasManagementRole(interaction) {
  try {
    if (interaction.guild && interaction.guild.ownerId === interaction.user.id) {
      return true;
    }

    const roles = interaction.member?.roles?.cache;
    if (!roles) return false;

    return roles.has(ADMIN_ROLE_ID) || roles.has(OWNER_ROLE_ID);
  } catch (err) {
    console.error("ROLE CHECK ERROR:", err);
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
      "**ᴛʏᴘᴇ ?ᴅᴀᴛᴇ ᴛᴏ ᴄʟᴀɪᴍ ʏᴏᴜʀ ɢᴏᴏs ᴡɪᴛʜɪɴ 1 ᴍɪɴᴜᴛᴇ!** <:PinkGoos:1511145367012376808>\n\n\n\n"
    )
    .setFooter({ text: "ᴄʜᴇᴄᴋ ɴᴇxᴛ ᴅᴀᴛᴇ ᴡɪᴛʜ '/ɴᴇxᴛᴅᴀᴛᴇ'" });
}

async function sendDateAlert() {
  if (!CHANNEL_ID) {
    console.error("SEND ERROR: CHANNEL_ID is not set. Use /setchannel or set CHANNEL_ID in Railway Variables.");
    return;
  }

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

  console.log("Next Goos Date scheduled for:", nextTime.toISOString());

  setTimeout(async () => {
    try {
      await sendDateAlert();
    } catch (err) {
      console.error("SEND ERROR:", err);
    }

    scheduleNextMessage();
  }, Math.max(delay, 0));
}

const commands = [
  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Bot status")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("testping")
    .setDescription("Test ping")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("setchannel")
    .setDescription("Set the Goos Date channel to this channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("nextdate")
    .setDescription("Next date")
].map(cmd => cmd.toJSON());

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("Slash commands registered.");
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await registerCommands();
  scheduleNextMessage();
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "status") {
    if (!hasManagementRole(interaction)) {
      return interaction.reply({
        content: "Admin/Co-owner only command.",
        ephemeral: true
      });
    }

    const next = getNextScheduledTime();
    const unix = next ? Math.floor(next.getTime() / 1000) : null;

    return interaction.reply({
      content:
        `Bot is online.\n` +
        `Current channel: ${CHANNEL_ID ? `<#${CHANNEL_ID}>` : "Not set"}\n` +
        `Next Goos Date: ${unix ? `<t:${unix}:t> (<t:${unix}:R>)` : "Not found"}`,
      ephemeral: true
    });
  }

  if (interaction.commandName === "testping") {
    if (!hasManagementRole(interaction)) {
      return interaction.reply({
        content: "Admin/Co-owner only command.",
        ephemeral: true
      });
    }

    await sendDateAlert();

    return interaction.reply({
      content: "Test ping sent.",
      ephemeral: true
    });
  }

  if (interaction.commandName === "setchannel") {
    if (!hasManagementRole(interaction)) {
      return interaction.reply({
        content: "Admin/Co-owner only command.",
        ephemeral: true
      });
    }

    CHANNEL_ID = interaction.channelId;

    return interaction.reply({
      content:
        `Goos Date channel set to <#${CHANNEL_ID}>.\n\n` +
        `Important: to keep this after Railway restarts, add this Railway Variable:\n` +
        `CHANNEL_ID=${CHANNEL_ID}`,
      ephemeral: true
    });
  }

  if (interaction.commandName === "nextdate") {
    const next = getNextScheduledTime();

    if (!next) {
      return interaction.reply({
        content: "No next date found."
      });
    }

    const unix = Math.floor(next.getTime() / 1000);

    return interaction.reply({
      content: `Next Goos Date is <t:${unix}:t> (<t:${unix}:R>)`
    });
  }
});

client.on("error", console.error);
process.on("unhandledRejection", console.error);

client.login(TOKEN);
