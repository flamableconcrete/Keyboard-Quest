// src/controllers/KitchenController.test.ts
import { describe, it, expect } from 'vitest'
import { KitchenController } from './KitchenController'

const baseConfig = {
  orderQuota: 4,
  maxWalkoffs: 2,
  worldNumber: 1,
  rng: () => 0.5,
}

describe('KitchenController — order management', () => {
  it('starts with no orders', () => {
    const ctrl = new KitchenController(baseConfig)
    expect(ctrl.activeOrders.length).toBe(0)
  })

  it('addOrder creates an order with patience = 1.0', () => {
    const ctrl = new KitchenController(baseConfig)
    ctrl.addOrder('seat_0', ['ant', 'bat'])
    expect(ctrl.activeOrders.length).toBe(1)
    expect(ctrl.activeOrders[0].patience).toBeCloseTo(1.0)
  })

  it('completeIngredient advances currentIngredientIndex', () => {
    const ctrl = new KitchenController(baseConfig)
    ctrl.addOrder('seat_0', ['ant', 'bat'])
    ctrl.completeIngredient('seat_0', 'ant')
    expect(ctrl.activeOrders[0].currentIngredientIndex).toBe(1)
  })

  it('completeIngredient on final ingredient fires order_complete event', () => {
    const ctrl = new KitchenController(baseConfig)
    ctrl.addOrder('seat_0', ['ant'])
    const events = ctrl.completeIngredient('seat_0', 'ant')
    expect(events.find(e => e.type === 'order_complete')).toBeDefined()
  })

  it('ordersFilled increments on order_complete', () => {
    const ctrl = new KitchenController(baseConfig)
    ctrl.addOrder('seat_0', ['ant'])
    ctrl.completeIngredient('seat_0', 'ant')
    expect(ctrl.ordersFilled).toBe(1)
  })

  it('returns quota_reached when ordersFilled hits orderQuota', () => {
    const ctrl = new KitchenController({ ...baseConfig, orderQuota: 1 })
    ctrl.addOrder('seat_0', ['ant'])
    const events = ctrl.completeIngredient('seat_0', 'ant')
    expect(events.find(e => e.type === 'quota_reached')).toBeDefined()
  })
})

describe('KitchenController — patience decay', () => {
  it('tick reduces patience over time', () => {
    const ctrl = new KitchenController(baseConfig)
    ctrl.addOrder('seat_0', ['ant', 'bat', 'cat'])
    const before = ctrl.activeOrders[0].patience
    ctrl.tick(1000)
    expect(ctrl.activeOrders[0].patience).toBeLessThan(before)
  })

  it('tick fires walkoff event when patience hits 0', () => {
    const ctrl = new KitchenController({ ...baseConfig, patienceRate: 10 })
    ctrl.addOrder('seat_0', ['ant'])
    const events: ReturnType<typeof ctrl.tick> = []
    for (let i = 0; i < 100; i++) {
      events.push(...ctrl.tick(500))
    }
    expect(events.find(e => e.type === 'walkoff')).toBeDefined()
  })

  it('walkoffs increments on walkoff event', () => {
    const ctrl = new KitchenController({ ...baseConfig, patienceRate: 10 })
    ctrl.addOrder('seat_0', ['ant'])
    for (let i = 0; i < 100; i++) ctrl.tick(500)
    expect(ctrl.walkoffs).toBe(1)
  })

  it('returns game_over when walkoffs exceeds maxWalkoffs', () => {
    const ctrl = new KitchenController({ ...baseConfig, maxWalkoffs: 1, patienceRate: 10 })
    ctrl.addOrder('seat_0', ['ant'])
    const events: ReturnType<typeof ctrl.tick> = []
    for (let i = 0; i < 200; i++) {
      events.push(...ctrl.tick(500))
    }
    expect(events.find(e => e.type === 'game_over')).toBeDefined()
  })
})
