const MusicSubscription = require("./src/subscription");
const Track = require("./src/track");
const Voice = require("@discordjs/voice");
module.exports = {
  name: "play",
  aliases: ["skip", "queue", "pause", "resume", "leave", "stop", "vol"],
  cooldown: 0,
  description: "Advanced music bot",
  async run(client, message, args, Discord, cmd) {
    const channel = message.member.voice.channel;
    if (!channel) return message.channel.send("Vui lòng vào 1 kênh chat voice");
    if (!client.subscriptions) client.subscriptions = new Map();
    let subscription = client.subscriptions.get(message.guildId);
    switch (cmd) {
      case "play":
        if (!subscription) {
          subscription = new MusicSubscription(
            Voice.joinVoiceChannel({
              channelId: channel.id,
              guildId: channel.guild.id,
              adapterCreator: channel.guild.voiceAdapterCreator,
            })
          );
          subscription.voiceConnection.on("error", console.warn);
          client.subscriptions = new Map();
          client.subscriptions.set(message.guildId, subscription);
        }

        try {
          await Voice.entersState(subscription.voiceConnection, Voice.VoiceConnectionStatus.Ready, 20000);
        } catch (error) {
          console.warn("error ", error);
          await message.channel.send("Không thể kết nối đến kênh voice");
          return;
        }

        try {
          const track = await Track.from(args, {
            onStart: () => {
              console.log(`Playing ${track.title}`);
              try {
                clearTimeout(subscription.timeout);
              } catch (error) {
                console.warn(error);
              }
            },
            onFinish: () => {
              console.log(`Finished playing ${track.title}`);
              subscription.timeout = setTimeout(() => {
                console.log("Timeout");
                subscription.voiceConnection.destroy();
                client.subscriptions.delete(message.guildId);
              }, 60 * 60 * 1000); // 1 hour
            },
            onError: (error) => {
              console.log(`Error playing ${track.title}`, error);
              message.channel.send(`Lỗi khi phát ${track.title}`);
            }

          });
          subscription.enqueue(track);
          await message.channel.send(`Đã thêm ***${track.title}***`);
        } catch (error) {
          console.warn(error);
          await message.channel.send("sai sai");
        }
        break;
      case "vol":
        subscription.vol = args[0];
        await message.channel.send(`Đã thay đổi volume thành ***${args[0]}*** ( Giá trị mặc định là 0.3 )`);
        break;
      case "skip":
        if (subscription) {
          // Calling .stop() on an AudioPlayer causes it to transition into the Idle state. Because of a state transition
          // listener defined in music/subscription.ts, transitions into the Idle state mean the next track from the queue
          // will be loaded and played.
          subscription.audioPlayer.stop();
          await message.channel.send("Nhảy bài");
        } else {
          await message.channel.send("Chưa có bài nào trong danh sách chờ");
        }
        break;
      case "queue":
        // Print out the current queue, including up to the next 5 tracks to be played.
        if (subscription) {
          const current = subscription.audioPlayer.state.status === Voice.AudioPlayerStatus.Idle ? `Danh sách chờ trống` : `Hiện tại **${subscription.audioPlayer.state.resource.metadata.title}**`;
          const queue = subscription.queue
            .slice(0, 5)
            .map((track, index) => `${index + 1}.  ***${track.title}***`)
            .join("\n");
          await message.channel.send(`${current}\n\n${queue}`);
        } else {
          await message.channel.send("Danh sách chờ trống!");
        }
        break;
      case "pause":
        if (subscription) {
          subscription.audioPlayer.pause();
          await message.channel.send("Tạm dừng");
        } else {
          await message.channel.send("Chưa có bài nào trong danh sách chờ");
        }
        break;
      case "resume":
        if (subscription) {
          subscription.audioPlayer.unpause();
          await message.channel.send("Tiếp tục");
        } else {
          await message.channel.send("Chưa có bài nào trong danh sách chờ");
        }
        break;
      case "leave":
      case "stop":
        if (subscription) {
          subscription.voiceConnection.destroy();
          client.subscriptions.delete(message.guildId);
          await message.channel.send({ content: `Left channel!`, ephemeral: true });
        } else {
          await message.channel.send("Chưa có bài nào trong danh sách chờ");
        }
        break;
    }
  },
};
