const Voice = require("@discordjs/voice");
const { Readable } = require("stream");
const download = require("download");

module.exports = class Speech {
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
  async createAudioResource() {
    let audio = Readable.from(await download(this.url));
    return Voice.createAudioResource(audio, { metadata: this, inlineVolume: true });
  }
  /**
   * Creates a Track from a video URL and lifecycle callback methods.
   *
   * @param url The URL of the video
   * @param methods Lifecycle callbacks
   * @returns The created Track
   */
  static async from(url, methods) {
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

    return new Speech({
      url: url,
      title: "TTS",
      ...warpedMethods,
    });
  }
};
