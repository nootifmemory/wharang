const Voice = require("@discordjs/voice");
const ytdl = require("youtube-dl-exec").raw;
const ytcore = require("ytdl-core");
const ytSearch = require("yt-search");

module.exports = class Track {
  constructor({ url, title, onStart, onFinish, onError }) {
    this.url = url;
    this.title = title;
    this.onStart = onStart;
    this.onFinish = onFinish;
    this.onError = onError;
  }
  /**
   * Creates an AudioResource from this Track.
   */
  createAudioResource() {
    return new Promise((resolve, reject) => {
      const process = ytdl(
        this.url,
        {
          o: "-",
          q: "",
          f: "bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio",
          r: "100K",
        },
        { stdio: ["ignore", "pipe", "ignore"] }
      );
      if (!process.stdout) {
        reject(new Error("no download result"));
        return;
      }
      const stream = process.stdout;
      const onError = (error) => {
        if (!process.killed) {
          process.kill();
        }
        stream.resume();
        reject(error);
      };
      process
        .once("spawn", () => {
          Voice.demuxProbe(stream)
            .then((probe) => resolve(Voice.createAudioResource(probe.stream, { metadata: this, inputType: probe.type, inlineVolume: true })))
            .catch(onError);
        })
        .catch(onError);
    });
  }

  /**
   * Creates a Track from a video URL and lifecycle callback methods.
   *
   * @param url The URL of the video
   * @param methods Lifecycle callbacks
   * @returns The created Track
   */
  static async from(url , methods) {
    let song;
    if (ytcore.validateURL(url[0])) {
      const song_info = await ytcore.getInfo(url[0]);
      song = {
        title: song_info.videoDetails.title,
        url: song_info.videoDetails.video_url,
      };
    } else {
      const video_finder = async (query) => {
        const video_result = await ytSearch(query);
        return video_result.videos.length > 1 ? video_result.videos[0] : null;
      };
      const video = await video_finder(url.join(" "));
      if (video) {
        song = { title: video.title, url: video.url };
      } else {
        throw "Can't Find Song On Youtube , check input";
      }
    }
    // The methods are wrapped so that we can ensure that they are only called once.
    const warpedMethods = {
      onStart() {
        warpedMethods.onStart = () => {};
        methods.onStart();
      },
      onFinish() {
        warpedMethods.onFinish = () => {};
        methods.onFinish();
      },
      onError(error) {
        warpedMethods.onError = () => {};
        methods.onError(error);
      },
    };

    return new Track({
      url: song.url,
      title: song.title,
      ...warpedMethods,
    });
  }
};
