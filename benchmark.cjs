const { performance } = require('perf_hooks');

function testOld(goblins) {
  return goblins.reduce((minWord, g) => {
    if (minWord === null) return g.word;
    const minG = goblins.find(x => x.word === minWord);
    return g.x < minG.x ? g.word : minWord;
  }, null);
}

function testNew(goblins) {
  let nearestGoblin = null;
  for (let i = 0; i < goblins.length; i++) {
    const g = goblins[i];
    if (!nearestGoblin || g.x < nearestGoblin.x) {
      nearestGoblin = g;
    }
  }
  return nearestGoblin ? nearestGoblin.word : null;
}

const numGoblins = 1000;
const goblins = [];
for (let i = 0; i < numGoblins; i++) {
  goblins.push({ word: 'word' + i, x: Math.random() * 1000 });
}

// Warm up
for (let i = 0; i < 100; i++) {
  testOld(goblins);
  testNew(goblins);
}

const iters = 1000;

const startOld = performance.now();
for (let i = 0; i < iters; i++) {
  testOld(goblins);
}
const endOld = performance.now();

const startNew = performance.now();
for (let i = 0; i < iters; i++) {
  testNew(goblins);
}
const endNew = performance.now();

console.log(`Old: ${endOld - startOld} ms`);
console.log(`New: ${endNew - startNew} ms`);
