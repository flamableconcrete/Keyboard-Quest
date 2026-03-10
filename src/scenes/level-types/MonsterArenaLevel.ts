import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { setupPause } from '../../utils/pauseSetup'

interface Monster {
  word: string
  x: number
  speed: number
  sprite: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
  hp: number
  maxHp: number
}

export class MonsterArenaLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private words: string[] = []
  private monsters: Monster[] = []
  private activeMonster: Monster | null = null
  private engine!: TypingEngine
  private wordQueue: string[] = []
  private playerHp = 3
  private maxMonsterReach = 0
  private hpText!: Phaser.GameObjects.Text
  private monsterHpText!: Phaser.GameObjects.Text
  private finished = false

  constructor() { super('MonsterArenaLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.playerHp = 3
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale
    this.maxMonsterReach = 80

    this.add.rectangle(width / 2, height / 2, width, height, 0x4a1e1e)

    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, { fontSize: '22px', color: '#ff4444' })
    this.monsterHpText = this.add.text(width - 20, 20, '', { fontSize: '22px', color: '#ffffff' }).setOrigin(1, 0)
    this.add.text(width / 2, 20, this.level.name, { fontSize: '22px', color: '#ffd700' }).setOrigin(0.5, 0)

    this.engine = new TypingEngine({
      scene: this, x: width / 2, y: height - 80, fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    const difficulty = Math.ceil(this.level.world / 2)
    this.words = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty, this.level.world === 1 ? 5 : undefined)
    this.wordQueue = [...this.words]

    this.spawnMonster()
  }

  private spawnMonster() {
    if (this.finished || this.wordQueue.length === 0) {
      this.endLevel(true)
      return
    }
    const word = this.wordQueue.shift()!
    const { width, height } = this.scale
    const y = height / 2
    const sprite = this.add.rectangle(width + 100, y, 100, 100, 0xaa2222)
    const label = this.add.text(width + 100, y - 60, word, {
      fontSize: '24px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5)
    
    // Multi-word HP bar logic
    const monsterHp = Math.min(5, this.words.length) // up to 5 words to kill
    
    const monster: Monster = { word, x: width + 100, speed: 20 + this.level.world * 5, sprite, label, hp: monsterHp, maxHp: monsterHp }
    this.monsters.push(monster)
    this.updateMonsterHpText(monster)

    if (!this.activeMonster) this.setActiveMonster(monster)
  }

  private updateMonsterHpText(monster: Monster) {
    this.monsterHpText.setText(`Monster HP: ${monster.hp}/${monster.maxHp}`)
  }

  private setActiveMonster(monster: Monster | null) {
    this.activeMonster = monster
    if (monster) this.engine.setWord(monster.word)
    else this.engine.clearWord()
  }

  update(_time: number, delta: number) {
    if (this.finished) return
    this.monsters.forEach(m => {
      m.x -= m.speed * (delta / 1000)
      m.sprite.setX(m.x)
      m.label.setX(m.x)
      if (m.x <= this.maxMonsterReach) this.monsterReachedPlayer(m)
    })
  }

  private monsterReachedPlayer(monster: Monster) {
    this.removeMonster(monster)
    this.playerHp--
    this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
    this.cameras.main.shake(200, 0.01)
    if (this.playerHp <= 0) this.endLevel(false)
    else this.spawnMonster() // Spawn next if player survived
  }

  private onWordComplete(word: string, _elapsed: number) {
    const monster = this.monsters.find(m => m.word === word)
    if (monster) {
      monster.hp--
      this.updateMonsterHpText(monster)
      if (monster.hp <= 0) {
        this.removeMonster(monster)
        this.spawnMonster()
      } else {
        // Assign new word
        if (this.wordQueue.length > 0) {
          monster.word = this.wordQueue.shift()!
          monster.label.setText(monster.word)
          this.engine.setWord(monster.word)
        } else {
          // No more words, monster dies
          this.removeMonster(monster)
          this.endLevel(true)
        }
      }
    }
  }

  private onWrongKey() { this.cameras.main.flash(80, 120, 0, 0) }

  private removeMonster(monster: Monster) {
    monster.sprite.destroy()
    monster.label.destroy()
    this.monsters = this.monsters.filter(m => m !== monster)
    this.monsterHpText.setText('')
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.engine.destroy()

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)
    const captureAttempt = this.level.captureEligible ? { monsterId: 'boss', monsterName: 'Arena Boss' } : undefined

    const profile = loadProfile(this.profileSlot)
    const companionUsed = !!(profile?.activeCompanionId || profile?.activePetId)

    this.time.delayedCall(500, () => {
      this.scene.start('LevelResult', {
        level: this.level, profileSlot: this.profileSlot,
        accuracyStars: acc, speedStars: spd, passed, 
        companionUsed, captureAttempt
      })
    })
  }
}