// src/controllers/KitchenController.ts
// Pure TypeScript — NO Phaser imports.

export type KitchenEvent =
  | { type: 'order_complete'; seatId: string }
  | { type: 'walkoff'; seatId: string }
  | { type: 'quota_reached' }
  | { type: 'game_over' }

export interface OrderState {
  seatId: string
  ingredients: string[]
  currentIngredientIndex: number
  patience: number      // 0.0 – 1.0
  patienceRate: number  // fraction drained per second (derived from ingredient count + world)
}

export interface KitchenConfig {
  orderQuota: number
  maxWalkoffs: number
  worldNumber: number
  /** Override patience rate (per second) for all orders — used in tests to drain patience quickly. */
  patienceRate?: number
  rng?: () => number
}

export class KitchenController {
  private _orders: OrderState[] = []
  private _ordersFilled = 0
  private _walkoffs = 0

  constructor(private config: KitchenConfig) {}

  get activeOrders(): ReadonlyArray<OrderState> { return this._orders }
  get ordersFilled() { return this._ordersFilled }
  get walkoffs() { return this._walkoffs }
  get isQuotaReached() { return this._ordersFilled >= this.config.orderQuota }

  addOrder(seatId: string, ingredients: string[]): void {
    const patienceDuration = Math.max(10, 70 - ingredients.length * 10)
    const patienceRate = this.config.patienceRate ?? (1 / patienceDuration)
    this._orders.push({
      seatId,
      ingredients,
      currentIngredientIndex: 0,
      patience: 1.0,
      patienceRate,
    })
  }

  completeIngredient(seatId: string, word: string): KitchenEvent[] {
    const order = this._orders.find(o => o.seatId === seatId)
    if (!order) return []
    if (order.ingredients[order.currentIngredientIndex] !== word) return []

    order.currentIngredientIndex++
    if (order.currentIngredientIndex < order.ingredients.length) return []

    // All ingredients done — order complete
    this._orders = this._orders.filter(o => o !== order)
    this._ordersFilled++
    const events: KitchenEvent[] = [{ type: 'order_complete', seatId }]
    if (this._ordersFilled >= this.config.orderQuota) {
      events.push({ type: 'quota_reached' })
    }
    return events
  }

  tick(delta: number): KitchenEvent[] {
    const events: KitchenEvent[] = []
    const dt = delta / 1000

    const walkedOff: OrderState[] = []
    this._orders.forEach(order => {
      order.patience -= order.patienceRate * dt
      if (order.patience <= 0) {
        order.patience = 0
        walkedOff.push(order)
      }
    })

    walkedOff.forEach(order => {
      this._orders = this._orders.filter(o => o !== order)
      this._walkoffs++
      events.push({ type: 'walkoff', seatId: order.seatId })
      if (this._walkoffs >= this.config.maxWalkoffs) {
        events.push({ type: 'game_over' })
      }
    })

    return events
  }
}
