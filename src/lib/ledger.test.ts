import { describe, expect, it } from 'vitest'
import { balanceOf, customerStats, isPaidUp, todayTotals, withRunning } from './ledger'
import type { Entry } from './types'

const entry = (overrides: Partial<Entry>): Entry => ({
  id: 'id', customerId: 'customer', type: 'bill', sign: 1, amountPaise: 10000,
  occurredAt: Date.now(), createdBy: 'owner', ...overrides,
})

describe('ledger calculations', () => {
  it('calculates an outstanding balance from signed records', () => {
    expect(balanceOf([entry({ amountPaise: 12000 }), entry({ id: 'p', type: 'payment', sign: -1, amountPaise: 2000 })])).toBe(10000)
  })
  it('marks a customer as paid up only when there is history and no amount left', () => {
    expect(isPaidUp(customerStats([entry({ type: 'bill' })]).get('customer'))).toBe(false)
    expect(isPaidUp(customerStats([entry({ type: 'bill' }), entry({ id: 'p', type: 'payment', sign: -1 })]).get('customer'))).toBe(true)
  })
  it('does not treat a cancelled payment as the last payment', () => {
    const stats = customerStats([
      entry({ id: 'bill', type: 'bill' }),
      entry({ id: 'pay', type: 'payment', sign: -1, occurredAt: 2 }),
      entry({ id: 'rev', type: 'reversal', sign: 1, reverses: 'pay', occurredAt: 3 }),
    ])
    expect(stats.get('customer')?.lastPaymentAt).toBeNull()
  })
  it('calculates running balances from oldest to newest', () => {
    expect(withRunning([
      entry({ id: 'later', occurredAt: 20, amountPaise: 2000 }),
      entry({ id: 'earlier', occurredAt: 10, amountPaise: 1000 }),
    ]).map((item) => item.running)).toEqual([1000, 3000])
  })
  it('removes a cancelled bill from today sales', () => {
    const now = Date.now()
    expect(todayTotals([
      entry({ id: 'bill', occurredAt: now }),
      entry({ id: 'reverse', type: 'reversal', sign: -1, reverses: 'bill', occurredAt: now + 1 }),
    ]).sales).toBe(0)
  })
  it('counts only bills and payments recorded today', () => {
    const now = Date.now()
    const yesterday = now - 2 * 86400000
    expect(todayTotals([
      entry({ id: 'old-bill', occurredAt: yesterday }),
      entry({ id: 'today-bill', occurredAt: now, amountPaise: 3500 }),
      entry({ id: 'today-payment', type: 'payment', sign: -1, amountPaise: 1500, occurredAt: now }),
    ])).toEqual({ sales: 3500, payments: 1500 })
  })
  it('removes a cancelled payment from today collections', () => {
    const now = Date.now()
    expect(todayTotals([
      entry({ id: 'payment', type: 'payment', sign: -1, occurredAt: now }),
      entry({ id: 'reverse', type: 'reversal', sign: 1, reverses: 'payment', occurredAt: now + 1 }),
    ]).payments).toBe(0)
  })
})
