import { LevelConfig } from '../../types'
import { W2_AFTER_MB4 } from './world2'

const W3_BASE = W2_AFTER_MB4
const W3_AFTER_MB1 = [...W3_BASE, 'm']
const W3_AFTER_MB2 = [...W3_AFTER_MB1, 'p']
const W3_AFTER_MB3 = [...W3_AFTER_MB2, 'u']
export const W3_AFTER_MB4 = [...W3_AFTER_MB3, 'g']

export const WORLD3_LEVELS: LevelConfig[] = [
  {
    id: 'w3_l1',
    name: 'Emberfall Ascent',
    type: 'GoblinWhacker',
    world: 3,
    unlockedLetters: W3_BASE,
    wordCount: 28,
    timeLimit: 100,
    dialogue: [
      { speaker: "enemy", text: "Fire goblins have made their home in the volcanic reaches of the Ember Peaks." },
      { speaker: "hero", text: "Stand aside, foul goblins! Your raids end here." }
    ],
    rewards: { xp: 240 },
    bossGate: null,
  },
  {
    id: 'w3_l2',
    name: 'Ashwood Cemetery',
    type: 'UndeadSiege',
    world: 3,
    unlockedLetters: W3_BASE,
    wordCount: 30,
    timeLimit: 120,
    dialogue: [
      { speaker: "enemy", text: "Ash walkers stir from their resting places in Cinderholt." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 260 },
    bossGate: null,
  },
  {
    id: 'w3_l3',
    name: 'Dragon\'s Tooth Tunnels',
    type: 'DungeonEscape',
    world: 3,
    unlockedLetters: W3_BASE,
    wordCount: 25,
    timeLimit: 100,
    dialogue: [
      { speaker: "enemy", text: "Dragon cultists chase you through the Scalethorn tunnels!" },
      { speaker: "hero", text: "Your reign of silence is over! Prepare yourself!" }
    ],
    rewards: { xp: 280 },
    bossGate: null,
  },
  {
    id: 'w3_mb1',
    name: 'Obsidian Gate',
    type: 'BossBattle',
    world: 3,
    unlockedLetters: W3_BASE,
    wordCount: 45,
    timeLimit: 170,
    dialogue: [
      { speaker: "enemy", text: "Moloch the Magma Mole, Keeper of M, erupts from the earth!" },
      { speaker: "hero", text: "I\'ve come to restore the letters! Surrender them!" }
    ],
    rewards: { xp: 560, title: 'Seeker of M' },
    bossGate: { minCombinedStars: 12, levelIds: ['w3_l1', 'w3_l2', 'w3_l3'] },
    isMiniBoss: true,
    bossId: 'dice_lich',
    miniBossUnlocksLetter: 'm',
    phases: 2,
  },
  {
    id: 'w3_l4',
    name: 'The Scorched Arena',
    type: 'MonsterArena',
    world: 3,
    unlockedLetters: W3_AFTER_MB1,
    wordCount: 30,
    timeLimit: 110,
    dialogue: [
      { speaker: "enemy", text: "Monster gladiators compete on the cooled lava flats of Pumice Mesa." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 280 },
    bossGate: null,
  },
  {
    id: 'w3_l5',
    name: 'Pillars of Flame',
    type: 'MagicRuneTyping',
    world: 3,
    unlockedLetters: W3_AFTER_MB1,
    wordCount: 24,
    timeLimit: 130,
    dialogue: [
      { speaker: "enemy", text: "Runes carved into the thermal spires hum with volcanic power." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 300 },
    bossGate: null,
  },
  {
    id: 'w3_mb2',
    name: 'Spire of the Phoenix',
    type: 'BossBattle',
    world: 3,
    unlockedLetters: W3_AFTER_MB1,
    wordCount: 48,
    timeLimit: 180,
    dialogue: [
      { speaker: "enemy", text: "Pyreth the Phoenix Paladin, Keeper of P, rises from the ashes!" },
      { speaker: "hero", text: "I\'ve come to restore the letters! Surrender them!" }
    ],
    rewards: { xp: 620, title: 'Seeker of P' },
    bossGate: { minCombinedStars: 14, levelIds: ['w3_l4', 'w3_l5'] },
    isMiniBoss: true,
    bossId: 'ancient_dragon',
    miniBossUnlocksLetter: 'p',
    phases: 2,
  },
  {
    id: 'w3_l6',
    name: 'The Grand Crucible',
    type: 'PotionBrewingLab',
    world: 3,
    unlockedLetters: W3_AFTER_MB2,
    wordCount: 28,
    timeLimit: 140,
    dialogue: [
      { speaker: "enemy", text: "Master alchemists at the Upper Crucible brew potions from volcanic minerals." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 320, item: 'flame_shield' },
    bossGate: null,
  },
  {
    id: 'w3_l7',
    name: 'Magma Vents',
    type: 'SlimeSplitting',
    world: 3,
    unlockedLetters: W3_AFTER_MB2,
    wordCount: 30,
    timeLimit: 120,
    dialogue: [
      { speaker: "enemy", text: "Magma slimes pour from vents along Eruption Road." },
      { speaker: "hero", text: "Ugh, more slimes. Let\'s clean this up." }
    ],
    rewards: { xp: 300 },
    bossGate: null,
  },
  {
    id: 'w3_mb3',
    name: 'The Umber Bridge',
    type: 'BossBattle',
    world: 3,
    unlockedLetters: W3_AFTER_MB2,
    wordCount: 50,
    timeLimit: 190,
    dialogue: [
      { speaker: "enemy", text: "Urgruth the Umber Elemental, Keeper of U, blocks the crossing!" },
      { speaker: "hero", text: "I\'ve come to restore the letters! Surrender them!" }
    ],
    rewards: { xp: 680, title: 'Seeker of U' },
    bossGate: { minCombinedStars: 14, levelIds: ['w3_l6', 'w3_l7'] },
    isMiniBoss: true,
    bossId: 'grizzlefang',
    miniBossUnlocksLetter: 'u',
    phases: 2,
  },
  {
    id: 'w3_l8',
    name: 'Festival of the Fire-Smiths',
    type: 'WoodlandFestival',
    world: 3,
    unlockedLetters: W3_AFTER_MB3,
    wordCount: 20,
    timeLimit: null,
    dialogue: [
      { speaker: "enemy", text: "The smiths of Grim Forge hold a naming festival." },
      { speaker: "hero", text: "Let\'s clear the path and move forward!" }
    ],
    rewards: { xp: 300 },
    bossGate: null,
  },
  {
    id: 'w3_l9',
    name: 'The Drake-Scholar\'s Rest',
    type: 'MonsterManual',
    world: 3,
    unlockedLetters: W3_AFTER_MB3,
    wordCount: 22,
    timeLimit: null,
    dialogue: [
      { speaker: "enemy", text: "A dragon scholar at Grudge Summit is cataloguing fire-type creatures." },
      { speaker: "hero", text: "Your reign of silence is over! Prepare yourself!" }
    ],
    rewards: { xp: 280 },
    bossGate: null,
  },
  {
    id: 'w3_mb4',
    name: 'The Gorgon\'s Pit',
    type: 'BossBattle',
    world: 3,
    unlockedLetters: W3_AFTER_MB3,
    wordCount: 52,
    timeLimit: 195,
    dialogue: [
      { speaker: "enemy", text: "Gorven the Gorgon Guard, Keeper of G, awaits at the pit!" },
      { speaker: "hero", text: "I\'ve come to restore the letters! Surrender them!" }
    ],
    rewards: { xp: 740, title: 'Seeker of G' },
    bossGate: { minCombinedStars: 16, levelIds: ['w3_l8', 'w3_l9'] },
    isMiniBoss: true,
    bossId: 'slime_king',
    miniBossUnlocksLetter: 'g',
    phases: 2,
  },
  {
    id: 'w3_boss',
    name: 'The Brass Citadel',
    type: 'BossBattle',
    world: 3,
    unlockedLetters: W3_AFTER_MB4,
    wordCount: 60,
    timeLimit: 240,
    dialogue: [
      { speaker: "enemy", text: "Gears turn and steam hisses — the mechanical dragon awakens!" },
      { speaker: "hero", text: "Your reign of silence is over! Prepare yourself!" }
    ],
    rewards: { xp: 1500, title: 'Dragon Slayer' },
    bossGate: { minCombinedStars: 20, levelIds: ['w3_mb1', 'w3_mb2', 'w3_mb3', 'w3_mb4'] },
    isBoss: true,
    bossId: 'clockwork_dragon',
    phases: 4,
  },
]
