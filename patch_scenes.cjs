const fs = require('fs');

function patchScene(file, importAudio, hookMethod, audioKey) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('AudioHelper')) {
    content = `import { AudioHelper } from '../utils/AudioHelper'\n` + content;
  }

  if (hookMethod === 'init' && !content.includes('init(')) {
    // If it doesn't have an init method, add one before create
    content = content.replace(/create\(\) \{/, `init() {\n    AudioHelper.playBGM(this, '${audioKey}');\n  }\n\n  create() {`);
  } else if (hookMethod === 'create' && content.includes('create() {')) {
    content = content.replace(/create\(\) \{/, `create() {\n    AudioHelper.playBGM(this, '${audioKey}');`);
  } else if (content.includes(`${hookMethod}() {`)) {
    content = content.replace(new RegExp(`${hookMethod}\\(\\)\\s*\\{`), `${hookMethod}() {\n    AudioHelper.playBGM(this, '${audioKey}');`);
  } else {
      console.log(`Failed to patch ${file}: ${hookMethod} not found`);
      return;
  }

  fs.writeFileSync(file, content);
  console.log(`Patched ${file} with ${audioKey}`);
}

patchScene('src/scenes/MainMenuScene.ts', true, 'create', 'bgm_menu');
patchScene('src/scenes/OverlandMapScene.ts', true, 'init', 'bgm_map');
patchScene('src/scenes/LevelScene.ts', true, 'create', 'bgm_level');
