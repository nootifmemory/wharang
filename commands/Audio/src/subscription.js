const Voice = require("@discordjs/voice");
const { promisify } = require("util");
const wait = promisify(setTimeout);

module.exports = class MusicSubscription {
  constructor(voiceConnection, client) {
    /**
     * @type {boolean}
     * @private
     */
    this.readyLock = false;
    this.queueLock = false;
    this.vol = 0.3;
    /**
     * The VoiceConnection
     * @type {VoiceConnection}
     */
    this.voiceConnection = voiceConnection;
    this.audioPlayer = Voice.createAudioPlayer();
    this.queue = [];
    this.client = client;
    /**
     * @type {VoiceChannel | StageChannel}
     */
    this.voiceConnection.on("stateChange", async (oldState, newState) => {
      if (newState.status === Voice.VoiceConnectionStatus.Disconnected) {
        if (newState.reason === Voice.VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
          try {
            await Voice.entersState(this.voiceConnection, Voice.VoiceConnectionStatus.Connecting, 5_000);
          } catch {
            this.voiceConnection.destroy();
          }
        } else if (this.voiceConnection.rejoinAttempts < 5) {
          await wait((this.voiceConnection.rejoinAttempts + 1) * 5000);
          this.voiceConnection.rejoin();
        } else {
          this.voiceConnection.destroy();
        }
      } else if (newState.status === Voice.VoiceConnectionStatus.Destroyed) {
        this.stop();
      } else if (!this.readyLock && (newState.status === Voice.VoiceConnectionStatus.Connecting || newState.status === Voice.VoiceConnectionStatus.Signalling)) {
        this.readyLock = true;
        try {
          await Voice.entersState(this.voiceConnection, Voice.VoiceConnectionStatus.Ready, 20000);
        } catch {
          if (this.voiceConnection.state.status !== Voice.VoiceConnectionStatus.Destroyed) {
            this.voiceConnection.destroy();
          }
        } finally {
          this.readyLock = false;
        }
      }
    });
    this.audioPlayer.on("stateChange", (oldState, newState) => {
      if (newState.status === Voice.AudioPlayerStatus.Idle && oldState.status !== Voice.AudioPlayerStatus.Idle) {
        oldState.resource.metadata.onFinish();
        void this.processQueue();
      } else if (newState.status === Voice.AudioPlayerStatus.Playing) {
        newState.resource.metadata.onStart();
      }
    });
    this.audioPlayer.on("error", (error) => error.resource.metadata.onError(error));
    this.voiceConnection.subscribe(this.audioPlayer);
  }

  /**
   * @param track enqueue track inputed
   */
  enqueue(track) {
    this.queue.push(track);
    void this.processQueue();
  }
  stop() {
    this.queueLock = true;
    this.queue = [];
    this.audioPlayer.stop(true);
  }
  async processQueue() {
    if (this.queueLock || this.audioPlayer.state.status !== Voice.AudioPlayerStatus.Idle || this.queue.length === 0) {
      return;
    }
    this.queueLock = true;
    const nextTrack = this.queue.shift();
    try {
      const resource = await nextTrack.createAudioResource();
      resource.volume.setVolume(this.vol);
      await wait(this.audioPlayer.play(resource));
      this.queueLock = false;
    } catch (error) {
      nextTrack.onError(error);
      this.queueLock = false;
      return this.processQueue();
    }
  }
};
