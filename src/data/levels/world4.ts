import { LevelConfig } from '../../types'
import { W3_AFTER_MB4 } from './world3'

const W4_BASE = W3_AFTER_MB4
const W4_AFTER_MB1 = [...W4_BASE, 'b']
const W4_AFTER_MB2 = [...W4_AFTER_MB1, 'w']
const W4_AFTER_MB3 = [...W4_AFTER_MB2, 'y']
export const W4_AFTER_MB4 = [...W4_AFTER_MB3, 'v']

export const WORLD4_LEVELS: LevelConfig[] = [
  {
    id: 'w4_l1',
    name: 'Twilight Thicket',
    type: 'GoblinWhacker',
    world: 4,
    unlockedLetters: W4_BASE,
    wordCount: 32,
    timeLimit: 110,
    dialogue: [
      { speaker: "enemy", text: "Deep in the Shrouded Wilds, shadow goblins hunt in packs." },
      { speaker: "hero", text: "Stand aside, foul goblins! Your raids end here." }
    ],
    rewards: { xp: 320 },
    bossGate: null,
  },
  {
    id: 'w4_l2',
    name: 'The Drowned Moor',
    type: 'UndeadSiege',
    world: 4,
    unlockedLetters: W4_BASE,
    wordCount: 35,
    timeLimit: 130,
    dialogue: [
      { speaker: "enemy", text: "The dead rise from the murky mere with terrible purpose." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 340 },
    bossGate: null,
  },
  {
    id: 'w4_l3',
    name: 'Forgotten Stone Pass',
    type: 'DungeonTrapDisarm',
    world: 4,
    unlockedLetters: W4_BASE,
    wordCount: 28,
    timeLimit: 140,
    dialogue: [
      { speaker: "enemy", text: "Hidden traps litter the ancient dwarven pass through the wilds." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 360 },
    bossGate: null,
  },
  {
    id: 'w4_mb1',
    name: 'Troll\'s Toll Bridge',
    type: 'BossBattle',
    world: 4,
    unlockedLetters: W4_BASE,
    wordCount: 55,
    timeLimit: 200,
    dialogue: [
      { speaker: "enemy", text: "Brutus the Bridge Troll, Keeper of B, guards the only crossing!" },
      { speaker: "hero", text: "I\'ve come to restore the letters! Surrender them!" }
    ],
    rewards: { xp: 800, title: 'Seeker of B' },
    bossGate: { minCombinedStars: 16, levelIds: ['w4_l1', 'w4_l2', 'w4_l3'] },
    isMiniBoss: true,
    bossId: 'bone_knight_boss',
    miniBossUnlocksLetter: 'b',
    phases: 2,
  },
  {
    id: 'w4_l4',
    name: 'The Weeping Woods',
    type: 'MagicRuneTyping',
    world: 4,
    unlockedLetters: W4_AFTER_MB1,
    wordCount: 30,
    timeLimit: 140,
    dialogue: [
      { speaker: "enemy", text: "Witch runes pulse among the wych elm roots." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 380 },
    bossGate: null,
  },
  {
    id: 'w4_l5',
    name: 'Ancestral Barrows',
    type: 'SkeletonSwarm',
    world: 4,
    unlockedLetters: W4_AFTER_MB1,
    wordCount: 35,
    timeLimit: 130,
    dialogue: [
      { speaker: "enemy", text: "Barrow wights emerge from the ancient downs at dusk." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 360 },
    bossGate: null,
  },
  {
    id: 'w4_mb2',
    name: 'Keep of the Wraith-Witch',
    type: 'BossBattle',
    world: 4,
    unlockedLetters: W4_AFTER_MB1,
    wordCount: 58,
    timeLimit: 210,
    dialogue: [
      { speaker: "enemy", text: "Wraith-Witch Wynna, Keeper of W, materialises within the keep!" },
      { speaker: "hero", text: "I\'ve come to restore the letters! Surrender them!" }
    ],
    rewards: { xp: 880, title: 'Seeker of W' },
    bossGate: { minCombinedStars: 18, levelIds: ['w4_l4', 'w4_l5'] },
    isMiniBoss: true,
    bossId: 'flash_word_boss',
    miniBossUnlocksLetter: 'w',
    phases: 2,
  },
  {
    id: 'w4_l6',
    name: 'Venomous Shallows',
    type: 'SlimeSplitting',
    world: 4,
    unlockedLetters: W4_AFTER_MB2,
    wordCount: 35,
    timeLimit: 130,
    dialogue: [
      { speaker: "enemy", text: "Yew-sap slimes multiply in the crossing pools." },
      { speaker: "hero", text: "Ugh, more slimes. Let\'s clean this up." }
    ],
    rewards: { xp: 380 },
    bossGate: null,
  },
  {
    id: 'w4_l7',
    name: 'The Jester\'s Glade',
    type: 'SillyChallenge',
    world: 4,
    unlockedLetters: W4_AFTER_MB2,
    wordCount: 20,
    timeLimit: null,
    dialogue: [
      { speaker: "enemy", text: "A jester challenges you to a word duel in the valley below." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 300 },
    bossGate: null,
  },
  {
    id: 'w4_mb3',
    name: 'Frosthowl Summit',
    type: 'BossBattle',
    world: 4,
    unlockedLetters: W4_AFTER_MB2,
    wordCount: 60,
    timeLimit: 220,
    dialogue: [
      { speaker: "enemy", text: "Yax the Yeti-Lord, Keeper of Y, roars from the heights!" },
      { speaker: "hero", text: "I\'ve come to restore the letters! Surrender them!" }
    ],
    rewards: { xp: 960, title: 'Seeker of Y' },
    bossGate: { minCombinedStars: 18, levelIds: ['w4_l6', 'w4_l7'] },
    isMiniBoss: true,
    bossId: 'spider_boss',
    miniBossUnlocksLetter: 'y',
    phases: 2,
  },
  {
    id: 'w4_l8',
    name: 'Ruins of the Old Kingdom',
    type: 'MonsterArena',
    world: 4,
    unlockedLetters: W4_AFTER_MB3,
    wordCount: 36,
    timeLimit: 140,
    dialogue: [
      { speaker: "enemy", text: "Vault-guardians of the ancient veldt ruins challenge all who approach." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 400 },
    bossGate: null,
  },
  {
    id: 'w4_l9',
    name: 'Shadow-Warden\'s Trap',
    type: 'DungeonEscape',
    world: 4,
    unlockedLetters: W4_AFTER_MB3,
    wordCount: 30,
    timeLimit: 120,
    dialogue: [
      { speaker: "enemy", text: "A shadow warden traps you in the hollow — escape!" },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 380 },
    bossGate: null,
  },
  {
    id: 'w4_mb4',
    name: 'Vault of the Ancients',
    type: 'BossBattle',
    world: 4,
    unlockedLetters: W4_AFTER_MB3,
    wordCount: 62,
    timeLimit: 225,
    dialogue: [
      { speaker: "enemy", text: "The Vault-Keeper, Guardian of V, will not yield the final seal!" },
      { speaker: "hero", text: "I\'ve come to restore the letters! Surrender them!" }
    ],
    rewards: { xp: 1040, title: 'Seeker of V' },
    bossGate: { minCombinedStars: 16, levelIds: ['w4_l8', 'w4_l9'] },
    isMiniBoss: true,
    bossId: 'baron_typo',
    miniBossUnlocksLetter: 'v',
    phases: 2,
  },
  {
    id: 'w4_boss',
    name: 'Sanctum of the Dice Lich',
    type: 'BossBattle',
    world: 4,
    unlockedLetters: W4_AFTER_MB4,
    wordCount: 70,
    timeLimit: 280,
    dialogue: [
      { speaker: "enemy", text: "In the heart of the Shrouded Wilds stands the Dice Lich — his power drawn from letters lost to chance." },
      { speaker: "hero", text: "Return to the earth, restless dead!" }
    ],
    rewards: { xp: 2000, title: 'Lich Vanquisher' },
    bossGate: { minCombinedStars: 24, levelIds: ['w4_mb1', 'w4_mb2', 'w4_mb3', 'w4_mb4'] },
    isBoss: true,
    bossId: 'dice_lich',
    phases: 4,
  },
]
