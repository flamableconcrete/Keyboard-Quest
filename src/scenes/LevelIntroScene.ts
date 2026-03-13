// src/scenes/LevelIntroScene.ts
import Phaser from 'phaser'
import { LevelConfig, LevelType } from '../types'
import { getSpeedThresholds } from '../utils/scoring'

const LEVEL_TYPE_LABELS: Record<LevelType, string> = {
  GoblinWhacker:      '⚔️ Wave Defence',
  SkeletonSwarm:      '💀 Skeleton Swarm',
  MonsterArena:       '🏟️ Monster Arena',
  UndeadSiege:        '🧟 Undead Siege',
  SlimeSplitting:     '🟢 Slime Splitting',
  DungeonTrapDisarm:  '🪤 Trap Disarm',
  DungeonPlatformer:  '🏰 Dungeon Run',
  DungeonEscape:      '🏃 Dungeon Escape',
  PotionBrewingLab:   '⚗️ Potion Brewing',
  MagicRuneTyping:    '🔮 Magic Runes',
  MonsterManual:      '📖 Monster Manual',
  GuildRecruitment:   '🛡️ Guild Recruitment',
  CharacterCreator:   '🎨 Character Creator',
  WoodlandFestival:   '🌳 Woodland Festival',
  SillyChallenge:     '🃏 Silly Challenge',
  BossBattle:         '🐉 Boss Battle',
}

export class LevelIntroScene extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number

  constructor() { super('LevelIntro') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
  }

  create() {
    const { width, height } = this.scale

    this.add.text(width / 2, height * 0.25, this.level.name, {
      fontSize: '64px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5)

    const subtitle = LEVEL_TYPE_LABELS[this.level.type] ?? this.level.type
    this.add.text(width / 2, height * 0.35, subtitle, {
      fontSize: '28px', color: '#aaddff', fontStyle: 'italic'
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.42, this.level.storyBeat, {
      fontSize: '20px', color: '#cccccc', wordWrap: { width: 800 }, align: 'center'
    }).setOrigin(0.5)

    const thresholds = getSpeedThresholds(this.level.world)

    // Create a container or just text for the thresholds
    const targetsText = `🎯 Target Speeds: ⭐⭐⭐ ${thresholds.star3} WPM | ⭐⭐⭐⭐ ${thresholds.star4} WPM | ⭐⭐⭐⭐⭐ ${thresholds.star5} WPM`
    this.add.text(width / 2, height * 0.55, targetsText, {
      fontSize: '18px', color: '#ffffaa', align: 'center'
    }).setOrigin(0.5)

    const prompt = this.add.text(width / 2, height * 0.72, 'Press SPACE or click to begin', {
      fontSize: '22px', color: '#aaaaaa'
    }).setOrigin(0.5)

    // Pulse the prompt
    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    const back = this.add.text(60, 40, '← BACK', {
      fontSize: '28px', color: '#ffffff', backgroundColor: '#4e4e6a', padding: { x: 20, y: 10 }
    }).setInteractive({ useHandCursor: true })

    back.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation()
      this.scene.start('OverlandMap', { profileSlot: this.profileSlot })
    })

    this.input.keyboard?.once('keydown-SPACE', this.enter, this)
    this.input.once('pointerdown', this.enter, this)
  }

  private enter() {
    this.scene.start('Level', { level: this.level, profileSlot: this.profileSlot })
  }
}
