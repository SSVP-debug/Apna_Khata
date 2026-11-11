import { describe, expect, it } from 'vitest'
import { balanceOf, customerStats, isPaidUp, todayTotals, withRunning } from './ledger'
import type { Entry } from './types'

const entry = (overrides: Partial<Entry>): Entry => ({
  id: 'id', customerId: 'customer', type: 'bill', sign: 1, amountPaise: 10000,
  occurredAt: Date.now(), createdBy: 'owner', ...overrides,
})

describe('ledger calculations', () => {
  it('calculates outstanding balance from signed entries', () => {
    expect(balanceOf([entry({ amountPaise: 12000 }), entry({ id: 'p', type: 'payment', sign: -1, amountPaise: 2000 })])).toBe(10000)
  })
  it('marks payments as paid up only when a payment or history exists', () => {
    expect(isPaidUp(customerStats([entry({ type: 'bill' })]).get('customer'))).toBe(false)
    expect(isPaidUp(customerStats([entry({ type: 'bill' }), entry({ id: 'p', type: 'payment', sign: -1 })]).get('customer'))).toBe(true)
  })
  it('ignores a payment reversed later when selecting last payment date', () => {
    const stats = customerStats([
      entry({ id: 'bill', type: 'bill' }),
      entry({ id: 'pay', type: 'payment', sign: -1, occurredAt: 2 }),
      entry({ id: 'rev', type: 'reversal', sign: 1, reverses: 'pay', occurredAt: 3 }),
    ])
    expect(stats.get('customer')?.lastPaymentAt).toBeNull()
  })
  it('calculates running balances in date order', () => {
    expect(withRunning([
      entry({ id: 'later', occurredAt: 20, amountPaise: 2000 }),
      entry({ id: 'earlier', occurredAt: 10, amountPaise: 1000 }),
    ]).map((item) => item.running)).toEqual([1000, 3000])
  })
  it('counts a cancelled bill as zero in today's sales', () => {
    const now = Date.now()
    expect(todayTotals([
      entry({ id: 'bill', occurredAt: now }),
      entry({ id: 'reverse', type: 'reversal', sign: -1, reverses: 'bill', occurredAt: now + 1 }),
    ]).sales).toBe(0)
  })
})
