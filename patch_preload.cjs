const fs = require('fs');

let fileContent = fs.readFileSync('src/scenes/PreloadScene.ts', 'utf8');

if (!fileContent.includes("generateThemeMusic")) {
    const importStr = "import { generateThemeMusic } from '../utils/musicGenerator'\n";
    fileContent = importStr + fileContent;
}

const createMethodRegex = /create\(\) \{\n\s*AvatarRenderer\.generateAll\(this\)\n\s*\}/g;

const replaceContent = `async create() {
    AvatarRenderer.generateAll(this)

    const loadingText = this.add.text(this.scale.width / 2, this.scale.height * 0.7, 'Synthesizing Audio...', {
      fontSize: '20px', color: '#ffffff'
    }).setOrigin(0.5);

    try {
      const themes = [
        { key: 'bgm_menu', seed: 'MainMenuTheme123' },
        { key: 'bgm_map', seed: 'OverworldMapHappy' },
        { key: 'bgm_level', seed: 'ChillTypingLevel' }
      ];

      for (const t of themes) {
        const audioBuffer = await generateThemeMusic(t.seed);
        this.cache.audio.add(t.key, audioBuffer);
      }
    } catch (e) {
      console.warn('Audio synthesis failed or not supported:', e);
    }

    loadingText.destroy();
    this.scene.start('MainMenu');
  }`;

fileContent = fileContent.replace(createMethodRegex, replaceContent);

// Remove the hardcoded transition if it exists
fileContent = fileContent.replace(/this\.scene\.start\('MainMenu'\)\n\s*\}\n/g, "");

fs.writeFileSync('src/scenes/PreloadScene.ts', fileContent);
console.log("Patched PreloadScene.ts");
