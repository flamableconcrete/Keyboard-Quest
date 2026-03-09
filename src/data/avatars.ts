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
}

const SKIN_TONES: number[] = [
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

const HAIR_STYLES: HairStyle[] = [
  'short',
  'long',
  'mohawk',
  'bald',
  'spiky',
  'ponytail',
];

const HAIR_COLORS: number[] = [
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

const EYE_COLORS: number[] = [
  0x4a3222, // dark brown
  0x7b4a2a, // brown
  0x2e7d32, // green
  0x1b5e20, // dark green
  0x1565c0, // blue
  0x0d47a1, // dark blue
  0x6a5acd, // slate blue
  0xbf360c, // amber
];

const ACCESSORIES: Accessory[] = [
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

function generateAvatarConfigs(): AvatarConfig[] {
  const configs: AvatarConfig[] = [];

  // Use offset primes for each attribute to avoid repeating patterns
  const skinOffset = 0;
  const hairStyleOffset = 3;
  const hairColorOffset = 7;
  const eyeColorOffset = 11;
  const accessoryOffset = 5;

  for (let i = 0; i < 30; i++) {
    const skinIndex = (i * 3 + skinOffset) % SKIN_TONES.length;
    const hairStyleIndex = (i * 2 + hairStyleOffset) % HAIR_STYLES.length;
    const hairColorIndex = (i * 5 + hairColorOffset) % HAIR_COLORS.length;
    const eyeColorIndex = (i * 3 + eyeColorOffset) % EYE_COLORS.length;
    const accessoryIndex = (i * 7 + accessoryOffset) % ACCESSORIES.length;

    configs.push({
      id: `avatar_${i}`,
      skinTone: SKIN_TONES[skinIndex],
      hairStyle: HAIR_STYLES[hairStyleIndex],
      hairColor: HAIR_COLORS[hairColorIndex],
      eyeColor: EYE_COLORS[eyeColorIndex],
      accessory: ACCESSORIES[accessoryIndex],
    });
  }

  return configs;
}

export const AVATAR_CONFIGS: AvatarConfig[] = generateAvatarConfigs();
