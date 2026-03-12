import { LevelConfig } from '../../types'
import { W1_AFTER_MB4 } from './world1'

const W2_BASE = W1_AFTER_MB4
const W2_AFTER_MB1 = [...W2_BASE, 't']
const W2_AFTER_MB2 = [...W2_AFTER_MB1, 'i']
const W2_AFTER_MB3 = [...W2_AFTER_MB2, 'h']
export const W2_AFTER_MB4 = [...W2_AFTER_MB3, 'c']

export const WORLD2_LEVELS: LevelConfig[] = [
  {
    id: 'w2_l1',
    name: 'Mistweaver Shore',
    type: 'SkeletonSwarm',
    world: 2,
    unlockedLetters: W2_BASE,
    wordCount: 20,
    timeLimit: 90,
    dialogue: [
      { speaker: "enemy", text: "The Shadowed Fen is home to restless skeletons who guard an ancient ford." },
      { speaker: "hero", text: "Return to the earth, restless dead!" }
    ],
    rewards: { xp: 160 },
    bossGate: null,
  },
  {
    id: 'w2_l2',
    name: 'The Proving Grounds',
    type: 'MonsterArena',
    world: 2,
    unlockedLetters: W2_BASE,
    wordCount: 20,
    timeLimit: 100,
    dialogue: [
      { speaker: "enemy", text: "Ogre champions challenge all who pass through Dorn Flats." },
      { speaker: "hero", text: "I\'ve come to restore the letters! Surrender them!" }
    ],
    rewards: { xp: 180 },
    bossGate: null,
  },
  {
    id: 'w2_l3',
    name: 'Bloodmoss Path',
    type: 'UndeadSiege',
    world: 2,
    unlockedLetters: W2_BASE,
    wordCount: 25,
    timeLimit: 110,
    dialogue: [
      { speaker: "enemy", text: "Undead march along the red-mossed road. Hold the line!" },
      { speaker: "hero", text: "Return to the earth, restless dead!" }
    ],
    rewards: { xp: 200 },
    bossGate: null,
  },
  {
    id: 'w2_mb1',
    name: 'Bramblegate Watch',
    type: 'BossBattle',
    world: 2,
    unlockedLetters: W2_BASE,
    wordCount: 35,
    timeLimit: 140,
    dialogue: [
      { speaker: "enemy", text: "Thornback the Troll, Keeper of T, bars your path!" },
      { speaker: "hero", text: "I\'ve come to restore the letters! Surrender them!" }
    ],
    rewards: { xp: 380, title: 'Seeker of T' },
    bossGate: { minCombinedStars: 8, levelIds: ['w2_l1', 'w2_l2', 'w2_l3'] },
    isMiniBoss: true,
    bossId: 'baron_typo',
    miniBossUnlocksLetter: 't',
    phases: 2,
  },
  {
    id: 'w2_l4',
    name: 'Elderwood Thicket',
    type: 'GoblinWhacker',
    world: 2,
    unlockedLetters: W2_AFTER_MB1,
    wordCount: 25,
    timeLimit: 90,
    dialogue: [
      { speaker: "enemy", text: "With T restored, the forest paths open wider." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 200 },
    bossGate: null,
  },
  {
    id: 'w2_l5',
    name: 'The Sludge Pools',
    type: 'SlimeSplitting',
    world: 2,
    unlockedLetters: W2_AFTER_MB1,
    wordCount: 25,
    timeLimit: 100,
    dialogue: [
      { speaker: "enemy", text: "Slimes multiply in the damp fen." },
      { speaker: "hero", text: "Ugh, more slimes. Let\'s clean this up." }
    ],
    rewards: { xp: 220 },
    bossGate: null,
  },
  {
    id: 'w2_l6',
    name: 'Dwarven Depths',
    type: 'DungeonTrapDisarm',
    world: 2,
    unlockedLetters: W2_AFTER_MB1,
    wordCount: 20,
    timeLimit: 120,
    dialogue: [
      { speaker: "enemy", text: "Ancient dwarven traps line the Stone Shelf passage." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 240 },
    bossGate: null,
  },
  {
    id: 'w2_mb2',
    name: 'Ironweb Keep',
    type: 'BossBattle',
    world: 2,
    unlockedLetters: W2_AFTER_MB1,
    wordCount: 38,
    timeLimit: 150,
    dialogue: [
      { speaker: "enemy", text: "Irontongue the Iron Witch, Keeper of I, seals the keep!" },
      { speaker: "hero", text: "I\'ve come to restore the letters! Surrender them!" }
    ],
    rewards: { xp: 420, title: 'Seeker of I' },
    bossGate: { minCombinedStars: 10, levelIds: ['w2_l4', 'w2_l5', 'w2_l6'] },
    isMiniBoss: true,
    bossId: 'spider_boss',
    miniBossUnlocksLetter: 'i',
    phases: 2,
  },
  {
    id: 'w2_l7',
    name: 'Rune-Scarred Path',
    type: 'MagicRuneTyping',
    world: 2,
    unlockedLetters: W2_AFTER_MB2,
    wordCount: 20,
    timeLimit: 110,
    dialogue: [
      { speaker: "enemy", text: "Strange runes appear on the thistle-lined path." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 240 },
    bossGate: null,
  },
  {
    id: 'w2_l8',
    name: 'Haven of the Silver Arrow',
    type: 'GuildRecruitment',
    world: 2,
    unlockedLetters: W2_AFTER_MB2,
    wordCount: 15,
    timeLimit: null,
    dialogue: [
      { speaker: "enemy", text: "The heroes of Heronshire offer their swords." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 200, companionId: 'archer' },
    bossGate: null,
  },
  {
    id: 'w2_mb3',
    name: 'Hollowhorn Peak',
    type: 'BossBattle',
    world: 2,
    unlockedLetters: W2_AFTER_MB2,
    wordCount: 40,
    timeLimit: 160,
    dialogue: [
      { speaker: "enemy", text: "Hexus the Hollow Horned One, Keeper of H, guards the ridge!" },
      { speaker: "hero", text: "I\'ve come to restore the letters! Surrender them!" }
    ],
    rewards: { xp: 460, title: 'Seeker of H' },
    bossGate: { minCombinedStars: 10, levelIds: ['w2_l7', 'w2_l8'] },
    isMiniBoss: true,
    bossId: 'flash_word_boss',
    miniBossUnlocksLetter: 'h',
    phases: 2,
  },
  {
    id: 'w2_l9',
    name: 'The Alchemist\'s Grotto',
    type: 'PotionBrewingLab',
    world: 2,
    unlockedLetters: W2_AFTER_MB3,
    wordCount: 20,
    timeLimit: 120,
    dialogue: [
      { speaker: "enemy", text: "An alchemist offers potions in exchange for correctly typed ingredients." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 260, item: 'iron_helm' },
    bossGate: null,
  },
  {
    id: 'w2_l10',
    name: 'The Ranger\'s Outpost',
    type: 'MonsterManual',
    world: 2,
    unlockedLetters: W2_AFTER_MB3,
    wordCount: 18,
    timeLimit: null,
    dialogue: [
      { speaker: "enemy", text: "A scholar catalogues the creatures of the fen." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 220 },
    bossGate: null,
  },
  {
    id: 'w2_mb4',
    name: 'Frostbite Hollow',
    type: 'BossBattle',
    world: 2,
    unlockedLetters: W2_AFTER_MB3,
    wordCount: 42,
    timeLimit: 165,
    dialogue: [
      { speaker: "enemy", text: "Crackthorn the Crone, Keeper of C, cackles in the hollow!" },
      { speaker: "hero", text: "I\'ve come to restore the letters! Surrender them!" }
    ],
    rewards: { xp: 500, title: 'Seeker of C' },
    bossGate: { minCombinedStars: 12, levelIds: ['w2_l9', 'w2_l10'] },
    isMiniBoss: true,
    bossId: 'bone_knight_boss',
    miniBossUnlocksLetter: 'c',
    phases: 2,
  },
  {
    id: 'w2_boss',
    name: 'Lair of the Deep Fen Hydra',
    type: 'BossBattle',
    world: 2,
    unlockedLetters: W2_AFTER_MB4,
    wordCount: 50,
    timeLimit: 200,
    dialogue: [
      { speaker: "enemy", text: "Five heads, five tongues — the Hydra speaks only in riddles of letters!" },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 1000, title: 'Slayer of the Hydra' },
    bossGate: { minCombinedStars: 16, levelIds: ['w2_mb1', 'w2_mb2', 'w2_mb3', 'w2_mb4'] },
    isBoss: true,
    bossId: 'hydra',
    phases: 5,
  },
]
