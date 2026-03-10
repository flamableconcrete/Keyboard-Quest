// src/components/TutorialHands.ts
import Phaser from 'phaser'

type Finger = 'lp' | 'lr' | 'lm' | 'li' | 'lt' | 'rt' | 'ri' | 'rm' | 'rr' | 'rp'

const CHAR_FINGER: Record<string, Finger> = {
  q: 'lp', a: 'lp', z: 'lp',
  w: 'lr', s: 'lr', x: 'lr',
  e: 'lm', d: 'lm', c: 'lm',
  r: 'li', f: 'li', v: 'li', t: 'li', g: 'li', b: 'li',
  ' ': 'lt',
  y: 'ri', h: 'ri', n: 'ri', u: 'ri', j: 'ri', m: 'ri',
  i: 'rm', k: 'rm',
  o: 'rr', l: 'rr',
  p: 'rp',
}

export class TutorialHands {
  private fingers: Map<Finger, Phaser.GameObjects.Rectangle[]> = new Map()
  private labels: Map<Finger, Phaser.GameObjects.Text[]> = new Map()
  private currentFinger: Finger | null = null

  constructor(private scene: Phaser.Scene, private cx: number, private cy: number) {
    this.buildHands()
  }

  highlightFinger(ch: string) {
    const finger = CHAR_FINGER[ch.toLowerCase()] ?? null
    if (finger === this.currentFinger) return
    this.currentFinger = finger
    this.fingers.forEach((rects, f) => {
      const active = f === finger
      rects.forEach(r => r.setFillStyle(active ? 0xffd700 : 0x334466))
    })
    this.labels.forEach((texts, f) => {
      const active = f === finger
      texts.forEach(t => t.setColor(active ? '#000000' : '#aaaacc'))
    })
  }

  destroy() {
    this.fingers.forEach(rects => rects.forEach(r => r.destroy()))
    this.labels.forEach(texts => texts.forEach(t => t.destroy()))
  }

  private buildHands() {
    // Left hand — 5 fingers spaced left of center
    const leftFingers: [Finger, string][] = [
      ['lp', 'P'], ['lr', 'R'], ['lm', 'M'], ['li', 'I'], ['lt', 'T'],
    ]
    const rightFingers: [Finger, string][] = [
      ['rt', 'T'], ['ri', 'I'], ['rm', 'M'], ['rr', 'R'], ['rp', 'P'],
    ]

    const fw = 34
    const fh = 70
    const gap = 6
    const totalW = 5 * fw + 4 * gap

    leftFingers.forEach(([f, label], i) => {
      const x = this.cx - totalW - 20 + i * (fw + gap)
      const h = f === 'lt' ? fh / 2 : fh
      const rect = this.scene.add.rectangle(x, this.cy, fw, h, 0x334466)
      const text = this.scene.add.text(x, this.cy, label, {
        fontSize: '12px', color: '#aaaacc'
      }).setOrigin(0.5)
      this.fingers.set(f, [rect])
      this.labels.set(f, [text])
    })

    rightFingers.forEach(([f, label], i) => {
      const x = this.cx + 20 + i * (fw + gap)
      const h = f === 'rt' ? fh / 2 : fh
      const rect = this.scene.add.rectangle(x, this.cy, fw, h, 0x334466)
      const text = this.scene.add.text(x, this.cy, label, {
        fontSize: '12px', color: '#aaaacc'
      }).setOrigin(0.5)
      // Right hand might share a finger key with left (rt) - but they're distinct, so just set
      if (!this.fingers.has(f)) {
        this.fingers.set(f, [])
        this.labels.set(f, [])
      }
      this.fingers.get(f)!.push(rect)
      this.labels.get(f)!.push(text)
    })
  }
}
