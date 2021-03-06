const fs = require("fs");

module.exports = (client, Discord) => {
  const commandFolders = fs.readdirSync("./commands");
  for (const folder of commandFolders) {
    const commandFiles = fs
      .readdirSync(`./commands/${folder}`)
      .filter((e) => e.endsWith(".js"));
    for (const file of commandFiles) {
      const command = require(`../commands/${folder}/${file}`);
      client.commands.set(command.name , command)
    }
  }
};
