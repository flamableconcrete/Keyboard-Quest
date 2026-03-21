// src/scenes/boss-types/BoneKnightBoss.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { BaseBossScene } from '../BaseBossScene'
import { GOLD_PER_KILL } from '../../constants'

interface Shield {
    sprite: Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle
    text: Phaser.GameObjects.Text
    word: string
}

export class BoneKnightBoss extends BaseBossScene {
    private phase = 1
    private maxPhases = 3
    private shields: Shield[] = []
    private activeShieldIndex = 0

    private bossSprite!: Phaser.GameObjects.Rectangle
    private bossHpText!: Phaser.GameObjects.Text
    private phaseText!: Phaser.GameObjects.Text
    private hpText!: Phaser.GameObjects.Text
    private timerText!: Phaser.GameObjects.Text

    private bossHp = 0
    private bossMaxHp = 0
    private playerHp = 5
    private timeLeft = 0
    private timerEvent?: Phaser.Time.TimerEvent

    constructor() {
        super('BoneKnightBoss')
    }

    init(data: { level: LevelConfig; profileSlot: number }) {
        super.init(data)
        this.playerHp = 5
        this.phase = 1
        this.activeShieldIndex = 0
    }

    create() {
        this.preCreate()
        const { width, height } = this.scale

        // Dark Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a)

        // HUD
        this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, {
            fontSize: '22px', color: '#ff4444'
        })
        this.timerText = this.add.text(width - 20, 20, '', {
            fontSize: '22px', color: '#ffffff'
        }).setOrigin(1, 0)

        this.add.text(width / 2, 20, this.level.name, {
            fontSize: '28px', color: '#e0e0e0'
        }).setOrigin(0.5, 0)

        this.phaseText = this.add.text(width / 2, 60, `Phase ${this.phase}/${this.maxPhases}`, {
            fontSize: '20px', color: '#aaaaaa'
        }).setOrigin(0.5, 0)

        // Boss Sprite (Bone Knight is tall and grey/silver)
        this.bossSprite = this.add.rectangle(width / 2, height * 0.42, 200, 350, 0xbdc3c7)
        this.add.rectangle(width / 2, height * 0.42 - 225, 100, 100, 0xbdc3c7) // Head

        this.bossMaxHp = this.level.wordCount
        this.bossHp = this.bossMaxHp
        this.bossHpText = this.add.text(width / 2, height / 2 + 150, `Bone Knight HP: ${this.bossHp}/${this.bossMaxHp}`, {
            fontSize: '24px', color: '#e0e0e0'
        }).setOrigin(0.5)

        if (this.level.timeLimit) {
            this.timeLeft = this.level.timeLimit
            this.timerEvent = this.time.addEvent({
                delay: 1000, repeat: this.level.timeLimit - 1,
                callback: () => {
                    this.timeLeft--
                    this.timerText.setText(`${this.timeLeft}s`)
                    if (this.timeLeft <= 0) this.endLevel(false)
                }
            })
        }

        this.startPhase()
    }

    private startPhase() {
        this.phaseText.setText(`Phase ${this.phase}/${this.maxPhases}`)
        this.clearShields()

        const shieldCount = this.phase // 1, 2, 3 shields
        const difficulty = Math.ceil(this.level.world / 2) + (this.phase - 1)
        const words = getWordPool(this.level.unlockedLetters, shieldCount, difficulty, this.level.world === 1 ? 5 : undefined)

        const { width, height } = this.scale
        const radius = 250

        words.forEach((word, i) => {
            const angle = Phaser.Math.DegToRad((i * (360 / shieldCount)) - 90)
            const x = width / 2 + Math.cos(angle) * radius
            const y = (height / 2 - 50) + Math.sin(angle) * radius

            const sprite = this.add.arc(x, y, 60, 0, 360, false, 0x3498db, 0.5)
            sprite.setStrokeStyle(4, 0x2980b9)

            const text = this.add.text(x, y, word, {
                fontSize: '36px',
                color: i === 0 ? '#ffff00' : '#888888',
                backgroundColor: '#000000',
                padding: { x: 6, y: 3 },
                fontStyle: 'bold'
            }).setOrigin(0.5)

            this.shields.push({ sprite, text, word })
        })

        this.activeShieldIndex = 0
        this.updateShieldVisuals()
        this.engine.setWord(this.shields[0].word)

        this.cameras.main.flash(500, 100, 100, 255)
    }

    private clearShields() {
        this.shields.forEach(s => {
            s.sprite.destroy()
            s.text.destroy()
        })
        this.shields = []
    }

    private updateShieldVisuals() {
        this.shields.forEach((s, i) => {
            if (i === this.activeShieldIndex) {
                s.sprite.setFillStyle(0x3498db, 0.8)
                s.text.setColor('#ffffff')
                s.text.setScale(1.2)
            } else {
                s.sprite.setFillStyle(0x34495e, 0.5)
                s.text.setColor('#888888')
                s.text.setScale(1.0)
            }
        })
    }

    protected onWordComplete() {
        // Drop gold on kill
        if (this.goldManager) {
            const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
            const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
            this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL);
        }

        if (this.finished) return

        const completedShield = this.shields[this.activeShieldIndex]

        // Damage effect
        this.tweens.add({
            targets: completedShield.sprite,
            scale: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                completedShield.sprite.destroy()
                completedShield.text.destroy()
            }
        })

        const pProfileBoss = loadProfile(this.profileSlot)
        const weaponItemBoss = pProfileBoss?.equipment?.weapon ? getItem(pProfileBoss.equipment.weapon) : null
        const powerBonus = weaponItemBoss?.effect?.power || 0
        this.bossHp -= (1 + powerBonus)
        this.bossHpText.setText(`Bone Knight HP: ${Math.max(0, this.bossHp)}/${this.bossMaxHp}`)

        this.activeShieldIndex++
        if (this.activeShieldIndex >= this.shields.length) {
            if (this.bossHp <= 0) {
                this.endLevel(true)
            } else {
                this.phase++
                if (this.phase > this.maxPhases) {
                    // If we somehow ran out of phases but still have HP, just finish
                    this.endLevel(true)
                } else {
                    this.time.delayedCall(500, () => this.startPhase())
                }
            }
        } else {
            this.updateShieldVisuals()
            this.engine.setWord(this.shields[this.activeShieldIndex].word)
        }
    }

    protected onWrongKey() {
        if (this.finished) return

        // Reset progress on current shield
        const currentShield = this.shields[this.activeShieldIndex]
        this.engine.setWord(currentShield.word)

        // Shake current shield
        this.tweens.add({
            targets: [currentShield.sprite, currentShield.text],
            x: '+=10',
            duration: 50,
            yoyo: true,
            repeat: 3
        })

        // Boss counter-attack
        const pProfile = loadProfile(this.profileSlot)
        const armorItem = pProfile?.equipment?.armor ? getItem(pProfile.equipment.armor) : null
        const absorbChance = armorItem?.effect?.absorbAttacksChance || 0
        if (Math.random() < absorbChance) {
            const blockText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'BLOCKED!', { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5).setDepth(3000)
            this.tweens.add({ targets: blockText, y: blockText.y - 50, alpha: 0, duration: 1000, onComplete: () => blockText.destroy() })
        } else {
            this.playerHp--
        }
        this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
        this.cameras.main.shake(200, 0.01)

        if (this.playerHp <= 0) {
            this.endLevel(false)
        }
    }

    update(time: number, delta: number) {
        super.update(time, delta)

        if (this.finished) return

        // Update the active shield text to show progress
        const currentShield = this.shields[this.activeShieldIndex]
        if (currentShield) {
            const typed = this.engine.getTypedSoFar()
            const word = currentShield.word

            // Format text to show typed vs untyped
            // Note: TypingEngine handles colors itself, but here we can just do a simple highlight
            // or just leave the text as is if we want to be simple.
            // Let's at least update the text object's content if we were to show progress.
            // But usually we'd want color. Let's just use the default word for now
            // and maybe add brackets around typed part.
            if (typed.length > 0) {
              currentShield.text.setText(`[${typed}]${word.substring(typed.length)}`)
            } else {
              currentShield.text.setText(word)
            }
        }
    }

    protected endLevel(passed: boolean) {
        this.timerEvent?.remove()

        if (passed) {
            this.bossHpText.setText('DEFEATED!')
            this.tweens.add({
                targets: this.bossSprite,
                alpha: 0,
                y: '+=100',
                duration: 1000
            })
        }

        super.endLevel(passed)
    }
}
