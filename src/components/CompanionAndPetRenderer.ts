import Phaser from 'phaser'
import { loadProfile } from '../utils/profile'
import { generateAllCompanionTextures } from '../art/companionsArt'

export class CompanionAndPetRenderer {
  private scene: Phaser.Scene
  private companionSprite: Phaser.GameObjects.Image | null = null
  private petSprite: Phaser.GameObjects.Image | null = null
  private startCompX = 0
  private startCompY = 0
  private startPetX = 0
  private startPetY = 0

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    profileSlot: number,
    side: 'left' | 'right' = 'right'
  ) {
    this.scene = scene
    const profile = loadProfile(profileSlot)

    const graphics = scene.add.graphics()
    graphics.fillStyle(0x000000, 0.3)

    // Hero is at (x, y).
    // 'right': pet one slot right, companion two slots right (default — combat levels).
    // 'left':  pet one slot left, companion two slots left (trap levels — party follows behind).
    const sign = side === 'left' ? -1 : 1
    const petX = x + sign * 70
    const petY = y
    // Left side: 140px gap (tighter follow for dungeon traversal); right: 145px for combat spacing
    const companionX = x + sign * (side === 'left' ? 140 : 145)
    const companionY = y

    this.startPetX = petX
    this.startPetY = petY
    this.startCompX = companionX
    this.startCompY = companionY

    // Shadow ellipses beneath each slot (positions follow petX/companionX)
    graphics.fillEllipse(petX, petY + 28, 50, 16)
    graphics.fillEllipse(companionX, companionY + 28, 60, 18)

    generateAllCompanionTextures(scene)

    if (profile?.activeCompanionId) {
      this.companionSprite = scene.add.image(companionX, companionY, profile.activeCompanionId).setScale(1.5).setDepth(3)
    }

    if (profile?.activePetId) {
      this.petSprite = scene.add.image(petX, petY, profile.activePetId).setScale(1.2).setDepth(5)
    }

    this.scene.events.on('word_completed_attack', this.playAttackAnimation, this)
    this.scene.events.on('trap_cleared', this.playJumpAnimation, this)
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this)
  }

  private playAttackAnimation() {
    if (this.companionSprite) {
      this.scene.tweens.add({
        targets: this.companionSprite,
        x: this.startCompX + 40,
        yoyo: true,
        duration: 150,
        delay: 60,
        ease: 'Quad.easeOut'
      })
    }
  }

  private playJumpAnimation() {
    if (this.companionSprite) {
      this.scene.tweens.add({
        targets: this.companionSprite,
        y: this.startCompY - 30,
        yoyo: true,
        duration: 200,
        ease: 'Sine.easeOut'
      })
    }
    if (this.petSprite) {
      this.scene.tweens.add({
        targets: this.petSprite,
        y: this.startPetY - 30,
        yoyo: true,
        duration: 200,
        delay: 60,
        ease: 'Sine.easeOut'
      })
    }
  }

  public getPetSprite() { return this.petSprite }
  public getStartPetX() { return this.startPetX }
  public getStartPetY() { return this.petSprite ? this.petSprite.y : 0 }

  public destroy() {
    this.scene.events.off('word_completed_attack', this.playAttackAnimation, this)
    this.scene.events.off('trap_cleared', this.playJumpAnimation, this)
  }
}
