// src/scenes/SettingsScene.ts
import Phaser from 'phaser'
import { loadProfile, saveProfile } from '../utils/profile'
import { ALL_LEVELS } from '../data/levels'

export class SettingsScene extends Phaser.Scene {
  private profileSlot!: number

  constructor() { super('Settings') }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
  }

  create() {
    this.renderSettings()
  }

  private renderSettings() {
    this.children.removeAll(true)
    const { width, height } = this.scale
    const profile = loadProfile(this.profileSlot)!

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    // Title
    this.add.text(width / 2, 60, 'SETTINGS', {
      fontSize: '40px', color: '#ffd700'
    }).setOrigin(0.5)

    // Avatar Section
    const avatarKey = this.textures.exists(profile.avatarChoice) ? profile.avatarChoice : 'avatar_0'
    this.add.image(width / 2, 130, avatarKey).setDisplaySize(48, 96)

    const changeAvatarBtn = this.add.text(width / 2, 180, '[ Change Avatar ]', {
      fontSize: '20px',
      color: '#88cc88',
      backgroundColor: '#222244',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    changeAvatarBtn.on('pointerdown', () => {
      this.scene.start('AvatarCustomizer', {
        slot: this.profileSlot,
        playerName: profile.playerName,
        isEditingExisting: true,
        returnTo: 'Settings'
      })
    })

    // Game Mode label
    this.add.text(width / 2, 240, 'Game Mode', {
      fontSize: '26px', color: '#ffffff'
    }).setOrigin(0.5)

    // Regular button
    const regularBtn = this.add.text(width / 2 - 120, 290, '[ Regular ]', {
      fontSize: '24px',
      color: profile.gameMode === 'regular' ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Advanced button
    const advancedBtn = this.add.text(width / 2 + 120, 290, '[ Advanced ]', {
      fontSize: '24px',
      color: profile.gameMode === 'advanced' ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Description text
    const descText = this.add.text(width / 2, 350, this.getModeDescription(profile.gameMode), {
      fontSize: '18px', color: '#aaaaaa', wordWrap: { width: 700 }, align: 'center',
    }).setOrigin(0.5)

    const setMode = (mode: 'regular' | 'advanced') => {
      const p = loadProfile(this.profileSlot)!
      p.gameMode = mode
      saveProfile(this.profileSlot, p)
      regularBtn.setColor(mode === 'regular' ? '#ffd700' : '#888888')
      advancedBtn.setColor(mode === 'advanced' ? '#ffd700' : '#888888')
      descText.setText(this.getModeDescription(mode))
    }

    regularBtn.on('pointerdown', () => setMode('regular'))
    advancedBtn.on('pointerdown', () => setMode('advanced'))

    // Finger Hints label
    this.add.text(width / 2, 420, 'Finger Hints', {
      fontSize: '26px', color: '#ffffff'
    }).setOrigin(0.5)

    // ON button
    const onBtn = this.add.text(width / 2 - 80, 480, '[ ON ]', {
      fontSize: '24px',
      color: profile.showFingerHints ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // OFF button
    const offBtn = this.add.text(width / 2 + 80, 480, '[ OFF ]', {
      fontSize: '24px',
      color: !profile.showFingerHints ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Finger hints description
    const hintsDesc = this.add.text(width / 2, 540, this.getHintsDescription(profile.showFingerHints), {
      fontSize: '18px', color: '#aaaaaa', wordWrap: { width: 700 }, align: 'center',
    }).setOrigin(0.5)

    const setHints = (on: boolean) => {
      const p = loadProfile(this.profileSlot)!
      p.showFingerHints = on
      saveProfile(this.profileSlot, p)
      onBtn.setColor(on ? '#ffd700' : '#888888')
      offBtn.setColor(!on ? '#ffd700' : '#888888')
      hintsDesc.setText(this.getHintsDescription(on))
    }

    onBtn.on('pointerdown', () => setHints(true))
    offBtn.on('pointerdown', () => setHints(false))

    // Debug: Unlock All Levels toggle
    const allLevelIds = ALL_LEVELS.map(l => l.id)
    const allUnlocked = allLevelIds.every(id => profile.unlockedLevelIds.includes(id))

    const unlockBtn = this.add.text(width / 2, 610, allUnlocked ? '[ Lock Levels ]' : '[ Unlock All Levels ]', {
      fontSize: '20px',
      color: allUnlocked ? '#ff6666' : '#66ff66',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    this.add.text(width / 2, 648, 'DEBUG', {
      fontSize: '12px', color: '#666666',
    }).setOrigin(0.5)

    unlockBtn.on('pointerdown', () => {
      const p = loadProfile(this.profileSlot)!
      const debugIds = p.debugUnlockedLevelIds ?? []
      if (allUnlocked) {
        // Remove only debug-added entries, keep legitimately earned ones
        p.unlockedLevelIds = p.unlockedLevelIds.filter(id => !debugIds.includes(id))
        for (const id of debugIds) {
          delete p.levelResults[id]
        }
        p.debugUnlockedLevelIds = undefined
      } else {
        // Track which levels and results we're adding for debug
        const newDebugIds: string[] = []
        for (const level of ALL_LEVELS) {
          if (!p.unlockedLevelIds.includes(level.id)) {
            p.unlockedLevelIds.push(level.id)
            newDebugIds.push(level.id)
          }
          if (!p.levelResults[level.id]) {
            p.levelResults[level.id] = {
              accuracyStars: 5,
              speedStars: 5,
              completedAt: Date.now(),
            }
            if (!newDebugIds.includes(level.id)) {
              newDebugIds.push(level.id)
            }
          }
        }
        p.debugUnlockedLevelIds = newDebugIds
      }
      saveProfile(this.profileSlot, p)
      this.renderSettings()
    })

    // Back button
    const back = this.add.text(60, 40, '← BACK', {
      fontSize: '22px', color: '#aaaaff'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => {
      this.scene.start('OverlandMap', { profileSlot: this.profileSlot })
    })
  }

  private getModeDescription(mode: 'regular' | 'advanced'): string {
    if (mode === 'regular') {
      return 'Regular: Enemies queue up and wait. Only the lead enemy can be defeated. No damage taken.'
    }
    return 'Advanced: Enemies march in real-time. Type fast or take damage!'
  }

  private getHintsDescription(on: boolean): string {
    if (on) {
      return 'Show which finger to use and the next letter to type during levels.'
    }
    return 'Finger hints are hidden. For experienced typists.'
  }
}
