const { performance } = require('perf_hooks');

const NUM_GOBLINS = 1000;
const activeGoblins = Array.from({ length: NUM_GOBLINS }, (_, i) => ({
  word: `goblin_${i}`,
  x: Math.random() * 1000,
  speed: 10,
  hp: 1,
}));

function originalNearest() {
  return activeGoblins.reduce((minWord, g) => {
    if (minWord === null) return g.word;
    const minG = activeGoblins.find(x => x.word === minWord);
    return g.x < minG.x ? g.word : minWord;
  }, null);
}

function optimizedNearest() {
  let nearestGoblin = null;
  for (const g of activeGoblins) {
    if (!nearestGoblin || g.x < nearestGoblin.x) {
      nearestGoblin = g;
    }
  }
  return nearestGoblin ? nearestGoblin.word : null;
}

const numRuns = 100;

// Warmup
for (let i = 0; i < 10; i++) {
  originalNearest();
  optimizedNearest();
}

const start1 = performance.now();
for (let i = 0; i < numRuns; i++) {
  originalNearest();
}
const end1 = performance.now();

const start2 = performance.now();
for (let i = 0; i < numRuns; i++) {
  optimizedNearest();
}
const end2 = performance.now();

console.log(`Original: ${(end1 - start1).toFixed(3)} ms`);
console.log(`Optimized: ${(end2 - start2).toFixed(3)} ms`);
