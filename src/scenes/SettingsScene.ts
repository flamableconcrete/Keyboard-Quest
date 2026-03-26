// src/scenes/SettingsScene.ts
import Phaser from 'phaser'
import { loadProfile, saveProfile } from '../utils/profile'
import { ALL_LEVELS } from '../data/levels'
import { AudioHelper } from '../utils/AudioHelper'

export class SettingsScene extends Phaser.Scene {
  private profileSlot!: number
  private activeTab: 'Profile' | 'Gameplay' | 'Audio' | 'Debug' = 'Profile'

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
    const mobile = this.registry.get('isMobile')
    const profile = loadProfile(this.profileSlot)!

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    // Title
    this.add.text(width / 2, 60, 'SETTINGS', {
      fontSize: '40px', color: '#ffd700'
    }).setOrigin(0.5)

    // Back button
    const back = this.add.text(60, 40, '← BACK', {
      fontSize: mobile ? '18px' : '22px', color: '#aaaaff'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => {
      const target = this.registry.get('isMobile') ? 'MobileOverlandMap' : 'OverlandMap'
      this.scene.start(target, { profileSlot: this.profileSlot })
    })

    // Render Tabs
    const tabs = ['Profile', 'Gameplay', 'Audio', 'Debug'] as const
    const tabWidth = mobile ? 100 : 140
    const startX = width / 2 - (tabs.length * tabWidth) / 2 + tabWidth / 2

    tabs.forEach((tab, index) => {
      const isSelected = this.activeTab === tab
      const tabText = this.add.text(startX + index * tabWidth, 130, tab, {
        fontSize: '22px',
        color: isSelected ? '#ffffff' : '#888888',
        backgroundColor: isSelected ? '#444466' : '#222244',
        padding: { x: 12, y: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      
      tabText.on('pointerdown', () => {
        this.activeTab = tab
        this.renderSettings()
      })
    })

    // Render active section
    if (this.activeTab === 'Profile') {
      this.renderProfileSection(width, profile)
      this.renderFullscreenButton(width)
    } else if (this.activeTab === 'Gameplay') {
      this.renderGameplaySection(width, profile)
    } else if (this.activeTab === 'Audio') {
      this.renderAudioSection(width)
    } else if (this.activeTab === 'Debug') {
      this.renderDebugSection(width, profile)
    }
  }

  private renderFullscreenButton(width: number) {
    const isFS = this.scale.isFullscreen;
    const fsBtn = this.add.text(width / 2, 430, isFS ? '[ Exit Full Screen ]' : '[ Enter Full Screen ]', {
      fontSize: '20px',
      color: isFS ? '#ffaa00' : '#ffff00',
      backgroundColor: '#222244',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    fsBtn.on('pointerdown', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    })

    // Listen for scale events to update UI correctly without race conditions
    this.scale.on('enterfullscreen', () => {
      this.renderSettings()
    })
    this.scale.on('leavefullscreen', () => {
      this.renderSettings()
    })

    // Clean up event listeners when the scene stops so they don't leak
    this.events.once('shutdown', () => {
      this.scale.off('enterfullscreen')
      this.scale.off('leavefullscreen')
    })
  }

  private renderProfileSection(width: number, profile: any) {
    const avatarKey = this.textures.exists(profile.avatarChoice) ? profile.avatarChoice : 'avatar_0'
    this.add.image(width / 2, 250, avatarKey).setDisplaySize(48, 96)

    const changeAvatarBtn = this.add.text(width / 2, 330, '[ Change Avatar ]', {
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
  }

  private renderGameplaySection(width: number, profile: any) {
    // Game Mode label
    this.add.text(width / 2, 220, 'Game Mode', {
      fontSize: '26px', color: '#ffffff'
    }).setOrigin(0.5)

    // Regular button
    const regularBtn = this.add.text(width / 2 - 120, 270, '[ Regular ]', {
      fontSize: '24px',
      color: profile.gameMode === 'regular' ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Advanced button
    const advancedBtn = this.add.text(width / 2 + 120, 270, '[ Advanced ]', {
      fontSize: '24px',
      color: profile.gameMode === 'advanced' ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Description text
    const descText = this.add.text(width / 2, 320, this.getModeDescription(profile.gameMode), {
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
    this.add.text(width / 2, 400, 'Finger Hints', {
      fontSize: '26px', color: '#ffffff'
    }).setOrigin(0.5)

    // ON button
    const onBtn = this.add.text(width / 2 - 80, 450, '[ ON ]', {
      fontSize: '24px',
      color: profile.showFingerHints ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // OFF button
    const offBtn = this.add.text(width / 2 + 80, 450, '[ OFF ]', {
      fontSize: '24px',
      color: !profile.showFingerHints ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Finger hints description
    const hintsDesc = this.add.text(width / 2, 500, this.getHintsDescription(profile.showFingerHints), {
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
  }

  private renderAudioSection(width: number) {
    // Background Music label
    this.add.text(width / 2, 220, 'Background Music', {
      fontSize: '26px', color: '#ffffff'
    }).setOrigin(0.5)

    // ON button
    const musicOnBtn = this.add.text(width / 2 - 80, 270, '[ ON ]', {
      fontSize: '24px',
      color: AudioHelper.isMusicEnabled() ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // OFF button
    const musicOffBtn = this.add.text(width / 2 + 80, 270, '[ OFF ]', {
      fontSize: '24px',
      color: !AudioHelper.isMusicEnabled() ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    const setMusic = (on: boolean) => {
      AudioHelper.setMusicEnabled(on, this)
      musicOnBtn.setColor(on ? '#ffd700' : '#888888')
      musicOffBtn.setColor(!on ? '#ffd700' : '#888888')
    }

    musicOnBtn.on('pointerdown', () => setMusic(true))
    musicOffBtn.on('pointerdown', () => setMusic(false))
  }

  private renderDebugSection(width: number, profile: any) {
    const allLevelIds = ALL_LEVELS.map(l => l.id)
    const allUnlocked = allLevelIds.every(id => profile.unlockedLevelIds.includes(id))

    this.add.text(width / 2, 220, 'DEBUG', {
      fontSize: '12px', color: '#666666',
    }).setOrigin(0.5)

    const unlockBtn = this.add.text(width / 2, 260, allUnlocked ? '[ Lock Levels ]' : '[ Unlock All Levels ]', {
      fontSize: '20px',
      color: allUnlocked ? '#ff6666' : '#66ff66',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    const giveGoldBtn = this.add.text(width / 2, 310, '[ +1000 Gold ]', {
      fontSize: '20px',
      color: '#ffd700',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    giveGoldBtn.on('pointerdown', () => {
      const p = loadProfile(this.profileSlot)!
      p.gold += 1000
      saveProfile(this.profileSlot, p)
      
      const popText = this.add.text(width / 2 + 120, 310, '+1000!', { fontSize: '18px', color: '#ffff00', fontStyle: 'bold' }).setOrigin(0, 0.5)
      this.tweens.add({
        targets: popText,
        y: 260,
        alpha: 0,
        duration: 1000,
        onComplete: () => popText.destroy()
      })
    })

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

