const fs = require('fs');

let content = fs.readFileSync('src/utils/AudioHelper.ts', 'utf8');
content = content.replace(/this\.currentBGMKey = key;\n\s*this\.currentBGM = scene\.sound\.add\(key, \{ loop: true, volume \}\);\n\s*this\.currentBGM\.play\(\);/,
`this.currentBGMKey = key;
        this.currentBGM = scene.sound.add(key, { loop: true, volume });

        // Browsers block audio before interaction. Phaser handles this, but just to be safe:
        if (scene.sound.context.state === 'suspended') {
            scene.input.once('pointerdown', () => {
                if (scene.sound.context.state === 'suspended') {
                    scene.sound.context.resume();
                }
            });
            scene.input.keyboard?.once('keydown', () => {
                if (scene.sound.context.state === 'suspended') {
                    scene.sound.context.resume();
                }
            });
        }

        this.currentBGM.play();`);

fs.writeFileSync('src/utils/AudioHelper.ts', content);
console.log('Patched AudioHelper.ts');
