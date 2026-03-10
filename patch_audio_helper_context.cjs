const fs = require('fs');

let content = fs.readFileSync('src/utils/AudioHelper.ts', 'utf8');

// The `context` is part of `WebAudioSoundManager`, but TS doesn't know what kind of SoundManager we have.
// We can cast `scene.sound as Phaser.Sound.WebAudioSoundManager`

content = content.replace(/scene\.sound\.context/g, '(scene.sound as Phaser.Sound.WebAudioSoundManager).context');

fs.writeFileSync('src/utils/AudioHelper.ts', content);
console.log('Patched AudioHelper.ts for TypeScript context casting');
