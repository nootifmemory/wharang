const cooldowns = new Map();
const { Prefix } = require("../../config.json");
const { Client, Message, MessageEmbed } = require("discord.js");

module.exports = {
  name: "messageCreate",
  /**
   * @param {Client} client
   * @param {Message} message
   */
  async run(message, client, Discord) {
    if (!message.content.startsWith(Prefix) || message.author.bot) return;
    // if (message.author.id != "416154670449295371")
    //   return message.channel.send("Nô tì của <@416154670449295371>");
    const [cmd, ...args] = message.content
      .trim()
      .substring(Prefix.length)
      .split(/\s+/);
    const command =
    client.commands.get(cmd) ||
    client.commands.find((a) => a.aliases && a.aliases.includes(cmd));
    //Check if command exsist
    if (!cmd || !command) return;
    //If cooldowns map doesn't have a command.name key then create one.
    if (!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Discord.Collection());
    }

    const current_time = Date.now();
    const time_stamps = cooldowns.get(command.name);
    const cooldown_amount = command.cooldown * 1000;

    //If time_stamps has a key with the author's id then check the expiration time to send a message to a user.
    if (time_stamps.has(message.author.id)) {
      const expiration_time = time_stamps.get(message.author.id) + cooldown_amount;

      if (current_time < expiration_time) {
        const time_left = (expiration_time - current_time) / 1000;

        return message.channel.send(
          `Nhập quá nhanh ! vui lòng chờ ${time_left.toFixed(1)} giây nữa`
        );
      }
    }

    //If the author's id is not in time_stamps then add them with the current time.
    time_stamps.set(message.author.id, current_time);
    //Delete the user's id once the cooldown is over.
    setTimeout(() => time_stamps.delete(message.author.id), cooldown_amount);

    try {
      command.run(client, message, args, Discord, cmd);
    } catch (err) {
      console.log(err);
    }
  },
};
