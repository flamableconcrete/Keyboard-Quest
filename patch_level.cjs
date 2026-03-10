const fs = require('fs');
let content = fs.readFileSync('src/scenes/LevelScene.ts', 'utf8');

content = content.replace(/create\(\) \{\n    AudioHelper\.playBGM\(this, 'bgm_level'\);\}\n\}/,
`create() {
    AudioHelper.playBGM(this, 'bgm_level');
  }
}`);

fs.writeFileSync('src/scenes/LevelScene.ts', content);
