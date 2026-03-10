import Phaser from 'phaser';

class TestScene extends Phaser.Scene {
  create() {
    const ctx = this.game.sound.context as AudioContext;
    if (!ctx) {
      console.log("No audio context");
      return;
    }
    const sampleRate = ctx.sampleRate || 44100;
    const duration = 2; // seconds
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      data[i] = Math.sin(2 * Math.PI * 440 * t) * 0.1;
    }

    this.cache.audio.add('testSynth', buffer);
    const sound = this.sound.add('testSynth');
    console.log("Sound created successfully!");
  }
}

const game = new Phaser.Game({
  type: Phaser.HEADLESS,
  scene: TestScene,
  audio: {
    noAudio: true // headless might crash without this, but let's try
  }
});
