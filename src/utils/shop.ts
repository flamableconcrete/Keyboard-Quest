import { ITEMS } from '../data/items'

const ITEMS_PER_CATEGORY = 3
const PREVIEW_COUNT = 2

type GearSlot = 'weapon' | 'armor' | 'accessory'

function gearItems(slot: GearSlot, ownedIds: string[], maxWorld: number) {
  return ITEMS.filter(
    item =>
      item.slot === slot &&
      item.goldCost > 0 &&
      item.worldUnlock <= maxWorld &&
      !ownedIds.includes(item.id)
  )
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random())
}

/** Called on new profile creation. Initialises the shop with World 1 common items. */
export function getInitialShopItems(ownedItemIds: string[]): string[] {
  const slots: GearSlot[] = ['weapon', 'armor', 'accessory']
  const result: string[] = []
  for (const slot of slots) {
    const available = gearItems(slot, ownedItemIds, 1)
    result.push(...shuffle(available).slice(0, ITEMS_PER_CATEGORY).map(i => i.id))
  }
  return result
}

/** Called on new profile creation. Picks 1-2 next-tier preview items. */
export function getInitialPreviewItems(ownedItemIds: string[], playerWorld: number): string[] {
  const nextWorld = playerWorld + 1
  if (nextWorld > 5) return []
  const available = ITEMS.filter(
    item =>
      item.slot !== 'consumable' &&
      item.slot !== 'trophy' &&
      item.goldCost > 0 &&
      item.worldUnlock === nextWorld &&
      !ownedItemIds.includes(item.id)
  )
  return shuffle(available).slice(0, PREVIEW_COUNT).map(i => i.id)
}

/**
 * Rotates current-tier shop items (1-2 items replaced).
 * Called after buying or boss defeat for current-tier items only.
 */
export function rotateShopItems(
  currentShopItemIds: string[],
  ownedItemIds: string[],
  playerWorld: number,
  itemsToReplaceCount: number = Math.floor(Math.random() * 2) + 1
): string[] {
  const slots: GearSlot[] = ['weapon', 'armor', 'accessory']
  let items = currentShopItemIds.filter(id => !ownedItemIds.includes(id))

  // Replenish any missing slots first
  for (const slot of slots) {
    const currentCount = items.filter(id => ITEMS.find(i => i.id === id)?.slot === slot).length
    const missing = ITEMS_PER_CATEGORY - currentCount
    if (missing > 0) {
      const pool = gearItems(slot, ownedItemIds, playerWorld).filter(i => !items.includes(i.id))
      items.push(...shuffle(pool).slice(0, missing).map(i => i.id))
    }
  }

  // Replace 1-2 items randomly
  const replaceIndices = shuffle([...items.keys()]).slice(0, itemsToReplaceCount)
  for (const idx of replaceIndices) {
    const outgoing = ITEMS.find(i => i.id === items[idx])
    if (!outgoing || outgoing.slot === 'trophy' || outgoing.slot === 'consumable') continue
    const pool = gearItems(outgoing.slot as GearSlot, ownedItemIds, playerWorld).filter(i => !items.includes(i.id))
    if (pool.length > 0) {
      items[idx] = pool[Math.floor(Math.random() * pool.length)].id
    }
  }

  return items
}

/**
 * Reshuffles the next-tier preview slots. Called on boss/mini-boss defeat.
 */
export function refreshPreviewItems(ownedItemIds: string[], playerWorld: number): string[] {
  return getInitialPreviewItems(ownedItemIds, playerWorld)
}

/** Returns all consumable item IDs (consumables are always available; stock is not depleted). */
export function getAvailableConsumables(_ownedItemIds: string[]): string[] {
  return ITEMS
    .filter(item => item.slot === 'consumable')
    .map(item => item.id)
}
