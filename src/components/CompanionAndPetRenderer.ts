import Phaser from 'phaser'
import { loadProfile } from '../utils/profile'
import { generateAllCompanionTextures } from '../art/companionsArt'

export class CompanionAndPetRenderer {
  private scene: Phaser.Scene
  private companionSprite: Phaser.GameObjects.Image | null = null
  private petSprite: Phaser.GameObjects.Image | null = null
  private startCompX = 0
  private startPetX = 0

  constructor(scene: Phaser.Scene, x: number, y: number, profileSlot: number) {
    this.scene = scene
    const profile = loadProfile(profileSlot)
    
    const graphics = scene.add.graphics()
    graphics.fillStyle(0x000000, 0.3)
    
    // Hero is at (x, y).
    // Pet sits one slot to the right; companion sits two slots to the right.
    // 70px spacing keeps all three clearly separated.
    const petX = x + 70
    const petY = y
    
    const companionX = x + 145
    const companionY = y
    
    this.startPetX = petX
    this.startCompX = companionX

    // Shadow ellipses beneath each slot
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
  
  public getPetSprite() { return this.petSprite }
  public getStartPetX() { return this.startPetX }
  public getStartPetY() { return this.petSprite ? this.petSprite.y : 0 }

  public destroy() {
    this.scene.events.off('word_completed_attack', this.playAttackAnimation, this)
  }
}
