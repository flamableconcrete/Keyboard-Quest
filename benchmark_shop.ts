import { getInitialShopItems, rotateShopItems } from './src/utils/shop';
import { ITEMS } from './src/data/items';

// Create a large number of dummy items if needed, or just run many iterations.
const iterations = 10000;

function runBenchmark() {
  const allItemIds = ITEMS.map(i => i.id);
  const ownedItemIds = allItemIds.slice(0, Math.floor(allItemIds.length / 2));
  let currentShopItemIds = getInitialShopItems(ownedItemIds);

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    currentShopItemIds = rotateShopItems(currentShopItemIds, ownedItemIds, 2);
  }
  const end = performance.now();

  console.log(`Benchmark completed in ${end - start} ms`);
}

runBenchmark();
