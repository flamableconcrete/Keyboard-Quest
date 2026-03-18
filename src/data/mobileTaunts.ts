import type { LevelType } from '../types';

export const mobileTaunts: Record<string, string[]> = {
  // --- Keyed by bossId ---
  grizzlefang: [
    "Grizzlefang yawns. \"You dare face me... on a PHONE? Come back with a proper keyboard, whelp.\"",
  ],
  knuckle_keeper_of_e: [
    "\"Eee! You think you can type on THAT tiny thing? Come back with real keys!\"",
  ],
  shadow_scribe: [
    "The Shadow Scribe's quill hovers mockingly. \"No keyboard? Then you cannot write your own fate.\"",
  ],

  // --- Keyed by LevelType ---
  GoblinWhacker: [
    "Ha! You brought a tiny little screen? Come back with a real weapon... er, keyboard!",
    "The goblin snickers. \"Can't even type on that thing! Shoo!\"",
  ],
  SkeletonSwarm: [
    "These old bones have waited centuries for a challenger... and you show up on a PHONE?",
  ],
  MonsterArena: [
    "The arena master shakes his head. \"No keyboard, no entry. Rules are rules.\"",
  ],
  UndeadSiege: [
    "The undead horde pauses, confused. \"Where's your keyboard, mortal?\"",
  ],
  SlimeSplitting: [
    "*jiggles smugly* Even I know you need a keyboard for this...",
  ],
  DungeonTrapDisarm: [
    "\"These traps require precise keystrokes. Your thumbs won't cut it.\"",
  ],
  DungeonPlatformer: [
    "\"The dungeon demands a keyboard, adventurer. Come back prepared.\"",
  ],
  DungeonEscape: [
    "\"You can't escape a dungeon on a phone! Come back with a keyboard!\"",
  ],
  PotionBrewingLab: [
    "\"Potions require precise ingredients — typed precisely. On a real keyboard.\"",
  ],
  MagicRuneTyping: [
    "The runes dim. \"These ancient symbols demand a proper keyboard to invoke.\"",
  ],
  MonsterManual: [
    "\"The manual is too complex for thumbs. Return with a keyboard, scholar.\"",
  ],
  GuildRecruitment: [
    "\"Guild applications require a keyboard, recruit. Come back properly equipped!\"",
  ],
  CharacterCreator: [
    "\"Even heroes need a proper keyboard to begin their journey!\"",
  ],
  WoodlandFestival: [
    "\"The festival games need nimble fingers on real keys, not a tiny screen!\"",
  ],
  BossBattle: [
    "The boss crosses their arms. \"Come back when you have a real keyboard, adventurer.\"",
  ],
};

export const fallbackTaunt = "You'll need a real keyboard to face me. Come back on a computer!";

export function getTaunt(bossId: string | undefined, levelType: LevelType): string {
  if (bossId && mobileTaunts[bossId]) {
    const taunts = mobileTaunts[bossId];
    return taunts[Math.floor(Math.random() * taunts.length)];
  }
  if (mobileTaunts[levelType]) {
    const taunts = mobileTaunts[levelType];
    return taunts[Math.floor(Math.random() * taunts.length)];
  }
  return fallbackTaunt;
}
