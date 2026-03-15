// src/scenes/MobileLevelIntroScene.ts
import Phaser from 'phaser';
import type { LevelConfig } from '../types';
import { getTaunt } from '../data/mobileTaunts';

export class MobileLevelIntroScene extends Phaser.Scene {
  private level!: LevelConfig;
  private profileSlot!: number;

  constructor() {
    super('MobileLevelIntro');
  }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level;
    this.profileSlot = data.profileSlot;
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Level name at top
    this.add.text(width / 2, 40, this.level.name, {
      fontSize: '32px',
      color: '#ffd700',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Enemy sprite centered
    const enemyKey = this.level.bossId || this.level.type;
    const enemyY = height * 0.4;
    if (this.textures.exists(enemyKey)) {
      this.add.image(width / 2, enemyY, enemyKey).setScale(3);
    } else {
      this.add.text(width / 2, enemyY, '👾', {
        fontSize: '80px',
      }).setOrigin(0.5);
    }

    // Taunt dialogue bubble
    const taunt = getTaunt(this.level.bossId, this.level.type);
    const bubbleWidth = width * 0.85;
    const bubbleX = width / 2;
    const bubbleY = height * 0.65;

    // Create text first to measure height, then size bubble to fit
    const tauntText = this.add.text(bubbleX, bubbleY, taunt, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'monospace',
      wordWrap: { width: bubbleWidth - 40 },
      align: 'center',
    }).setOrigin(0.5);

    const bubbleHeight = Math.max(120, tauntText.height + 40);
    this.add.rectangle(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 0x2a2a4e)
      .setStrokeStyle(2, 0x4e4e6a);

    // Re-add text on top of bubble (rectangle was added after text)
    tauntText.setDepth(1);

    // Back to Map button — goes directly to MobileOverlandMap
    const backBtn = this.add.text(width / 2, height * 0.88, '← Back to Map', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#4e4e6a',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setColor('#ffd700'));
    backBtn.on('pointerout', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerdown', () => {
      this.scene.start('MobileOverlandMap', { profileSlot: this.profileSlot });
    });
  }
}
