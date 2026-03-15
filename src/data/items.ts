import { ItemData } from '../types'

export const ITEMS: ItemData[] = [
  // --- ORIGINAL ITEMS (For backwards compatibility) ---
  {
    id: 'rusty_quill',
    name: 'Rusty Quill',
    slot: 'weapon',
    rarity: 'common',
    description: 'A worn writing quill. Still works.',
    goldCost: 0,
    effect: { power: 1 },
  },
  {
    id: 'ink_blotter',
    name: 'Ink Blotter',
    slot: 'armor',
    rarity: 'common',
    description: 'Absorbs minor stains and spells.',
    goldCost: 0,
    effect: { hp: 1 },
  },
  {
    id: 'iron_gauntlet',
    name: 'Iron Gauntlet',
    slot: 'armor',
    rarity: 'uncommon',
    description: 'Heavy but protective.',
    goldCost: 0,
    effect: { hp: 2 },
  },
  {
    id: 'focus_ring',
    name: 'Focus Ring',
    slot: 'accessory',
    rarity: 'common',
    description: 'Sharpens the mind.',
    goldCost: 0,
    effect: { focusBonus: 5 },
  },
  {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    slot: 'accessory',
    rarity: 'common',
    description: 'Increases gold earned.',
    goldCost: 0,
    effect: { goldMultiplier: 0.1 },
  },
  {
    id: 'obsidian_nib',
    name: 'Obsidian Nib',
    slot: 'weapon',
    rarity: 'uncommon',
    description: 'A sharp nib made of volcanic glass.',
    goldCost: 0,
    effect: { power: 3 },
  },
  {
    id: 'padded_envelope',
    name: 'Padded Envelope',
    slot: 'armor',
    rarity: 'uncommon',
    description: 'Soft and surprisingly durable.',
    goldCost: 0,
    effect: { hp: 3 },
  },
  {
    id: 'scholars_monocle',
    name: 'Scholars Monocle',
    slot: 'accessory',
    rarity: 'uncommon',
    description: 'Better clarity for faster typing.',
    goldCost: 0,
    effect: { focusBonus: 10 },
  },

  // --- SHOP WEAPONS ---
  {
    id: 'copper_shortsword',
    name: 'Copper Shortsword',
    slot: 'weapon',
    rarity: 'common',
    description: 'A basic blade. Sometimes cuts through two weak foes.',
    goldCost: 50,
    effect: { power: 1, defeatAdditionalEnemiesChance: 0.1 },
  },
  {
    id: 'iron_broadsword',
    name: 'Iron Broadsword',
    slot: 'weapon',
    rarity: 'uncommon',
    description: 'Heavy and reliable. Good for crowd control.',
    goldCost: 150,
    effect: { power: 2, defeatAdditionalEnemiesChance: 0.2 },
  },
  {
    id: 'steel_longsword',
    name: 'Steel Longsword',
    slot: 'weapon',
    rarity: 'rare',
    description: 'A finely crafted longsword. Cuts with precision.',
    goldCost: 350,
    effect: { power: 3, defeatAdditionalEnemiesChance: 0.35 },
  },
  {
    id: 'mithril_blade',
    name: 'Mithril Blade',
    slot: 'weapon',
    rarity: 'epic',
    description: 'Light as a feather, sharp as a dragon\'s tooth.',
    goldCost: 800,
    effect: { power: 5, defeatAdditionalEnemiesChance: 0.5 },
  },
  {
    id: 'excalibur',
    name: 'Excalibur',
    slot: 'weapon',
    rarity: 'epic',
    description: 'A legendary sword that cleaves through darkness.',
    goldCost: 2000,
    effect: { power: 8, defeatAdditionalEnemiesChance: 0.75 },
  },

  // --- ARMOR ---
  {
    id: 'leather_tunic',
    name: 'Leather Tunic',
    slot: 'armor',
    rarity: 'common',
    description: 'Stiff leather that might deflect a glancing blow.',
    goldCost: 40,
    effect: { absorbAttacksChance: 0.1 },
  },
  {
    id: 'chainmail_shirt',
    name: 'Chainmail Shirt',
    slot: 'armor',
    rarity: 'uncommon',
    description: 'Interlocking iron rings protect against slashes.',
    goldCost: 120,
    effect: { absorbAttacksChance: 0.2 },
  },
  {
    id: 'steel_plate',
    name: 'Steel Plate',
    slot: 'armor',
    rarity: 'rare',
    description: 'Solid steel plating. Slows you down but takes a beating.',
    goldCost: 300,
    effect: { absorbAttacksChance: 0.35 },
  },
  {
    id: 'dragon_scale_mail',
    name: 'Dragon Scale Mail',
    slot: 'armor',
    rarity: 'epic',
    description: 'Impenetrable scales from a fallen beast.',
    goldCost: 750,
    effect: { absorbAttacksChance: 0.5 },
  },
  {
    id: 'aegis_armor',
    name: 'Aegis Armor',
    slot: 'armor',
    rarity: 'epic',
    description: 'Blessed by the gods to ward off harm.',
    goldCost: 1800,
    effect: { absorbAttacksChance: 0.75 },
  },

  // --- ACCESSORIES ---
  {
    id: 'lucky_coin',
    name: 'Lucky Coin',
    slot: 'accessory',
    rarity: 'common',
    description: 'A coin that sometimes doubles your earnings.',
    goldCost: 60,
    effect: { bonusGoldChance: 0.15 },
  },
  {
    id: 'hunters_charm',
    name: 'Hunter\'s Charm',
    slot: 'accessory',
    rarity: 'uncommon',
    description: 'Increases gold earned from enemies.',
    goldCost: 100,
    effect: { goldMultiplier: 0.15 },
  },
  {
    id: 'golden_idol',
    name: 'Golden Idol',
    slot: 'accessory',
    rarity: 'rare',
    description: 'Attracts wealth to its bearer.',
    goldCost: 250,
    effect: { bonusGoldChance: 0.3 },
  },
  {
    id: 'taming_bell',
    name: 'Taming Bell',
    slot: 'accessory',
    rarity: 'epic',
    description: 'Its soothing ring attracts gold.',
    goldCost: 400,
    effect: { goldMultiplier: 0.3 },
  },
  {
    id: 'midas_ring',
    name: 'Ring of Midas',
    slot: 'accessory',
    rarity: 'epic',
    description: 'Turns fallen foes into pure gold.',
    goldCost: 1000,
    effect: { bonusGoldChance: 0.6 },
  },

  // --- MASTERY TROPHIES (auto-awarded for world mastery) ---
  {
    id: 'mastery_speed_boots',
    name: 'Speed Boots',
    slot: 'trophy',
    rarity: 'epic',
    description: 'Awarded for mastering World 1. Sharpens reflexes.',
    goldCost: 0,
    effect: { focusBonus: 15 },
  },
  {
    id: 'mastery_arcane_focus',
    name: 'Arcane Focus',
    slot: 'trophy',
    rarity: 'epic',
    description: 'Awarded for mastering World 2. Channels arcane energy.',
    goldCost: 0,
    effect: { power: 4 },
  },
  {
    id: 'mastery_shadow_cloak',
    name: 'Shadow Cloak',
    slot: 'trophy',
    rarity: 'epic',
    description: 'Awarded for mastering World 3. Wraps you in shadow.',
    goldCost: 0,
    effect: { absorbAttacksChance: 0.4 },
  },
  {
    id: 'mastery_forest_crown',
    name: 'Forest Crown',
    slot: 'trophy',
    rarity: 'epic',
    description: 'Awarded for mastering World 4. Crown of the woodland.',
    goldCost: 0,
    effect: { bonusGoldChance: 0.4 },
  },
  {
    id: 'mastery_quill_of_power',
    name: 'Quill of Power',
    slot: 'trophy',
    rarity: 'epic',
    description: 'Awarded for mastering World 5. The mightiest quill.',
    goldCost: 0,
    effect: { power: 6, focusBonus: 10 },
  },
]

export const MASTERY_ITEMS: Record<number, string> = {
  1: 'mastery_speed_boots',
  2: 'mastery_arcane_focus',
  3: 'mastery_shadow_cloak',
  4: 'mastery_forest_crown',
  5: 'mastery_quill_of_power',
}

export function getItem(id: string): ItemData | undefined {
  return ITEMS.find((i) => i.id === id)
}

export function getItemColor(rarity?: string): string {
  switch (rarity) {
    case 'uncommon':
      return '#1eff00'
    case 'rare':
      return '#0070dd'
    case 'epic':
      return '#a335ee'
    case 'common':
    default:
      return '#ffffff'
  }
}
