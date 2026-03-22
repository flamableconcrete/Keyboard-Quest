import Phaser from 'phaser'
import { TYPING_HANDS_DEPTH } from '../constants'

type Finger = 'lp' | 'lr' | 'lm' | 'li' | 'lt' | 'rt' | 'ri' | 'rm' | 'rr' | 'rp'

const CHAR_FINGER: Record<string, Finger> = {
  q: 'lp', a: 'lp', z: 'lp',
  w: 'lr', s: 'lr', x: 'lr',
  e: 'lm', d: 'lm', c: 'lm',
  r: 'li', f: 'li', v: 'li', t: 'li', g: 'li', b: 'li',
  ' ': 'lt',
  y: 'ri', h: 'ri', n: 'ri', u: 'ri', j: 'ri', m: 'ri',
  i: 'rm', k: 'rm', ',': 'rm',
  o: 'rr', l: 'rr', '.': 'rr',
  p: 'rp', ';': 'rp', '/': 'rp',
}

export class TypingHands {
  private scene: Phaser.Scene
  private fingerOverlays: Map<Finger, Phaser.GameObjects.Graphics[]> = new Map()
  private currentFinger: Finger | null = null
  private pulseTween?: Phaser.Tweens.Tween
  private allObjects: (Phaser.GameObjects.Graphics | Phaser.GameObjects.Text)[] = []

  constructor(scene: Phaser.Scene, cx: number, cy: number) {
    this.scene = scene
    this.buildHands(cx, cy)
    // Elevate above HUD background panels (depth 50)
    this.allObjects.forEach(obj => obj.setDepth(TYPING_HANDS_DEPTH))
  }

  highlightFinger(ch: string) {
    const finger = CHAR_FINGER[ch.toLowerCase()] ?? null

    if (finger === this.currentFinger) return
    this.currentFinger = finger
    this.pulseTween?.stop()

    // Reset all finger overlays to invisible
    this.fingerOverlays.forEach((graphics) => {
      graphics.forEach(g => { g.setAlpha(0) })
    })

    // Highlight active finger overlay
    if (finger) {
      const active = this.fingerOverlays.get(finger)
      if (active) {
        active.forEach(g => { g.setAlpha(1.0) })
        this.pulseTween = this.scene.tweens.add({
          targets: active,
          alpha: { from: 1.0, to: 0.4 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      }
    }
  }

  destroy() {
    this.pulseTween?.stop()
    this.allObjects.forEach(obj => obj.destroy())
  }

  fadeOut() {
    this.pulseTween?.stop()
    this.scene.tweens.add({
      targets: this.allObjects,
      alpha: 0,
      duration: 800,
    })
  }

  private buildHands(cx: number, cy: number) {
    const leftFingerHeights = [50, 65, 75, 65, 20] // pinky, ring, middle, index, thumb
    const rightFingerHeights = [20, 65, 75, 65, 50] // thumb, index, middle, ring, pinky
    const fw = 28
    const gap = 5
    const handWidth = 5 * fw + 4 * gap
    const handGap = 200

    const leftFingers: Finger[] = ['lp', 'lr', 'lm', 'li', 'lt']
    const rightFingers: Finger[] = ['rt', 'ri', 'rm', 'rr', 'rp']

    // Finger bottoms align with the top of the palm (cy + 30)
    const fingerBaseY = cy + 30

    // Left hand
    const leftStartX = cx - handGap / 2 - handWidth
    leftFingers.forEach((finger, i) => {
      const x = leftStartX + i * (fw + gap)
      const h = leftFingerHeights[i]
      const y = fingerBaseY - h
      this.drawFinger(x, y, fw, h, finger)
    })

    // Right hand
    const rightStartX = cx + handGap / 2
    rightFingers.forEach((finger, i) => {
      const x = rightStartX + i * (fw + gap)
      const h = rightFingerHeights[i]
      const y = fingerBaseY - h
      this.drawFinger(x, y, fw, h, finger)
    })

    // Palm areas
    this.drawPalm(leftStartX, cy + 30, handWidth, 30, 0x2a3a52)
    this.drawPalm(rightStartX, cy + 30, handWidth, 30, 0x2a3a52)
  }

  private drawFinger(x: number, y: number, w: number, h: number, finger: Finger) {
    // Base finger (dark, always visible)
    const base = this.scene.add.graphics()
    base.fillStyle(0x5a6e9a)
    base.fillRoundedRect(x, y, w, h, { tl: w / 2, tr: w / 2, bl: 4, br: 4 })
    this.allObjects.push(base)

    // Gold overlay (hidden by default, shown when highlighted)
    const overlay = this.scene.add.graphics()
    overlay.fillStyle(0xffd700)
    overlay.fillRoundedRect(x, y, w, h, { tl: w / 2, tr: w / 2, bl: 4, br: 4 })
    overlay.setAlpha(0)
    this.allObjects.push(overlay)

    if (!this.fingerOverlays.has(finger)) this.fingerOverlays.set(finger, [])
    this.fingerOverlays.get(finger)!.push(overlay)
  }

  private drawPalm(x: number, y: number, w: number, h: number, color: number) {
    const g = this.scene.add.graphics()
    g.fillStyle(color, 0.9)
    g.fillRoundedRect(x, y, w, h, 6)
    this.allObjects.push(g)
  }
}
