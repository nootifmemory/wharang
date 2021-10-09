const { Client, Message } = require("discord.js");

module.exports = {
  name: "ready",
  once: "1",
  /**
   * @param {Client} client
   * @param {Message} message
   */
  async run(message, client) {
    console.log("Connected As " + client.user.username);
    client.user.setPresence({
      activities: [{ name: "bê đê", type: "PLAYING" }],
      status: "idle",
    });
  },
};
