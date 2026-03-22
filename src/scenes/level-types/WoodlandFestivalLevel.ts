// src/scenes/level-types/WoodlandFestivalLevel.ts
import Phaser from 'phaser'
import { BaseLevelScene } from '../BaseLevelScene'
import { GOLD_PER_KILL, DEFAULT_PLAYER_HP } from '../../constants'
import { WoodlandFestivalController } from '../../controllers/WoodlandFestivalController'
import { LevelHUD } from '../../components/LevelHUD'

export class WoodlandFestivalLevel extends BaseLevelScene {
  private festCtrl!: WoodlandFestivalController
  private playerScoreText!: Phaser.GameObjects.Text
  private aiScoreText!: Phaser.GameObjects.Text
  private aiTimer?: Phaser.Time.TimerEvent

  constructor() { super('WoodlandFestivalLevel') }

  create() {
    const { width, height } = this.scale

    this.initWordPool()
    this.preCreate(80, height * 0.65, {
      hud: new LevelHUD(this, {
        profileSlot: this.profileSlot,
        heroHp: DEFAULT_PLAYER_HP,
        levelName: this.level.name,
        wordPool: this.wordQueue,
        onWordComplete: this.onWordComplete.bind(this),
        onWrongKey: this.onWrongKey.bind(this),
      }),
    })

    // Initialize controller with the word queue
    this.festCtrl = new WoodlandFestivalController({
      words: [...this.wordQueue],
      worldNumber: this.level.world,
    })
    // Controller owns the word queue from here; drain the scene's copy
    this.wordQueue.length = 0

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d4a1e)

    this.add.text(width / 2, 80, 'Typing Contest vs Animal Champion!', {
      fontSize: '20px', color: '#ffffff'
    }).setOrigin(0.5)

    this.playerScoreText = this.add.text(200, 200, 'Player Score: 0', {
      fontSize: '24px', color: '#44ff44'
    })

    this.aiScoreText = this.add.text(width - 400, 200, 'Animal Score: 0', {
      fontSize: '24px', color: '#ff4444'
    })

    // Set first word from controller
    if (this.festCtrl.currentWord) {
      this.engine.setWord(this.festCtrl.currentWord)
    }

    // AI timer — fires at the world-appropriate interval; delegates to controller
    this.aiTimer = this.time.addEvent({
      delay: this.festCtrl.aiInterval,
      loop: true,
      callback: () => {
        const events = this.festCtrl.aiTick()
        for (const ev of events) {
          switch (ev.type) {
            case 'ai_scored':
              this.aiScoreText.setText(`Animal Score: ${ev.aiScore}`)
              break
          }
        }
      }
    })
  }

  protected onWordComplete(_word: string, _elapsed: number) {
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
      this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL);
    }

    const events = this.festCtrl.wordTyped()
    for (const ev of events) {
      switch (ev.type) {
        case 'player_scored':
          this.playerScoreText.setText(`Player Score: ${ev.playerScore}`)
          break
        case 'word_changed':
          this.engine.setWord(ev.word)
          break
        case 'level_complete':
          // winner (e.winner) is computed but not displayed yet — reserved for future UI
          this.endLevel(true)
          break
      }
    }
  }

  protected onWrongKey() {
    this.cameras.main.flash(50, 100, 0, 0)
  }

  protected endLevel(passed: boolean) {
    this.aiTimer?.remove()
    super.endLevel(passed)
  }

  update(_time: number, delta: number) {
    super.update(_time, delta)
  }
}
