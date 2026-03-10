import Phaser from 'phaser';

export class AudioHelper {
    static currentBGMKey: string | null = null;
    static currentBGM: Phaser.Sound.BaseSound | null = null;

    static playBGM(scene: Phaser.Scene, key: string, volume: number = 0.5) {
        // Only change music if it's different
        if (this.currentBGMKey === key && this.currentBGM && this.currentBGM.isPlaying) {
            return;
        }

        // Stop current
        if (this.currentBGM) {
            this.currentBGM.stop();
        }

        // Make sure it's in cache
        if (!scene.cache.audio.exists(key)) {
            console.warn(`Audio ${key} not found in cache`);
            return;
        }

        // Play new
        this.currentBGMKey = key;
        this.currentBGM = scene.sound.add(key, { loop: true, volume });

        // Browsers block audio before interaction. Phaser handles this, but just to be safe:
        if ((scene.sound as Phaser.Sound.WebAudioSoundManager).context.state === 'suspended') {
            scene.input.once('pointerdown', () => {
                if ((scene.sound as Phaser.Sound.WebAudioSoundManager).context.state === 'suspended') {
                    (scene.sound as Phaser.Sound.WebAudioSoundManager).context.resume();
                }
            });
            scene.input.keyboard?.once('keydown', () => {
                if ((scene.sound as Phaser.Sound.WebAudioSoundManager).context.state === 'suspended') {
                    (scene.sound as Phaser.Sound.WebAudioSoundManager).context.resume();
                }
            });
        }

        this.currentBGM.play();
    }

    static stopBGM() {
        if (this.currentBGM) {
            this.currentBGM.stop();
            this.currentBGMKey = null;
            this.currentBGM = null;
        }
    }
}
