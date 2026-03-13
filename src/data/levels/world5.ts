import { LevelConfig } from '../../types'
import { W4_AFTER_MB4 } from './world4'

const W5_BASE = W4_AFTER_MB4
const W5_AFTER_MB1 = [...W5_BASE, 'q']
const W5_AFTER_MB2 = [...W5_AFTER_MB1, 'x']
const W5_AFTER_MB3 = [...W5_AFTER_MB2, 'z']
export const W5_AFTER_MB4 = [...W5_AFTER_MB3, 'j']

export const WORLD5_LEVELS: LevelConfig[] = [
  {
    id: 'w5_l1',
    name: 'Gates of the Maelstrom',
    type: 'GoblinWhacker',
    world: 5,
    unlockedLetters: W5_BASE,
    wordCount: 36,
    timeLimit: 120,
    dialogue: [
      { speaker: "enemy", text: "Soldiers of the Typemancer guard the base of the tower." },
      { speaker: "hero", text: "Your reign of silence is over! Prepare yourself!" }
    ],
    rewards: { xp: 460 },
    bossGate: null,
  },
  {
    id: 'w5_l2',
    name: 'The Shifting Labyrinth',
    type: 'DungeonTrapDisarm',
    world: 5,
    unlockedLetters: W5_BASE,
    wordCount: 32,
    timeLimit: 150,
    dialogue: [
      { speaker: "enemy", text: "The maze shifts as you type — words unlock passages." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 480 },
    bossGate: null,
  },
  {
    id: 'w5_l3',
    name: 'Archives of Eternity',
    type: 'MonsterManual',
    world: 5,
    unlockedLetters: W5_BASE,
    wordCount: 24,
    timeLimit: null,
    dialogue: [
      { speaker: "enemy", text: "Ancient scrolls hold the history of the Typemancer\'s rise." },
      { speaker: "hero", text: "Your reign of silence is over! Prepare yourself!" }
    ],
    rewards: { xp: 440 },
    bossGate: null,
  },
  {
    id: 'w5_mb1',
    name: 'Chamber of the Quillmaster',
    type: 'BossBattle',
    world: 5,
    unlockedLetters: W5_BASE,
    wordCount: 65,
    timeLimit: 240,
    dialogue: [
      { speaker: "enemy", text: "Quixel the Quillmaster, Keeper of Q, scratches rare words into the walls!" },
      { speaker: "hero", text: "I\'ve come to restore the letters! Surrender them!" }
    ],
    rewards: { xp: 1100, title: 'Seeker of Q' },
    bossGate: { minCombinedStars: 20, levelIds: ['w5_l1', 'w5_l2', 'w5_l3'] },
    isMiniBoss: true,
    bossId: 'ancient_dragon',
    miniBossUnlocksLetter: 'q',
    phases: 2,
  },
  {
    id: 'w5_l4',
    name: 'The Enchanted Forges',
    type: 'MagicRuneTyping',
    world: 5,
    unlockedLetters: W5_AFTER_MB1,
    wordCount: 32,
    timeLimit: 150,
    dialogue: [
      { speaker: "enemy", text: "Enchanted forges ring with the sound of rare letters being hammered into shape." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 500 },
    bossGate: null,
  },
  {
    id: 'w5_l5',
    name: 'The Desolate Courtyard',
    type: 'SkeletonSwarm',
    world: 5,
    unlockedLetters: W5_AFTER_MB1,
    wordCount: 40,
    timeLimit: 140,
    dialogue: [
      { speaker: "enemy", text: "Bone warriors march across the xeric flats beneath the tower." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 480 },
    bossGate: null,
  },
  {
    id: 'w5_mb2',
    name: 'Spire of the Hexed Exile',
    type: 'BossBattle',
    world: 5,
    unlockedLetters: W5_AFTER_MB1,
    wordCount: 68,
    timeLimit: 250,
    dialogue: [
      { speaker: "enemy", text: "Xeron the Hexed Exile, Keeper of X, casts words as weapons!" },
      { speaker: "hero", text: "I\'ve come to restore the letters! Surrender them!" }
    ],
    rewards: { xp: 1200, title: 'Seeker of X' },
    bossGate: { minCombinedStars: 16, levelIds: ['w5_l4', 'w5_l5'] },
    isMiniBoss: true,
    bossId: 'dice_lich',
    miniBossUnlocksLetter: 'x',
    phases: 2,
  },
  {
    id: 'w5_l6',
    name: "The Mad King's Court",
    type: 'SillyChallenge',
    world: 5,
    unlockedLetters: W5_AFTER_MB2,
    wordCount: 22,
    timeLimit: null,
    dialogue: [
      { speaker: "enemy", text: "A court jester challenges you with the zaniest words in the realm." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 440 },
    bossGate: null,
  },
  {
    id: 'w5_l7',
    name: 'Prison of the Wind Faeries',
    type: 'WoodlandFestival',
    world: 5,
    unlockedLetters: W5_AFTER_MB2,
    wordCount: 22,
    timeLimit: null,
    dialogue: [
      { speaker: "enemy", text: "The imprisoned faeries of Zephyr Court beg you to free them with words." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 460 },
    bossGate: null,
  },
  {
    id: 'w5_mb3',
    name: "Zealot's Ascent",
    type: 'BossBattle',
    world: 5,
    unlockedLetters: W5_AFTER_MB2,
    wordCount: 70,
    timeLimit: 260,
    dialogue: [
      { speaker: "enemy", text: "Zindark the Zealot, Keeper of Z, stands between you and the final ascent!" },
      { speaker: "hero", text: "I\'ve come to restore the letters! Surrender them!" }
    ],
    rewards: { xp: 1300, title: 'Seeker of Z' },
    bossGate: { minCombinedStars: 16, levelIds: ['w5_l6', 'w5_l7'] },
    isMiniBoss: true,
    bossId: 'grizzlefang',
    miniBossUnlocksLetter: 'z',
    phases: 2,
  },
  {
    id: 'w5_l8',
    name: 'The Crumbling Stairway',
    type: 'DungeonEscape',
    world: 5,
    unlockedLetters: W5_AFTER_MB3,
    wordCount: 38,
    timeLimit: 150,
    dialogue: [
      { speaker: "enemy", text: "The tower trembles as you climb — type to keep your footing!" },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 520 },
    bossGate: null,
  },
  {
    id: 'w5_mb4',
    name: 'Hall of Illusions',
    type: 'BossBattle',
    world: 5,
    unlockedLetters: W5_AFTER_MB3,
    wordCount: 72,
    timeLimit: 265,
    dialogue: [
      { speaker: "enemy", text: "The Typemancer\'s jester blocks the throne room with jokes and jabs!" },
      { speaker: "hero", text: "Your reign of silence is over! Prepare yourself!" }
    ],
    rewards: { xp: 1400, title: "Jester's Bane" },
    bossGate: { minCombinedStars: 8, levelIds: ['w5_l8'] },
    isMiniBoss: true,
    bossId: 'spider_boss',
    miniBossUnlocksLetter: 'j',
    phases: 2,
  },
  {
    id: 'w5_boss',
    name: 'Throne of the Typemancer',
    type: 'BossBattle',
    world: 5,
    unlockedLetters: W5_AFTER_MB4,
    wordCount: 80,
    timeLimit: 360,
    dialogue: [
      { speaker: "enemy", text: "The Typemancer floats above his throne, weaving letters into destruction. Face him — and type your destiny!" },
      { speaker: "hero", text: "Your reign of silence is over! Prepare yourself!" }
    ],
    rewards: { xp: 5000, title: 'Keyboard Champion' },
    bossGate: { minCombinedStars: 28, levelIds: ['w5_mb1', 'w5_mb2', 'w5_mb3', 'w5_mb4'] },
    isBoss: true,
    bossId: 'typemancer',
    phases: 5,
  },
]
