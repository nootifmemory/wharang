const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");
const voiceDiscord = require("@discordjs/voice");
const youtubedl = require("youtube-dl-exec").raw;
const globalQueue = new Map();

module.exports = {
  name: "p",
  cooldown: 0,
  description: "Advanced music bot",
  async run(client, message, args, Discord, cmd) {
    const channel = message.member.voice.channel;
    if (!channel) return message.reply("Join a channel plz");
    if (ytdl.validateURL(args[0])) {
      const song_info = await ytdl.getInfo(args[0]);
      song = {
        title: song_info.videoDetails.title,
        url: song_info.videoDetails.video_url,
      };
    } else {
      const video_finder = async (query) => {
        const video_result = await ytSearch(query);
        return video_result.videos.length > 1 ? video_result.videos[0] : null;
      };
      const video = await video_finder(args.join(" "));
      if (video) {
        song = { title: video.title, url: video.url };
      } else {
        return message.channel.send("Không thể tìm được video");
      }
    }
    let serverQueue = globalQueue.get(message.guild.id);
    if (!serverQueue) {
      const serverContructer = {
        channel: channel,
        text_channel: message.channel,
        connection: null,
        songs: [],
      };
      globalQueue.set(message.guild.id, serverContructer);
      serverContructer.songs.push(song);
      const connection = voiceDiscord.joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });
      serverContructer.connection = connection;
      play(message.guild.id, song, voiceDiscord, serverContructer.channel, serverContructer.text_channel);
    } else {
      serverQueue.songs.push(song);
      return message.channel.send(`Đã thêm bài hát ***${song.title}***  vào danh sách chờ , hàng chờ còn ***${serverQueue.songs.length}***  bài hát`);
    }
  },
};
async function play(guild, song, voiceDiscord) {
  const song_queue = globalQueue.get(guild);
  if (!song) {
    globalQueue.delete(guild);
    song_queue.connection.destroy();
    return;
  }
  const stream = youtubedl(
    song.url,
    {
      o: "-",
      q: "",
      f: "bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio",
      r: "100K",
    },
    { stdio: ["ignore", "pipe", "ignore"] }
  );
  const resource = voiceDiscord.createAudioResource(stream.stdout, {
    inlineVolume: true,
  });
  resource.volume.setVolume(0.5);
  const player = voiceDiscord.createAudioPlayer();

  console.log("URL:", song.url, ", Title:", song.title);
  song_queue.text_channel.send(`Bài hát hiện tại : ***${song.title}*** `);
  song_queue.connection.subscribe(player);
  player.play(resource);
  player.on("error", (error) => {
    console.error("Error:", error.message, "Song Title:", song.title);
  });
  player.on(voiceDiscord.AudioPlayerStatus.Idle, () => {
    song_queue.songs.shift();
    play(guild, song_queue.songs[0], voiceDiscord);
  });
}
