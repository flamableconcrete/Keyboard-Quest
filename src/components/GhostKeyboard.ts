import Phaser from 'phaser'

export class GhostKeyboard {
  private keys: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private labels: Map<string, Phaser.GameObjects.Text> = new Map()

  constructor(private scene: Phaser.Scene, private y: number) {
    this.buildLayout()
  }

  highlight(ch: string) {
    this.keys.forEach((rect, key) => {
      rect.setFillStyle(key === ch ? 0xffd700 : 0x333355)
    })
  }

  fadeOut() {
    this.scene.tweens.add({
      targets: [...this.keys.values(), ...this.labels.values()],
      alpha: 0, duration: 1000
    })
  }

  private buildLayout() {
    const rows = [
      ['q','w','e','r','t','y','u','i','o','p'],
      ['a','s','d','f','g','h','j','k','l',';'],
      ['z','x','c','v','b','n','m',',','.','/'],
    ]
    const { width } = this.scene.scale
    rows.forEach((row, rowIdx) => {
      row.forEach((key, colIdx) => {
        const x = width * 0.1 + colIdx * 36 + rowIdx * 18
        const y = this.y + rowIdx * 38
        const rect = this.scene.add.rectangle(x, y, 30, 30, 0x333355).setAlpha(0.7)
        const label = this.scene.add.text(x, y, key, {
          fontSize: '14px', color: '#aaaaaa'
        }).setOrigin(0.5).setAlpha(0.7)
        this.keys.set(key, rect)
        this.labels.set(key, label)
      })
    })
  }
}
