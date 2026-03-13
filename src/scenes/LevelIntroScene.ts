// src/scenes/LevelIntroScene.ts
import Phaser from 'phaser'
import { LevelConfig, LevelType, ProfileData } from '../types'
import { loadProfile } from '../utils/profile'
import { AvatarRenderer } from '../components/AvatarRenderer'
import { generateGoblinWhackerTextures } from '../art/goblinWhackerArt'
import { generateGenericBossTextures } from '../art/genericBossArt'

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
  private profile!: ProfileData

  constructor() { super('LevelIntro') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.profile = loadProfile(this.profileSlot)!
  }

  create() {
    const { width, height } = this.scale

    // Back button
    const backBtn = this.add.text(20, 20, '◀ BACK TO MAP', {
      fontSize: '20px', color: '#ffffff', backgroundColor: '#444444', padding: { x: 8, y: 4 }
    }).setInteractive({ useHandCursor: true })
    backBtn.on('pointerover', () => backBtn.setStyle({ backgroundColor: '#666666' }))
    backBtn.on('pointerout', () => backBtn.setStyle({ backgroundColor: '#444444' }))
    backBtn.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation()
      this.scene.start('OverlandMap', { profileSlot: this.profileSlot })
    })

    this.add.text(width / 2, height * 0.25, this.level.name, {
      fontSize: '64px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5)

    const subtitle = LEVEL_TYPE_LABELS[this.level.type] ?? this.level.type
    this.add.text(width / 2, height * 0.35, subtitle, {
      fontSize: '28px', color: '#aaddff', fontStyle: 'italic'
    }).setOrigin(0.5)

    // Render Avatar
    if (this.profile.avatarConfig && !this.textures.exists(this.profile.avatarConfig.id)) {
      AvatarRenderer.generateOne(this, this.profile.avatarConfig, this.profile.equipment)
    }
    const avatarTexture = (this.profile.avatarConfig?.id && this.textures.exists(this.profile.avatarConfig.id))
      ? this.profile.avatarConfig.id
      : (this.profile.avatarChoice || 'avatar_0')

    const avatarTargetX = width / 2 - 200
    const avatar = this.add.sprite(-200, height * 0.85, avatarTexture).setOrigin(0.5, 1).setScale(2)

    // Render Representative Enemy
    let enemyTexture = ''
    if (this.level.type === 'GoblinWhacker') {
      generateGoblinWhackerTextures(this)
      enemyTexture = 'goblin'
    } else if (this.level.isBoss || this.level.isMiniBoss || this.level.type === 'BossBattle') {
      generateGenericBossTextures(this)
      enemyTexture = 'generic_boss'
    } else if (this.level.type === 'SkeletonSwarm' || this.level.type === 'UndeadSiege') {
      // Create a simple skeleton placeholder texture
      if (!this.textures.exists('skeleton_placeholder')) {
        const g = this.add.graphics()
        g.fillStyle(0xdddddd)
        g.fillRect(0, 0, 32, 32)
        g.fillStyle(0x000000)
        g.fillRect(8, 8, 4, 4)
        g.fillRect(20, 8, 4, 4)
        g.fillRect(10, 20, 12, 4)
        g.generateTexture('skeleton_placeholder', 32, 32)
        g.destroy()
      }
      enemyTexture = 'skeleton_placeholder'
    } else if (this.level.type === 'SlimeSplitting') {
      // Create a simple slime placeholder texture
      if (!this.textures.exists('slime_placeholder')) {
        const g = this.add.graphics()
        g.fillStyle(0x44aaaa)
        g.fillRoundedRect(0, 0, 32, 32, 8)
        g.fillStyle(0xffffff)
        g.fillCircle(10, 12, 4)
        g.fillCircle(22, 12, 4)
        g.fillStyle(0x000000)
        g.fillCircle(10, 12, 2)
        g.fillCircle(22, 12, 2)
        g.generateTexture('slime_placeholder', 32, 32)
        g.destroy()
      }
      enemyTexture = 'slime_placeholder'
    } else {
      // Generic monster placeholder
      if (!this.textures.exists('generic_monster')) {
        const g = this.add.graphics()
        g.fillStyle(0x884444)
        g.fillCircle(16, 16, 16)
        g.fillStyle(0xffffff)
        g.fillCircle(10, 10, 4)
        g.fillCircle(22, 10, 4)
        g.fillStyle(0x000000)
        g.fillCircle(10, 10, 2)
        g.fillCircle(22, 10, 2)
        g.generateTexture('generic_monster', 32, 32)
        g.destroy()
      }
      enemyTexture = 'generic_monster'
    }

    const enemyTargetX = width / 2 + 200
    let enemy: Phaser.GameObjects.Sprite | null = null

    if (enemyTexture) {
      enemy = this.add.sprite(width + 200, height * 0.85, enemyTexture).setOrigin(0.5, 1).setScale(3)
      if (enemyTexture === 'generic_boss') {
        enemy.setScale(2)
      } else if (enemyTexture.includes('placeholder') || enemyTexture === 'generic_monster') {
        enemy.setScale(2.5)
      }
    }

    // Sequence Dialogue Bubbles
    const prompt = this.add.text(width / 2, height * 0.95, 'Press SPACE or click to begin', {
      fontSize: '22px', color: '#aaaaaa'
    }).setOrigin(0.5)
    prompt.setAlpha(0)

    // Entrance Animations
    this.tweens.add({
      targets: avatar,
      x: avatarTargetX,
      duration: 600,
      ease: 'Back.easeOut',
      delay: 200
    })

    if (enemy) {
      this.tweens.add({
        targets: enemy,
        x: enemyTargetX,
        duration: 600,
        ease: 'Back.easeOut',
        delay: 400
      })
    }

    const drawBubble = (speaker: 'hero' | 'enemy', text: string, delay: number, onComplete?: () => void) => {
      const bubbleWidth = 340
      const bubbleHeight = 110
      const isHero = speaker === 'hero'

      const bubbleX = isHero ? (width / 2 - 200) : (width / 2 + 200)
      const bubbleY = height * 0.45

      const graphics = this.add.graphics({ x: bubbleX, y: bubbleY })
      graphics.fillStyle(0xffffff, 1)
      graphics.lineStyle(4, 0x000000, 1)
      graphics.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 16)
      graphics.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 16)

      // Draw tail pointing to the speaker
      if (isHero) {
        graphics.fillTriangle(-60, bubbleHeight / 2, -20, bubbleHeight / 2, -80, bubbleHeight / 2 + 40)
        graphics.strokeTriangle(-60, bubbleHeight / 2, -20, bubbleHeight / 2, -80, bubbleHeight / 2 + 40)
        graphics.lineStyle(4, 0xffffff, 1)
        graphics.beginPath()
        graphics.moveTo(-58, bubbleHeight / 2)
        graphics.lineTo(-22, bubbleHeight / 2)
        graphics.strokePath()
      } else {
        graphics.fillTriangle(20, bubbleHeight / 2, 60, bubbleHeight / 2, 80, bubbleHeight / 2 + 40)
        graphics.strokeTriangle(20, bubbleHeight / 2, 60, bubbleHeight / 2, 80, bubbleHeight / 2 + 40)
        graphics.lineStyle(4, 0xffffff, 1)
        graphics.beginPath()
        graphics.moveTo(22, bubbleHeight / 2)
        graphics.lineTo(58, bubbleHeight / 2)
        graphics.strokePath()
      }

      const bubbleText = this.add.text(bubbleX, bubbleY, text, {
        fontSize: '18px', color: '#000000', wordWrap: { width: bubbleWidth - 40 }, align: 'center', fontStyle: 'bold'
      }).setOrigin(0.5)

      graphics.setAlpha(0)
      graphics.setScale(0)
      bubbleText.setAlpha(0)
      bubbleText.setScale(0)

      this.tweens.add({
        targets: [graphics, bubbleText],
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 400,
        ease: 'Back.easeOut',
        delay: delay,
        onComplete: onComplete
      })

      return [graphics, bubbleText]
    }

    const dialogues = this.level.dialogue || (this.level.storyBeat ? [{speaker: 'enemy' as 'enemy', text: this.level.storyBeat}] : [])

    let currentDelay = 1000

    for (let i = 0; i < dialogues.length; i++) {
      const isLast = i === dialogues.length - 1

      drawBubble(dialogues[i].speaker as 'hero' | 'enemy', dialogues[i].text, currentDelay, isLast ? () => {
        // Show and pulse the prompt
        prompt.setAlpha(1)
        this.tweens.add({
          targets: prompt,
          alpha: 0.3,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })

        // Enable input only after all animations finish
        this.input.keyboard?.once('keydown-SPACE', this.enter, this)
        this.input.once('pointerdown', this.enter, this)
      } : undefined)
      currentDelay += 2000 // Wait 2 seconds between speech bubbles
    }
  }

  private enter() {
    this.scene.start('Level', { level: this.level, profileSlot: this.profileSlot })
  }
}
