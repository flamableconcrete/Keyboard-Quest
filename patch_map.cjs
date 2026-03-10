const fs = require('fs');
let content = fs.readFileSync('src/scenes/OverlandMapScene.ts', 'utf8');

if (!content.includes('AudioHelper')) {
  content = `import { AudioHelper } from '../utils/AudioHelper'\n` + content;
}

content = content.replace(/init\(data: \{ profileSlot: number; world\?: number \}\) \{/,
  `init(data: { profileSlot: number; world?: number }) {\n    AudioHelper.playBGM(this, 'bgm_map');`);

fs.writeFileSync('src/scenes/OverlandMapScene.ts', content);
console.log('Patched OverlandMapScene.ts');
