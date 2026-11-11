import { describe, expect, it } from 'vitest'
import { customerStats, isPaidUp } from './ledger'
import type { Entry } from './types'

let n = 0
const e = (customerId: string, type: Entry['type'], sign: 1 | -1, amountPaise: number, occurredAt: number, extra: Partial<Entry> = {}): Entry => ({
  id: `e${n++}`, customerId, type, sign, amountPaise, occurredAt, createdBy: 'u', ...extra,
})

describe('customer stats', () => {
  it('marks a fully paid customer as paid up and keeps the last payment date', () => {
    const s = customerStats([e('a', 'bill', 1, 40500, 1), e('a', 'payment', -1, 20000, 2), e('a', 'payment', -1, 20500, 3)])
    expect(s.get('a')).toMatchObject({ balance: 0, count: 3, lastPaymentAt: 3 })
    expect(isPaidUp(s.get('a'))).toBe(true)
  })
  it('does not call an owing customer paid up', () => {
    expect(isPaidUp(customerStats([e('a', 'bill', 1, 100, 1)]).get('a'))).toBe(false)
  })
  it('does not call a brand-new customer (no entries) paid up', () => {
    expect(isPaidUp(customerStats([]).get('a'))).toBe(false)
  })
  it('ignores a cancelled payment for "last payment"', () => {
    const pay = e('a', 'payment', -1, 100, 5)
    const s = customerStats([e('a', 'bill', 1, 100, 1), e('a', 'payment', -1, 100, 3), pay, e('a', 'reversal', 1, 100, 6, { reverses: pay.id })])
    expect(s.get('a')?.lastPaymentAt).toBe(3)
    expect(s.get('a')?.balance).toBe(0)
  })
  it('treats overpayment as paid up (advance)', () => {
    expect(isPaidUp(customerStats([e('a', 'bill', 1, 100, 1), e('a', 'payment', -1, 150, 2)]).get('a'))).toBe(true)
  })
})
