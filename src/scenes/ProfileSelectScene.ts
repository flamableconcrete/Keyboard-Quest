// src/scenes/ProfileSelectScene.ts
import Phaser from 'phaser'
import { getAllProfiles, loadProfile, saveProfile, deleteProfile, exportProfile, importProfile } from '../utils/profile'
import { ProfileData } from '../types'
import { AvatarRenderer } from '../components/AvatarRenderer'
import { AudioHelper } from '../utils/AudioHelper'

const MONO_FONT = '"Courier New", Courier, monospace'

export class ProfileSelectScene extends Phaser.Scene {
  private typingBuffer = ''
  private profiles: (ProfileData | null)[] = []

  constructor() { super('ProfileSelect') }

  create() {
    this.profiles = getAllProfiles()
    this.typingBuffer = ''
    this.render()
  }

  private drawPixelPanel(x: number, y: number, w: number, h: number, fillColor: number, borderColor: number): Phaser.GameObjects.Graphics {
    const gfx = this.add.graphics()
    const border = 3
    // Outer border
    gfx.fillStyle(borderColor)
    gfx.fillRect(x - w / 2, y - h / 2, w, h)
    // Inner fill
    gfx.fillStyle(fillColor)
    gfx.fillRect(x - w / 2 + border, y - h / 2 + border, w - border * 2, h - border * 2)
    // Corner notches (pixel-art style - cut corners with background color)
    gfx.fillStyle(0x1a1a2e)
    gfx.fillRect(x - w / 2, y - h / 2, border, border)
    gfx.fillRect(x + w / 2 - border, y - h / 2, border, border)
    gfx.fillRect(x - w / 2, y + h / 2 - border, border, border)
    gfx.fillRect(x + w / 2 - border, y + h / 2 - border, border, border)
    return gfx
  }

  private render() {
    this.children.removeAll(true)
    const { width } = this.scale
    const mobile = this.registry.get('isMobile')

    const musicBtn = this.add.text(width - 20, 20, AudioHelper.isMusicEnabled() ? '🎵 Music: ON' : '🎵 Music: OFF', {
      fontSize: '20px', color: '#aaaaaa', fontFamily: MONO_FONT
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
    musicBtn.on('pointerdown', () => {
       const enabled = !AudioHelper.isMusicEnabled();
       AudioHelper.setMusicEnabled(enabled, this);
       musicBtn.setText(enabled ? '🎵 Music: ON' : '🎵 Music: OFF');
    })

    const title = this.add.text(width / 2, 50, 'Choose Your Hero', {
      fontSize: mobile ? '28px' : '40px', color: '#ffd700', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title,
      alpha: 0.7,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })

    const slotY = mobile ? [140, 280, 420, 560] : [180, 340, 500, 660]
    this.profiles.forEach((profile, i) => {
      const y = slotY[i] ?? 180 + i * 140
      if (profile) {
        this.renderFilledSlot(profile, i, y)
      } else {
        this.renderEmptySlot(i, y)
      }
    })

    // Back button
    const back = this.add.text(60, 40, '← BACK', {
      fontSize: '28px', color: '#ffffff', backgroundColor: '#4e4e6a', padding: { x: 20, y: 10 }, fontFamily: MONO_FONT
    }).setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => this.scene.start('MainMenu'))
  }

  private renderFilledSlot(profile: ProfileData, slot: number, y: number) {
    const { width } = this.scale
    const mobile = this.registry.get('isMobile')
    const panelW = mobile ? 500 : 700
    const panelH = mobile ? 80 : 100

    this.drawPixelPanel(width / 2, y, panelW, panelH, 0x2a2a4a, 0x5555aa)

    // Interactive hit area over the panel
    const box = this.add.rectangle(width / 2, y, panelW, panelH, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
    box.on('pointerup', () => this.startGame(slot, profile))

    // Avatar
    const avatarX = width / 2 - panelW / 2 + 50

    // Ensure custom avatar is generated if it exists
    if (profile.avatarConfig && profile.avatarConfig.id) {
      if (!this.textures.exists(profile.avatarConfig.id)) {
        AvatarRenderer.generateOne(this, profile.avatarConfig, profile.equipment);
      }
      const avatarKey = profile.avatarConfig.id;
      this.add.image(avatarX, y, avatarKey).setDisplaySize(mobile ? 28 : 36, mobile ? 56 : 72);
    } else {
      const avatarKey = this.textures.exists(profile.avatarChoice) ? profile.avatarChoice : 'avatar_0'
      this.add.image(avatarX, y, avatarKey).setDisplaySize(mobile ? 28 : 36, mobile ? 56 : 72)
    }

    // Player name
    const textStartX = avatarX + 45
    this.add.text(textStartX, y - 30, profile.playerName, {
      fontSize: mobile ? '18px' : '24px', color: '#ffffff', fontFamily: MONO_FONT
    })

    // Stats line
    this.add.text(textStartX, y - 2, `Lv.${profile.characterLevel} — World ${profile.currentWorld}`, {
      fontSize: mobile ? '13px' : '16px', color: '#aaaaaa', fontFamily: MONO_FONT
    })

    // Star count
    let totalStars = 0
    if (profile.levelResults) {
      for (const key of Object.keys(profile.levelResults)) {
        const result = profile.levelResults[key]
        if (result) {
          totalStars += (result.accuracyStars ?? 0) + (result.speedStars ?? 0)
        }
      }
    }
    this.add.text(textStartX, y + 20, `★ ${totalStars}`, {
      fontSize: mobile ? '13px' : '16px', color: '#ffd700', fontFamily: MONO_FONT
    })

    // Active companion
    if (profile.activeCompanionId && profile.companions) {
      const companion = profile.companions.find(c => c.id === profile.activeCompanionId)
      if (companion) {
        this.add.text(textStartX + 80, y + 20, companion.name, {
          fontSize: '14px', color: '#88aacc', fontFamily: MONO_FONT
        })
      }
    }

    // Export button
    const exp = this.add.text(width / 2 + 200, y - 15, '[Export]', {
      fontSize: mobile ? '13px' : '16px', color: '#88cc88', fontFamily: MONO_FONT
    }).setInteractive({ useHandCursor: true })
    exp.on('pointerover', () => exp.setColor('#aaffaa'))
    exp.on('pointerout', () => exp.setColor('#88cc88'))
    exp.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation()
      this.handleExport(profile)
    })


    // Edit Hero button
    const editY = y + 10;
    const edit = this.add.text(width / 2 + 100, editY, '[Edit Hero]', {
      fontSize: mobile ? '13px' : '16px', color: '#ccaa88', fontFamily: MONO_FONT
    }).setInteractive({ useHandCursor: true })
    edit.on('pointerover', () => edit.setColor('#ffeecc'))
    edit.on('pointerout', () => edit.setColor('#ccaa88'))
    edit.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation()
      this.scene.start('AvatarCustomizer', { slot, playerName: profile.playerName, isEditingExisting: true })
    })

    // Delete button
    const del = this.add.text(width / 2 + 200, y + 10, '[Delete]', {
      fontSize: mobile ? '13px' : '16px', color: '#cc6666', fontFamily: MONO_FONT
    }).setInteractive({ useHandCursor: true })
    del.on('pointerover', () => del.setColor('#ff8888'))
    del.on('pointerout', () => del.setColor('#cc6666'))
    del.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation()
      deleteProfile(slot)
      this.profiles[slot] = null
      this.render()
    })
  }

  private renderEmptySlot(slot: number, y: number) {
    const { width } = this.scale
    const mobile = this.registry.get('isMobile')
    const panelW = mobile ? 500 : 700
    const panelH = mobile ? 80 : 100

    this.drawPixelPanel(width / 2, y, panelW, panelH, 0x1a1a2e, 0x333366)

    const box = this.add.rectangle(width / 2, y, panelW, panelH, 0x000000, 0)
      .setInteractive({ useHandCursor: true })

    const newHeroText = this.add.text(width / 2, y, '+ New Hero', {
      fontSize: '22px', color: '#8888cc', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    this.tweens.add({
      targets: newHeroText,
      alpha: 0.4,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })

    // Import button
    const imp = this.add.text(width / 2 + 250, y, '[Import]', {
      fontSize: mobile ? '13px' : '16px', color: '#88cc88', fontFamily: MONO_FONT
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    imp.on('pointerover', () => imp.setColor('#aaffaa'))
    imp.on('pointerout', () => imp.setColor('#88cc88'))

    box.on('pointerup', () => {
      this.startNaming(slot)
    })
    imp.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation()
      this.handleImport(slot)
    })
  }

  private startNaming(slot: number) {
    this.typingBuffer = ''
    this.input.keyboard?.removeAllListeners()
    this.children.removeAll(true)
    const { width, height } = this.scale
    const mobile = this.registry.get('isMobile')

    this.add.text(width / 2, height * 0.35, "Type your hero's name:", {
      fontSize: mobile ? '24px' : '32px', color: '#ffd700', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    const musicBtn = this.add.text(width - 20, 20, AudioHelper.isMusicEnabled() ? '🎵 Music: ON' : '🎵 Music: OFF', {
      fontSize: '20px', color: '#aaaaaa', fontFamily: MONO_FONT
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
    musicBtn.on('pointerdown', () => {
       const enabled = !AudioHelper.isMusicEnabled();
       AudioHelper.setMusicEnabled(enabled, this);
       musicBtn.setText(enabled ? '🎵 Music: ON' : '🎵 Music: OFF');
    })

    // Pixel panel background for the input area
    this.drawPixelPanel(width / 2, height * 0.5, 500, 80, 0x2a2a4a, 0x5555aa)

    const nameDisplay = this.add.text(width / 2, height * 0.5, '_', {
      fontSize: '48px', color: '#ffffff', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    const hintText = this.add.text(width / 2, height * 0.65, 'Press ENTER to confirm', {
      fontSize: '20px', color: '#888888', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    // Pulse the input field if the user clicks without typing a name
    const pulseInput = () => {
      if (this.typingBuffer.length === 0) {
        this.tweens.add({
          targets: nameDisplay,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 80,
          ease: 'Quad.easeOut',
          yoyo: true,
          repeat: 2,
        })
        hintText.setColor('#ff8888')
        this.tweens.add({
          targets: hintText,
          alpha: 0.4,
          duration: 300,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: 1,
          onComplete: () => hintText.setColor('#888888'),
        })
      }
    }

    this.input.on('pointerdown', pulseInput)

    if (mobile) {
      const canvas = this.game.canvas;
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width / this.scale.width;
      const scaleY = rect.height / this.scale.height;

      const htmlInput = document.createElement('input');
      htmlInput.type = 'text';
      htmlInput.maxLength = 16;
      htmlInput.style.position = 'absolute';
      htmlInput.style.left = `${rect.left + (this.scale.width / 2 - 100) * scaleX}px`;
      htmlInput.style.top = `${rect.top + (this.scale.height * 0.5) * scaleY}px`;
      htmlInput.style.width = `${200 * scaleX}px`;
      htmlInput.style.height = `${40 * scaleY}px`;
      htmlInput.style.opacity = '0';
      htmlInput.style.zIndex = '1000';
      htmlInput.autocomplete = 'off';
      htmlInput.autocapitalize = 'off';
      document.body.appendChild(htmlInput);

      setTimeout(() => htmlInput.focus(), 100);

      htmlInput.addEventListener('input', () => {
        const val = htmlInput.value.slice(0, 16);
        this.typingBuffer = val;
        nameDisplay.setText(val + '_');
      });

      htmlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const finalName = htmlInput.value.trim();
          if (finalName.length > 0) {
            htmlInput.remove();
            this.input.off('pointerdown', pulseInput);
            this.showAvatarGallery(slot, finalName);
          }
        }
      });

      this.events.on('shutdown', () => {
        if (htmlInput.parentElement) htmlInput.remove();
      });
    } else {
      this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter' && this.typingBuffer.length > 0) {
          this.input.keyboard?.removeAllListeners()
          this.input.off('pointerdown', pulseInput)
          this.showAvatarGallery(slot, this.typingBuffer)
        } else if (event.key === 'Backspace') {
          this.typingBuffer = this.typingBuffer.slice(0, -1)
        } else if (event.key.length === 1 && this.typingBuffer.length < 16) {
          this.typingBuffer += event.key
        }
        nameDisplay.setText(this.typingBuffer + '_')
      })
    }
  }


  private showAvatarGallery(slot: number, playerName: string, ) {
    this.children.removeAll(true)

    // We'll replace this with an AvatarCustomizer in a dedicated scene
    // For now, let's start the AvatarCustomizerScene
    this.scene.start('AvatarCustomizer', { slot, playerName })
  }


  private startGame(slot: number, profile: ProfileData) {
    // Guard against navigating with a deleted/missing profile
    if (!loadProfile(slot)) return
    // Store active profile slot in registry for other scenes
    this.registry.set('profileSlot', slot)
    this.registry.set('profile', profile)
    this.scene.start('OverlandMap', { profileSlot: slot })
  }

  private handleExport(profile: ProfileData) {
    const json = exportProfile(profile)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kq_save_${profile.playerName}.kq`
    a.click()
    URL.revokeObjectURL(url)
  }

  private handleImport(slot: number) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.kq'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const profile = importProfile(reader.result as string)
        if (profile) {
          saveProfile(slot, profile)
          this.profiles[slot] = profile
          this.render()
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }
}
