import { describe, it, expect } from 'vitest'
import { WrongKeyAttackController } from './WrongKeyAttackController'

describe('WrongKeyAttackController', () => {
  it('returns no event when threshold is not reached', () => {
    const ctrl = new WrongKeyAttackController({ threshold: 5 })
    expect(ctrl.recordWrongKey()).toEqual([])
    expect(ctrl.recordWrongKey()).toEqual([])
  })

  it('returns attack event when threshold is reached', () => {
    const ctrl = new WrongKeyAttackController({ threshold: 3 })
    ctrl.recordWrongKey()
    ctrl.recordWrongKey()
    const events = ctrl.recordWrongKey()
    expect(events).toEqual([{ type: 'enemy_attacks' }])
  })

  it('resets counter after attack so next threshold counts fresh', () => {
    const ctrl = new WrongKeyAttackController({ threshold: 2 })
    ctrl.recordWrongKey()
    ctrl.recordWrongKey() // attack fires
    ctrl.recordWrongKey() // counter resets → no attack yet
    const events = ctrl.recordWrongKey() // second attack
    expect(events).toEqual([{ type: 'enemy_attacks' }])
  })
})
