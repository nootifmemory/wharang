const Discord = require("discord.js");
require('dotenv').config()
const { Client, Intents, Collection } = Discord;
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES],
});
client.commands = new Collection();
["commands_handler", "events_handler"].forEach((handler) => {
  require(`./handlers/${handler}`)(client, Discord);
});

client.login(process.env.TOKEN)
