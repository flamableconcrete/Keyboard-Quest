// src/scenes/LevelIntroScene.ts
import Phaser from 'phaser'
import { LevelConfig, LevelType, ProfileData } from '../types'
import { loadProfile } from '../utils/profile'
import { AvatarRenderer } from '../components/AvatarRenderer'
import { generateGoblinWhackerTextures } from '../art/goblinWhackerArt'
import { generateGenericBossTextures } from '../art/genericBossArt'
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
  WoodlandFestival:   '🌳 Woodland Festival',
  CrazedCook:         '🍳 Crazed Cook',
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
    if (this.registry.get('isMobile')) {
      this.scene.start('MobileLevelIntro', { level: this.level, profileSlot: this.profileSlot });
      return;
    }

    const { width, height } = this.scale

    // Back button
    const back = this.add.text(60, 40, '← BACK', {
      fontSize: '28px', color: '#ffffff', backgroundColor: '#4e4e6a', padding: { x: 20, y: 10 }
    }).setInteractive({ useHandCursor: true })
    back.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation()
      this.scene.start('OverlandMap', { profileSlot: this.profileSlot })
    })

    this.add.text(width / 2, height * 0.10, this.level.name, {
      fontSize: '64px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5)

    const subtitle = LEVEL_TYPE_LABELS[this.level.type] ?? this.level.type
    this.add.text(width / 2, height * 0.20, subtitle, {
      fontSize: '28px', color: '#aaddff', fontStyle: 'italic'
    }).setOrigin(0.5)

    const thresholds = getSpeedThresholds(this.level.world)
    const targetsText = `🎯 Target Speeds: ⭐⭐⭐ ${thresholds.star3} WPM | ⭐⭐⭐⭐ ${thresholds.star4} WPM | ⭐⭐⭐⭐⭐ ${thresholds.star5} WPM`
    this.add.text(width / 2, height * 0.28, targetsText, {
      fontSize: '18px', color: '#ffffaa', align: 'center'
    }).setOrigin(0.5)

    // Render Avatar
    if (this.profile.avatarConfig && !this.textures.exists(this.profile.avatarConfig.id)) {
      AvatarRenderer.generateOne(this, this.profile.avatarConfig, this.profile.equipment)
    }
    const avatarTexture = (this.profile.avatarConfig?.id && this.textures.exists(this.profile.avatarConfig.id))
      ? this.profile.avatarConfig.id
      : (this.profile.avatarChoice || 'avatar_0')

    const avatarTargetX = width * 0.18
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

    const enemyTargetX = width * 0.82
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
    const prompt = this.add.text(width / 2, height * 0.95, '', {
      fontSize: '22px', color: '#aaaaaa', backgroundColor: '#333333', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
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

    const dialogues = this.level.dialogue || (this.level.storyBeat ? [{speaker: 'enemy' as 'enemy', text: this.level.storyBeat}] : [])
    let currentDialogueIndex = 0
    let currentBubbleObjs: Phaser.GameObjects.GameObject[] = []
    let isAnimatingBubble = false

    const drawBubble = (speaker: 'hero' | 'enemy', text: string, delay: number, onComplete?: () => void) => {
      // Clean up previous bubble if exists
      currentBubbleObjs.forEach(obj => obj.destroy())
      currentBubbleObjs = []

      const bubbleWidth = 340
      const bubbleHeight = 110
      const isHero = speaker === 'hero'

      const bubbleX = isHero ? width * 0.28 : width * 0.72
      const bubbleY = height * 0.44

      const graphics = this.add.graphics({ x: bubbleX, y: bubbleY })
      graphics.fillStyle(0xffffff, 1)
      graphics.lineStyle(4, 0x000000, 1)
      graphics.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 16)
      graphics.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 16)

      // Draw tail pointing down-outward toward the speaker (who stands farther out than the bubble)
      graphics.fillStyle(0xffffff, 1)
      graphics.lineStyle(4, 0x000000, 1)
      if (isHero) {
        graphics.fillTriangle(-80, bubbleHeight / 2, -40, bubbleHeight / 2, -110, bubbleHeight / 2 + 50)
        graphics.strokeTriangle(-80, bubbleHeight / 2, -40, bubbleHeight / 2, -110, bubbleHeight / 2 + 50)
        graphics.lineStyle(4, 0xffffff, 1)
        graphics.beginPath()
        graphics.moveTo(-78, bubbleHeight / 2)
        graphics.lineTo(-42, bubbleHeight / 2)
        graphics.strokePath()
      } else {
        graphics.fillTriangle(40, bubbleHeight / 2, 80, bubbleHeight / 2, 110, bubbleHeight / 2 + 50)
        graphics.strokeTriangle(40, bubbleHeight / 2, 80, bubbleHeight / 2, 110, bubbleHeight / 2 + 50)
        graphics.lineStyle(4, 0xffffff, 1)
        graphics.beginPath()
        graphics.moveTo(42, bubbleHeight / 2)
        graphics.lineTo(78, bubbleHeight / 2)
        graphics.strokePath()
      }

      const resolvedText = text.replace(/\{name\}/g, this.profile.playerName)
      const bubbleText = this.add.text(bubbleX, bubbleY, resolvedText, {
        fontSize: '18px', color: '#000000', wordWrap: { width: bubbleWidth - 40 }, align: 'center', fontStyle: 'bold'
      }).setOrigin(0.5)

      graphics.setAlpha(0)
      graphics.setScale(0)
      bubbleText.setAlpha(0)
      bubbleText.setScale(0)

      currentBubbleObjs.push(graphics, bubbleText)
      isAnimatingBubble = true

      this.tweens.add({
        targets: [graphics, bubbleText],
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 400,
        ease: 'Back.easeOut',
        delay: delay,
        onComplete: () => {
          isAnimatingBubble = false
          if (onComplete) onComplete()
        }
      })
    }

    const showNextDialogue = () => {
      if (isAnimatingBubble) return // Ignore input if a bubble is currently animating

      if (currentDialogueIndex < dialogues.length) {
        const dialog = dialogues[currentDialogueIndex]
        const isLast = currentDialogueIndex === dialogues.length - 1

        prompt.setText(isLast ? 'Press SPACE or Click to Begin' : 'Press SPACE or Click to Continue')
        prompt.setAlpha(1)

        drawBubble(dialog.speaker as 'hero' | 'enemy', dialog.text, 0, () => {
          // ensure pulse is running if not already
          if (!this.tweens.getTweensOf(prompt).length) {
            this.tweens.add({
              targets: prompt,
              alpha: 0.6,
              duration: 800,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            })
          }
        })
        currentDialogueIndex++
      } else {
        this.enter()
      }
    }

    // Input handlers
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (currentDialogueIndex === 0) return // Space not allowed before first dialogue is ready
      showNextDialogue()
    })

    // Global pointer down for advancing dialogue or clicking the prompt
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      // If clicking the back button, let the back button handle it
      if (currentlyOver.includes(back)) return
      if (currentDialogueIndex === 0) return
      showNextDialogue()
    })

    // Start first dialogue after entrance animations
    this.time.delayedCall(1000, () => {
      if (dialogues.length > 0) {
        showNextDialogue()
      } else {
        // No dialogue, just show the begin prompt
        prompt.setText('Press SPACE or Click to Begin')
        prompt.setAlpha(1)
        this.tweens.add({
          targets: prompt,
          alpha: 0.6,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
        currentDialogueIndex = dialogues.length // set to end
        // Let player press space/click to enter
      }
    })
  }

  private enter() {
    this.scene.start('Level', { level: this.level, profileSlot: this.profileSlot })
  }
}
