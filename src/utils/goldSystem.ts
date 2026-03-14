import Phaser from 'phaser'

export interface GoldDrop {
  sprite: Phaser.GameObjects.Image
  amount: number
  active: boolean
}

export class GoldManager {
  private scene: Phaser.Scene
  private drops: GoldDrop[] = []
  public collectedGold: number = 0
  private petSprite: Phaser.GameObjects.Image | null = null
  private basePetX: number = 0
  private basePetY: number = 0
  private petSpeed: number = 100
  private returning: boolean = false
  private currentTarget: GoldDrop | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  public registerPet(petSprite: Phaser.GameObjects.Image, speed: number, baseX: number, baseY: number) {

    this.petSprite = petSprite
    this.basePetX = baseX
    this.basePetY = baseY
    this.petSpeed = speed
  }

  public spawnGold(x: number, y: number, amount: number) {
    if (!this.scene.textures.exists('gold_coin_drop')) {
      const g = this.scene.add.graphics()
      g.fillStyle(0xffcc00)
      g.fillCircle(8, 8, 8)
      g.fillStyle(0xeebb00)
      g.fillCircle(8, 8, 6)
      g.generateTexture('gold_coin_drop', 16, 16)
      g.destroy()
    }

    const sprite = this.scene.add.image(x, y, 'gold_coin_drop').setDepth(10)

    // Add a little pop animation
    this.scene.tweens.add({
      targets: sprite,
      y: y - 10,
      duration: 200,
      yoyo: true,
      ease: 'Quad.easeOut'
    })

    this.drops.push({ sprite, amount, active: true });
  }

  public update(delta: number) {

    if (!this.petSprite) return;

    const activeDrops = this.drops.filter(d => d.active)

    if (activeDrops.length > 0 && !this.currentTarget) {
      // Find closest drop
      this.currentTarget = activeDrops.reduce((prev, curr) => {
        const d1 = Phaser.Math.Distance.Between(this.petSprite!.x, this.petSprite!.y, prev.sprite.x, prev.sprite.y)
        const d2 = Phaser.Math.Distance.Between(this.petSprite!.x, this.petSprite!.y, curr.sprite.x, curr.sprite.y)
        return d1 < d2 ? prev : curr
      })
      this.returning = false
    }

    if (this.currentTarget) {
      if (!this.currentTarget.active) {
        this.currentTarget = null
        return
      }

      const tx = this.currentTarget.sprite.x
      const ty = this.currentTarget.sprite.y
      const dist = Phaser.Math.Distance.Between(this.petSprite.x, this.petSprite.y, tx, ty)

      if (dist < 20) {
        this.collectDrop(this.currentTarget)
        this.currentTarget = null
        this.returning = activeDrops.length <= 1 // If this was the last drop, return
      } else {
        const moveSpeed = (this.petSpeed * delta) / 1000
        const angle = Phaser.Math.Angle.Between(this.petSprite.x, this.petSprite.y, tx, ty)
        this.petSprite.x += Math.cos(angle) * moveSpeed
        this.petSprite.y += Math.sin(angle) * moveSpeed
        this.petSprite.flipX = tx < this.petSprite.x
      }
    } else if (this.returning || activeDrops.length === 0) {
      const dist = Phaser.Math.Distance.Between(this.petSprite.x, this.petSprite.y, this.basePetX, this.basePetY)
      if (dist > 5) {
        const moveSpeed = (this.petSpeed * delta) / 1000
        const angle = Phaser.Math.Angle.Between(this.petSprite.x, this.petSprite.y, this.basePetX, this.basePetY)
        this.petSprite.x += Math.cos(angle) * moveSpeed
        this.petSprite.y += Math.sin(angle) * moveSpeed
        this.petSprite.flipX = this.basePetX < this.petSprite.x
      } else {
        this.petSprite.x = this.basePetX
        this.petSprite.y = this.basePetY
        this.petSprite.flipX = false
        this.returning = false
      }
    }
  }

  private collectDrop(drop: GoldDrop) {
    drop.active = false
    this.collectedGold += drop.amount

    if (drop.sprite && drop.sprite.active) {
        const text = this.scene.add.text(drop.sprite.x, drop.sprite.y - 15, `+${drop.amount}`, {
          fontSize: '16px', color: '#ffdd00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(15)

        this.scene.tweens.add({
          targets: drop.sprite,
          alpha: 0,
          y: drop.sprite.y - 10,
          scale: 1.5,
          duration: 300,
          onComplete: () => {
            if (drop.sprite && drop.sprite.active) drop.sprite.destroy()
          }
        })

        this.scene.tweens.add({
          targets: text,
          y: text.y - 40,
          alpha: 0,
          duration: 1200,
          onComplete: () => {
            if (text && text.active) text.destroy()
          }
        })
    }
  }

  public getCollectedGold() {
    return this.collectedGold;
  }

  public destroy() {
    this.drops.forEach(d => {
      if (d.sprite && d.sprite.active) d.sprite.destroy()
    })
    this.drops = []
  }
}
