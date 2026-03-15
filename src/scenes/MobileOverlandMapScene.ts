// src/scenes/MobileOverlandMapScene.ts
import Phaser from 'phaser';
import { loadProfile } from '../utils/profile';
import { ALL_LEVELS } from '../data/levels';
import type { LevelConfig, ProfileData } from '../types';

const NAV_BAR_HEIGHT = 120;
const CARD_HEIGHT = 80;
const CARD_GAP = 12;
const WORLD_HEADER_HEIGHT = 60;
const PADDING_X = 40;
const CONTENT_TOP = 80;

interface NavItem {
  icon: string;
  label: string;
  scene: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: '⚔️', label: 'Hero', scene: 'Character' },
  { icon: '🛒', label: 'Shop', scene: 'Shop' },
  { icon: '🍺', label: 'Tavern', scene: 'Tavern' },
  { icon: '🐴', label: 'Stable', scene: 'Stable' },
  { icon: '🏆', label: 'Trophy', scene: 'TrophyRoom' },
  { icon: '⚙️', label: 'Settings', scene: 'Settings' },
];

export class MobileOverlandMapScene extends Phaser.Scene {
  private profileSlot!: number;
  private profile!: ProfileData;

  constructor() {
    super('MobileOverlandMap');
  }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot;
    this.profile = loadProfile(this.profileSlot)!;
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    this.add.text(20, 20, `${this.profile.playerName}`, {
      fontSize: '20px',
      color: '#ffd700',
      fontFamily: 'monospace',
    }).setScrollFactor(0).setDepth(10);

    this.add.text(width - 20, 20, `Lv ${this.profile.characterLevel}`, {
      fontSize: '18px',
      color: '#aaaacc',
      fontFamily: 'monospace',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

    const contentHeight = this.buildLevelList(width);

    const viewableHeight = height - NAV_BAR_HEIGHT;
    const totalHeight = Math.max(contentHeight + CONTENT_TOP + 40, viewableHeight);
    this.cameras.main.setBounds(0, 0, width, totalHeight);
    this.cameras.main.setViewport(0, 0, width, viewableHeight);

    this.setupTouchScroll(viewableHeight, totalHeight);
    this.buildNavBar(width, height);
  }

  private buildLevelList(screenWidth: number): number {
    const cardWidth = screenWidth - PADDING_X * 2;
    let y = CONTENT_TOP;

    const worlds = new Map<number, LevelConfig[]>();
    for (const level of ALL_LEVELS) {
      const worldLevels = worlds.get(level.world) || [];
      worldLevels.push(level);
      worlds.set(level.world, worldLevels);
    }

    const worldNames = ['', 'The Heartland', 'The Coastlands', 'The Shadowfen', 'The Frostpeak', 'The Ember Wastes'];

    for (const [worldNum, levels] of worlds) {
      this.add.text(screenWidth / 2, y, `World ${worldNum}: ${worldNames[worldNum] || ''}`, {
        fontSize: '22px',
        color: '#ffd700',
        fontFamily: 'monospace',
      }).setOrigin(0.5, 0);

      y += WORLD_HEADER_HEIGHT;

      for (const level of levels) {
        this.buildLevelCard(screenWidth / 2, y, cardWidth, level);
        y += CARD_HEIGHT + CARD_GAP;
      }

      y += 20;
    }

    return y;
  }

  private buildLevelCard(cx: number, y: number, cardWidth: number, level: LevelConfig) {
    const isUnlocked = this.profile.unlockedLevelIds.includes(level.id);
    const result = this.profile.levelResults[level.id];
    const stars = result ? Math.min(result.accuracyStars, result.speedStars) : 0;

    const bgColor = isUnlocked ? 0x2a2a4e : 0x1a1a2a;
    const borderColor = isUnlocked ? 0x4e4e6a : 0x2a2a3a;
    const textColor = isUnlocked ? '#ffffff' : '#555566';

    const card = this.add.rectangle(cx, y + CARD_HEIGHT / 2, cardWidth, CARD_HEIGHT, bgColor)
      .setStrokeStyle(2, borderColor);

    const nameX = cx - cardWidth / 2 + 20;
    this.add.text(nameX, y + CARD_HEIGHT / 2 - 10, level.name, {
      fontSize: '18px',
      color: textColor,
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    this.add.text(nameX, y + CARD_HEIGHT / 2 + 12, level.type, {
      fontSize: '12px',
      color: isUnlocked ? '#8888aa' : '#444455',
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    if (stars > 0) {
      const starText = '★'.repeat(stars) + '☆'.repeat(5 - stars);
      this.add.text(cx + cardWidth / 2 - 20, y + CARD_HEIGHT / 2, starText, {
        fontSize: '16px',
        color: '#ffd700',
        fontFamily: 'monospace',
      }).setOrigin(1, 0.5);
    } else if (!isUnlocked) {
      this.add.text(cx + cardWidth / 2 - 20, y + CARD_HEIGHT / 2, '🔒', {
        fontSize: '20px',
      }).setOrigin(1, 0.5);
    }

    if (isUnlocked) {
      card.setInteractive({ useHandCursor: true });
      card.on('pointerdown', () => {
        this.scene.start('LevelIntro', {
          level,
          profileSlot: this.profileSlot,
        });
      });
    }
  }

  private setupTouchScroll(viewableHeight: number, totalHeight: number) {
    let dragStartY = 0;
    let cameraStartY = 0;
    let isDragging = false;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y >= viewableHeight) return;
      dragStartY = pointer.y;
      cameraStartY = this.cameras.main.scrollY;
      isDragging = false;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;
      const dy = dragStartY - pointer.y;
      if (Math.abs(dy) > 5) isDragging = true;
      if (isDragging) {
        const newY = Phaser.Math.Clamp(
          cameraStartY + dy,
          0,
          Math.max(0, totalHeight - viewableHeight)
        );
        this.cameras.main.scrollY = newY;
      }
    });
  }

  private buildNavBar(screenWidth: number, screenHeight: number) {
    const barY = screenHeight - NAV_BAR_HEIGHT;
    const itemWidth = screenWidth / NAV_ITEMS.length;

    this.add.rectangle(screenWidth / 2, barY + NAV_BAR_HEIGHT / 2, screenWidth, NAV_BAR_HEIGHT, 0x0d0d1a)
      .setScrollFactor(0)
      .setDepth(20);

    this.add.rectangle(screenWidth / 2, barY, screenWidth, 2, 0x4e4e6a)
      .setScrollFactor(0)
      .setDepth(20);

    for (let i = 0; i < NAV_ITEMS.length; i++) {
      const item = NAV_ITEMS[i];
      const x = itemWidth * i + itemWidth / 2;
      const y = barY + NAV_BAR_HEIGHT / 2;

      this.add.text(x, y - 14, item.icon, {
        fontSize: '28px',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

      this.add.text(x, y + 22, item.label, {
        fontSize: '12px',
        color: '#8888aa',
        fontFamily: 'monospace',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

      const hitZone = this.add.rectangle(x, y, itemWidth, NAV_BAR_HEIGHT, 0x000000, 0)
        .setScrollFactor(0)
        .setDepth(22)
        .setInteractive({ useHandCursor: true });

      hitZone.on('pointerdown', () => {
        this.scene.start(item.scene, { profileSlot: this.profileSlot });
      });
    }
  }
}
