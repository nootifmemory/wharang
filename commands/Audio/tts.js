const MusicSubscription = require("./src/subscription");
const Voice = require("@discordjs/voice");
const Speech = require("./src/speech");
const tts = require("google-tts-api");
const languageCode = require("../../data/languages.json");

module.exports = {
  name: "tts",
  aliases: ["t", "ttso", "to"],
  cooldown: 0,
  description: "Advanced speech bot",
  async run(client, message, args, Discord, cmd) {
    const channel = message.member.voice.channel;
    if (!channel) return message.channel.send("Vui lòng vào 1 kênh chat voice");
    if (!args) return;
    if (!client.subscriptions) client.subscriptions = new Map();
    let subscription = client.subscriptions.get(message.guildId);
    if (!subscription) {
      subscription = new MusicSubscription(
        Voice.joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator,
        })
      );
      subscription.voiceConnection.on("error", console.warn);
      client.subscriptions.set(message.guildId, subscription);
    }

    try {
      await Voice.entersState(subscription.voiceConnection, Voice.VoiceConnectionStatus.Ready, 20000); // fix to 20000 when production
    } catch (error) {
      console.warn("error ", error);
      await message.channel.send("Không thể kết nối đến kênh voice");
      return;
    }
    let Lang;
    switch (cmd) {
      case "t":
      case "tts":
        Lang = "vi";
        break;
      case "to":
      case "ttso":
        Lang = args.shift();
        break;
    }
    if (!languageCode[Lang]) return message.channel.send(`Ngôn ngữ ***${Lang}***  không tồn tại`);
    const ttsList = tts
      .getAllAudioUrls(args.join(" "), {
        lang: Lang,
        slow: false,
        host: "https://translate.google.com",
        splitPunct: ",.?!",
      })
      .map((val) => val.url);
    ttsList.forEach(async (e) => {
      try {
        subscription.enqueue(
          await Speech.from(e, {
            onStart: () => {
              console.log(`Playing TTS`);
              try {
                clearTimeout(subscription.timeout);
              } catch (error) {
                console.warn(error);
              }
            },
            onFinish: () => {
              console.log(`Finished TTS`);
              subscription.timeout = setTimeout(() => {
                subscription.voiceConnection.destroy();
                client.subscriptions.delete(message.guildId);
              }, 60 * 60 * 1000); // 1 hour
            },
            onError: (error) => {
              console.log(`Error playing TTS`, error);
              message.channel.send(`Lỗi khi phát TTS`);
            }

          })
        );
      } catch (err) {
        console.warn(error);
        message.channel.send("sai sai");
      }
    });
  },
};
