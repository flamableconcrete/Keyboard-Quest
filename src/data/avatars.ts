export type HairStyle = 'short' | 'long' | 'mohawk' | 'bald' | 'spiky' | 'ponytail';
export type Accessory =
  | 'none'
  | 'helmet'
  | 'headband'
  | 'scar'
  | 'glasses'
  | 'beard'
  | 'eyepatch'
  | 'crown'
  | 'horns'
  | 'bandana';

export interface AvatarConfig {
  id: string;
  skinTone: number;
  hairStyle: HairStyle;
  hairColor: number;
  eyeColor: number;
  accessory: Accessory;
  shirtColor: number;
  pantsColor: number;
  shoeColor: number;
}

export const SKIN_TONES: number[] = [
  0xfde0c4, // light peach
  0xf5c8a0, // warm beige
  0xe8b88a, // light tan
  0xd4a574, // medium tan
  0xc08c5a, // olive
  0xa0724a, // brown
  0x8b5e3c, // medium brown
  0x6b4226, // dark brown
  0x4a2d12, // deep brown
  0x3b1e08, // very dark brown
];

export const SKIN_TONE_NAMES: Record<number, string> = {
  0xfde0c4: 'Light Peach',
  0xf5c8a0: 'Warm Beige',
  0xe8b88a: 'Light Tan',
  0xd4a574: 'Medium Tan',
  0xc08c5a: 'Olive',
  0xa0724a: 'Brown',
  0x8b5e3c: 'Medium Brown',
  0x6b4226: 'Dark Brown',
  0x4a2d12: 'Deep Brown',
  0x3b1e08: 'Very Dark Brown',
};

export const HAIR_STYLES: HairStyle[] = [
  'short',
  'long',
  'mohawk',
  'bald',
  'spiky',
  'ponytail',
];

export const HAIR_COLORS: number[] = [
  0x2c1b0e, // black
  0x4a3222, // dark brown
  0x7b4a2a, // brown
  0xa0522d, // auburn
  0xc8842a, // copper
  0xe8c44a, // blonde
  0xf5e6b8, // platinum blonde
  0xd43030, // red
  0x4a4a8a, // dark blue
  0x6b3a6b, // purple
  0x2e7d32, // forest green
  0xc0c0c0, // silver/gray
];

export const HAIR_COLOR_NAMES: Record<number, string> = {
  0x2c1b0e: 'Black',
  0x4a3222: 'Dark Brown',
  0x7b4a2a: 'Brown',
  0xa0522d: 'Auburn',
  0xc8842a: 'Copper',
  0xe8c44a: 'Blonde',
  0xf5e6b8: 'Platinum Blonde',
  0xd43030: 'Red',
  0x4a4a8a: 'Dark Blue',
  0x6b3a6b: 'Purple',
  0x2e7d32: 'Forest Green',
  0xc0c0c0: 'Silver/Gray',
};

export const EYE_COLORS: number[] = [
  0x4a3222, // dark brown
  0x7b4a2a, // brown
  0x2e7d32, // green
  0x1b5e20, // dark green
  0x1565c0, // blue
  0x0d47a1, // dark blue
  0x6a5acd, // slate blue
  0xbf360c, // amber
];

export const EYE_COLOR_NAMES: Record<number, string> = {
  0x4a3222: 'Dark Brown',
  0x7b4a2a: 'Brown',
  0x2e7d32: 'Green',
  0x1b5e20: 'Dark Green',
  0x1565c0: 'Blue',
  0x0d47a1: 'Dark Blue',
  0x6a5acd: 'Slate Blue',
  0xbf360c: 'Amber',
};

export const ACCESSORIES: Accessory[] = [
  'none',
  'helmet',
  'headband',
  'scar',
  'glasses',
  'beard',
  'eyepatch',
  'crown',
  'horns',
  'bandana',
];

export const SHIRT_COLORS: number[] = [
  0xff3b30, // red
  0xff9500, // orange
  0xffcc00, // yellow
  0x4cd964, // green
  0x5ac8fa, // light blue
  0x007aff, // blue
  0x5856d6, // purple
  0xff2d55, // pink
  0xffffff, // white
  0x8e8e93, // gray
  0x1c1c1e, // black
];

export const SHIRT_COLOR_NAMES: Record<number, string> = {
  0xff3b30: 'Red',
  0xff9500: 'Orange',
  0xffcc00: 'Yellow',
  0x4cd964: 'Green',
  0x5ac8fa: 'Light Blue',
  0x007aff: 'Blue',
  0x5856d6: 'Purple',
  0xff2d55: 'Pink',
  0xffffff: 'White',
  0x8e8e93: 'Gray',
  0x1c1c1e: 'Black',
};

export const PANTS_COLORS: number[] = [
  0x0a4a8f, // dark blue jeans
  0x2a7bcf, // light blue jeans
  0x222222, // black slacks
  0x444444, // dark gray slacks
  0x8b7355, // brown khakis
  0xc1a073, // light khakis
  0x3c3c3c, // dark shorts
  0x556b2f, // olive cargo
];

export const PANTS_COLOR_NAMES: Record<number, string> = {
  0x0a4a8f: 'Dark Blue Jeans',
  0x2a7bcf: 'Light Blue Jeans',
  0x222222: 'Black Slacks',
  0x444444: 'Dark Gray Slacks',
  0x8b7355: 'Brown Khakis',
  0xc1a073: 'Light Khakis',
  0x3c3c3c: 'Dark Shorts',
  0x556b2f: 'Olive Cargo',
};

export const SHOE_COLORS: number[] = [
  0x2c1b0e, // dark brown
  0x5a3d2b, // brown
  0x111111, // black
  0xeeeeee, // white
  0x888888, // gray
  0x8b0000, // dark red
];

export const SHOE_COLOR_NAMES: Record<number, string> = {
  0x2c1b0e: 'Dark Brown',
  0x5a3d2b: 'Brown',
  0x111111: 'Black',
  0xeeeeee: 'White',
  0x888888: 'Gray',
  0x8b0000: 'Dark Red',
};

function generateAvatarConfigs(): AvatarConfig[] {
  const configs: AvatarConfig[] = [];

  // Use offset primes for each attribute to avoid repeating patterns
  const skinOffset = 0;
  const hairStyleOffset = 3;
  const hairColorOffset = 7;
  const eyeColorOffset = 11;
const accessoryOffset = 5;
  const shirtColorOffset = 13;
  const pantsColorOffset = 17;
  const shoeColorOffset = 19;

  for (let i = 0; i < 30; i++) {
    const skinIndex = (i * 3 + skinOffset) % SKIN_TONES.length;
    const hairStyleIndex = (i * 2 + hairStyleOffset) % HAIR_STYLES.length;
    const hairColorIndex = (i * 5 + hairColorOffset) % HAIR_COLORS.length;
    const eyeColorIndex = (i * 3 + eyeColorOffset) % EYE_COLORS.length;
const accessoryIndex = (i * 7 + accessoryOffset) % ACCESSORIES.length;
    const shirtColorIndex = (i * 13 + shirtColorOffset) % SHIRT_COLORS.length;
    const pantsColorIndex = (i * 17 + pantsColorOffset) % PANTS_COLORS.length;
    const shoeColorIndex = (i * 19 + shoeColorOffset) % SHOE_COLORS.length;

    configs.push({
      id: `avatar_${i}`,
      skinTone: SKIN_TONES[skinIndex],
      hairStyle: HAIR_STYLES[hairStyleIndex],
      hairColor: HAIR_COLORS[hairColorIndex],
      eyeColor: EYE_COLORS[eyeColorIndex],
      accessory: ACCESSORIES[accessoryIndex],
      shirtColor: SHIRT_COLORS[shirtColorIndex],
      pantsColor: PANTS_COLORS[pantsColorIndex],
      shoeColor: SHOE_COLORS[shoeColorIndex],
    });
  }

  return configs;
}

export const AVATAR_CONFIGS: AvatarConfig[] = generateAvatarConfigs();

export function randomizeOneConfig(): AvatarConfig {
  return {
    id: `custom_${Date.now()}`,
    skinTone: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)],
    hairStyle: HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)],
    hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
    eyeColor: EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)],
    accessory: ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)],
    shirtColor: SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)],
    pantsColor: PANTS_COLORS[Math.floor(Math.random() * PANTS_COLORS.length)],
    shoeColor: SHOE_COLORS[Math.floor(Math.random() * SHOE_COLORS.length)],
  }
}

export function randomizeAvatarConfigs(): void {
  AVATAR_CONFIGS.length = 0;
  const ts = Date.now();
  for (let i = 0; i < 30; i++) {
AVATAR_CONFIGS.push({
      id: `avatar_${ts}_${i}`,
      skinTone: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)],
      hairStyle: HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)],
      hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
      eyeColor: EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)],
      accessory: ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)],
      shirtColor: SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)],
      pantsColor: PANTS_COLORS[Math.floor(Math.random() * PANTS_COLORS.length)],
      shoeColor: SHOE_COLORS[Math.floor(Math.random() * SHOE_COLORS.length)],
    });
  }
}
