import { ITEMS } from '../data/items'

const ITEMS_PER_CATEGORY = 5

export function getInitialShopItems(ownedItemIds: string[]): string[] {
  const shopItems: string[] = []
  const categories: ('weapon' | 'armor' | 'accessory')[] = ['weapon', 'armor', 'accessory']

  for (const cat of categories) {
    const availableItems = ITEMS.filter(
      (item) => item.slot === cat && item.goldCost > 0 && !ownedItemIds.includes(item.id)
    )

    // Shuffle and pick
    const shuffled = availableItems.sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, ITEMS_PER_CATEGORY).map((item) => item.id)
    shopItems.push(...selected)
  }

  return shopItems
}

export function rotateShopItems(currentShopItemIds: string[], ownedItemIds: string[], itemsToReplaceCount: number = Math.floor(Math.random() * 2) + 1): string[] {
  // We want to replace 1-2 items per restock by default

  const newShopItemIds = [...currentShopItemIds]

  // Filter out owned items first (if they somehow are still in the shop array)
  // This effectively removes any purchased items from the current shop state
  const unownedCurrentShopItems = newShopItemIds.filter((id) => !ownedItemIds.includes(id))

  // If we have fewer items than we should (due to purchases), we should replenish up to the limit per category
  const categories: ('weapon' | 'armor' | 'accessory')[] = ['weapon', 'armor', 'accessory']

  for (const cat of categories) {
    const currentCatItems = unownedCurrentShopItems.filter(
      (id) => ITEMS.find((item) => item.id === id)?.slot === cat
    )

    // How many items are missing in this category?
    const missingCount = ITEMS_PER_CATEGORY - currentCatItems.length
    if (missingCount > 0) {
      const availableItems = ITEMS.filter(
        (item) => item.slot === cat && item.goldCost > 0 && !ownedItemIds.includes(item.id) && !unownedCurrentShopItems.includes(item.id)
      )
      const shuffled = availableItems.sort(() => 0.5 - Math.random())
      const selected = shuffled.slice(0, missingCount).map((item) => item.id)
      unownedCurrentShopItems.push(...selected)
    }
  }

  // Now perform the 1-2 item rotation
  // Pick random indices to replace
  let replaceableIndices = [...Array(unownedCurrentShopItems.length).keys()]
  replaceableIndices = replaceableIndices.sort(() => 0.5 - Math.random()).slice(0, itemsToReplaceCount)

  for (const index of replaceableIndices) {
    const itemIdToReplace = unownedCurrentShopItems[index]
    const itemToReplace = ITEMS.find((i) => i.id === itemIdToReplace)

    if (itemToReplace) {
      const availableItems = ITEMS.filter(
        (item) => item.slot === itemToReplace.slot && item.goldCost > 0 && !ownedItemIds.includes(item.id) && !unownedCurrentShopItems.includes(item.id)
      )

      if (availableItems.length > 0) {
        const newItem = availableItems[Math.floor(Math.random() * availableItems.length)]
        unownedCurrentShopItems[index] = newItem.id
      }
    }
  }

  return unownedCurrentShopItems
}
