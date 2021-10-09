const { DiscordTogether } = require("discord-together");
module.exports = {
  name: "together",
  aliases: [],
  description: "talks for a user in vc",
  cooldown: 0,
  run(client, message, args, Discord, cmd) {
    if (message.member.voice.channel) {
      client.discordTogether = new DiscordTogether(client);
      const channel = message.member.voice.channel;
      if (!channel) return message.channel.send("Vui lòng vào 1 kênh VC");
      const list = ["betrayal", "chess", "chessdev", "youtube", "youtubedev"];
      if (list.indexOf(args[0]) == -1) {
        message.channel.send(`Vui lòng chọn một trong các activitys sau :   ***${list.toString().replace(/,/g, "  ,  ")}***`);
      } else {
        client.discordTogether.createTogetherCode(message.member.voice.channel.id, args[0]).then(async (invite) => {
          console.log(invite);
          return message.channel.send(invite.code);
        });
      }
    }
  },
};
